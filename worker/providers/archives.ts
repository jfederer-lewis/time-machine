/**
 * Archive / press discovery providers.
 * Perplexity Search is wired for allowlisted domains + date windows.
 * NYT / Guardian / Chronicling America remain stubs until keys arrive.
 */

import { withHarvard, type CulturalEvent } from '../../shared/provenance'
import { CITATION_ALLOWLIST, isCitationBlocked } from '../../shared/source-registry'

const PERPLEXITY_SEARCH_URL = 'https://api.perplexity.ai/search'

/** Tier B/A news domains only — never aggregators. Cap 20 for Perplexity. */
const PERPLEXITY_DOMAINS = CITATION_ALLOWLIST.filter(
  (e) =>
    e.role === 'citation' &&
    (e.tier === 'A' || e.tier === 'B') &&
    !e.host.includes('officialcharts') &&
    !e.host.includes('billboard') &&
    !e.host.includes('moma') &&
    !e.host.includes('vam.ac') &&
    !e.host.includes('si.edu'),
)
  .map((e) => e.host)
  .slice(0, 20)

export async function fetchNytForDate(_date: string, _apiKey?: string): Promise<CulturalEvent[]> {
  if (!_apiKey) return []
  return []
}

export async function fetchGuardianForDate(_date: string, _apiKey?: string): Promise<CulturalEvent[]> {
  if (!_apiKey) return []
  return []
}

export async function fetchChroniclingAmerica(_date: string): Promise<CulturalEvent[]> {
  return []
}

/**
 * Perplexity Search for press published around the query date.
 * Uses search_after/before filters (MM/DD/YYYY). Results must be allowlisted hosts;
 * Perplexity itself is never the citation.
 */
export async function fetchPerplexityForDate(
  date: string,
  apiKey?: string,
): Promise<CulturalEvent[]> {
  if (!apiKey) return []

  const [y, m, d] = date.split('-').map(Number)
  const display = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  // Window: day itself ± a few days (press sometimes lags by a day)
  const after = formatPplxDate(addDaysUtc(y, m, d, -2))
  const before = formatPplxDate(addDaysUtc(y, m, d, 3))

  const query = `major world news events culture sport on ${display}`

  const body: Record<string, unknown> = {
    query,
    max_results: 10,
    search_after_date_filter: after,
    search_before_date_filter: before,
    search_domain_filter: PERPLEXITY_DOMAINS,
  }

  let res: Response
  try {
    res = await fetch(PERPLEXITY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    console.error('[time-machine] Perplexity network error', err)
    return []
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[time-machine] Perplexity ${res.status}`, errText.slice(0, 400))
    return []
  }

  const payload = (await res.json()) as {
    results?: Array<{
      title?: string
      url?: string
      snippet?: string
      date?: string | null
      last_updated?: string | null
    }>
  }

  const accessedAt = new Date().toISOString()
  const events: CulturalEvent[] = []

  for (const [index, row] of (payload.results ?? []).entries()) {
    const url = row.url?.trim()
    if (!url || isCitationBlocked(url)) continue

    const title = (row.title || 'Untitled').trim()
    const snippet = (row.snippet || '').trim()
    const publishedAt = row.date || row.last_updated || date

    events.push({
      id: `pplx-${date}-${index}`,
      year: y,
      title: title.slice(0, 120),
      synopsis:
        snippet ||
        `Press cutting surfaced for ${display} via allowlisted search. Verify before export.`,
      category: 'other',
      precision: 'exact-day',
      discoveredVia: ['unknown'],
      needsHumanReview: true,
      citations: [
        withHarvard({
          title,
          url,
          publisher: hostname(url),
          publishedAt: publishedAt.slice(0, 10),
          accessedAt,
          sourceQuality: snippet.length >= 80 ? 'trusted-source-snippet' : 'trusted-discovery-only',
          evidenceKind: 'paraphrase',
          reference:
            snippet ||
            `Source note: headline/metadata from allowlisted press search for ${display}. Fetch full article text before quoting.`,
          provider: 'perplexity-search',
          isExactQuote: false,
        }),
      ],
    })
  }

  return events
}

/**
 * Claim-specific search (no publish-date window) — used to upgrade Wikipedia
 * discoveries to Tier A/B news / archive URLs. Perplexity is never the cite.
 */
export async function searchAllowlistedCiteForClaim(opts: {
  apiKey?: string
  year: number
  title: string
  synopsis: string
}): Promise<Array<{ url: string; title: string; snippet: string; publisher: string }>> {
  const { apiKey, year, title, synopsis } = opts
  if (!apiKey) return []

  const claim = `${year}: ${title}. ${synopsis}`.slice(0, 400)
  const query = `primary source or reputable news archive confirming: ${claim}`

  let res: Response
  try {
    res = await fetch(PERPLEXITY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: 8,
        search_domain_filter: PERPLEXITY_DOMAINS,
      }),
    })
  } catch (err) {
    console.error('[time-machine] Perplexity claim search network error', err)
    return []
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[time-machine] Perplexity claim search ${res.status}`, errText.slice(0, 400))
    return []
  }

  const payload = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; snippet?: string }>
  }

  const out: Array<{ url: string; title: string; snippet: string; publisher: string }> = []
  for (const row of payload.results ?? []) {
    const url = row.url?.trim()
    if (!url || isCitationBlocked(url)) continue
    out.push({
      url,
      title: (row.title || 'Untitled').trim(),
      snippet: (row.snippet || '').trim(),
      publisher: hostname(url),
    })
  }
  return out
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatPplxDate(parts: { y: number; m: number; d: number }): string {
  return `${parts.m}/${parts.d}/${parts.y}`
}

function addDaysUtc(y: number, m: number, d: number, delta: number) {
  const dt = new Date(Date.UTC(y, m - 1, d + delta))
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}
