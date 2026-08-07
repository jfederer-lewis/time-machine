/**
 * Wikipedia REST Summary resolver — Bloom-style gloss bodies.
 * Glosses are context, never the public citation for a claim.
 */

import { firstSentence, clipToCompleteSentences } from '../lib/clean-text'

const USER_AGENT = 'TimeMachinePressPrototype/0.1 (heritage press tool; research@local)'

export type WikiSummaryHit = {
  extract: string
  url: string
  title: string
  originator: string
}

function normalizeTitle(value: string): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ /g, '_')
    .slice(0, 160)
}

const WIKIPEDIA_SUMMARY_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const WIKIPEDIA_OPENSEARCH =
  'https://en.wikipedia.org/w/api.php?action=opensearch&limit=5&namespace=0&format=json&origin=*&search='

async function wikiFetch(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Api-User-Agent': USER_AGENT,
        'User-Agent': USER_AGENT,
      },
    })
  } catch (err) {
    console.error('[time-machine] Wikipedia network error', err)
    return null
  }
}

function parseSummaryPayload(payload: {
  type?: string
  extract?: string
  title?: string
  description?: string
  content_urls?: { desktop?: { page?: string }; mobile?: { page?: string } }
}): WikiSummaryHit | null {
  if (payload.type === 'disambiguation') return null

  let extract = firstSentence(payload.extract || '')
  extract = clipToCompleteSentences(extract, 220)
  const pageUrl = payload.content_urls?.desktop?.page || payload.content_urls?.mobile?.page || ''
  if (!extract || !pageUrl) return null

  return {
    extract,
    url: pageUrl,
    title: payload.title || '',
    originator: String(payload.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120),
  }
}

async function fetchSummaryForTitle(title: string): Promise<WikiSummaryHit | null> {
  const normalized = normalizeTitle(title)
  if (!normalized) return null

  const res = await wikiFetch(`${WIKIPEDIA_SUMMARY_BASE}/${encodeURIComponent(normalized)}`)
  if (!res) return null
  if (res.status === 404) return null
  if (!res.ok) {
    console.error(`[time-machine] Wikipedia summary ${res.status}`)
    return null
  }

  const payload = (await res.json()) as Parameters<typeof parseSummaryPayload>[0]
  const hit = parseSummaryPayload(payload)
  if (!hit) return null
  if (!hit.title) hit.title = title.replace(/_/g, ' ')
  return hit
}

/** Resolve an ambiguous / approximate name to a page title via OpenSearch. */
async function searchWikipediaTitle(query: string): Promise<string | null> {
  const q = String(query || '').replace(/\s+/g, ' ').trim()
  if (q.length < 3) return null

  const res = await wikiFetch(`${WIKIPEDIA_OPENSEARCH}${encodeURIComponent(q)}`)
  if (!res?.ok) return null

  const data = (await res.json()) as unknown
  // OpenSearch returns [query, [titles], [descriptions], [urls]]
  if (!Array.isArray(data) || !Array.isArray(data[1]) || data[1].length === 0) return null

  const titles = data[1] as string[]
  const qLower = q.toLowerCase()
  const exact = titles.find((t) => t.toLowerCase() === qLower)
  if (exact) return exact
  // Prefer a title that starts with the query (person pages often do)
  const starts = titles.find((t) => t.toLowerCase().startsWith(qLower))
  if (starts) return starts
  return titles[0] || null
}

/**
 * Look up a Wikipedia summary for a term.
 * Tries the exact title first; on miss / disambiguation, OpenSearch then summary.
 */
export async function fetchWikipediaSummary(titleOrTerm: string): Promise<WikiSummaryHit | null> {
  const direct = await fetchSummaryForTitle(titleOrTerm)
  if (direct) return direct

  const searched = await searchWikipediaTitle(titleOrTerm)
  if (!searched || searched.toLowerCase() === titleOrTerm.replace(/_/g, ' ').toLowerCase()) {
    return null
  }
  return fetchSummaryForTitle(searched)
}
