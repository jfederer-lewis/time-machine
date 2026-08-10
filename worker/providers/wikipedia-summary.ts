/**
 * Wikipedia REST Summary resolver — Bloom-style gloss bodies.
 * Glosses are context. Chuck-E may also use the page URL + allowlisted
 * externallinks (footnotes) as a sparse Sources bridge — never over curated / Tier A/B.
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

function normalizeAliasKey(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Product / collab shorthand that OpenSearch mis-resolves (e.g. “Billie By You” → Billie Burke).
 * Map to the person / entity page desks actually need.
 */
const WIKI_TITLE_ALIASES: Record<string, string> = {
  'billie by you': 'Billie Eilish',
  'billie eilish by you': 'Billie Eilish',
  'converse x billie eilish': 'Billie Eilish',
  'converse by you x billie eilish': 'Billie Eilish',
  'tyler team-up': 'Tyler, the Creator',
  'tyler the creator': 'Tyler, the Creator',
  'tyler, the creator': 'Tyler, the Creator',
  'golf le fleur': 'Tyler, the Creator',
  'golf le fleur*': 'Tyler, the Creator',
  'golf le fleur* one star': 'Tyler, the Creator',
  'le fleur': 'Tyler, the Creator',
  'le fleur*': 'Tyler, the Creator',
  '1908 program': 'Tyler, the Creator',
}

/** Tiny connectors — not enough alone to justify a person-page expansion. */
const OPENSEARCH_STOP = new Set([
  'a',
  'an',
  'and',
  'by',
  'for',
  'in',
  'of',
  'on',
  'the',
  'to',
  'x',
  'you',
  'with',
])

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

/**
 * Refuse OpenSearch expansions that only share a first name with a multi-word query
 * (“Billie By You” → Billie Burke). Prefer silence over the wrong person.
 */
export function isPlausibleWikipediaTitle(query: string, title: string): boolean {
  const q = String(query || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const t = String(title || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .trim()
    .toLowerCase()
  if (!q || !t) return false
  if (t === q) return true
  if (t.startsWith(q) || q.startsWith(t)) return true

  const qParts = q.split(/\s+/).filter(Boolean)
  const tParts = t.split(/\s+/).filter(Boolean)
  if (qParts.length <= 1) return true

  const qContent = qParts.filter((p) => !OPENSEARCH_STOP.has(p) && p.length > 1)
  const overlap = qContent.filter((p) =>
    tParts.some((tp) => tp === p || tp.startsWith(p) || p.startsWith(tp)),
  )

  if (qContent.length >= 2) {
    return overlap.length >= Math.ceil(qContent.length * 0.6)
  }

  // Multi-word product / campaign shorthand with one content token (“Billie By You”):
  // do not expand to “Billie Burke” / “Billie Young”.
  if (qContent.length === 1 && qParts.length >= 2) {
    return tParts.length === 1 && tParts[0] === qContent[0]
  }

  return overlap.length >= 1
}

function pickOpenSearchTitle(query: string, titles: string[]): string | null {
  const qLower = query.toLowerCase()
  const exact = titles.find((t) => t.toLowerCase() === qLower)
  if (exact) return exact

  const starts = titles.find(
    (t) => t.toLowerCase().startsWith(qLower) && isPlausibleWikipediaTitle(query, t),
  )
  if (starts) return starts

  for (const t of titles) {
    if (isPlausibleWikipediaTitle(query, t)) return t
  }
  return null
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

  return pickOpenSearchTitle(q, data[1] as string[])
}

const WIKIPEDIA_PARSE =
  'https://en.wikipedia.org/w/api.php?action=parse&prop=externallinks&format=json&redirects=1&page='

/**
 * External links from a Wikipedia page (includes reference / footnote hosts).
 * Callers must filter with the citation registry — many links are not citable.
 */
export async function fetchWikipediaExternalLinks(title: string): Promise<string[]> {
  const normalized = normalizeTitle(title)
  if (!normalized) return []

  const res = await wikiFetch(`${WIKIPEDIA_PARSE}${encodeURIComponent(normalized.replace(/_/g, ' '))}`)
  if (!res?.ok) return []

  const payload = (await res.json()) as {
    parse?: { externallinks?: string[]; title?: string }
    error?: { code?: string }
  }
  if (payload.error || !payload.parse?.externallinks?.length) return []

  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of payload.parse.externallinks) {
    const url = String(raw || '').trim()
    if (!url || !/^https?:\/\//i.test(url)) continue
    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(url)
  }
  return out
}

/**
 * Look up a Wikipedia summary for a term.
 * Tries aliases + exact title first; on miss / disambiguation, OpenSearch then summary.
 */
export async function fetchWikipediaSummary(titleOrTerm: string): Promise<WikiSummaryHit | null> {
  const raw = String(titleOrTerm || '').replace(/\s+/g, ' ').trim()
  if (!raw) return null

  const alias = WIKI_TITLE_ALIASES[normalizeAliasKey(raw)]
  if (alias) {
    const aliased = await fetchSummaryForTitle(alias)
    if (aliased) return aliased
  }

  const direct = await fetchSummaryForTitle(raw)
  if (direct) return direct

  const searched = await searchWikipediaTitle(raw)
  if (!searched || searched.toLowerCase() === raw.toLowerCase()) {
    return null
  }
  return fetchSummaryForTitle(searched)
}
