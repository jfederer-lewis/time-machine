/**
 * Credible-source registry for Time Machine.
 * Discovery hosts ≠ citation hosts. See documentation/SOURCES_AND_LANDSCAPE.md.
 */

export type SourceTier = 'A' | 'B' | 'C' | 'bridge' | 'blocked'

export interface SourceRegistryEntry {
  host: string
  label: string
  tier: SourceTier
  regions?: string[]
  role: 'citation' | 'discovery-only' | 'gloss-bridge' | 'blocked'
  notes?: string
}

/** Hosts that must never appear in public citations or Harvard exports. */
export const CITATION_BLOCKLIST: SourceRegistryEntry[] = [
  {
    host: 'youdidntnotice.com',
    label: 'You Didn’t Notice',
    tier: 'blocked',
    role: 'blocked',
    notes: 'Personal timeline product — discovery/UX research only.',
  },
  {
    host: 'bdayrecap.com',
    label: 'Birthday Recap',
    tier: 'blocked',
    role: 'blocked',
    notes: 'Hobby NYT-wrapper — useful API lesson only.',
  },
  {
    host: 'onthisday.com',
    label: 'On This Day',
    tier: 'blocked',
    role: 'discovery-only',
    notes: 'Best date URL pattern + cultural facets; never the cite.',
  },
  {
    host: 'history.com',
    label: 'History.com',
    tier: 'blocked',
    role: 'discovery-only',
    notes: 'This-day indexes are month-day only; prefer primary docs.',
  },
]

export const CITATION_ALLOWLIST: SourceRegistryEntry[] = [
  // Tier A — institutional
  { host: 'nationalarchives.gov.uk', label: 'The National Archives (UK)', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'archives.gov', label: 'US National Archives', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'loc.gov', label: 'Library of Congress', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'chroniclingamerica.loc.gov', label: 'Chronicling America', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'un.org', label: 'United Nations', tier: 'A', regions: ['GLOBAL'], role: 'citation' },
  { host: 'unesco.org', label: 'UNESCO', tier: 'A', regions: ['GLOBAL'], role: 'citation' },
  { host: 'europa.eu', label: 'European Union', tier: 'A', regions: ['EU'], role: 'citation' },
  { host: 'bnf.fr', label: 'BnF / Gallica', tier: 'A', regions: ['FR'], role: 'citation' },
  { host: 'gallica.bnf.fr', label: 'Gallica', tier: 'A', regions: ['FR'], role: 'citation' },
  { host: 'bundesarchiv.de', label: 'Bundesarchiv', tier: 'A', regions: ['DE'], role: 'citation' },
  { host: 'ndl.go.jp', label: 'National Diet Library', tier: 'A', regions: ['JP'], role: 'citation' },
  { host: 'nla.gov.au', label: 'National Library of Australia', tier: 'A', regions: ['AU'], role: 'citation' },
  { host: 'trove.nla.gov.au', label: 'Trove', tier: 'A', regions: ['AU'], role: 'citation' },
  { host: 'officialcharts.com', label: 'Official Charts Company', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'billboard.com', label: 'Billboard', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'si.edu', label: 'Smithsonian', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'vam.ac.uk', label: 'V&A', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'moma.org', label: 'MoMA', tier: 'A', regions: ['US'], role: 'citation' },

  // Tier B — papers / wires
  { host: 'nytimes.com', label: 'The New York Times', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'timesmachine.nytimes.com', label: 'NYT TimesMachine', tier: 'B', regions: ['US'], role: 'citation', notes: 'Cite specific issues/articles, not the browser shell alone.' },
  { host: 'theguardian.com', label: 'The Guardian', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'telegraph.co.uk', label: 'The Telegraph', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'reuters.com', label: 'Reuters', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'apnews.com', label: 'Associated Press', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'afp.com', label: 'AFP', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'bbc.co.uk', label: 'BBC', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation', notes: 'Prefer article URLs over On This Day index pages.' },
  { host: 'bbc.com', label: 'BBC', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'ft.com', label: 'Financial Times', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'washingtonpost.com', label: 'The Washington Post', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'lemonde.fr', label: 'Le Monde', tier: 'B', regions: ['FR'], role: 'citation' },
  { host: 'asahi.com', label: 'Asahi Shimbun', tier: 'B', regions: ['JP'], role: 'citation' },
  { host: 'nikkei.com', label: 'Nikkei', tier: 'B', regions: ['JP'], role: 'citation' },
  { host: 'scmp.com', label: 'South China Morning Post', tier: 'B', regions: ['HK', 'ASIA'], role: 'citation' },
  { host: 'thehindu.com', label: 'The Hindu', tier: 'B', regions: ['IN'], role: 'citation' },
  { host: 'indianexpress.com', label: 'The Indian Express', tier: 'B', regions: ['IN'], role: 'citation' },
  { host: 'smh.com.au', label: 'Sydney Morning Herald', tier: 'B', regions: ['AU'], role: 'citation' },

  // Tier C / bridge
  { host: 'britannica.com', label: 'Encyclopaedia Britannica', tier: 'C', regions: ['GLOBAL'], role: 'citation' },
  { host: 'converse.com', label: 'Converse', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Brand claims only.' },
  { host: 'about.nike.com', label: 'Nike', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Brand claims only.' },
  {
    host: 'wikipedia.org',
    label: 'Wikipedia',
    tier: 'bridge',
    regions: ['GLOBAL'],
    role: 'gloss-bridge',
    notes: 'Discovery + glosses; upgrade to underlying primary when possible.',
  },
  {
    host: 'en.wikipedia.org',
    label: 'Wikipedia',
    tier: 'bridge',
    regions: ['GLOBAL'],
    role: 'gloss-bridge',
  },
]

export type DiscoveryChannel =
  | 'wikipedia-onthisday'
  | 'onthisday-com'
  | 'history-com'
  | 'bbc-onthisday'
  | 'youdidntnotice'
  | 'bdayrecap'
  | 'nyt-learning-on-this-day'
  | 'internal-curated'
  | 'gdelt'
  | 'unknown'

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function hostMatches(entryHost: string, urlHost: string): boolean {
  return urlHost === entryHost || urlHost.endsWith(`.${entryHost}`)
}

export function findRegistryEntry(url: string): SourceRegistryEntry | undefined {
  const host = hostnameOf(url)
  if (!host) return undefined
  const blocked = CITATION_BLOCKLIST.find((e) => hostMatches(e.host, host))
  if (blocked) return blocked
  return CITATION_ALLOWLIST.find((e) => hostMatches(e.host, host))
}

export function isCitationBlocked(url: string): boolean {
  const entry = findRegistryEntry(url)
  return entry?.role === 'blocked' || entry?.role === 'discovery-only'
}

export function isCitationAllowed(url: string): boolean {
  const entry = findRegistryEntry(url)
  if (!entry) return false
  return entry.role === 'citation' || entry.role === 'gloss-bridge'
}

export function citationTier(url: string): SourceTier | 'unknown' {
  return findRegistryEntry(url)?.tier ?? 'unknown'
}

export interface HarvardCitationInput {
  author?: string
  /** Free-text year or ISO date year */
  year?: string | number
  title: string
  publisher: string
  /** Day Month Year if known, e.g. 21 July 1969 */
  publishedDisplay?: string
  url: string
  /** Kept for provenance; not shown — lookups are live. */
  accessedAt?: string
}

/** Author-date Harvard-ish string for the source line. */
export function formatHarvardCitation(input: HarvardCitationInput): string {
  const year =
    input.year !== undefined && input.year !== ''
      ? String(input.year).slice(0, 4)
      : input.publishedDisplay?.match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1] || 'n.d.'

  const authorBit = input.author?.trim()
    ? `${input.author.trim()} (${year})`
    : `${input.publisher} (${year})`

  const publishedBit = input.publishedDisplay ? `, ${input.publishedDisplay}` : ''

  return `${authorBit} '${input.title}', ${input.publisher}${publishedBit}. Available at: ${input.url}`
}

/**
 * Query dates may be year (`1917`), year-month (`1999-04`), or full day (`2003-07-09`).
 * Never invent missing day/month — display only what was known.
 */
export type QueryDatePrecision = 'exact-day' | 'month' | 'year'

export function queryDatePrecision(queryDate: string): QueryDatePrecision {
  if (/^\d{4}-\d{2}-\d{2}$/.test(queryDate)) return 'exact-day'
  if (/^\d{4}-\d{2}$/.test(queryDate)) return 'month'
  return 'year'
}

/** Human + API date helpers — On This Day style naming without copying their site. */
export function toOnThisDayPath(queryDate: string): string {
  const precision = queryDatePrecision(queryDate)
  const parts = queryDate.split('-').map(Number)
  const y = parts[0]
  if (precision === 'year') return String(y)

  const m = parts[1]
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  }).toLowerCase()

  if (precision === 'month') return `${y}/${month}`
  return `${y}/${month}/${parts[2]}`
}

export function toDisplayDate(queryDate: string, locale = 'en-GB'): string {
  const precision = queryDatePrecision(queryDate)
  const parts = queryDate.split('-').map(Number)
  const y = parts[0]

  if (precision === 'year') return String(y)

  if (precision === 'month') {
    return new Date(Date.UTC(y, parts[1] - 1, 1)).toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  return new Date(Date.UTC(y, parts[1] - 1, parts[2])).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Validate YYYY | YYYY-MM | YYYY-MM-DD. Returns normalized string or null. */
export function parseQueryDate(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()

  if (/^\d{4}$/.test(trimmed)) {
    const y = Number(trimmed)
    if (y < 1800 || y > 2099) return null
    return trimmed
  }

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [ys, ms] = trimmed.split('-')
    const y = Number(ys)
    const m = Number(ms)
    if (y < 1800 || y > 2099 || m < 1 || m > 12) return null
    return `${ys}-${ms}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [ys, ms, ds] = trimmed.split('-')
    const y = Number(ys)
    const m = Number(ms)
    const d = Number(ds)
    if (y < 1800 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return null
    const check = new Date(`${trimmed}T12:00:00Z`)
    if (
      Number.isNaN(check.getTime()) ||
      check.getUTCFullYear() !== y ||
      check.getUTCMonth() + 1 !== m ||
      check.getUTCDate() !== d
    ) {
      return null
    }
    return trimmed
  }

  return null
}
