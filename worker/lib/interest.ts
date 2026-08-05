import type { CulturalEvent } from '../../shared/provenance'
import { COPY_KNOBS } from '../../shared/copy-knobs'
import { looksLikeHeadlineDump } from './clean-text'

/**
 * Press-desk interest scoring — bias toward poignant global / UK-relevant news
 * over remote administrative trivia (e.g. a new Canadian territory).
 *
 * Heuristic only; Gemini may re-rank a shortlist when a key is present.
 */

const BOOST =
  /\b(uk|u\.k\.|britain|british|england|scotland|wales|london|ireland|northern ireland|europe|european|eu\b|nato|united nations|\bun\b|world war|wwii|wwi|cold war|berlin|paris|berlin wall|soviet|russia|ukraine|china|japan|india|africa|middle east|israel|palestine|gaza|iraq|iran|afghanistan|kosovo|bosnia|rwanda|apartheid|mandela|churchill|thatcher|blair|beatles|rolling stones|olympics|world cup|wimbledon|premier league|fa cup|nobel|moon landing|apollo|chernobyl|aids|covid|pandemic|climate|brexit|eu referendum|royal|queen elizabeth|king charles|princess diana|beatles|woodstock|berlin wall|911|september 11|hiroshima|nagasaki|holocaust|suffrage|civil rights|martin luther king|nelson mandela|gandhi|vatican|pope|euro\b|single currency)\b/i

const CULTURE =
  /\b(music|album|single|chart|film|cinema|oscar|bafta|fashion|design|art|museum|theatre|novel|literature|football|cricket|rugby|tennis|athletics|space|scientist|discovery|invention|radio|television|bbc|guardian|times)\b/i

const POIGNANT =
  /\b(war|invasion|bombing|siege|genocide|massacre|assassination|murder|terror|coup|revolution|independence|liberation|treaty|peace|ceasefire|referendum|election|landslide|resign|impeach|crash|disaster|earthquake|tsunami|famine|refugees|protest|riot|strike|abolition|rights|equality|first woman|first black|landing|launch)\b/i

const ADMIN_TRIVIA =
  /\b(territory|territories|province|county|municipality|borough|incorporated|renamed|amalgamat|redistrict|census|postal code|administrative division|carved out of|northwest territories|nunavut|yukon)\b/i

const LOCAL_US_CANADA =
  /\b(state of|governor of|mayor of|city council|township|alberta|manitoba|saskatchewan|newfoundland|nova scotia|prince edward|new brunswick|ohio|idaho|iowa|nebraska|wyoming|montana|dakota)\b/i

export function scoreCulturalInterest(event: CulturalEvent): number {
  const text = `${event.title} ${event.synopsis}`
  let score = 0

  // Wire roundups / video indexes are never the day card.
  if (looksLikeHeadlineDump(event.synopsis) || looksLikeHeadlineDump(text)) score -= 40

  if (BOOST.test(text)) score += 8
  if (POIGNANT.test(text)) score += 6
  if (CULTURE.test(text)) score += 4

  // Brand / culture moments already curated — slight lift
  if (event.category === 'brand') score += 3
  if (event.category === 'music' || event.category === 'culture' || event.category === 'sport') {
    score += 2
  }

  // Soft-penalise dry admin geography (Nunavut-style)
  if (ADMIN_TRIVIA.test(text)) score -= 10
  if (LOCAL_US_CANADA.test(text) && !BOOST.test(text) && !POIGNANT.test(text)) score -= 4

  // Editorial day-indexes (discovery only) — slight lift over raw wire / wiki dumps
  if (event.discoveredVia?.includes('history-com')) score += 4
  if (event.discoveredVia?.includes('onthisday-com')) score += 3
  // Wikipedia remains a useful bridge, but must not dominate the shortlist
  if (event.discoveredVia?.includes('wikipedia-onthisday')) score += 1

  if (event.category === 'charts') score += 3

  // Prefer a bit of substance in the blurb — but not a dump
  if (event.synopsis.length >= 80 && event.synopsis.length < 400) score += 1

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
  if (event.discoveredVia?.includes('history-com')) return 3
  if (event.discoveredVia?.includes('onthisday-com')) return 2
  if (event.discoveredVia?.includes('wikipedia-onthisday')) return 1
  return 0
}

/** Sort: closer year first (unless anyYear is true), then higher interest; editorial indexes beat wiki ties. */
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
