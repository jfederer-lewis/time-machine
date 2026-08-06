import type { BrandConfig } from '../brand'
import {
  CONVERSE_HERITAGE_KB,
  CONVERSE_HISTORY_CITE_URL,
} from './converse-heritage-kb'

/**
 * Converse brand pack — plug-and-play.
 * Swap this file (or BRAND_ID) to pitch the same time machine to another heritage brand.
 *
 * Two heritage layers:
 * - `timeline` — curated public Timeline surface (story beats, not a History LP clone)
 * - `heritageKb` — full Converse History landing text for Chuck-E + date attach
 *
 * Date precision notes (critical for hallucination avoidance):
 * - Founding: company opens Feb 1908 (secondary); first ten galoshes = 30 Apr 1909 (Converse).
 * - Non-Skid / All Star introduction: 1917 / 1919 year-only on official history.
 * - Chuck Taylor joins: Converse official history says 1922.
 * - Signature on the ankle patch: Converse official history + brand archive narrative = 1934
 *   (older secondary sources often say 1932 — superseded here by brand pack).
 * - Nike: agreement announced 9 Jul 2003; acquisition completed 4 Sep 2003 (SEC / Nike 8-K).
 *
 * Open product question — date range / “time capsule” framing:
 * Wondering whether to reposition lookup so it only covers what has happened *since*
 * Converse existed — e.g. floor the selectable range at founding (1908) or the first
 * shoe, and treat the tool as a capsule of the Converse era rather than all of history.
 * That could sharpen the concept (Chuck’s world, not arbitrary antiquity), but may dull
 * the open “time machine” fun of jumping anywhere. Not decided; leave unconstrained
 * for now.
 */

const HISTORY_URL = CONVERSE_HISTORY_CITE_URL

export const converseBrand: BrandConfig = {
  id: 'converse',
  name: 'Converse',
  productLine: 'Chuck Taylor All Star',
  tagline: 'Good News, Chuck',
  claimFrame: 'Chuck was there.',
  lookupIntro:
    'Pick a year, a month, or a day — and see what was happening in the world.',
  timelineTitle: 'The All Star story',
  heritageNote:
    'Over a century of Converse heritage — from a Malden rubber shop to a silhouette worn everywhere, the moments that made Chuck Taylor.',
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
    { date: '1917', label: '1917' },
    { date: '1922', label: '1922' },
    { date: '1934', label: '1934' },
    { date: '1982-03-29', label: '1982' },
    { date: '2003-09-04', label: '2003' },
    { date: '2013-02-15', label: '2013' },
  ],
  /** Curated Timeline UI — keep short; full History lives in heritageKb. */
  timeline: [
    {
      id: 'cv-1908',
      date: '1908-02',
      precision: 'month',
      title: 'Converse Rubber Shoe Company founded',
      synopsis:
        'Marquis Mills Converse opened the Converse Rubber Shoe Company in Malden, Massachusetts — a rubber footwear maker before basketball became the summer line.',
      reference:
        'Converse History frames the Malden opening under Marquis Mills; secondary company histories place the founding in February 1908.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1917',
      date: '1917',
      precision: 'year',
      title: 'Non-Skid basketball shoe introduced',
      synopsis:
        'Converse introduced a basketball-specific canvas-and-rubber shoe marketed as the Non-Skid — the design lineage that becomes the All Star.',
      reference:
        'Converse History: “The All Star gets its start under the name Non-Skid. It was one of the first shoes specifically designed for the new game of basketball.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
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
        'Responding to coaches who wanted darker canvas to hide wear, Converse released a brown Non-Skid and branded it the All Star.',
      reference:
        'Converse History entry for 1919 (“Meet the All Star”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1922',
      date: '1922',
      precision: 'year',
      title: 'Chuck Taylor joins Converse',
      synopsis:
        'Charles H. “Chuck” Taylor joined as a salesman and brand ambassador, touring the U.S. as player and coach for the Converse All Stars.',
      reference:
        'Converse History: “Charles H. ‘Chuck’ Taylor joins the Converse family as a salesman” in 1922.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1934',
      date: '1934',
      precision: 'year',
      title: 'Signature added to the ankle patch',
      synopsis:
        'Chuck Taylor’s signature was added to the All Star ankle patch, creating the original signature basketball shoe.',
      reference:
        'Converse History (1934): “Chuck Taylor’s signature is added to the All Star, creating the original signature basketball shoe.” Older secondary sources that say 1932 are treated as superseded for this pack.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1982-jordan',
      date: '1982-03-29',
      precision: 'exact-day',
      title: 'Jordan in Pro Leather',
      synopsis:
        'Michael Jordan led UNC past Georgetown 63–62 in the NCAA championship wearing the Pro Leather — the jump shot that launched his national fame.',
      reference:
        'Converse History notes Jordan’s Pro Leather title run; contemporary coverage dated the final to 29 March 1982.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2003',
      date: '2003-09-04',
      precision: 'exact-day',
      title: 'Nike acquires Converse',
      synopsis:
        'Nike completed the acquisition of Converse on 4 September 2003, folding the heritage silhouette into a global portfolio while keeping Converse as a distinct label.',
      reference:
        'Converse History (“Swooshed”, 2003). Exact close day 4 September 2003 corroborated by Nike SEC 8-K.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2013',
      date: '2013-02-15',
      precision: 'exact-day',
      title: 'Chuck 70 launches',
      synopsis:
        'Converse launched the Chuck 70 — built from the 1970s All Star with heavier canvas, higher foxing, and modern cushioning — globally on 15 February 2013.',
      reference:
        'Converse History lists the Chuck 70 under 2013; Hypebeast / Nice Kicks reported the black/white global drop for 15 February 2013.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
  ],
  /** Full History LP beats for chat + on-this-day brand attach — not Timeline UI. */
  heritageKb: CONVERSE_HERITAGE_KB,
  exportFilenamePrefix: 'good-news-chuck',
}

export default converseBrand
