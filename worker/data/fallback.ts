import type { CulturalEvent, DateQueryResult, ProviderStatus } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'

const accessedAt = '2026-08-04'

/** Curated press-ready cards with traceable URLs — used when APIs are offline or keys missing. */
export const FALLBACK_EVENTS_BY_DATE: Record<string, CulturalEvent[]> = {
  '1917-01-01': [
    {
      id: 'fb-1917-us-enters-wwi-context',
      year: 1917,
      title: 'The United States enters World War I',
      synopsis:
        'In April 1917 the U.S. declares war on Germany, reshaping American industry, sport, and youth culture in the same decade Converse launches its basketball shoe.',
      category: 'politics',
      locale: 'United States',
      precision: 'year',
      needsHumanReview: false,
      citations: [
        {
          title: 'American entry into World War I',
          url: 'https://en.wikipedia.org/wiki/American_entry_into_World_War_I',
          publisher: 'Wikipedia',
          publishedAt: '1917-04-06',
          accessedAt,
          sourceQuality: 'curated-fallback',
          evidenceKind: 'paraphrase',
          reference:
            'Congress declared war on Germany on 6 April 1917, following President Wilson’s request of 2 April.',
          provider: 'curated-fallback',
          isExactQuote: false,
        },
      ],
      glosses: [
        {
          term: 'World War I',
          gloss: 'Global conflict (1914–1918) that pulled the United States into combat in 1917.',
          url: 'https://en.wikipedia.org/wiki/World_War_I',
          source: 'wikipedia',
          sourceLabel: 'Wikipedia',
          period: '1914–1918',
        },
      ],
    },
    {
      id: 'fb-1917-jazz-age-prelude',
      year: 1917,
      title: 'Original Dixieland Jazz Band records in New York',
      synopsis:
        'Early jazz recordings in 1917 help mark the soundtrack of the decade in which canvas basketball shoes leave the gym and enter American street culture.',
      category: 'music',
      locale: 'New York',
      precision: 'year',
      needsHumanReview: true,
      citations: [
        {
          title: 'Original Dixieland Jass Band',
          url: 'https://en.wikipedia.org/wiki/Original_Dixieland_Jass_Band',
          publisher: 'Wikipedia',
          accessedAt,
          sourceQuality: 'needs-human-review',
          evidenceKind: 'paraphrase',
          reference:
            'The band’s 1917 Victor recordings are widely cited among the earliest commercially released jazz discs — verify exact session dates before press export.',
          provider: 'curated-fallback',
          isExactQuote: false,
        },
      ],
    },
  ],
  '2003-07-09': [
    {
      id: 'fb-2003-07-09-wikipedia',
      year: 2003,
      title: 'Sudan Airways Flight 139 crashes near Port Sudan',
      synopsis:
        'A same-day world news marker for 9 July 2003 — useful as a localisation seed when pairing brand acquisition coverage with “what else happened” desks.',
      category: 'other',
      locale: 'Sudan',
      precision: 'exact-day',
      needsHumanReview: false,
      citations: [
        {
          title: 'Sudan Airways Flight 139',
          url: 'https://en.wikipedia.org/wiki/Sudan_Airways_Flight_139',
          publisher: 'Wikipedia',
          publishedAt: '2003-07-08',
          accessedAt,
          sourceQuality: 'curated-fallback',
          evidenceKind: 'paraphrase',
          reference:
            'Wikipedia summarises the Boeing 737 crash on approach to Port Sudan on 8 July 2003 (adjacent day — confirm desk timezone policy before export).',
          provider: 'curated-fallback',
          isExactQuote: false,
        },
      ],
    },
  ],
}

export const PROVIDER_CATALOGUE: ProviderStatus[] = [
  {
    id: 'wikipedia-onthisday',
    label: 'Wikipedia On This Day',
    role: 'Primary free layer for calendar-day events, births, deaths across centuries',
    status: 'live',
    notes: 'REST feed /feed/onthisday/{type}/{mm}/{dd} — no key. Best default for deep history.',
  },
  {
    id: 'wikipedia-summary',
    label: 'Wikipedia REST Summary',
    role: 'Gloss definitions for named entities (Bloom pattern)',
    status: 'live',
    notes: 'Used for dotted-underline glosses; never treated as claim proof alone.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    role: 'Press voice / synthesis — never the citation itself',
    status: 'needs-key',
    notes: 'Wire GEMINI_API_KEY. Narrative only; every claim still needs a source card.',
  },
  {
    id: 'perplexity-search',
    label: 'Perplexity Search',
    role: 'Allowlisted contemporary press discovery (Bloom news pattern)',
    status: 'needs-key',
    notes: 'Strong for recent windows; not a substitute for fixed historical date archives.',
  },
  {
    id: 'nyt-archive',
    label: 'NYT Archive API',
    role: 'Article metadata by month, 1851–present',
    status: 'needs-key',
    notes: 'Ideal for U.S. press localisation; filter client-side to day-of-month.',
  },
  {
    id: 'guardian',
    label: 'Guardian Open Platform',
    role: 'UK/international press from ~1999',
    status: 'needs-key',
    notes: 'from-date / to-date query params for exact-day windows.',
  },
  {
    id: 'gdelt',
    label: 'GDELT',
    role: 'Structured global events ~1979–present',
    status: 'stub',
    notes: 'Date-anchored event codes; pair with original URL for citations.',
  },
  {
    id: 'chronicling-america',
    label: 'Chronicling America (LoC)',
    role: 'U.S. historic newspapers ~1777–1963',
    status: 'stub',
    notes: 'Free; excellent for pre-digital Chuck decades. No key required.',
  },
  {
    id: 'curated-fallback',
    label: 'Curated fallback pack',
    role: 'Human-checked seed stories for demos',
    status: 'fallback',
    notes: 'Ships with prototype so UX works before keys arrive.',
  },
]

export function buildFallbackResult(queryDate: string, brandId: string): DateQueryResult {
  const brand = getBrand(brandId)
  const events = FALLBACK_EVENTS_BY_DATE[queryDate] ?? synthesizeGenericFallback(queryDate)
  const brandMoments: CulturalEvent[] = brand.timeline
    .filter((m) => momentTouchesDate(m.date, queryDate))
    .map((m) => ({
      id: m.id,
      year: Number(m.date.slice(0, 4)),
      title: m.title,
      synopsis: m.synopsis,
      category: 'brand',
      precision: m.precision,
      needsHumanReview: m.precision === 'period-estimate',
      citations: [
        {
          title: m.citation.title,
          url: m.citation.url,
          publisher: m.citation.publisher,
          author: m.citation.author,
          publishedAt: m.citation.publishedAt,
          accessedAt,
          sourceQuality:
            m.precision === 'period-estimate' ? 'needs-human-review' : 'curated-fallback',
          evidenceKind: m.isExactQuote ? 'quote' : 'paraphrase',
          reference: m.reference,
          provider: 'brand-timeline',
          isExactQuote: m.isExactQuote,
        },
      ],
    }))

  const hasExact =
    events.some((e) => e.precision === 'exact-day') ||
    brandMoments.some((e) => e.precision === 'exact-day')

  return {
    queryDate,
    resolvedMode: hasExact ? 'mixed' : 'period-estimate',
    brandId: brand.id,
    narrative: {
      headline: `${brand.claimFrame} · ${formatDisplayDate(queryDate)}`,
      lede: `On ${formatDisplayDate(queryDate)}, the archive returns ${events.length} cultural marker${events.length === 1 ? '' : 's'}${brandMoments.length ? ` and ${brandMoments.length} ${brand.name} moment${brandMoments.length === 1 ? '' : 's'}` : ''}. Running in fallback mode — swap API keys to replace seed cards with live retrieval.`,
      voice: 'template',
      disclaimer:
        'Every card below carries a source link. AI voice (when enabled) may only paraphrase; it may not invent quotations or unsourced facts. Contested dates are labelled for human review.',
    },
    events,
    brandMoments,
    providersUsed: ['curated-fallback', 'brand-timeline'],
    usingFallback: true,
    generatedAt: new Date().toISOString(),
  }
}

function momentTouchesDate(momentDate: string, queryDate: string): boolean {
  if (momentDate.length === 4) return momentDate === queryDate.slice(0, 4)
  if (momentDate.length === 7) return momentDate === queryDate.slice(0, 7)
  return momentDate === queryDate || momentDate.slice(0, 4) === queryDate.slice(0, 4)
}

function synthesizeGenericFallback(queryDate: string): CulturalEvent[] {
  const [, mm, dd] = queryDate.split('-').map(Number)
  return [
    {
      id: `fb-generic-${queryDate}`,
      year: Number(queryDate.slice(0, 4)),
      title: `Period estimate for ${formatDisplayDate(queryDate)}`,
      synopsis:
        'No curated exact-day pack is loaded for this date yet. In live mode, Wikipedia On This Day supplies same-calendar events across years; archive APIs fill press cuttings. This placeholder keeps the UX path intact.',
      category: 'other',
      precision: 'period-estimate',
      needsHumanReview: true,
      citations: [
        {
          title: 'Wikimedia On this day API',
          url: 'https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day',
          publisher: 'Wikimedia Foundation',
          accessedAt,
          sourceQuality: 'period-estimate',
          evidenceKind: 'paraphrase',
          reference: `Intended live query: GET /feed/onthisday/events/${String(mm).padStart(2, '0')}/${String(dd).padStart(2, '0')} — returns multi-year events for this calendar day.`,
          provider: 'curated-fallback',
          isExactQuote: false,
        },
      ],
    },
  ]
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
