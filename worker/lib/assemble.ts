import type { CulturalEvent, DateQueryResult, ProviderId } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'
import { queryDatePrecision, toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { buildFallbackResult, PROVIDER_CATALOGUE } from '../data/fallback'
import { composeNarrative } from '../providers/gemini'
import { fetchOnThisDay } from '../providers/wikipedia'
import {
  fetchChroniclingAmerica,
  fetchGuardianForDate,
  fetchNytForDate,
  fetchPerplexityForDate,
} from '../providers/archives'
import { sanitizeEventCitations } from './verify'

export interface Env {
  GEMINI_API_KEY?: string
  PERPLEXITY_API_KEY?: string
  NYT_API_KEY?: string
  GUARDIAN_API_KEY?: string
  GDELT_API_KEY?: string
  USE_FALLBACK?: string
  BRAND_ID?: string
}

export async function assembleDateQuery(
  queryDate: string,
  env: Env,
  opts?: { forceFallback?: boolean; brandId?: string },
): Promise<DateQueryResult> {
  const brandId = opts?.brandId || env.BRAND_ID || 'converse'
  const brand = getBrand(brandId)
  const forceFallback = opts?.forceFallback ?? env.USE_FALLBACK === 'true'

  if (forceFallback) {
    return buildFallbackResult(queryDate, brandId)
  }

  const precision = queryDatePrecision(queryDate)
  const providersUsed: ProviderId[] = []

  // Day-indexed providers only run when a real calendar day was supplied —
  // never invent Jan 1 (or any day) for year/month-only queries.
  let wikiEvents: CulturalEvent[] = []
  let nyt: CulturalEvent[] = []
  let guardian: CulturalEvent[] = []
  let perplexity: CulturalEvent[] = []
  let chronicling: CulturalEvent[] = []

  if (precision === 'exact-day') {
    const [, mm, dd] = queryDate.split('-').map(Number)
    try {
      wikiEvents = await fetchOnThisDay(mm, dd)
      if (wikiEvents.length) providersUsed.push('wikipedia-onthisday')
    } catch {
      // fall through — may still have brand moments / fallback
    }

    ;[nyt, guardian, perplexity, chronicling] = await Promise.all([
      fetchNytForDate(queryDate, env.NYT_API_KEY),
      fetchGuardianForDate(queryDate, env.GUARDIAN_API_KEY),
      fetchPerplexityForDate(queryDate, env.PERPLEXITY_API_KEY),
      fetchChroniclingAmerica(queryDate),
    ])

    if (nyt.length) providersUsed.push('nyt-archive')
    if (guardian.length) providersUsed.push('guardian')
    if (perplexity.length) providersUsed.push('perplexity-search')
    if (chronicling.length) providersUsed.push('chronicling-america')
  }

  const merged = [...wikiEvents, ...nyt, ...guardian, ...perplexity, ...chronicling].map((e) =>
    sanitizeEventCitations(e),
  )

  if (merged.length === 0) {
    const fallback = buildFallbackResult(queryDate, brandId)
    fallback.usingFallback = true
    return fallback
  }

  // Newest first; UI surfaces a single beat.
  merged.sort((a, b) => b.year - a.year)

  const brandMoments: CulturalEvent[] = brand.timeline
    .filter((m) => {
      if (m.date.length === 4) return m.date === queryDate.slice(0, 4)
      if (m.date.length === 7) return m.date === queryDate.slice(0, 7)
      return m.date === queryDate || m.date.slice(0, 4) === queryDate.slice(0, 4)
    })
    .map((m) =>
      sanitizeEventCitations({
        id: m.id,
        year: Number(m.date.slice(0, 4)),
        title: m.title,
        synopsis: m.synopsis,
        category: 'brand',
        precision: m.precision,
        discoveredVia: ['internal-curated'],
        needsHumanReview: m.precision === 'period-estimate',
        citations: [
          withHarvard({
            title: m.citation.title,
            url: m.citation.url,
            publisher: m.citation.publisher,
            author: m.citation.author,
            publishedAt: m.citation.publishedAt,
            accessedAt: new Date().toISOString(),
            sourceQuality:
              m.precision === 'period-estimate' ? 'needs-human-review' : 'curated-fallback',
            evidenceKind: m.isExactQuote ? 'quote' : 'paraphrase',
            reference: m.reference,
            provider: 'brand-timeline',
            isExactQuote: m.isExactQuote,
          }),
        ],
      }),
    )

  if (brandMoments.length) providersUsed.push('brand-timeline')

  const events = merged.slice(0, 1)
  const narrative = await composeNarrative({
    apiKey: env.GEMINI_API_KEY,
    brand,
    queryDate,
    eventSummaries: events.map((e) => `${e.year}: ${e.title} — ${e.synopsis}`),
  })
  if (narrative.voice === 'gemini') providersUsed.push('gemini')

  const hasExact = events.some((e) => e.precision === 'exact-day')

  return {
    queryDate,
    datePath: toOnThisDayPath(queryDate),
    displayDate: toDisplayDate(queryDate),
    resolvedMode: hasExact ? 'exact' : 'period-estimate',
    brandId: brand.id,
    narrative,
    events,
    brandMoments: brandMoments.slice(0, 1),
    providersUsed,
    usingFallback: false,
    generatedAt: new Date().toISOString(),
  }
}

export function listProviders(env: Env) {
  return PROVIDER_CATALOGUE.map((p) => {
    if (p.id === 'gemini') {
      return { ...p, status: env.GEMINI_API_KEY ? ('live' as const) : p.status }
    }
    if (p.id === 'perplexity-search') {
      return { ...p, status: env.PERPLEXITY_API_KEY ? ('live' as const) : p.status }
    }
    if (p.id === 'nyt-archive') {
      return { ...p, status: env.NYT_API_KEY ? ('stub' as const) : p.status }
    }
    if (p.id === 'guardian') {
      return { ...p, status: env.GUARDIAN_API_KEY ? ('stub' as const) : p.status }
    }
    return p
  })
}
