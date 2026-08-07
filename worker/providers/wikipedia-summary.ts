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

// Removed local duplicate firstSentence function as we import from clean-text


export async function fetchWikipediaSummary(titleOrTerm: string): Promise<WikiSummaryHit | null> {
  const title = normalizeTitle(titleOrTerm)
  if (!title) return null

  const url = `${WIKIPEDIA_SUMMARY_BASE}/${encodeURIComponent(title)}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Api-User-Agent': USER_AGENT,
        'User-Agent': USER_AGENT,
      },
    })
  } catch (err) {
    console.error('[time-machine] Wikipedia summary network error', err)
    return null
  }

  if (res.status === 404) return null
  if (!res.ok) {
    console.error(`[time-machine] Wikipedia summary ${res.status}`)
    return null
  }

  const payload = (await res.json()) as {
    type?: string
    extract?: string
    title?: string
    description?: string
    content_urls?: { desktop?: { page?: string }; mobile?: { page?: string } }
  }

  if (payload.type === 'disambiguation') return null

  let extract = firstSentence(payload.extract || '')
  extract = clipToCompleteSentences(extract, 220)
  const pageUrl = payload.content_urls?.desktop?.page || payload.content_urls?.mobile?.page || ''
  if (!extract || !pageUrl) return null

  return {
    extract,
    url: pageUrl,
    title: payload.title || title.replace(/_/g, ' '),
    originator: String(payload.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80),
  }
}
