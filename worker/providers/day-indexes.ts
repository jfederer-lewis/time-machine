/**
 * Editorial “on this day” indexes — discovery only.
 * Never cite onthisday.com / history.com as the public source.
 * Cards ship with empty citations until Pass 2 upgrades to Tier A/B.
 */

import type { CulturalEvent, EventFacet } from '../../shared/provenance'
import { firstCompleteClause, cleanPressText } from '../lib/clean-text'

const USER_AGENT = 'TimeMachinePressPrototype/0.1 (heritage press tool; research@local)'

const MONTH_SLUGS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

function monthSlug(month: number): string {
  return MONTH_SLUGS[month - 1] || 'january'
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
}

function guessFacet(text: string): EventFacet {
  const t = text.toLowerCase()
  if (/\b(nba|nfl|mlb|fifa|olympic|world cup|tennis|football|cricket|rugby|goal|match|championship)\b/.test(t))
    return 'sport'
  if (/\b(film|movie|cinema|oscar|theatre|novel|art|museum|fashion|design)\b/.test(t)) return 'culture'
  if (/\b(song|singer|band|music|jazz|rock|rap|hip[- ]?hop|album|single|chart|billboard)\b/.test(t))
    return 'music'
  if (/\b(scientist|discovery|invent|space|nasa|launch|telescope)\b/.test(t)) return 'science'
  if (/\b(war|treaty|election|president|prime minister|parliament|coup|invasion|bomb|nato|un )\b/.test(t))
    return 'politics'
  return 'other'
}

function titleFromFact(text: string): string {
  const clause = firstCompleteClause(text)
  if (clause.length <= 110) return clause
  const soft = clause.slice(0, 100)
  const at = soft.lastIndexOf(' ')
  return (at > 40 ? soft.slice(0, at) : soft).trim()
}

function isLowValueDiscovery(text: string): boolean {
  const t = text.toLowerCase()
  // Skip pure sports trivia milestones unless also culturally huge
  if (/\b(900th|1,?000th|1,000|1000)\b/.test(t) && /\bgames?\b/.test(t)) return true
  // Aggregator “#1 song on this date” labels — not research cards
  if (/\b#\s*1\s*(song|single|album)\b/i.test(t) && t.length < 120) return true
  if (/^(uk|us)\s*#\s*1\b/i.test(t.trim()) && t.length < 120) return true
  if (t.length < 28) return true
  return false
}

function htmlToLines(html: string): string[] {
  const withBreaks = html
    .replace(/<\/(?:h[1-6]|p|div|li|a|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
  return stripTags(withBreaks.replace(/\n+/g, '\n'))
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': USER_AGENT,
        'Api-User-Agent': USER_AGENT,
      },
    })
    if (!res.ok) {
      console.error(`[time-machine] day-index fetch ${res.status} ${url}`)
      return null
    }
    return await res.text()
  } catch (err) {
    console.error('[time-machine] day-index fetch failed', url, err)
    return null
  }
}

/**
 * Year-specific On This Day page: /date/1999/april/1
 * Complete day-fact sentences + optional chart rows.
 */
export async function fetchOnThisDayCom(
  year: number,
  month: number,
  day: number,
): Promise<CulturalEvent[]> {
  const slug = monthSlug(month)
  const url = `https://www.onthisday.com/date/${year}/${slug}/${day}`
  const html = await fetchHtml(url)
  if (!html) return []

  const events: CulturalEvent[] = []
  const listMatch = html.match(
    /<h2>(?:[\s\S]*?)Historical Events(?:[\s\S]*?)<\/h2>[\s\S]*?<ul class="event-list[^"]*">([\s\S]*?)<\/ul>/i,
  )
  const listHtml = listMatch?.[1] || ''
  const items = [...listHtml.matchAll(/<li class="event"[^>]*>([\s\S]*?)<\/li>/gi)]

  items.forEach((m, index) => {
    const text = cleanPressText(stripTags(m[1]).replace(/\s+/g, ' ').trim())
    if (!text || isLowValueDiscovery(text)) return
    events.push({
      id: `otd-${year}-${month}-${day}-${index}`,
      year,
      title: titleFromFact(text),
      synopsis: text,
      category: guessFacet(text),
      precision: 'exact-day',
      discoveredVia: ['onthisday-com'],
      needsHumanReview: true,
      citations: [],
    })
  })

  return events.slice(0, 12)
}

/**
 * Cross-year On This Day index: /events/april/1
 * Used when anyYear is on, or to enrich the shortlist with stronger historic beats.
 */
export async function fetchOnThisDayComAnyYear(
  month: number,
  day: number,
  opts?: { preferNearYear?: number; limit?: number },
): Promise<CulturalEvent[]> {
  const slug = monthSlug(month)
  const url = `https://www.onthisday.com/events/${slug}/${day}`
  const html = await fetchHtml(url)
  if (!html) return []

  const items = [...html.matchAll(/<li class="event"[^>]*>([\s\S]*?)<\/li>/gi)]
  const prefer = opts?.preferNearYear
  const scored: Array<{ event: CulturalEvent; rank: number }> = []

  items.forEach((m, index) => {
    const raw = m[1]
    const yearMatch = raw.match(/href="\/date\/(\d{4})[^"]*"[^>]*class="date"[^>]*>\s*(\d{4})\s*<\/a>/i)
      || raw.match(/class="date"[^>]*>\s*(\d{4})\s*<\/a>/i)
      || raw.match(/>(\d{3,4})<\/a>/)
    const year = yearMatch ? Number(yearMatch[1] || yearMatch[2]) : NaN
    if (!Number.isFinite(year) || year < 1000 || year > 2100) return

    const withoutDate = raw.replace(/<a[^>]*class="date"[^>]*>[\s\S]*?<\/a>/i, ' ')
    const text = cleanPressText(stripTags(withoutDate).replace(/\s+/g, ' ').trim())
    if (!text || isLowValueDiscovery(text)) return
    // Skip deep antiquity for press packs unless anyYear explicitly wants breadth
    if (year < 1750) return

    const event: CulturalEvent = {
      id: `otd-any-${month}-${day}-${year}-${index}`,
      year,
      title: titleFromFact(text),
      synopsis: text,
      category: guessFacet(text),
      precision: 'exact-day',
      discoveredVia: ['onthisday-com'],
      needsHumanReview: true,
      citations: [],
    }

    const near = prefer != null ? Math.abs(year - prefer) : 50
    const interestHint =
      (guessFacet(text) === 'politics' ? 2 : 0) +
      (guessFacet(text) === 'culture' || guessFacet(text) === 'music' ? 1 : 0)
    scored.push({ event, rank: near - interestHint * 5 })
  })

  scored.sort((a, b) => a.rank - b.rank)
  const limit = opts?.limit ?? 16
  return scored.slice(0, limit).map((s) => s.event)
}

/**
 * History.com This Day — month/day editorial heroes across years.
 * Discovery only; never cited.
 */
export async function fetchHistoryComDay(month: number, day: number): Promise<CulturalEvent[]> {
  const slug = monthSlug(month)
  const url = `https://www.history.com/this-day-in-history/${slug}-${day}`
  const html = await fetchHtml(url)
  if (!html) return []

  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  const events: CulturalEvent[] = []
  const seen = new Set<string>()

  const push = (year: number, title: string, synopsis: string) => {
    const t = cleanPressText(title)
    const s = cleanPressText(synopsis || title)
    if (!t || t.length < 8) return
    if (!Number.isFinite(year) || year < 1400 || year > 2100) return
    const key = `${year}:${t.toLowerCase().slice(0, 48)}`
    if (seen.has(key)) return
    seen.add(key)
    events.push({
      id: `hist-${month}-${day}-${year}-${events.length}`,
      year,
      title: t.length <= 110 ? t : titleFromFact(t),
      synopsis: s.length >= 40 ? s : t,
      category: guessFacet(`${t} ${s}`),
      precision: 'exact-day',
      discoveredVia: ['history-com'],
      needsHumanReview: true,
      citations: [],
    })
  }

  // Hero: year span + h1 (lede paragraph is often far below in the DOM)
  const hero = withoutScripts.match(
    /(\d{4})\s*<\/span>[\s\S]{0,400}?<h1[^>]*>([^<]+)<\/h1>/i,
  )
  if (hero) {
    const title = stripTags(hero[2]).replace(/\s+/g, ' ').trim()
    // Prefer a nearby paragraph that mentions the title subject, else title alone
    const afterHero = withoutScripts.slice(hero.index! + hero[0].length, hero.index! + hero[0].length + 2500)
    const para = afterHero.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
    const synopsis = para
      ? stripTags(para[1]).replace(/\s+/g, ' ').trim()
      : title
    push(Number(hero[1]), title, synopsis)
  }

  // “Also on This Day” list: year → title → lede
  const alsoIdx = withoutScripts.search(/Also on This Day/i)
  const chunk = alsoIdx >= 0 ? withoutScripts.slice(alsoIdx, alsoIdx + 40_000) : ''
  const lines = htmlToLines(chunk)

  for (let i = 0; i < lines.length - 1; i++) {
    const yearLine = lines[i]
    if (!/^\d{4}$/.test(yearLine)) continue
    const title = lines[i + 1]
    if (!title || title.length < 10 || /^(discover more|m read|\d+:\d+)/i.test(title)) continue
    if (/^\d{4}$/.test(title)) continue
    let synopsis = title
    const next = lines[i + 2]
    if (
      next &&
      next.length > 40 &&
      !/^\d{4}$/.test(next) &&
      !/m read/i.test(next) &&
      !/^\d+:\d+/.test(next)
    ) {
      synopsis = next
    }
    push(Number(yearLine), title, synopsis)
    if (events.length >= 14) break
  }

  return events
}
