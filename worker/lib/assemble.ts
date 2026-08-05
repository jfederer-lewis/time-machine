import type { CulturalEvent, DateQueryResult, ProviderId, ResearchMode } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'
import { queryDatePrecision, toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { buildFallbackResult, PROVIDER_CATALOGUE } from '../data/fallback'
import { composeNarrative, polishEventCopy, pickMostInterestingEvent } from '../providers/gemini'
import { fetchOnThisDay } from '../providers/wikipedia'
import {
  fetchChroniclingAmerica,
  fetchGuardianForDate,
  fetchNytForDate,
  fetchPerplexityForDate,
} from '../providers/archives'
import { sanitizeEventCitations } from './verify'
import {
  isWikipediaBridgeEvent,
  upgradeWikipediaClaim,
} from './upgrade-claim'
import { attachGlosses } from './gloss-service'
import {
  cleanPressText,
  looksLikeDateOnlyTitle,
  descriptiveFallbackTitle,
  titleEchoesBody,
  looksLikeBareName,
  isIncompleteHeadline,
  toSentenceCaseHeadline,
  looksLikeHeadlineDump,
  clipToShortProse,
} from './clean-text'
import { rankByInterest, scoreCulturalInterest, isTooRecentForLiveWire } from './interest'

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
  opts?: { forceFallback?: boolean; brandId?: string; researchMode?: ResearchMode },
): Promise<DateQueryResult> {
  const brandId = opts?.brandId || env.BRAND_ID || 'converse'
  const brand = getBrand(brandId)
  const forceFallback = opts?.forceFallback ?? env.USE_FALLBACK === 'true'
  const researchMode: ResearchMode = opts?.researchMode === 'lite' ? 'lite' : 'full'
  const isLite = researchMode === 'lite'

  if (forceFallback) {
    return buildFallbackResult(queryDate, brandId, researchMode)
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

    // Full mode fans out to paid / archive providers. Lite stays on Wikipedia only
    // so local testing does not burn Perplexity / Gemini credits.
    // Skip live wire date-search for recent/future dates — this product reads as past.
    if (!isLite) {
      const skipLiveWire = isTooRecentForLiveWire(queryDate)
      ;[nyt, guardian, perplexity, chronicling] = await Promise.all([
        fetchNytForDate(queryDate, env.NYT_API_KEY),
        fetchGuardianForDate(queryDate, env.GUARDIAN_API_KEY),
        skipLiveWire ? Promise.resolve([]) : fetchPerplexityForDate(queryDate, env.PERPLEXITY_API_KEY),
        fetchChroniclingAmerica(queryDate),
      ])

      if (nyt.length) providersUsed.push('nyt-archive')
      if (guardian.length) providersUsed.push('guardian')
      if (perplexity.length) providersUsed.push('perplexity-search')
      if (chronicling.length) providersUsed.push('chronicling-america')
    }
  }

  const merged = [...wikiEvents, ...nyt, ...guardian, ...perplexity, ...chronicling]
    .map((e) => sanitizeEventCitations(e))
    .filter((e) => !looksLikeHeadlineDump(e.synopsis))
    .map((e) =>
      e.synopsis.length > 320
        ? { ...e, synopsis: clipToShortProse(e.synopsis, 280) }
        : e,
    )

  if (merged.length === 0) {
    const fallback = buildFallbackResult(queryDate, brandId, researchMode)
    fallback.usingFallback = true
    return fallback
  }

  // Prefer the queried year when it has something press-worthy; otherwise
  // allow a more poignant same-calendar-day event (UI shows “Also on this day”).
  // Recent / future dates: prefer historical Wikipedia over live wire.
  const targetYear = Number(queryDate.slice(0, 4))
  const sameYear = merged.filter((e) => e.year === targetYear)
  const sameYearRanked = rankByInterest(sameYear, targetYear)
  const bestSameScore = sameYearRanked[0] ? scoreCulturalInterest(sameYearRanked[0]) : -99
  const wikiOnly = merged.filter((e) => e.discoveredVia?.includes('wikipedia-onthisday'))
  const preferHistorical = isTooRecentForLiveWire(queryDate) || bestSameScore < 2

  const poolForPick =
    preferHistorical && wikiOnly.length > 0
      ? rankByInterest(wikiOnly, targetYear)
      : bestSameScore >= 2 && sameYearRanked.length > 0
        ? sameYearRanked
        : rankByInterest(merged, targetYear)

  const shortlist = poolForPick.slice(0, 8)

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

  let events = shortlist.slice(0, 1)

  if (env.GEMINI_API_KEY && shortlist.length > 1) {
    const picked = await pickMostInterestingEvent({
      apiKey: env.GEMINI_API_KEY,
      queryDate,
      targetYear,
      candidates: shortlist.map((e) => ({
        title: e.title,
        synopsis: e.synopsis,
        year: e.year,
      })),
    })
    if (picked != null && shortlist[picked]) {
      events = [shortlist[picked]]
      if (!providersUsed.includes('gemini')) providersUsed.push('gemini')
    }
  }

  // Full mode: verify Wikipedia bridge claims and upgrade to news/gov cites when possible.
  if (!isLite && events[0] && isWikipediaBridgeEvent(events[0])) {
    const upgraded = await upgradeWikipediaClaim(events[0], env)
    events = [sanitizeEventCitations(upgraded.event)]
    for (const id of upgraded.providersUsed) {
      if (!providersUsed.includes(id)) providersUsed.push(id)
    }
  }

  // Both modes: Gemini rewrites truncated wiki titles into a complete headline + body.
  // Lite stays Wikipedia-sourced; full also gets cite upgrades above.
  if (env.GEMINI_API_KEY && events[0]) {
    const event = events[0]
    const polished = await polishEventCopy({
      apiKey: env.GEMINI_API_KEY,
      year: event.year,
      title: event.title,
      synopsis: event.synopsis,
      pageTitle: event.citations[0]?.title,
      mode: isLite ? 'lite' : 'full',
    })
    if (polished) {
      events = [
        {
          ...event,
          title: polished.title,
          synopsis: polished.synopsis,
          ...(polished.whyItMatters ? { whyItMatters: polished.whyItMatters } : {}),
        },
      ]
      if (!providersUsed.includes('gemini')) providersUsed.push('gemini')
    } else {
      events = [fallbackDistinctCopy(event)]
    }
  } else if (events[0]) {
    events = [fallbackDistinctCopy(events[0])]
  }

  // Bloom-style entity glosses on the claim sentence (Wikipedia summary).
  if (events[0]) {
    events = [await attachGlosses(events[0])]
    if (events[0].glosses?.length && !providersUsed.includes('wikipedia-summary')) {
      providersUsed.push('wikipedia-summary')
    }
  }

  // Display copy comes from polishEventCopy in full mode — skip a second Gemini
  // pass for narrative.lede (unused in the spotlight UI today).
  const narrative = await composeNarrative({
    apiKey: undefined,
    brand,
    queryDate,
    eventSummaries: events.map((e) => `${e.year}: ${e.title} — ${e.synopsis}`),
  })
  if (events[0]?.synopsis) {
    narrative.lede = events[0].synopsis
    if (providersUsed.includes('gemini')) narrative.voice = 'gemini'
  }

  const hasExact = events.some((e) => e.precision === 'exact-day')

  return {
    queryDate,
    datePath: toOnThisDayPath(queryDate),
    displayDate: toDisplayDate(queryDate),
    resolvedMode: hasExact ? 'exact' : 'period-estimate',
    researchMode,
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

/** Scrub chrome and prefer a descriptive headline over a bare page name. */
function fallbackDistinctCopy(event: CulturalEvent): CulturalEvent {
  const synopsis = cleanPressText(event.synopsis)
  const pageTitle = cleanPressText(event.citations[0]?.title || '')
  let title = toSentenceCaseHeadline(event.title)

  const bad =
    !title ||
    looksLikeDateOnlyTitle(title) ||
    looksLikeBareName(title) ||
    isIncompleteHeadline(title) ||
    titleEchoesBody(title, synopsis)

  if (bad) {
    title = toSentenceCaseHeadline(descriptiveFallbackTitle(synopsis, pageTitle))
  }

  return { ...event, title, synopsis }
}
