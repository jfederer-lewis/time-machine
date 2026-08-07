/**
 * Converse “universe” — soft cultural affinity for on-this-day ranking and Chuck-E date ties.
 * Direct brand names stay strongest; these themes lift adjacent culture without inventing claims.
 * Never boost competing footwear brands (Nike only via explicit Converse acquisition ties elsewhere).
 * Never force Chuck over clearer significance; never bridge beside landmark defining days.
 *
 * Canonical rules: documentation/EDITORIAL_SCHEMA.md
 */

export const CONVERSE_UNIVERSE_KNOBS = {
  /**
   * Soft lift when cultural news matches Converse-adjacent scenes / words.
   * Keep small — never force Chuck over clearly more significant world news.
   */
  universeAffinityWeight: 4,
  /** Soft demote when the day is clearly about a competing sneaker brand. */
  competitorDemoteWeight: -6,
} as const

/**
 * Direct product / house names — strongest brand affinity (also in interest.ts historically).
 */
export const CONVERSE_BRAND_AFFINITY_RE =
  /\b(converse|chuck\s+taylor|chucks\b|chuck\s*70|all[\s-]?stars?|non[\s-]?skid|jack\s+purcell|one\s+star|pro\s+leather|pro\s+stars?|weapon\b|golf\s+le\s+fleur|comme\s+des\s+gar[cç]ons\s+play|cdg\s+play|cons\s+skate|malden)\b/i

/**
 * Extended cultural neighbourhood — basketball / skate / punk / youth / canvas / self-expression.
 * Soft boost only; never invent a Converse claim from these alone.
 */
export const CONVERSE_UNIVERSE_AFFINITY_RE =
  /\b(basketball|nba|ncaa|olympics?\b.{0,30}basketball|skateboard|skate\s+culture|sidewalk\s+surf|punk\s+rock|sex\s+pistols|ramones|grunge|kurt\s+cobain|nirvana|hip[\s-]?hop|canvas\s+(shoe|sneaker|trainer)|high[\s-]?top|vulcani[sz]ed|foxing|self[\s-]?expression|street\s+style|youth\s+culture|indie\s+(rock|scene)|music\s+festival|subculture|sneaker\s+culture)\b/i

/** Competing footwear houses — demote unless Converse also appears in the claim. */
export const COMPETITOR_FOOTWEAR_RE =
  /\b(adidas|nike(?!\s*.{0,40}converse)|jordan\s+brand|air\s+jordan|vans\b|puma\b|reebok|new\s+balance|asics|salomon|hoka\b|on\s+running|skechers)\b/i

export interface ConverseUniverseAnchor {
  id: string
  /** ISO exact day */
  date: string
  title: string
  /** How this day ties into the Converse story — past tense, sourced. */
  converseTie: string
  synopsis: string
  reference: string
  citation: {
    title: string
    url: string
    publisher: string
    author?: string
    publishedAt?: string
  }
}

/**
 * Calendar-day people / hinge anchors outside the History LP chronology —
 * e.g. Chuck Taylor’s birthday → who he became for Converse.
 */
export const CONVERSE_UNIVERSE_ANCHORS: ConverseUniverseAnchor[] = [
  {
    id: 'cu-chuck-taylor-born',
    date: '1901-06-24',
    title: 'Chuck Taylor born',
    synopsis:
      'Charles Hollis “Chuck” Taylor was born on 24 June 1901 in Brown County, Indiana.',
    converseTie:
      'He later joined Converse as a salesman and brand ambassador, helped shape the All Star, and gave the silhouette the signature name still worn worldwide.',
    reference:
      'Naismith Memorial Basketball Hall of Fame — Chuck Taylor (Date of Birth June 24, 1901). Corroborated by Wikipedia ‘Chuck Taylor (salesman)’. Converse History places his joining the company in 1922 and the signature ankle patch in 1934.',
    citation: {
      title: 'Chuck Taylor',
      url: 'https://www.hoophall.com/hall-of-famers/chuck-taylor',
      publisher: 'Naismith Memorial Basketball Hall of Fame',
    },
  },
  {
    id: 'cu-chuck-taylor-died',
    date: '1969-06-23',
    title: 'Chuck Taylor died',
    synopsis:
      'Chuck Taylor died on 23 June 1969 in Port Charlotte, Florida, aged 67.',
    converseTie:
      'By then his name was inseparable from the Converse All Star — the signature basketball shoe he had promoted across clinics, teams, and decades on the road.',
    reference:
      'Wikipedia ‘Chuck Taylor (salesman)’ (died June 23, 1969). Converse History covers his signature era and All Star legacy.',
    citation: {
      title: 'Chuck Taylor (salesman)',
      url: 'https://en.wikipedia.org/wiki/Chuck_Taylor_(salesman)',
      publisher: 'Wikipedia',
      publishedAt: '1969-06-23',
    },
  },
]

/** MM-DD key for calendar matching across years. */
export function calendarDayKey(isoDate: string): string | null {
  const m = isoDate.match(/^\d{4}-(\d{2}-\d{2})$/)
  return m ? m[1] : null
}

export function universeAnchorsForQueryDate(queryDate: string): ConverseUniverseAnchor[] {
  const key = calendarDayKey(queryDate)
  if (!key) return []
  return CONVERSE_UNIVERSE_ANCHORS.filter((a) => calendarDayKey(a.date) === key)
}
