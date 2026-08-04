import type { CulturalEvent, DateQueryResult, ProviderStatus } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'
import { toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { sanitizeEventCitations } from '../lib/verify'

const accessedAt = '2026-08-04T12:00:00.000Z'

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
      discoveredVia: ['internal-curated', 'wikipedia-onthisday'],
      needsHumanReview: false,
      citations: [
        withHarvard({
          title: 'Joint Resolution of April 6, 1917 [Declaring War on Germany]',
          url: 'https://www.archives.gov/milestone-documents/joint-resolution-declaration-of-war-with-germany-wwi',
          publisher: 'U.S. National Archives',
          publishedAt: '1917-04-06',
          accessedAt,
          sourceQuality: 'curated-fallback',
          evidenceKind: 'paraphrase',
          reference:
            'The National Archives preserves the joint resolution of 6 April 1917 declaring a state of war between the United States and the Imperial German Government.',
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
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
      discoveredVia: ['internal-curated'],
      needsHumanReview: true,
      citations: [
        withHarvard({
          title: 'Original Dixieland Jass Band',
          url: 'https://en.wikipedia.org/wiki/Original_Dixieland_Jass_Band',
          publisher: 'Wikipedia',
          accessedAt,
          sourceQuality: 'needs-human-review',
          evidenceKind: 'paraphrase',
          reference:
            'The band’s 1917 Victor recordings are widely cited among the earliest commercially released jazz discs — upgrade to Library of Congress / discography primary before press export.',
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
      ],
    },
  ],
  '1999-04-01': [
    {
      id: 'fb-1999-04-01-charts-facet',
      year: 1999,
      title: 'Cultural facet placeholder — chart / entertainment markers',
      synopsis:
        'On This Day–style packs include music and charts alongside geopolitics. Specific #1 singles must be verified against Official Charts Company or Billboard — never cited from onthisday.com or birthday aggregators.',
      category: 'charts',
      locale: 'United Kingdom',
      precision: 'exact-day',
      discoveredVia: ['onthisday-com'],
      needsHumanReview: true,
      citations: [
        withHarvard({
          title: 'Official Charts — about the charts',
          url: 'https://www.officialcharts.com/',
          publisher: 'Official Charts Company',
          accessedAt,
          sourceQuality: 'needs-human-review',
          evidenceKind: 'paraphrase',
          reference:
            'Use Official Charts (UK) or Billboard (US) archive pages for the exact week ending nearest the query date. This card is a facet template until a week-specific chart URL is attached.',
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
      ],
    },
  ],
  '2003-07-09': [
    {
      id: 'fb-2003-07-09-wikipedia',
      year: 2003,
      title: 'Sudan Airways Flight 139 crashes near Port Sudan',
      synopsis:
        'A same-day world news marker for 9 July 2003 — useful as a localisation seed when pairing brand acquisition coverage with “what else happened” desks. Upgrade cite to Reuters/AFP wire when available.',
      category: 'other',
      locale: 'Sudan',
      precision: 'exact-day',
      discoveredVia: ['wikipedia-onthisday'],
      needsHumanReview: true,
      citations: [
        withHarvard({
          title: 'Sudan Airways Flight 139',
          url: 'https://en.wikipedia.org/wiki/Sudan_Airways_Flight_139',
          publisher: 'Wikipedia',
          publishedAt: '2003-07-08',
          accessedAt,
          sourceQuality: 'needs-human-review',
          evidenceKind: 'paraphrase',
          reference:
            'Wikipedia summarises the Boeing 737 crash on approach to Port Sudan on 8 July 2003 (adjacent day — confirm desk timezone policy; prefer wire-service primary).',
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
      ],
    },
  ],
}

export const PROVIDER_CATALOGUE: ProviderStatus[] = [
  {
    id: 'wikipedia-onthisday',
    label: 'Wikipedia On This Day',
    role: 'Discovery + provisional bridge for calendar-day events across centuries',
    status: 'live',
    notes:
      'Pass 1 discovery. Prefer upgrading each claim to Tier A/B (archives, wires, papers). Never stop at hobby aggregators.',
  },
  {
    id: 'wikipedia-summary',
    label: 'Wikipedia REST Summary',
    role: 'Gloss definitions for named entities (Bloom pattern)',
    status: 'live',
    notes: 'Gloss bridge only — not sufficient as sole press citation when a primary exists.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    role: 'Press voice / synthesis — never the citation itself',
    status: 'needs-key',
    notes: 'May phrase over verified cards only. Must not invent facts or quotations.',
  },
  {
    id: 'perplexity-search',
    label: 'Perplexity Search',
    role: 'Allowlisted contemporary press discovery → verify against Tier A/B URLs',
    status: 'needs-key',
    notes: 'Rolling lookback ≠ deep history. Domain allowlist must exclude birthday aggregators.',
  },
  {
    id: 'nyt-archive',
    label: 'NYT Archive API',
    role: 'Verification / citation — US press metadata (deepest public newspaper API)',
    status: 'needs-key',
    notes: 'Lesson from bdayrecap: strongest open depth; filter month dump to day. Cite article/issue URLs.',
  },
  {
    id: 'guardian',
    label: 'Guardian Open Platform',
    role: 'Verification / citation — UK/intl ~1999+',
    status: 'needs-key',
    notes: 'from-date / to-date for exact-day windows. Shallower historically than NYT.',
  },
  {
    id: 'gdelt',
    label: 'GDELT',
    role: 'Discovery of structured global events ~1979– — cite original outlet URLs',
    status: 'stub',
    notes: 'GDELT points at sources; the outlet URL is the citation, not GDELT itself.',
  },
  {
    id: 'chronicling-america',
    label: 'Chronicling America (LoC)',
    role: 'Tier A citation — U.S. historic newspapers ~1777–1963',
    status: 'stub',
    notes: 'Free; ideal for Chuck decades. Pair with National Archives UK/others for global desks.',
  },
  {
    id: 'national-archives',
    label: 'National Archives (UK/US + peers)',
    role: 'Tier A citation — official records',
    status: 'stub',
    notes: 'nationalarchives.gov.uk, archives.gov, Gallica, NDL, Trove, etc.',
  },
  {
    id: 'curated-fallback',
    label: 'Curated fallback pack',
    role: 'Human-checked seed stories for demos',
    status: 'fallback',
    notes: 'Must already use allowlisted URLs. Blocklist enforced in sanitizeEventCitations.',
  },
]

export function buildFallbackResult(queryDate: string, brandId: string): DateQueryResult {
  const brand = getBrand(brandId)
  const rawEvents = FALLBACK_EVENTS_BY_DATE[queryDate] ?? synthesizeGenericFallback(queryDate)
  const events = rawEvents.map((e) => sanitizeEventCitations(e))
  const brandMoments: CulturalEvent[] = brand.timeline
    .filter((m) => momentTouchesDate(m.date, queryDate))
    .map((m) =>
      sanitizeEventCitations({
        id: m.id,
        year: Number(m.date.slice(0, 4)),
        title: m.title,
        synopsis: m.synopsis,
        category: 'brand',
        precision: m.precision,
        discoveredVia: ['internal-curated'],
        needsHumanReview: m.precision === 'period-estimate',
        citations: [
          withHarvard({
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
          }),
        ],
      }),
    )

  const hasExact =
    events.some((e) => e.precision === 'exact-day') ||
    brandMoments.some((e) => e.precision === 'exact-day')

  return {
    queryDate,
    datePath: toOnThisDayPath(queryDate),
    displayDate: toDisplayDate(queryDate),
    resolvedMode: hasExact ? 'mixed' : 'period-estimate',
    brandId: brand.id,
    narrative: {
      headline: `${brand.claimFrame} · ${toDisplayDate(queryDate)}`,
      lede: `On ${toDisplayDate(queryDate)} (${toOnThisDayPath(queryDate)}), the archive returns ${events.length} cultural marker${events.length === 1 ? '' : 's'}${brandMoments.length ? ` and ${brandMoments.length} ${brand.name} moment${brandMoments.length === 1 ? '' : 's'}` : ''}. Fallback mode — every public cite must be Tier A/B/C allowlisted; aggregators are discovery-only.`,
      voice: 'template',
      disclaimer:
        'Harvard citations required for export. AI voice (when enabled) may only paraphrase verified cards. Contested dates stay labelled for human review. Never cite onthisday.com, youdidntnotice.com, or bdayrecap.com.',
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
      title: `Period estimate for ${toDisplayDate(queryDate)}`,
      synopsis:
        'No curated exact-day pack is loaded for this date yet. Live mode discovers via Wikipedia On This Day (and later NYT/Guardian/archives), then verifies each claim against Tier A/B sources before Harvard export.',
      category: 'other',
      precision: 'period-estimate',
      discoveredVia: ['internal-curated'],
      needsHumanReview: true,
      citations: [
        withHarvard({
          title: 'Wikimedia On this day API',
          url: 'https://api.wikimedia.org/wiki/Feed_API/Reference/On_this_day',
          publisher: 'Wikimedia Foundation',
          accessedAt,
          sourceQuality: 'period-estimate',
          evidenceKind: 'paraphrase',
          reference: `Intended live discovery query: GET /feed/onthisday/events/${String(mm).padStart(2, '0')}/${String(dd).padStart(2, '0')} — then verify each event on an allowlisted archive or paper of record.`,
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
      ],
    },
  ]
}
