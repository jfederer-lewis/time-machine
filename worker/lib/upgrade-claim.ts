/**
 * Pass 2 — verify a Wikipedia-discovered claim and prefer a Tier A/B cite.
 * Gemini judges legitimacy; Perplexity (+ Gemini grounding) supply candidate URLs.
 * Gemini itself is never the public citation.
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

const TIER_RANK: Record<SourceTier | 'unknown', number> = {
  A: 4,
  B: 3,
  C: 2,
  bridge: 1,
  blocked: 0,
  unknown: 0,
}

export function isWikipediaBridgeEvent(event: CulturalEvent): boolean {
  if (event.discoveredVia?.includes('wikipedia-onthisday')) return true
  const cite = event.citations[0]
  return cite?.publisher === 'Wikipedia' || citationTier(cite?.url ?? '') === 'bridge'
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

function pickBestCandidate(
  candidates: ClaimCandidate[],
): ClaimCandidate | undefined {
  const eligible = candidates.filter((c) => c.url && isUpgradeCite(c.url))
  eligible.sort(
    (a, b) =>
      (TIER_RANK[citationTier(b.url)] ?? 0) - (TIER_RANK[citationTier(a.url)] ?? 0),
  )
  return eligible[0]
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

  const best = pickBestCandidate(pool)

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
    // Claim may be fine, but no Tier A/B URL found — keep Wiki bridge, flag review.
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
  const snippet = best.snippet?.trim()
  const accessedAt = new Date().toISOString()

  return {
    event: {
      ...event,
      // Still discovered via Wiki; cite is upgraded.
      needsHumanReview: false,
      citations: [
        withHarvard({
          title: best.title || event.title,
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
