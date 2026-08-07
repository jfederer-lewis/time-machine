export interface BrandPalette {
  ink: string
  paper: string
  muted: string
  rule: string
  accent: string
  accentSoft: string
  estimate: string
}

export interface BrandMomentImage {
  /** Deep-link to brand CDN / press asset — do not rehost without license. */
  url: string
  alt: string
  /** Page the asset was published on (traceability). */
  sourcePageUrl: string
  credit?: string
}

export interface BrandMoment {
  id: string
  /** ISO date when known; otherwise year-month or year string */
  date: string
  precision: 'exact-day' | 'month' | 'year' | 'period-estimate'
  title: string
  synopsis: string
  reference: string
  citation: {
    title: string
    url: string
    publisher: string
    author?: string
    publishedAt?: string
  }
  isExactQuote: boolean
  /** Optional visual from the brand History page (or other credited source). */
  image?: BrandMomentImage
  /**
   * When set, theme replies keep only one beat per cluster (prefer Converse History).
   * e.g. One Hund(RED) + Vogue (PRODUCT) RED colour share `product-red-2008`.
   */
  storyCluster?: string
  /**
   * When true, same calendar day (MM-DD) in other years may surface as a yearly
   * anniversary on Lookup — house-defining milestones only (brand launch, Nike
   * acquisition, main-model debuts). Collabs stay exact-day / month only.
   */
  anniversaryEligible?: boolean
}

export interface BrandConfig {
  id: string
  name: string
  productLine: string
  tagline: string
  claimFrame: string
  /** Supporting line under the lookup hero — what the date tool does */
  lookupIntro: string
  /** Timeline page headline */
  timelineTitle: string
  /** Short lede under the timeline title */
  heritageNote: string
  palette: BrandPalette
  /** Seed dates journalists can jump to — YYYY, YYYY-MM, or YYYY-MM-DD (never invent a day). */
  featuredDates: Array<{ date: string; label: string }>
  /**
   * Curated public Timeline surface — short story beats, not a History LP clone.
   */
  timeline: BrandMoment[]
  /**
   * Full heritage knowledge pack (e.g. Converse History landing text) for Chuck-E
   * and date-attach. When omitted, callers fall back to `timeline`.
   */
  heritageKb?: BrandMoment[]
  exportFilenamePrefix: string
}

/** Full KB when present; otherwise the curated timeline. */
export function heritageMoments(brand: BrandConfig): BrandMoment[] {
  return brand.heritageKb?.length ? brand.heritageKb : brand.timeline
}

/** MM-DD from YYYY-MM-DD; null when the moment is year/month-only. */
export function brandCalendarDay(iso: string): string | null {
  const m = iso.match(/^\d{4}-(\d{2}-\d{2})$/)
  return m ? m[1] : null
}

/**
 * How well a heritage beat matches the queried date.
 * Exact-day queries must not pull sibling milestones in the same year
 * (e.g. Nike announce 9 Jul 2003 vs close 4 Sep 2003).
 * Calendar-day anniversaries require `anniversaryEligible` — not every collab.
 * Higher = better. 0 = exclude.
 */
export function brandMomentQueryRank(moment: BrandMoment, queryDate: string): number {
  const q = queryDate.trim()
  if (!q) return 0

  if (moment.date === q) return 100

  // Year-only query: any beat in that year (caller may still prefer close over announce)
  if (q.length === 4 && /^\d{4}$/.test(q)) {
    if (moment.date === q) return 60
    if (moment.date.startsWith(`${q}-`)) return 50
    return 0
  }

  // Month query YYYY-MM
  if (q.length === 7 && /^\d{4}-\d{2}$/.test(q)) {
    if (moment.date === q || moment.date.startsWith(`${q}-`)) return 90
    return 0
  }

  // Exact-day query YYYY-MM-DD
  if (q.length >= 10) {
    const qDay = brandCalendarDay(q)
    const mDay = brandCalendarDay(moment.date)
    if (qDay && mDay && qDay === mDay && moment.date !== q) {
      // Yearly anniversary — house-defining milestones only
      if (moment.anniversaryEligible) return 80
      return 0
    }
    if (moment.precision === 'month' && moment.date.length === 7 && moment.date === q.slice(0, 7)) {
      return 70
    }
    // Year-only History beat for the queried year — OK; other exact-day siblings are not
    if (moment.precision === 'year' && moment.date === q.slice(0, 4)) return 40
    return 0
  }

  return 0
}

/** Heritage beats for a query date, best match first. */
export function brandMomentsForQueryDate(
  brand: BrandConfig,
  queryDate: string,
): BrandMoment[] {
  return heritageMoments(brand)
    .map((m) => ({ m, rank: brandMomentQueryRank(m, queryDate) }))
    .filter((x) => x.rank > 0)
    .sort((a, b) => b.rank - a.rank || b.m.date.localeCompare(a.m.date))
    .map((x) => x.m)
}

export type ConverseDaySegmentLane = 'exact' | 'anniversary' | 'month'

export type ConverseDaySegmentHit = {
  lane: ConverseDaySegmentLane
  moment: BrandMoment
}

function segmentLaneForHit(moment: BrandMoment, queryDate: string): ConverseDaySegmentLane | null {
  const q = queryDate.trim()
  if (q.length < 10) return null
  if (moment.date === q) return 'exact'
  if (moment.precision === 'month' && moment.date === q.slice(0, 7)) return 'month'
  const qDay = brandCalendarDay(q)
  const mDay = brandCalendarDay(moment.date)
  if (qDay && mDay && qDay === mDay && moment.anniversaryEligible) return 'anniversary'
  return null
}

const LANE_ORDER: Record<ConverseDaySegmentLane, number> = {
  exact: 0,
  anniversary: 1,
  month: 2,
}

/**
 * Lookup Converse addon: exact-day hits, curated yearly anniversaries, and
 * same-month release beats. One beat per storyCluster; cap defaults to 2.
 * Year-only / period-estimate soft matches are excluded from the segment.
 */
export function converseDaySegmentForQuery(
  brand: BrandConfig,
  queryDate: string,
  opts: { limit?: number } = {},
): ConverseDaySegmentHit[] {
  const limit = opts.limit ?? 2
  const q = queryDate.trim()
  if (q.length < 10) return []

  const scored = heritageMoments(brand)
    .map((m) => {
      const rank = brandMomentQueryRank(m, q)
      const lane = segmentLaneForHit(m, q)
      return { m, rank, lane }
    })
    .filter((x): x is { m: BrandMoment; rank: number; lane: ConverseDaySegmentLane } =>
      Boolean(x.lane && x.rank > 0),
    )
    .sort((a, b) => {
      const laneDiff = LANE_ORDER[a.lane] - LANE_ORDER[b.lane]
      if (laneDiff !== 0) return laneDiff
      if (b.rank !== a.rank) return b.rank - a.rank
      return b.m.date.localeCompare(a.m.date)
    })

  const out: ConverseDaySegmentHit[] = []
  const seenIds = new Set<string>()
  const seenClusters = new Set<string>()
  for (const { m, lane } of scored) {
    if (seenIds.has(m.id)) continue
    if (m.storyCluster && seenClusters.has(m.storyCluster)) continue
    seenIds.add(m.id)
    if (m.storyCluster) seenClusters.add(m.storyCluster)
    out.push({ lane, moment: m })
    if (out.length >= limit) break
  }
  return out
}
