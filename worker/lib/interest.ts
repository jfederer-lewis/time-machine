import type { CulturalEvent } from '../../shared/provenance'
import { COPY_KNOBS } from '../../shared/copy-knobs'
import { looksLikeHeadlineDump, titleTooCloseToBody } from './clean-text'

/**
 * Press-desk interest formula.
 *
 * Balance (in priority order):
 * 1. Cultural / historical significance — the main weight
 * 2. Light positive / neutral tone lean — a secondary nudge, not a veto
 * 3. Landmark defining days — may be tragic, but still outrank ordinary stories
 *
 * Heuristic only; Gemini may re-rank a shortlist when a key is present.
 *
 * Approximate scale when tone lean is on:
 *   score ≈ significance (0–~35) + tone (−3…+3) + credibility (0–~14) + quality
 */

const BOOST =
  /\b(uk|u\.k\.|britain|british|england|scotland|wales|london|ireland|northern ireland|europe|european|eu\b|nato|united nations|\bun\b|world war|wwii|wwi|cold war|berlin|paris|berlin wall|soviet|russia|ukraine|china|japan|india|africa|middle east|israel|palestine|gaza|iraq|iran|afghanistan|kosovo|bosnia|rwanda|apartheid|mandela|churchill|thatcher|blair|beatles|rolling stones|olympics|world cup|wimbledon|premier league|fa cup|nobel|moon landing|apollo|chernobyl|aids|covid|pandemic|climate|brexit|eu referendum|royal|queen elizabeth|king charles|princess diana|beatles|woodstock|berlin wall|911|september 11|hiroshima|nagasaki|holocaust|suffrage|civil rights|martin luther king|nelson mandela|gandhi|vatican|pope|euro\b|single currency)\b/i

/** Culture / arts / design / sport — the “interesting headline” pool. */
const CULTURE =
  /\b(music|album|single|chart|film|cinema|movie|oscar|bafta|fashion|design|art|museum|gallery|theatre|broadway|west end|novel|literature|poet|painting|sculpture|architect|football|cricket|rugby|tennis|athletics|space|scientist|discovery|invention|radio|television|premiere|festival|tour|concert|band|singer|actor|actress|director|photographer|sneaker|streetwear|youth culture)\b/i

/**
 * High-stakes political / rights / breakthrough language (valence-neutral).
 * Disaster/crime words live in NEGATIVE_ROUTINE / LANDMARK_DEFINING instead.
 */
const POIGNANT =
  /\b(coup|revolution|independence|liberation|treaty|peace|ceasefire|referendum|election|landslide|resign|impeach|protest|strike|abolition|rights|equality|first woman|first black|landing|launch)\b/i

/**
 * Calendar dates that define world memory — never soft-pedal these for a
 * tone preference. Ignoring them would read as editorially wrong.
 */
const LANDMARK_DEFINING =
  /\b(9\s*\/\s*11|911|september\s*11|pearl\s*harbou?r|hiroshima|nagasaki|holocaust|chernobyl|titanic.*(sank|sinking|disaster)|assassination of|assassinated\b|john f\.?\s*kennedy.*(assassin|killed|shot|death)|jfk.*(assassin|killed|shot|death)|(martin luther king|mlk).*(assassin|killed|shot|death)|princess diana.*(died|death|killed|funeral)|d-?day|normandy landings?|kristallnacht|srebrenica|rwandan genocide|rwanda genocide|berlin wall|moon landing|apollo\s*11|armistice|ve day|vj day|world trade center|twin towers|atomic bomb)\b/i

/** Constructive / celebratory settled history. */
const POSITIVE =
  /\b(peace|treaty|ceasefire|liberation|independence|suffrage|rights|equality|nobel|premiere|debut|invention|discovery|championship|coronation|abolition|emancipation|breakthrough|opened|opens\b|released|founded|founding|medal|gold medal|wedding|inaugurat|first woman|first black|record-breaking|victory|wins?\b|triumph|celebrat)\b/i

/** Routine tragedy / violence — mild tone penalty unless landmark-defining. */
const NEGATIVE_ROUTINE =
  /\b(war|invasion|bombing|siege|genocide|massacre|assassination|murder|terror|crash|disaster|earthquake|tsunami|famine|refugees|riot|killed|killing|fatal|explosion|hostage)\b/i

const ADMIN_TRIVIA =
  /\b(territory|territories|province|county|municipality|borough|incorporated|renamed|amalgamat|redistrict|census|postal code|administrative division|carved out of|northwest territories|nunavut|yukon)\b/i

const LOCAL_US_CANADA =
  /\b(state of|governor of|mayor of|city council|township|alberta|manitoba|saskatchewan|newfoundland|nova scotia|prince edward|new brunswick|ohio|idaho|iowa|nebraska|wyoming|montana|dakota)\b/i

/**
 * Direct Converse / Chuck story beats — lift these when they appear in cultural news.
 * Makes “what happened on this day” feel brand-adjacent without inventing claims.
 */
const BRAND_AFFINITY =
  /\b(converse|chuck\s+taylor|chuck\s*70|all[\s-]?stars?|non[\s-]?skid|jack\s+purcell|one\s+star|pro\s+leather|golf\s+le\s+fleur|comme\s+des\s+gar[cç]ons\s+play|cons\s+skate)\b/i

/**
 * Nike only when the claim is about Converse (acquisition / portfolio) —
 * not every iconic Nike sports day.
 */
const NIKE_CONVERSE_TIE =
  /\b(nike.{0,40}(acquir|acquire|acquisition|buy|bought|purchase|completes?).{0,40}converse|converse.{0,40}(acquir|acquire|acquisition|buy|bought|purchase|nike)|swoosh.{0,20}converse)\b/i

/**
 * Formula weights — significance dominates; tone is a light lean only.
 * Tunable here (and via COPY_KNOBS.preferPositiveWhenTied on/off for the tone term).
 */
const W = {
  landmarkDefining: 18,
  ukGlobal: 8,
  cultureSignal: 7,
  poignantStakes: 5,
  categoryCulture: 4,
  categoryScience: 3,
  categoryPolitics: 2,
  /** Curated / KB brand moment in the pool — strong but below landmark. */
  categoryBrand: 14,
  brandAffinity: 12,
  nikeConverseTie: 10,
  ukCultureCombo: 2,
  /** Secondary lean — deliberately smaller than a single culture signal. */
  tonePositive: 3,
  toneNeutralCulture: 1,
  toneRoutineNegative: -3,
} as const

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

export type InterestBreakdown = {
  significance: number
  tone: number
  credibility: number
  quality: number
  total: number
  landmark: boolean
  toneTag: 'landmark' | 'positive' | 'neutral' | 'negative' | 'none'
}

function eventText(event: CulturalEvent): string {
  return `${event.title} ${event.synopsis}`
}

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
  // Gemini grounded discovery already cite-gated — modest lift when cite is premium (above).
  if (via.includes('gemini') && best === 0) best = Math.max(best, 4)
  // Perplexity date-search only counts when a premium cite is already attached (above).
  if (via.includes('perplexity-search') && best === 0) best = Math.max(best, 3)

  return best
}

/** True when the event is a world-memory defining day (must not be soft-pedalled). */
export function isLandmarkDefiningEvent(event: CulturalEvent): boolean {
  return LANDMARK_DEFINING.test(eventText(event))
}

/** Constructive lean — landmark defining days are handled via significance, not tone. */
export function leansPositive(event: CulturalEvent): boolean {
  if (isLandmarkDefiningEvent(event)) return false
  return POSITIVE.test(eventText(event))
}

function scoreSignificance(event: CulturalEvent, text: string, landmark: boolean): number {
  let s = 0

  // Landmark significance can outweigh ordinary tone preference entirely.
  if (landmark) s += W.landmarkDefining

  if (BOOST.test(text)) s += W.ukGlobal
  if (CULTURE.test(text)) s += W.cultureSignal
  if (POIGNANT.test(text)) s += W.poignantStakes

  if (event.category === 'brand') s += W.categoryBrand
  if (event.category === 'music' || event.category === 'culture' || event.category === 'sport') {
    s += W.categoryCulture
  }
  if (event.category === 'science') s += W.categoryScience
  if (event.category === 'politics') s += W.categoryPolitics

  if (COPY_KNOBS.preferBrandAffinity) {
    if (BRAND_AFFINITY.test(text)) s += W.brandAffinity
    if (NIKE_CONVERSE_TIE.test(text)) s += W.nikeConverseTie
  }

  if (COPY_KNOBS.preferUkGlobalInterest && BOOST.test(text) && CULTURE.test(text)) {
    s += W.ukCultureCombo
  }

  return s
}

/**
 * Secondary tone lean only. Smaller than one culture-signal unit so a clearly
 * more significant negative can still beat a mildly positive culture stub —
 * while equal-significance races tilt positive / neutral.
 */
function scoreTone(
  text: string,
  landmark: boolean,
): { tone: number; toneTag: InterestBreakdown['toneTag'] } {
  if (!COPY_KNOBS.preferPositiveWhenTied) {
    return { tone: 0, toneTag: 'none' }
  }
  // Landmark days are scored on significance alone — no “make it nicer” drag.
  if (landmark) return { tone: 0, toneTag: 'landmark' }

  const positive = POSITIVE.test(text)
  const negative = NEGATIVE_ROUTINE.test(text)
  const cultural = CULTURE.test(text) || POIGNANT.test(text)

  if (positive && !negative) return { tone: W.tonePositive, toneTag: 'positive' }
  if (positive && negative) return { tone: Math.floor(W.tonePositive / 2), toneTag: 'positive' }
  if (negative) return { tone: W.toneRoutineNegative, toneTag: 'negative' }
  if (cultural) return { tone: W.toneNeutralCulture, toneTag: 'neutral' }
  return { tone: 0, toneTag: 'none' }
}

function scoreCredibility(event: CulturalEvent): number {
  let c = 0
  if (COPY_KNOBS.preferPremiumPress) c += premiumPressBoost(event)
  if (event.discoveredVia?.includes('history-com')) c += 4
  if (event.discoveredVia?.includes('onthisday-com')) c += 3
  if (event.discoveredVia?.includes('wikipedia-onthisday')) c += 1
  return c
}

function scoreQuality(event: CulturalEvent, text: string, landmark: boolean): number {
  let q = 0
  if (looksLikeHeadlineDump(event.synopsis) || looksLikeHeadlineDump(text)) q -= 40
  if (ADMIN_TRIVIA.test(text)) q -= 10
  if (LOCAL_US_CANADA.test(text) && !BOOST.test(text) && !POIGNANT.test(text) && !landmark) q -= 4
  if (titleTooCloseToBody(event.title, event.synopsis)) q -= 18
  if (event.synopsis.length < 60) q -= 8
  if (event.synopsis.length >= 80 && event.synopsis.length < 400) q += 1
  return q
}

/** Full breakdown — useful for debugging / tuning the balance. */
export function scoreInterestBreakdown(event: CulturalEvent): InterestBreakdown {
  const text = eventText(event)
  const landmark = LANDMARK_DEFINING.test(text)
  const significance = scoreSignificance(event, text, landmark)
  const { tone, toneTag } = scoreTone(text, landmark)
  const credibility = scoreCredibility(event)
  const quality = scoreQuality(event, text, landmark)
  return {
    significance,
    tone,
    credibility,
    quality,
    total: significance + tone + credibility + quality,
    landmark,
    toneTag,
  }
}

export function scoreCulturalInterest(event: CulturalEvent): number {
  return scoreInterestBreakdown(event).total
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

/**
 * Sort: closer year first (unless anyYear), then formula score.
 * True ties: landmark → positive/neutral lean → discovery rank → newer year.
 */
export function rankByInterest(events: CulturalEvent[], targetYear: number, anyYear = false): CulturalEvent[] {
  return [...events].sort((a, b) => {
    if (!anyYear) {
      const yearDiff = Math.abs(a.year - targetYear) - Math.abs(b.year - targetYear)
      if (yearDiff !== 0) return yearDiff
    }

    const aBreak = scoreInterestBreakdown(a)
    const bBreak = scoreInterestBreakdown(b)
    const interestDiff = bBreak.total - aBreak.total
    if (interestDiff !== 0) return interestDiff

    // Exact formula ties only — significance already dominates the score.
    if (aBreak.landmark !== bBreak.landmark) return aBreak.landmark ? -1 : 1
    if (COPY_KNOBS.preferPositiveWhenTied) {
      const toneRank = (tag: InterestBreakdown['toneTag']) => {
        if (tag === 'positive' || tag === 'neutral') return 1
        if (tag === 'negative') return -1
        return 0
      }
      const toneDiff = toneRank(bBreak.toneTag) - toneRank(aBreak.toneTag)
      if (toneDiff !== 0) return toneDiff
    }

    const discDiff = discoveryRank(b) - discoveryRank(a)
    if (discDiff !== 0) return discDiff
    return b.year - a.year
  })
}
