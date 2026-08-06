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
  timeline: BrandMoment[]
  exportFilenamePrefix: string
}
