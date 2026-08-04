import {
  citationTier,
  isCitationAllowed,
  isCitationBlocked,
  type DiscoveryChannel,
} from '../../shared/source-registry'
import { withHarvard, type Citation, type CulturalEvent } from '../../shared/provenance'

/**
 * Enforce: discovery hosts never become public citations.
 * Cards without an allowlisted cite are forced to needs-human-review.
 */
export function sanitizeEventCitations(
  event: CulturalEvent,
  discoveredVia: DiscoveryChannel[] = event.discoveredVia ?? [],
): CulturalEvent {
  const safeCitations: Citation[] = []

  for (const raw of event.citations) {
    if (isCitationBlocked(raw.url)) {
      continue
    }
    if (!isCitationAllowed(raw.url) && raw.sourceQuality !== 'curated-fallback') {
      // Unknown host — keep but flag for human review rather than silent drop
      safeCitations.push(
        withHarvard({
          ...raw,
          sourceQuality: 'needs-human-review',
          tier: citationTier(raw.url),
        }),
      )
      continue
    }
    safeCitations.push(
      withHarvard({
        ...raw,
        tier: citationTier(raw.url),
      }),
    )
  }

  const needsHumanReview =
    event.needsHumanReview ||
    safeCitations.length === 0 ||
    safeCitations.some((c) => c.sourceQuality === 'needs-human-review')

  return {
    ...event,
    discoveredVia,
    citations: safeCitations,
    needsHumanReview,
  }
}

export function assertNotBlocklistedCitation(url: string): void {
  if (isCitationBlocked(url)) {
    throw new Error(
      `Blocked as citation (discovery-only): ${url}. See documentation/SOURCES_AND_LANDSCAPE.md`,
    )
  }
}
