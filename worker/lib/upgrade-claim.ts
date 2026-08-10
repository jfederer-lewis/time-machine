/**
 * Pass 2 — verify a Wikipedia-discovered claim and prefer a Tier A/B cite.
 * Gemini judges legitimacy; Perplexity (+ Gemini grounding) supply candidate URLs.
 * Gemini itself is never the public citation.
 *
 * Candidates must be *about the claim* — Tier A alone is not enough
 * (e.g. a National Archives copyright guide must not cite a UK #1 single).
 */

import {
  withHarvard,
  type CulturalEvent,
  type ProviderId,
} from '../../shared/provenance'
import {
  citationTier,
  findRegistryEntry,
  isCitationBlocked,
  type SourceTier,
} from '../../shared/source-registry'
import { searchAllowlistedCiteForClaim } from '../providers/archives'
import { verifyClaimWithGemini, type ClaimCandidate } from '../providers/gemini'
import { cleanPressText, looksLikeDateOnlyTitle } from './clean-text'

const TIER_RANK: Record<SourceTier | 'unknown', number> = {
  A: 4,
  B: 3,
  C: 2,
  bridge: 1,
  blocked: 0,
  unknown: 0,
}

const DISCOVERY_CHANNELS = new Set([
  'wikipedia-onthisday',
  'onthisday-com',
  'history-com',
  'bbc-onthisday',
])

/** True when the public cite is missing, Wiki-bridge, or discovery-index only. */
export function isWikipediaBridgeEvent(event: CulturalEvent): boolean {
  return needsCiteUpgrade(event)
}

/** Discovery / bridge cards that must be upgraded before press export. */
export function needsCiteUpgrade(event: CulturalEvent): boolean {
  const cite = event.citations[0]
  const tier = cite?.url ? citationTier(cite.url) : 'unknown'
  // Already verified with a credible public cite — no upgrade pass needed.
  if (cite && (tier === 'A' || tier === 'B') && cite.publisher !== 'Wikipedia') {
    return false
  }
  if (event.discoveredVia?.some((d) => DISCOVERY_CHANNELS.has(d))) return true
  if (!event.citations.length) return true
  if (cite?.publisher === 'Wikipedia' || tier === 'bridge') return true
  if (cite?.sourceQuality === 'trusted-discovery-only' || cite?.sourceQuality === 'needs-human-review') {
    return tier === 'unknown' || tier === 'C'
  }
  return false
}

export function citationPreferability(event: CulturalEvent): number {
  const url = event.citations[0]?.url
  if (!url) return 0
  return TIER_RANK[citationTier(url)] ?? 0
}

function isUpgradeCite(url: string): boolean {
  if (isCitationBlocked(url)) return false
  const entry = findRegistryEntry(url)
  return entry?.role === 'citation' && (entry.tier === 'A' || entry.tier === 'B')
}

/** Generic research-guide / help pages that are almost never about a day fact. */
function isGenericResearchGuide(url: string): boolean {
  return /help-with-your-research|research-guides|copyright-records|stationers-hall|\/faq\/|\/about\//i.test(
    url,
  )
}

const STOP = new Set([
  'the','a','an','and','or','of','on','in','to','for','at','by','from','with','this','that',
  'date','song','single','album','chart','charts','uk','us','number','one','was','were','is',
  'are','its','it','as','into','over','after','before','during','about','available','http','https',
])

function significantTokens(text: string): Set<string> {
  return new Set(
    cleanPressText(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP.has(t)),
  )
}

/** How well a candidate page title/snippet matches the day claim. */
export function claimCiteRelevance(
  claimText: string,
  candidate: Pick<ClaimCandidate, 'title' | 'snippet' | 'url'>,
): number {
  if (isGenericResearchGuide(candidate.url)) return 0

  const claim = significantTokens(claimText)
  if (!claim.size) return 0

  const cand = significantTokens(`${candidate.title || ''} ${candidate.snippet || ''}`)
  let hit = 0
  for (const t of claim) {
    if (cand.has(t)) hit += 1
  }
  // Prefer at least two content tokens, or one distinctive long token
  const longHits = [...claim].filter((t) => t.length >= 6 && cand.has(t)).length
  if (hit < 2 && longHits < 1) return 0
  return hit + longHits * 2
}

function preferredChartHost(url: string): boolean {
  return /officialcharts\.com|billboard\.com/i.test(url)
}

function isChartish(event: CulturalEvent): boolean {
  if (event.category === 'charts' || event.category === 'music') return true
  return /#\s*1|chart|billboard|official charts|number[\s-]one/i.test(
    `${event.title} ${event.synopsis}`,
  )
}

function pickBestCandidate(
  candidates: ClaimCandidate[],
  event: CulturalEvent,
): ClaimCandidate | undefined {
  const claimText = `${event.year} ${event.title} ${event.synopsis}`
  const chartish = isChartish(event)

  const scored = candidates
    .filter((c) => c.url && isUpgradeCite(c.url))
    .map((c) => {
      let relevance = claimCiteRelevance(claimText, c)
      if (chartish && preferredChartHost(c.url)) relevance += 6
      // Soft-penalise national archives / museums when the claim is a chart hit
      if (chartish && /nationalarchives|moma\.org|vam\.ac|si\.edu/i.test(c.url) && relevance < 4) {
        relevance = 0
      }
      return { c, relevance, tier: TIER_RANK[citationTier(c.url)] ?? 0 }
    })
    .filter((row) => row.relevance > 0)

  scored.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance
    return b.tier - a.tier
  })
  return scored[0]?.c
}

export async function upgradeWikipediaClaim(
  event: CulturalEvent,
  env: { GEMINI_API_KEY?: string; PERPLEXITY_API_KEY?: string },
): Promise<{ event: CulturalEvent; providersUsed: ProviderId[] }> {
  if (!isWikipediaBridgeEvent(event)) {
    return { event, providersUsed: [] }
  }

  const providersUsed: ProviderId[] = []
  const hasGemini = Boolean(env.GEMINI_API_KEY)
  const hasPerplexity = Boolean(env.PERPLEXITY_API_KEY)

  if (!hasGemini && !hasPerplexity) {
    return {
      event: {
        ...event,
        needsHumanReview: true,
        citations: event.citations.map((c) =>
          withHarvard({
            ...c,
            sourceQuality: 'needs-human-review',
            tier: citationTier(c.url),
          }),
        ),
      },
      providersUsed,
    }
  }

  const pplxCandidates = await searchAllowlistedCiteForClaim({
    apiKey: env.PERPLEXITY_API_KEY,
    year: event.year,
    title: event.title,
    synopsis: event.synopsis,
    category: event.category,
    domainProfile: 'press',
  })
  if (pplxCandidates.length) providersUsed.push('perplexity-search')

  const verification = hasGemini
    ? await verifyClaimWithGemini({
        apiKey: env.GEMINI_API_KEY!,
        year: event.year,
        title: event.title,
        synopsis: event.synopsis,
        candidates: pplxCandidates,
      })
    : null
  if (verification) providersUsed.push('gemini')

  const pool: ClaimCandidate[] = [
    ...pplxCandidates,
    ...(verification?.betterCitation ? [verification.betterCitation] : []),
    ...(verification?.groundedSources ?? []),
  ]

  const best = pickBestCandidate(pool, event)

  if (verification && !verification.legit) {
    return {
      event: {
        ...event,
        needsHumanReview: true,
        citations: event.citations.map((c) =>
          withHarvard({
            ...c,
            sourceQuality: 'needs-human-review',
            reference:
              verification.reason
                ? `${c.reference}\n\nVerification note: ${verification.reason}`
                : c.reference,
            tier: citationTier(c.url),
          }),
        ),
      },
      providersUsed,
    }
  }

  if (!best) {
    // Claim may be fine, but no *relevant* Tier A/B URL found — keep Wiki bridge, flag review.
    return {
      event: {
        ...event,
        needsHumanReview: true,
        citations: event.citations.map((c) =>
          withHarvard({
            ...c,
            sourceQuality: 'needs-human-review',
            tier: 'bridge',
          }),
        ),
      },
      providersUsed,
    }
  }

  const entry = findRegistryEntry(best.url)
  const publisher = best.publisher || entry?.label || hostname(best.url)
  const snippet = cleanPressText(best.snippet || '')
  const citeTitle = cleanPressText(best.title || event.title)
  const accessedAt = new Date().toISOString()

  return {
    event: {
      ...event,
      // Still discovered via Wiki; cite is upgraded. Keep Wiki claim text —
      // never replace synopsis with a scrape dump from the new cite.
      needsHumanReview: false,
      citations: [
        withHarvard({
          title:
            citeTitle && !looksLikeDateOnlyTitle(citeTitle) ? citeTitle : event.title,
          url: best.url,
          publisher,
          publishedAt: best.publishedAt || String(event.year),
          accessedAt,
          sourceQuality: 'trusted-source-snippet',
          evidenceKind: 'paraphrase',
          reference: snippet || event.synopsis,
          provider: pplxCandidates.some((c) => c.url === best.url)
            ? 'perplexity-search'
            : 'gemini',
          isExactQuote: false,
          tier: citationTier(best.url),
        }),
        // Keep Wiki as secondary provenance, not the public lead cite.
        ...event.citations.map((c) =>
          withHarvard({
            ...c,
            sourceQuality: 'trusted-discovery-only',
            tier: 'bridge',
          }),
        ),
      ],
    },
    providersUsed,
  }
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
