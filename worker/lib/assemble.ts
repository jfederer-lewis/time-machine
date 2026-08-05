import type { CulturalEvent, DateQueryResult, ProviderId, ResearchMode } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'
import { queryDatePrecision, toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { buildFallbackResult, PROVIDER_CATALOGUE } from '../data/fallback'
import { composeNarrative, polishEventCopy, pickMostInterestingEvent } from '../providers/gemini'
import { fetchOnThisDay } from '../providers/wikipedia'
import {
  fetchOnThisDayCom,
  fetchOnThisDayComAnyYear,
  fetchHistoryComDay,
} from '../providers/day-indexes'
import {
  fetchChroniclingAmerica,
  fetchGuardianForDate,
  fetchNytForDate,
  fetchPerplexityForDate,
} from '../providers/archives'
import { sanitizeEventCitations } from './verify'
import {
  needsCiteUpgrade,
  upgradeWikipediaClaim,
} from './upgrade-claim'
import { attachGlosses } from './gloss-service'
import {
  cleanPressText,
  looksLikeDateOnlyTitle,
  descriptiveFallbackTitle,
  titleEchoesBody,
  titleIsCutFromBody,
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
  opts?: { forceFallback?: boolean; brandId?: string; researchMode?: ResearchMode; anyYear?: boolean },
): Promise<DateQueryResult> {
  const brandId = opts?.brandId || env.BRAND_ID || 'converse'
  const brand = getBrand(brandId)
  const forceFallback = opts?.forceFallback ?? env.USE_FALLBACK === 'true'
  const researchMode: ResearchMode = opts?.researchMode === 'lite' ? 'lite' : 'full'
  const isLite = researchMode === 'lite'
  const anyYear = opts?.anyYear ?? false

  if (forceFallback) {
    return buildFallbackResult(queryDate, brandId, researchMode)
  }

  const precision = queryDatePrecision(queryDate)
  const providersUsed: ProviderId[] = []

  // Day-indexed providers only run when a real calendar day was supplied —
  // never invent Jan 1 (or any day) for year/month-only queries.
  let wikiEvents: CulturalEvent[] = []
  let onThisDayCom: CulturalEvent[] = []
  let historyCom: CulturalEvent[] = []
  let nyt: CulturalEvent[] = []
  let guardian: CulturalEvent[] = []
  let perplexity: CulturalEvent[] = []
  let chronicling: CulturalEvent[] = []

  if (precision === 'exact-day') {
    const [yyyy, mm, dd] = queryDate.split('-').map(Number)

    // Multi-source discovery: editorial day-indexes + Wikipedia bridge.
    // On This Day / History.com are never public citations.
    const discoverySettled = await Promise.allSettled([
      fetchOnThisDay(mm, dd),
      fetchOnThisDayCom(yyyy, mm, dd),
      anyYear
        ? fetchOnThisDayComAnyYear(mm, dd, { preferNearYear: yyyy, limit: 18 })
        : Promise.resolve([] as CulturalEvent[]),
      fetchHistoryComDay(mm, dd),
    ])

    wikiEvents = discoverySettled[0].status === 'fulfilled' ? discoverySettled[0].value : []
    const otdYear = discoverySettled[1].status === 'fulfilled' ? discoverySettled[1].value : []
    const otdAny = discoverySettled[2].status === 'fulfilled' ? discoverySettled[2].value : []
    historyCom = discoverySettled[3].status === 'fulfilled' ? discoverySettled[3].value : []
    onThisDayCom = [...otdYear, ...otdAny]

    if (wikiEvents.length) providersUsed.push('wikipedia-onthisday')
    if (onThisDayCom.length) providersUsed.push('onthisday-com')
    if (historyCom.length) providersUsed.push('history-com')

    // Full mode fans out to paid / archive providers.
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

  const merged = dedupeDiscoveryEvents([
    ...onThisDayCom,
    ...historyCom,
    ...wikiEvents,
    ...nyt,
    ...guardian,
    ...perplexity,
    ...chronicling,
  ])
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
  // Do NOT force a Wikipedia-only pool — editorial indexes compete equally.
  const targetYear = Number(queryDate.slice(0, 4))
  const sameYear = merged.filter((e) => e.year === targetYear)
  const sameYearRanked = rankByInterest(sameYear, targetYear)
  const bestSameScore = sameYearRanked[0] ? scoreCulturalInterest(sameYearRanked[0]) : -99

  const poolForPick = anyYear
    ? rankByInterest(merged, targetYear, true)
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

  // Full mode: verify discovery / Wiki-bridge claims and upgrade to news/gov cites.
  if (!isLite && events[0] && needsCiteUpgrade(events[0])) {
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
    titleEchoesBody(title, synopsis) ||
    titleIsCutFromBody(title, synopsis)

  if (bad) {
    title = toSentenceCaseHeadline(descriptiveFallbackTitle(synopsis, pageTitle))
  }

  return { ...event, title, synopsis }
}

/** Collapse near-duplicate day facts from multiple discovery hosts. */
function dedupeDiscoveryEvents(events: CulturalEvent[]): CulturalEvent[] {
  const out: CulturalEvent[] = []
  const byKey = new Map<string, number>()

  for (const event of events) {
    const norm = cleanPressText(event.synopsis || event.title)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 96)
    const key = `${event.year}:${norm}`
    const existingIdx = byKey.get(key)
    if (existingIdx == null) {
      byKey.set(key, out.length)
      out.push(event)
      continue
    }
    const prev = out[existingIdx]
    const mergedVia = [
      ...new Set([...(prev.discoveredVia ?? []), ...(event.discoveredVia ?? [])]),
    ]
    // Prefer the copy with a real citation, else the higher-interest editorial host
    const prevCite = prev.citations.length
    const nextCite = event.citations.length
    if (nextCite > prevCite) {
      out[existingIdx] = { ...event, discoveredVia: mergedVia }
    } else {
      out[existingIdx] = { ...prev, discoveredVia: mergedVia }
    }
  }

  return out
}
