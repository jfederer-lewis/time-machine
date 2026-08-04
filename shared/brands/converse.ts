import type { BrandConfig } from '../brand'

/**
 * Converse brand pack — plug-and-play.
 * Swap this file (or BRAND_ID) to pitch the same time machine to another heritage brand.
 *
 * Date precision notes (critical for hallucination avoidance):
 * - Non-Skid / All Star introduction is attested for 1917, not a single public calendar day.
 * - Chuck Taylor joins as salesman: Converse official history says 1922.
 * - Signature on the ankle patch: sources disagree (often cited as early 1920s / 1932).
 *   Contested claims are marked period-estimate / needs-human-review in the data layer.
 */
export const converseBrand: BrandConfig = {
  id: 'converse',
  name: 'Converse',
  productLine: 'Chuck Taylor All Star',
  tagline: 'Good News, Chuck',
  claimFrame: 'Chuck was there.',
  heritageNote:
    'A century of continuous cultural presence — the claim is not that the news was good, only that the silhouette was already in the room.',
  palette: {
    ink: '#141414',
    paper: '#F5F4F0',
    muted: '#5C5C5C',
    rule: '#CFCBC3',
    accent: '#C41230',
    accentSoft: '#F0D5DA',
    estimate: '#7A6E55',
  },
  featuredDates: [
    { date: '1917-01-01', label: '1917' },
    { date: '1922-01-01', label: '1922' },
    { date: '1970-01-01', label: '1970' },
    { date: '1999-04-01', label: '1999' },
    { date: '2003-07-09', label: '2003' },
  ],
  timeline: [
    {
      id: 'cv-1908',
      date: '1908',
      precision: 'year',
      title: 'Converse Rubber Shoe Company founded',
      synopsis:
        'Marquis Mills Converse establishes the company in Malden, Massachusetts, beginning as a rubber footwear maker before basketball becomes the summer line.',
      reference:
        'Nike’s official history places founding in 1908 in Massachusetts, with early products including galoshes and waterproof winter boots.',
      citation: {
        title: 'The True History of the Chuck Taylor All Star',
        url: 'https://about.nike.com/en/magazine/converse-chuck-taylor-all-star-iconic-sneaker-true-history',
        publisher: 'Nike',
        publishedAt: '2024',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1917',
      date: '1917',
      precision: 'year',
      title: 'Non-Skid basketball shoe introduced',
      synopsis:
        'Converse introduces a basketball-specific canvas-and-rubber shoe marketed as the Non-Skid — the design lineage that becomes the All Star.',
      reference:
        'Converse’s own history: “The All Star gets its start under the name Non-Skid. It was one of the first shoes specifically designed for the new game of basketball.”',
      citation: {
        title: 'Converse History',
        url: 'https://www.converse.com/at/en/landing-converse-history',
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1919',
      date: '1919',
      precision: 'year',
      title: 'Rebranded as All Star',
      synopsis:
        'Responding to coaches who wanted darker canvas to hide wear, Converse releases a brown Non-Skid and brands it the All Star.',
      reference:
        'Nike magazine history: the darker iteration “was officially branded the ‘All Star’ in 1919.”',
      citation: {
        title: 'The True History of the Chuck Taylor All Star',
        url: 'https://about.nike.com/en/magazine/converse-chuck-taylor-all-star-iconic-sneaker-true-history',
        publisher: 'Nike',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1922',
      date: '1922',
      precision: 'year',
      title: 'Chuck Taylor joins Converse',
      synopsis:
        'Charles H. “Chuck” Taylor joins as a salesman and brand ambassador, touring the U.S. as player and coach for the Converse All Stars.',
      reference:
        'Converse History: “Charles H. ‘Chuck’ Taylor joins the Converse family as a salesman” in 1922.',
      citation: {
        title: 'Converse History',
        url: 'https://www.converse.com/at/en/landing-converse-history',
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1932',
      date: '1932',
      precision: 'period-estimate',
      title: 'Signature added to the ankle patch',
      synopsis:
        'Taylor’s signature appears on the All Star ankle patch, creating the signature silhouette. Exact year is contested across secondary sources; treat as heritage narrative pending primary verification.',
      reference:
        'English Wikipedia (citing company history summaries) places the signature addition in 1932; other secondary accounts place it in the early 1920s. Flagged for human review before press use.',
      citation: {
        title: 'Converse (brand)',
        url: 'https://en.wikipedia.org/wiki/Converse_(shoe)',
        publisher: 'Wikipedia',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2003',
      date: '2003-07-09',
      precision: 'exact-day',
      title: 'Nike acquires Converse',
      synopsis:
        'Nike completes acquisition of Converse, folding the heritage silhouette into a global brand portfolio while keeping Converse as a distinct label.',
      reference:
        'Nike investor materials and contemporary coverage mark July 2003 as the acquisition close; used here as a dated brand doorway rather than a product launch.',
      citation: {
        title: 'Converse (brand)',
        url: 'https://en.wikipedia.org/wiki/Converse_(shoe)',
        publisher: 'Wikipedia',
        publishedAt: '2003',
      },
      isExactQuote: false,
    },
  ],
  exportFilenamePrefix: 'good-news-chuck',
}

export default converseBrand
