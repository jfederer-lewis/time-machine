/** Shared provenance contract — adapted from Bloom's citation honesty model. */

import type { DiscoveryChannel } from './source-registry'
import { formatHarvardCitation } from './source-registry'

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

export type EventFacet =
  | 'culture'
  | 'politics'
  | 'sport'
  | 'science'
  | 'music'
  | 'charts'
  | 'design'
  | 'fashion'
  | 'brand'
  | 'other'

export type ProviderId =
  | 'wikipedia-onthisday'
  | 'wikipedia-summary'
  | 'gemini'
  | 'perplexity-search'
  | 'nyt-archive'
  | 'guardian'
  | 'gdelt'
  | 'chronicling-america'
  | 'national-archives'
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
  /** Full Harvard-style string for press export. */
  harvard?: string
  /** A / B / C / bridge — from source registry when known. */
  tier?: string
}

export interface Gloss {
  term: string
  gloss: string
  url?: string
  source: GlossSource
  sourceLabel?: string
  period?: string
  /** Short Wikipedia description / role line, e.g. "American astronaut". */
  originator?: string
}

export interface CulturalEvent {
  id: string
  year: number
  title: string
  synopsis: string
  /**
   * Optional background — why the fact lands for a general reader
   * (era, actors, stakes). Secondary to the day claim; not a citation.
   */
  whyItMatters?: string
  /** Primary facet (On This Day–style breadth: charts, sport, culture…). */
  category: EventFacet
  locale?: string
  precision: DatePrecision
  citations: Citation[]
  glosses?: Gloss[]
  /**
   * Internal only — which aggregator/index suggested this event.
   * Must never be shown as the public citation.
   */
  discoveredVia?: DiscoveryChannel[]
  /** When true, claim must not ship to press without editor sign-off. */
  needsHumanReview: boolean
}

export interface NarrativeBlock {
  headline: string
  lede: string
  voice: 'gemini' | 'template'
  disclaimer: string
}

/** Lite = Wikipedia only (no paid APIs). Full = Perplexity discovery + Gemini voice. */
export type ResearchMode = 'lite' | 'full'

export interface DateQueryResult {
  queryDate: string
  /** On This Day–style path — year, year/month, or year/month/day */
  datePath: string
  /** Honest display: year, “April 1999”, or “9 July 2003” — never invents missing parts */
  displayDate: string
  resolvedMode: 'exact' | 'period-estimate' | 'mixed'
  /** Which provider stack was requested for this lookup. */
  researchMode: ResearchMode
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

export function withHarvard(citation: Omit<Citation, 'harvard'> & { harvard?: string }): Citation {
  if (citation.harvard) return citation as Citation
  return {
    ...citation,
    harvard: formatHarvardCitation({
      author: citation.author,
      year: citation.publishedAt?.slice(0, 4),
      title: citation.title,
      publisher: citation.publisher,
      publishedDisplay: citation.publishedAt,
      url: citation.url,
      accessedAt: citation.accessedAt,
    }),
  }
}
