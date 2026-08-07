import type { CulturalEvent, DateQueryResult, ProviderId, ResearchMode } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { brandMomentsForQueryDate } from '../../shared/brand'
import { getBrand } from '../../shared/brands'
import {
  universeAnchorsForQueryDate,
} from '../../shared/converse-universe'
import { queryDatePrecision, toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { buildFallbackResult, PROVIDER_CATALOGUE } from '../data/fallback'
import { composeNarrative, polishEventCopy, pickMostInterestingEvent, discoverEventsWithGemini } from '../providers/gemini'
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
  titleTooCloseToBody,
  looksLikeBareName,
  isIncompleteHeadline,
  toSentenceCaseHeadline,
  looksLikeHeadlineDump,
  clipToShortProse,
} from './clean-text'
import { validateCopyContract } from './copy-contract'
import { rankByInterest, scoreCulturalInterest, isTooRecentForLiveWire, isLandmarkDefiningEvent } from './interest'

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
  opts?: { forceFallback?: boolean; brandId?: string; anyYear?: boolean },
): Promise<DateQueryResult> {
  const brandId = opts?.brandId || env.BRAND_ID || 'converse'
  const brand = getBrand(brandId)
  const forceFallback = opts?.forceFallback ?? env.USE_FALLBACK === 'true'
  const researchMode: ResearchMode = 'full'
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
  let geminiDiscovery: CulturalEvent[] = []

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

    // Paid archives + Gemini grounded retrieval (cite-gated).
    // Skip live wire date-search for recent/future dates — this product reads as past.
    const skipLiveWire = isTooRecentForLiveWire(queryDate)
    const [nytR, guardianR, perplexityR, chroniclingR, geminiR] = await Promise.all([
      fetchNytForDate(queryDate, env.NYT_API_KEY),
      fetchGuardianForDate(queryDate, env.GUARDIAN_API_KEY),
      skipLiveWire ? Promise.resolve([]) : fetchPerplexityForDate(queryDate, env.PERPLEXITY_API_KEY),
      fetchChroniclingAmerica(queryDate),
      env.GEMINI_API_KEY
        ? discoverEventsWithGemini({ apiKey: env.GEMINI_API_KEY, queryDate })
        : Promise.resolve([] as CulturalEvent[]),
    ])
    nyt = nytR
    guardian = guardianR
    perplexity = perplexityR
    chronicling = chroniclingR
    geminiDiscovery = geminiR

    if (nyt.length) providersUsed.push('nyt-archive')
    if (guardian.length) providersUsed.push('guardian')
    if (perplexity.length) providersUsed.push('perplexity-search')
    if (chronicling.length) providersUsed.push('chronicling-america')
    if (geminiDiscovery.length && !providersUsed.includes('gemini')) providersUsed.push('gemini')
  }

  const merged = dedupeDiscoveryEvents([
    ...geminiDiscovery,
    ...onThisDayCom,
    ...historyCom,
    ...wikiEvents,
    ...nyt,
    ...guardian,
    ...perplexity,
    ...chronicling,
  ])
    .map((e) => sanitizeEventCitations(e))
    // Aggregator #1-song labels and other non-cards never enter the pool
    .filter((e) => e.category !== 'charts')
    .filter((e) => !looksLikeHeadlineDump(e.synopsis))
    .filter((e) => !isThinDiscoveryStub(e))
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

  const brandMoments: CulturalEvent[] = brandMomentsForQueryDate(brand, queryDate)
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

  // People / hinge anchors (e.g. Chuck Taylor birthday) — same calendar day, any year
  for (const anchor of universeAnchorsForQueryDate(queryDate)) {
    if (brandMoments.some((b) => b.id === anchor.id)) continue
    brandMoments.push(
      sanitizeEventCitations({
        id: anchor.id,
        year: Number(anchor.date.slice(0, 4)),
        title: anchor.title,
        synopsis: `${anchor.synopsis} ${anchor.converseTie}`,
        category: 'brand',
        precision: 'exact-day',
        discoveredVia: ['internal-curated'],
        citations: [
          withHarvard({
            title: anchor.citation.title,
            url: anchor.citation.url,
            publisher: anchor.citation.publisher,
            author: anchor.citation.author,
            publishedAt: anchor.citation.publishedAt ?? anchor.date,
            accessedAt: new Date().toISOString(),
            sourceQuality: 'trusted-source-snippet',
            evidenceKind: 'paraphrase',
            reference: anchor.reference,
            provider: 'brand-timeline',
            isExactQuote: false,
          }),
        ],
      }),
    )
  }

  if (brandMoments.length) providersUsed.push('brand-timeline')

  // Exact-day / month heritage beats compete for the spotlight (not only as a side note)
  // — except on landmark defining days (9/11-class), where brand must not win or dilute.
  const poolHasLandmark = poolForPick.some((e) => isLandmarkDefiningEvent(e))
  const brandForSpotlight = poolHasLandmark
    ? []
    : brandMoments.filter((m) => m.precision === 'exact-day' || m.precision === 'month')
  const poolWithBrand = brandForSpotlight.length
    ? rankByInterest([...poolForPick, ...brandForSpotlight], targetYear)
    : poolForPick

  // Prefer substance for the shortlist — thin chart stubs (#1: Song / same fact twice) lose.
  const substanceFirst = poolWithBrand.filter((e) => !isThinDiscoveryStub(e))
  const shortlist = (substanceFirst.length ? substanceFirst : poolWithBrand).slice(0, 8)

  // Ordered try list: Gemini pick first, then remaining shortlist by interest rank.
  let ordered = [...shortlist]
  if (env.GEMINI_API_KEY && shortlist.length > 1) {
    const picked = await pickMostInterestingEvent({
      apiKey: env.GEMINI_API_KEY,
      queryDate,
      targetYear,
      candidates: shortlist.map((e) => ({
        title: e.title,
        synopsis: e.synopsis,
        year: e.year,
        sourceHint:
          e.citations[0]?.publisher ||
          e.citations[0]?.provider ||
          e.discoveredVia?.[0] ||
          undefined,
      })),
    })
    if (picked != null && shortlist[picked]) {
      ordered = [shortlist[picked], ...shortlist.filter((_, i) => i !== picked)]
      if (!providersUsed.includes('gemini')) providersUsed.push('gemini')
    }
  }

  // Polish → validate → (full) cite upgrade. Never ship a card that fails the copy contract.
  // Cap tries so a bad pick doesn't burn the quota on every shortlist row.
  let events: CulturalEvent[] = []
  for (const candidate of ordered.slice(0, 3)) {
    let next = candidate

    if (env.GEMINI_API_KEY) {
      const polished = await polishEventCopy({
        apiKey: env.GEMINI_API_KEY,
        year: candidate.year,
        title: candidate.title,
        synopsis: candidate.synopsis,
        pageTitle: candidate.citations[0]?.title,
      })
      if (polished) {
        next = {
          ...candidate,
          title: polished.title,
          synopsis: polished.synopsis,
          ...(polished.whyItMatters ? { whyItMatters: polished.whyItMatters } : {}),
        }
        if (!providersUsed.includes('gemini')) providersUsed.push('gemini')
      } else {
        // Discovery found a real claim — don't blank the day because phrasing failed.
        next = fallbackDistinctCopy(candidate)
        const gate = validateCopyContract({
          title: next.title,
          synopsis: next.synopsis,
          ...(next.whyItMatters ? { whyItMatters: next.whyItMatters } : {}),
        })
        if (!gate.ok) {
          console.warn(
            '[time-machine] polish failed and deterministic copy also failed contract',
            gate.issues.map((i) => i.code).join(', '),
          )
          continue
        }
      }
    } else {
      next = fallbackDistinctCopy(candidate)
      const gate = validateCopyContract({
        title: next.title,
        synopsis: next.synopsis,
        ...(next.whyItMatters ? { whyItMatters: next.whyItMatters } : {}),
      })
      if (!gate.ok) continue
    }

    if (needsCiteUpgrade(next)) {
      const upgraded = await upgradeWikipediaClaim(next, env)
      next = sanitizeEventCitations(upgraded.event)
      for (const id of upgraded.providersUsed) {
        if (!providersUsed.includes(id)) providersUsed.push(id)
      }
    }

    const shipped = validateCopyContract({
      title: next.title,
      synopsis: next.synopsis,
      ...(next.whyItMatters ? { whyItMatters: next.whyItMatters } : {}),
    })
    if (!shipped.ok) {
      console.warn(
        '[time-machine] skipping candidate after polish/cite — contract failed',
        shipped.issues.map((i) => i.code).join(', '),
      )
      continue
    }

    events = [
      {
        ...next,
        title: shipped.value.title,
        synopsis: shipped.value.synopsis,
        ...(shipped.value.whyItMatters ? { whyItMatters: shipped.value.whyItMatters } : {}),
      },
    ]
    break
  }

  if (!events.length) {
    const fallback = buildFallbackResult(queryDate, brandId, researchMode)
    fallback.usingFallback = true
    return fallback
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
    titleTooCloseToBody(title, synopsis) ||
    titleIsCutFromBody(title, synopsis)

  if (bad) {
    title = toSentenceCaseHeadline(descriptiveFallbackTitle(synopsis, pageTitle))
  }

  // Context is required by knobs — reuse a Wikipedia extract gloss when Gemini polish failed.
  let whyItMatters = event.whyItMatters ? cleanPressText(event.whyItMatters) : ''
  if (!whyItMatters) {
    const gloss = event.glosses?.find((g) => cleanPressText(g.gloss).length > 40)
    if (gloss) {
      const candidate = cleanPressText(gloss.gloss)
      if (
        candidate &&
        !titleEchoesBody(candidate, synopsis) &&
        candidate.toLowerCase() !== synopsis.toLowerCase()
      ) {
        whyItMatters = candidate
      }
    }
  }

  return {
    ...event,
    title,
    synopsis,
    ...(whyItMatters ? { whyItMatters } : {}),
  }
}

/** Discovery labels with title ≈ synopsis — not shippable research cards. */
function isThinDiscoveryStub(event: CulturalEvent): boolean {
  if (event.category === 'charts') return true
  if (titleTooCloseToBody(event.title, event.synopsis)) return true
  if (event.synopsis.length < 48) return true
  return false
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
