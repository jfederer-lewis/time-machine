import type {
  CulturalEvent,
  DateQueryResult,
  ProviderStatus,
  ResearchMode,
} from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { getBrand } from '../../shared/brands'
import { heritageMoments } from '../../shared/brand'
import { toDisplayDate, toOnThisDayPath } from '../../shared/source-registry'
import { sanitizeEventCitations } from '../lib/verify'

const accessedAt = '2026-08-04T12:00:00.000Z'

/** Curated press-ready cards with traceable URLs — used when APIs are offline or keys missing. */
export const FALLBACK_EVENTS_BY_DATE: Record<string, CulturalEvent[]> = {
  '1917': [
    {
      id: 'fb-1917-us-enters-wwi-context',
      year: 1917,
      title: 'The United States enters World War I',
      synopsis:
        'In April 1917 the U.S. declares war on Germany, reshaping American industry, sport, and youth culture in the same decade Converse launches its basketball shoe.',
      whyItMatters: 'The American entry into the First World War marked a major turning point, shifting the balance of power toward the Allied forces and accelerating the country\'s rise as a global political and industrial leader.',
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
      whyItMatters: 'These early commercial releases helped popularize jazz nationwide, paving the way for the Jazz Age of the 1920s and the expansion of modern popular music.',
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
            'The band’s 1917 Victor recordings are widely cited among the earliest commercially released jazz discs.',
          provider: 'curated-fallback',
          isExactQuote: false,
        }),
      ],
    },
  ],
  '1999-04': [
    {
      id: 'fb-1999-04-01-nato',
      year: 1999,
      title: 'NATO’s Kosovo air campaign continues',
      synopsis:
        'In spring 1999, NATO’s Operation Allied Force dominates international headlines — the kind of global backdrop a heritage brand sits against on an ordinary April day.',
      whyItMatters: 'Operation Allied Force represented the first time NATO used military force without explicit UN Security Council approval, sparking intense international debates over humanitarian intervention and national sovereignty.',
      category: 'politics',
      locale: 'Europe',
      precision: 'month',
      discoveredVia: ['internal-curated'],
      needsHumanReview: false,
      citations: [
        withHarvard({
          title: 'Kosovo Air Campaign (Operation Allied Force)',
          url: 'https://www.nato.int/cps/en/natohq/topics_49602.htm',
          publisher: 'NATO',
          publishedAt: '1999',
          accessedAt,
          sourceQuality: 'curated-fallback',
          evidenceKind: 'paraphrase',
          reference:
            'NATO’s official history places Operation Allied Force from 24 March to 10 June 1999.',
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
        'On 8 July 2003, a Boeing 737 crashes on approach to Port Sudan — one of the day’s international news markers.',
      whyItMatters: 'The tragic crash, which killed all but one of the 117 passengers and crew, drew global attention to Sudanese aviation safety under international trade sanctions.',
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
            'Wikipedia summarises the crash on approach to Port Sudan on 8 July 2003.',
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
    role: 'Calendar-day discovery bridge (not preferred shortlist lead)',
    status: 'live',
    notes: '',
  },
  {
    id: 'onthisday-com',
    label: 'On This Day',
    role: 'Year+day editorial discovery — never a public citation',
    status: 'live',
    notes: 'Discovery only.',
  },
  {
    id: 'history-com',
    label: 'History.com This Day',
    role: 'Month/day editorial heroes — never a public citation',
    status: 'live',
    notes: 'Discovery only.',
  },
  {
    id: 'wikipedia-summary',
    label: 'Wikipedia',
    role: 'Entity glosses on claim terms',
    status: 'live',
    notes: 'Context only — never the public claim citation.',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    role: 'Grounded discovery + phrasing — never the public citation',
    status: 'needs-key',
    notes: 'Candidates only ship with an allowlisted Tier A/B URL that corroborates the date.',
  },
  {
    id: 'perplexity-search',
    label: 'Perplexity',
    role: 'Allowlisted press discovery + cite upgrades',
    status: 'needs-key',
    notes: '',
  },
  {
    id: 'nyt-archive',
    label: 'New York Times Archive',
    role: 'US newspaper verification',
    status: 'needs-key',
    notes: '',
  },
  {
    id: 'guardian',
    label: 'The Guardian',
    role: 'UK and international coverage',
    status: 'needs-key',
    notes: '',
  },
  {
    id: 'gdelt',
    label: 'GDELT',
    role: 'Global event discovery from 1979',
    status: 'stub',
    notes: '',
  },
  {
    id: 'chronicling-america',
    label: 'Chronicling America',
    role: 'US historic newspapers',
    status: 'stub',
    notes: '',
  },
  {
    id: 'national-archives',
    label: 'National Archives',
    role: 'Official records and primary sources',
    status: 'stub',
    notes: '',
  },
  {
    id: 'curated-fallback',
    label: 'Curated archive',
    role: 'Human-checked seed stories',
    status: 'fallback',
    notes: '',
  },
]

export function buildFallbackResult(
  queryDate: string,
  brandId: string,
  researchMode: ResearchMode = 'full',
): DateQueryResult {
  const brand = getBrand(brandId)
  const rawEvents = lookupFallbackEvents(queryDate)
  const events = rawEvents.map((e) => sanitizeEventCitations(e))
  const brandMoments: CulturalEvent[] = heritageMoments(brand)
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

  const display = toDisplayDate(queryDate)
  const spotlight = events[0] ?? brandMoments[0]
  const lede = spotlight
    ? spotlight.synopsis.replace(/^(.+?[.!?])(?:\s|$)[\s\S]*$/, '$1')
    : `No fact on record for ${display}.`

  return {
    queryDate,
    datePath: toOnThisDayPath(queryDate),
    displayDate: display,
    resolvedMode: hasExact ? 'mixed' : 'period-estimate',
    researchMode,
    brandId: brand.id,
    narrative: {
      headline: brand.claimFrame,
      lede,
      voice: 'template',
      disclaimer: '',
    },
    events: events.slice(0, 1),
    brandMoments: brandMoments.slice(0, 1),
    providersUsed: ['curated-fallback', 'brand-timeline'],
    usingFallback: true,
    generatedAt: new Date().toISOString(),
  }
}

function lookupFallbackEvents(queryDate: string): CulturalEvent[] {
  if (FALLBACK_EVENTS_BY_DATE[queryDate]) return FALLBACK_EVENTS_BY_DATE[queryDate]
  // Year-month query can still hit a year-keyed fallback.
  if (queryDate.length >= 7) {
    const yearKey = queryDate.slice(0, 4)
    if (FALLBACK_EVENTS_BY_DATE[yearKey]) return FALLBACK_EVENTS_BY_DATE[yearKey]
  }
  return synthesizeGenericFallback(queryDate)
}

function momentTouchesDate(momentDate: string, queryDate: string): boolean {
  if (momentDate.length === 4) return momentDate === queryDate.slice(0, 4)
  if (momentDate.length === 7) return momentDate === queryDate.slice(0, 7)
  return momentDate === queryDate || momentDate.slice(0, 4) === queryDate.slice(0, 4)
}

function synthesizeGenericFallback(_queryDate: string): CulturalEvent[] {
  // Empty — UI leads with the "quiet day" note; brand timeline moments may still attach.
  return []
}
