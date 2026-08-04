/** Shared provenance contract — adapted from Bloom's citation honesty model. */

export type SourceQuality =
  | 'trusted-source-quote'
  | 'trusted-source-snippet'
  | 'trusted-discovery-only'
  | 'curated-fallback'
  | 'period-estimate'
  | 'needs-human-review'

export type EvidenceKind = 'quote' | 'paraphrase' | 'mixed'

export type GlossSource = 'wikipedia' | 'curated' | 'ai'

export type DatePrecision = 'exact-day' | 'month' | 'year' | 'period-estimate'

export type ProviderId =
  | 'wikipedia-onthisday'
  | 'wikipedia-summary'
  | 'gemini'
  | 'perplexity-search'
  | 'nyt-archive'
  | 'guardian'
  | 'gdelt'
  | 'chronicling-america'
  | 'curated-fallback'
  | 'brand-timeline'

export interface Citation {
  title: string
  url: string
  publisher: string
  author?: string
  publishedAt?: string
  accessedAt: string
  sourceQuality: SourceQuality
  evidenceKind: EvidenceKind
  /** Verbatim slices only inside "…"; paraphrase stays outside. */
  reference: string
  provider: ProviderId
  isExactQuote: boolean
}

export interface Gloss {
  term: string
  gloss: string
  url?: string
  source: GlossSource
  sourceLabel?: string
  period?: string
}

export interface CulturalEvent {
  id: string
  year: number
  title: string
  synopsis: string
  category: 'culture' | 'politics' | 'sport' | 'science' | 'music' | 'design' | 'brand' | 'other'
  locale?: string
  precision: DatePrecision
  citations: Citation[]
  glosses?: Gloss[]
  /** When true, claim must not ship to press without editor sign-off. */
  needsHumanReview: boolean
}

export interface NarrativeBlock {
  headline: string
  lede: string
  voice: 'gemini' | 'template'
  disclaimer: string
}

export interface DateQueryResult {
  queryDate: string
  resolvedMode: 'exact' | 'period-estimate' | 'mixed'
  brandId: string
  narrative: NarrativeBlock
  events: CulturalEvent[]
  brandMoments: CulturalEvent[]
  providersUsed: ProviderId[]
  usingFallback: boolean
  generatedAt: string
}

export interface ProviderStatus {
  id: ProviderId
  label: string
  role: string
  status: 'live' | 'stub' | 'fallback' | 'needs-key'
  notes: string
}
