import type { CulturalEvent } from '../../shared/provenance'
import { COPY_KNOBS } from '../../shared/copy-knobs'
import { looksLikeHeadlineDump, titleTooCloseToBody } from './clean-text'

/**
 * Press-desk interest scoring — bias toward culturally resonant / UK-global news
 * from papers of record (NYT, BBC, Guardian, …) when those cites are logged,
 * over remote admin trivia and thin chart stubs.
 *
 * Heuristic only; Gemini may re-rank a shortlist when a key is present.
 */

const BOOST =
  /\b(uk|u\.k\.|britain|british|england|scotland|wales|london|ireland|northern ireland|europe|european|eu\b|nato|united nations|\bun\b|world war|wwii|wwi|cold war|berlin|paris|berlin wall|soviet|russia|ukraine|china|japan|india|africa|middle east|israel|palestine|gaza|iraq|iran|afghanistan|kosovo|bosnia|rwanda|apartheid|mandela|churchill|thatcher|blair|beatles|rolling stones|olympics|world cup|wimbledon|premier league|fa cup|nobel|moon landing|apollo|chernobyl|aids|covid|pandemic|climate|brexit|eu referendum|royal|queen elizabeth|king charles|princess diana|beatles|woodstock|berlin wall|911|september 11|hiroshima|nagasaki|holocaust|suffrage|civil rights|martin luther king|nelson mandela|gandhi|vatican|pope|euro\b|single currency)\b/i

/** Culture / arts / design / sport — the “interesting headline” pool. */
const CULTURE =
  /\b(music|album|single|chart|film|cinema|movie|oscar|bafta|fashion|design|art|museum|gallery|theatre|broadway|west end|novel|literature|poet|painting|sculpture|architect|football|cricket|rugby|tennis|athletics|space|scientist|discovery|invention|radio|television|premiere|festival|tour|concert|band|singer|actor|actress|director|photographer|sneaker|streetwear|youth culture)\b/i

const POIGNANT =
  /\b(war|invasion|bombing|siege|genocide|massacre|assassination|murder|terror|coup|revolution|independence|liberation|treaty|peace|ceasefire|referendum|election|landslide|resign|impeach|crash|disaster|earthquake|tsunami|famine|refugees|protest|riot|strike|abolition|rights|equality|first woman|first black|landing|launch)\b/i

const ADMIN_TRIVIA =
  /\b(territory|territories|province|county|municipality|borough|incorporated|renamed|amalgamat|redistrict|census|postal code|administrative division|carved out of|northwest territories|nunavut|yukon)\b/i

const LOCAL_US_CANADA =
  /\b(state of|governor of|mayor of|city council|township|alberta|manitoba|saskatchewan|newfoundland|nova scotia|prince edward|new brunswick|ohio|idaho|iowa|nebraska|wyoming|montana|dakota)\b/i

/**
 * Papers of record / wires — boost when already logged on the event citation.
 * Prefer these over aggregator day-indexes when they compete.
 */
const PREMIUM_PRESS: Array<{ re: RegExp; score: number }> = [
  { re: /(^|\.)nytimes\.com$|timesmachine\.nytimes\.com/i, score: 14 },
  { re: /(^|\.)bbc\.(co\.uk|com)$/i, score: 13 },
  { re: /(^|\.)theguardian\.com$/i, score: 13 },
  { re: /(^|\.)ft\.com$|(^|\.)telegraph\.co\.uk$/i, score: 11 },
  { re: /(^|\.)reuters\.com$|(^|\.)apnews\.com$|(^|\.)washingtonpost\.com$/i, score: 11 },
  { re: /(^|\.)lemonde\.fr$|(^|\.)asahi\.com$|(^|\.)thehindu\.com$/i, score: 9 },
]

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

/** Lift when NYT / BBC / Guardian (etc.) are already on the card. */
export function premiumPressBoost(event: CulturalEvent): number {
  let best = 0

  for (const cite of event.citations ?? []) {
    const host = hostnameOf(cite.url || '')
    for (const row of PREMIUM_PRESS) {
      if (host && row.re.test(host)) best = Math.max(best, row.score)
    }
    if (cite.provider === 'nyt-archive') best = Math.max(best, 14)
    if (cite.provider === 'guardian') best = Math.max(best, 13)
    if (cite.provider === 'chronicling-america') best = Math.max(best, 8)
  }

  const via = event.discoveredVia ?? []
  if (via.includes('nyt-archive')) best = Math.max(best, 12)
  if (via.includes('guardian')) best = Math.max(best, 11)
  if (via.includes('bbc-onthisday')) best = Math.max(best, 10)
  if (via.includes('chronicling-america')) best = Math.max(best, 7)
  // Perplexity date-search only counts when a premium cite is already attached (above).
  if (via.includes('perplexity-search') && best === 0) best = Math.max(best, 3)

  return best
}

export function scoreCulturalInterest(event: CulturalEvent): number {
  const text = `${event.title} ${event.synopsis}`
  let score = 0

  // Wire roundups / video indexes are never the day card.
  if (looksLikeHeadlineDump(event.synopsis) || looksLikeHeadlineDump(text)) score -= 40

  if (BOOST.test(text)) score += 8
  if (POIGNANT.test(text)) score += 6
  if (CULTURE.test(text)) score += 6

  // Brand / culture moments already curated — slight lift
  if (event.category === 'brand') score += 3
  if (event.category === 'music' || event.category === 'culture' || event.category === 'sport') {
    score += 3
  }
  if (event.category === 'politics' || event.category === 'science') score += 2

  // Soft-penalise dry admin geography (Nunavut-style)
  if (ADMIN_TRIVIA.test(text)) score -= 10
  if (LOCAL_US_CANADA.test(text) && !BOOST.test(text) && !POIGNANT.test(text)) score -= 4

  // Papers of record logged on the event beat aggregator discovery alone.
  if (COPY_KNOBS.preferPremiumPress) {
    score += premiumPressBoost(event)
  }

  // Editorial day-indexes (discovery only) — modest lift; below premium press cites
  if (event.discoveredVia?.includes('history-com')) score += 4
  if (event.discoveredVia?.includes('onthisday-com')) score += 3
  // Wikipedia remains a useful bridge, but must not dominate the shortlist
  if (event.discoveredVia?.includes('wikipedia-onthisday')) score += 1

  // Charts are a cultural facet — but only when there is real prose (stubs penalised below)
  if (event.category === 'charts') score += 1

  // Thin chart stubs (“UK #1: Song” / “UK #1 song on this date: Song”) are discovery only —
  // they must not win the day card without real prose.
  if (titleTooCloseToBody(event.title, event.synopsis)) score -= 18
  if (event.synopsis.length < 60) score -= 8
  if (event.category === 'charts' && event.synopsis.length < 100) score -= 10

  // Prefer a bit of substance in the blurb — but not a dump
  if (event.synopsis.length >= 80 && event.synopsis.length < 400) score += 1

  if (COPY_KNOBS.preferUkGlobalInterest && BOOST.test(text) && CULTURE.test(text)) {
    score += 2
  }

  return score
}

/**
 * Recent / future lookup dates should not surface live wire scrapes —
 * the product reads as settled history (“Chuck was there”), not breaking news.
 */
export function isTooRecentForLiveWire(queryDate: string, now = new Date()): boolean {
  const m = queryDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false
  const q = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const daysAhead = (q - today) / 86_400_000
  const daysBehind = (today - q) / 86_400_000
  // Future dates, or roughly the last 18 months
  return daysAhead >= 0 || daysBehind < COPY_KNOBS.recentLiveWireSkipDays
}

function discoveryRank(event: CulturalEvent): number {
  const press = COPY_KNOBS.preferPremiumPress ? premiumPressBoost(event) : 0
  if (press >= 12) return 6
  if (press >= 9) return 5
  if (event.discoveredVia?.includes('history-com')) return 3
  if (event.discoveredVia?.includes('onthisday-com')) return 2
  if (event.discoveredVia?.includes('wikipedia-onthisday')) return 1
  return 0
}

/** Sort: closer year first (unless anyYear is true), then higher interest; premium press beats wiki ties. */
export function rankByInterest(events: CulturalEvent[], targetYear: number, anyYear = false): CulturalEvent[] {
  return [...events].sort((a, b) => {
    if (!anyYear) {
      const yearDiff = Math.abs(a.year - targetYear) - Math.abs(b.year - targetYear)
      if (yearDiff !== 0) return yearDiff
    }
    const interestDiff = scoreCulturalInterest(b) - scoreCulturalInterest(a)
    if (interestDiff !== 0) return interestDiff
    const discDiff = discoveryRank(b) - discoveryRank(a)
    if (discDiff !== 0) return discDiff
    return b.year - a.year
  })
}
