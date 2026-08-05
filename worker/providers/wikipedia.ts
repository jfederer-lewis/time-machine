import type { CulturalEvent, Gloss } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'

const USER_AGENT = 'TimeMachinePressPrototype/0.1 (heritage press tool; research@local)'

interface WikiOnThisDayEvent {
  text: string
  year: number
  pages?: Array<{
    titles?: { canonical?: string; display?: string }
    content_urls?: { desktop?: { page?: string } }
    description?: string
    extract?: string
  }>
}

interface WikiOnThisDayResponse {
  events?: WikiOnThisDayEvent[]
}

export async function fetchOnThisDay(month: number, day: number): Promise<CulturalEvent[]> {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Api-User-Agent': USER_AGENT,
      'User-Agent': USER_AGENT,
    },
  })

  if (!res.ok) {
    throw new Error(`Wikipedia On This Day failed: ${res.status}`)
  }

  const data = (await res.json()) as WikiOnThisDayResponse
  const accessedAt = new Date().toISOString()

  return (data.events ?? []).slice(0, 12).map((event, index) => {
    const page = event.pages?.[0]
    const pageUrl =
      page?.content_urls?.desktop?.page ??
      (page?.titles?.canonical
        ? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.titles.canonical)}`
        : 'https://en.wikipedia.org/wiki/Wikipedia:On_this_day')

    const pageDisplay = page?.titles?.display
      ? stripHtml(page.titles.display.replace(/_/g, ' '))
      : ''
    const title = headlineFromOnThisDay(event.text, pageDisplay)
    const glosses: Gloss[] = pageDisplay
      ? [
          {
            term: pageDisplay,
            gloss: truncate(
              page?.extract || page?.description || 'Wikipedia article linked from this event.',
              220,
            ),
            url: pageUrl,
            source: 'wikipedia',
            sourceLabel: 'Wikipedia',
          },
        ]
      : []

    const cleanTitle = pageDisplay || title

    return {
      id: `wiki-${mm}${dd}-${event.year}-${index}`,
      year: event.year,
      title,
      synopsis: stripHtml(event.text).replace(/\s+/g, ' ').trim(),
      category: 'other' as const,
      precision: 'exact-day' as const,
      discoveredVia: ['wikipedia-onthisday'],
      // Wiki is a bridge cite — desks should upgrade to archive / paper of record before export
      needsHumanReview: true,
      citations: [
        withHarvard({
          title: cleanTitle || title,
          url: pageUrl,
          publisher: 'Wikipedia',
          publishedAt: String(event.year),
          accessedAt,
          sourceQuality: 'needs-human-review',
          evidenceKind: 'paraphrase',
          reference: stripHtml(event.text).replace(/\s+/g, ' ').trim(),
          provider: 'wikipedia-onthisday',
          isExactQuote: false,
        }),
      ],
      glosses,
    }
  })
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function truncate(text: string, max: number): string {
  const clean = stripHtml(text)
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

/**
 * Prefer the linked Wikipedia article title when it reads like a topic/event
 * (not a bare person/place name). Never mid-sentence truncate the body —
 * a short complete clause beats a long cut-off fragment.
 */
function headlineFromOnThisDay(text: string, pageTitle: string): string {
  const page = pageTitle.trim()
  if (page.length > 20 && page.length <= 100 && !looksLikeBareName(page)) {
    return page
  }

  const sentence = stripHtml(text)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.replace(/[.!?]$/, '')
    .trim()

  if (!sentence) return page || 'Untitled event'
  if (sentence.length <= 100) return sentence

  // Prefer a natural clause break over a hard character cut.
  const clause = sentence.match(/^(.{24,100}?)(?:,| — | – |:)\s/)
  if (clause && !endsDangling(clause[1])) return clause[1].trim()

  // Fall back to the page title rather than a truncated fragment.
  if (page) return page

  // Last resort: keep the full sentence (better long than mid-cut).
  return sentence
}

function endsDangling(text: string): boolean {
  return /\b(the|a|an|of|in|on|at|to|for|from|by|with|and|or|as)$/i.test(text.trim())
}

function looksLikeBareName(title: string): boolean {
  // "Donald Trump", "Paris" — short proper-name titles make poor event headlines.
  if (/\b(of|the|in|at|and|for|from|on|by)\b/i.test(title)) return false
  const words = title.split(/\s+/)
  return words.length <= 4 && title.length <= 28
}
