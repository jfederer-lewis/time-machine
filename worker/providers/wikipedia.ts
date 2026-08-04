import type { CulturalEvent, Gloss } from '../../shared/provenance'

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

    const title = truncate(event.text.split('.')[0] || event.text, 96)
    const glosses: Gloss[] = page?.titles?.display
      ? [
          {
            term: page.titles.display.replace(/_/g, ' '),
            gloss: truncate(page.extract || page.description || 'Wikipedia article linked from this event.', 220),
            url: pageUrl,
            source: 'wikipedia',
            sourceLabel: 'Wikipedia',
          },
        ]
      : []

    const rawTitle = page?.titles?.display?.replace(/_/g, ' ') || title
    const cleanTitle = stripHtml(rawTitle)

    return {
      id: `wiki-${mm}${dd}-${event.year}-${index}`,
      year: event.year,
      title,
      synopsis: event.text,
      category: 'other' as const,
      precision: 'exact-day' as const,
      needsHumanReview: false,
      citations: [
        {
          title: cleanTitle || title,
          url: pageUrl,
          publisher: 'Wikipedia',
          publishedAt: String(event.year),
          accessedAt,
          sourceQuality: 'trusted-source-snippet' as const,
          evidenceKind: 'paraphrase' as const,
          reference: event.text,
          provider: 'wikipedia-onthisday' as const,
          isExactQuote: false,
        },
      ],
      glosses: glosses.map((g) => ({ ...g, term: stripHtml(g.term) })),
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
