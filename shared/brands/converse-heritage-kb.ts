import type { BrandMoment } from '../brand'
import {
  CONVERSE_HISTORY_PAGE_UK,
  heritageImageForYear,
} from './converse-heritage-media'

/**
 * Full Converse History landing beats — knowledge pack for Chuck-E / date attach.
 * Not the public Timeline surface (that stays curated in converse.ts).
 * Source narrative: https://www.converse.com/uk/en/landing-converse-history
 */

const HISTORY_URL = CONVERSE_HISTORY_PAGE_UK

function withHeritageImages(moments: BrandMoment[]): BrandMoment[] {
  return moments.map((m) => {
    if (m.image) return m
    const img = heritageImageForYear(
      m.date,
      `${m.title} (${m.date.slice(0, 4)}) — from Converse History`,
    )
    return img ? { ...m, image: img } : m
  })
}

export const CONVERSE_HERITAGE_KB: BrandMoment[] = withHeritageImages([
    {
      id: 'cv-1908',
      date: '1908-02',
      precision: 'month',
      title: 'It all starts here',
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
      id: 'cv-1909',
      date: '1909-04-30',
      precision: 'exact-day',
      title: 'A boot beginning',
      synopsis:
        'Ten rubber galoshes — Converse’s first products — were produced on 30 April 1909.',
      reference:
        'Converse History: “Ten rubber galoshes, Converse’s first products, were produced on April 30, 1909.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1910',
      date: '1910',
      precision: 'year',
      title: 'Created with canvas',
      synopsis:
        'Innovations for galoshes and tires made products wear evenly and last longer; the brand began producing canvas footwear to retain employees through the summer.',
      reference:
        'Converse History entry for 1910 (“Created with canvas”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1913',
      date: '1913',
      precision: 'year',
      title: 'Nautical roots',
      synopsis:
        'Converse introduced its first yachting shoe — a silhouette that later resembled the modern Circular Vamp Oxford.',
      reference:
        'Converse History entry for 1913 (“Nautical roots”).',
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
      title: 'Non-Skid now',
      synopsis:
        'The All Star lineage began under the name Non-Skid — one of the first shoes designed specifically for basketball.',
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
      title: 'Meet the All Star',
      synopsis:
        'Coaches asked for darker canvas to hide wear; Converse released a brown Non-Skid and named it the All Star.',
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
      title: 'Calling Chuck Taylor',
      synopsis:
        'Charles H. “Chuck” Taylor joined as a salesman and toured the U.S. promoting the brand as player and coach for the Converse All Stars.',
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
      id: 'cv-1924',
      date: '1924',
      precision: 'year',
      title: 'Sponsors women’s basketball',
      synopsis:
        'Converse sponsored the Edmonton Grads, women’s basketball world champions from 1923–1940 with a 502–20 record.',
      reference:
        'Converse History entry for 1924 (“Sponsors women’s basketball team”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1933',
      date: '1933',
      precision: 'year',
      title: 'Jack Purcell joins',
      synopsis:
        'Jack Purcell collaborated with B.F. Goodrich on a badminton shoe; Converse later purchased the rights in 1972 as the style became casual footwear.',
      reference:
        'Converse History entry for 1933 (“Jack Purcell joins”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1934',
      date: '1934',
      precision: 'year',
      title: 'Signed by Chuck',
      synopsis:
        'Chuck Taylor’s signature was added to the All Star ankle patch, creating the original signature basketball shoe.',
      reference:
        'Converse History (1934): “Chuck Taylor’s signature is added to the All Star, creating the original signature basketball shoe.” Brand archive accounts (e.g. Smithsonian interview with Converse archivist Sam Smallidge) place the name/signature change in 1934; older secondary sources that say 1932 are treated as superseded for this pack.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: true,
    },
    {
      id: 'cv-1936',
      date: '1936-08-14',
      precision: 'exact-day',
      title: 'New colours, new sponsorship',
      synopsis:
        'Converse sponsored the first U.S. men’s Olympic basketball team in a white All Star with red and blue pinstripes — the look that became the All Star most people know. On 14 August 1936 the U.S. beat Canada 19–8 for the first Olympic basketball gold.',
      reference:
        'Converse History ties the Olympic white colorway to the 1936 Games; Olympedia / Basketball-Reference list the gold-medal final as 14 August 1936 (USA 19–8 Canada).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1939',
      date: '1939-03-27',
      precision: 'exact-day',
      title: 'NCAA All Star championships',
      synopsis:
        'Both teams in the first NCAA championship basketball game wore All Stars — Oregon beat Ohio State 46–33 at Patten Gymnasium in Evanston on 27 March 1939.',
      reference:
        'Converse History claims both teams wore All Stars; Sports-Reference / NCAA records place the inaugural title game on 27 March 1939.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1945',
      date: '1945',
      precision: 'year',
      title: 'Contracts for the cause',
      synopsis:
        'Across WWII, Converse completed over 50 military contracts — from basketball shoes to deck jackets.',
      reference:
        'Converse History entry for 1945 (“Contracts for the cause”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1957',
      date: '1957',
      precision: 'year',
      title: 'Introduces the low top',
      synopsis:
        'Converse introduced the low-top All Star; it took off in California with beach-goers even as performance sales plateaued elsewhere.',
      reference:
        'Converse History entry for 1957 (“Introduces the low top”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1971',
      date: '1971',
      precision: 'year',
      title: 'More colours, One Star, Naut-1',
      synopsis:
        'Converse added five All Star colours, introduced the One Star (later a skate staple), and launched the Naut-1 in navy and white.',
      reference:
        'Converse History 1971 entries: “More All Star colors,” “Number One Star,” and “Naut-1.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1975',
      date: '1975',
      precision: 'year',
      title: 'A year of firsts',
      synopsis:
        'Converse introduced the Star Chevron logo, its first performance running shoe (the All Star Training Shoe), and its first two graphic T-shirts.',
      reference:
        'Converse History entry for 1975 (“A year of firsts”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1976',
      date: '1976',
      precision: 'year',
      title: 'Pro Leather and Chris Evert',
      synopsis:
        'Chris Evert became the first female athlete with an individual Converse endorsement; the Pro Leather succeeded the Leather All Star as the pinnacle performance basketball shoe.',
      reference:
        'Converse History 1976 entries: “First female athlete endorsement” and “Presenting: Pro Leather.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1982-lab',
      date: '1982',
      precision: 'year',
      title: 'Biomechanical',
      synopsis:
        'Converse established the Converse Biomechanics Laboratory — one of the industry’s first — to design better products for athletes.',
      reference:
        'Converse History entry for 1982 (“Biomechanical”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1982-jordan',
      date: '1982-03-29',
      precision: 'exact-day',
      title: 'Jordan in Pro Leather',
      synopsis:
        'Michael Jordan led UNC past Georgetown 63–62 in the NCAA championship wearing the Pro Leather — the jump shot that launched his national fame.',
      reference:
        'Converse History notes Jordan’s Pro Leather title run; contemporary coverage (e.g. NYT, 30 March 1982) dated the final to 29 March 1982.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1984',
      date: '1984',
      precision: 'year',
      title: 'Official Olympic footwear',
      synopsis:
        'Converse was official footwear sponsor of the 1984 Olympics; the U.S. men’s and women’s basketball teams won gold in Converse shoes.',
      reference:
        'Converse History entry for 1984 (“Official Olympic footwear”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1986',
      date: '1986',
      precision: 'year',
      title: 'Choose Your Weapon',
      synopsis:
        'Converse released the Weapon, central to the Bird–Magic rivalry; the “Choose Your Weapon” campaign had the two face off.',
      reference:
        'Converse History entry for 1986 (“Choose Your Weapon”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1991',
      date: '1991',
      precision: 'year',
      title: 'Stars and stripes',
      synopsis:
        'Converse added an American flag print to the Chuck — opening the door to innumerable ornamental motifs on the silhouette.',
      reference:
        'Converse History entry for 1991 (“Stars and stripes”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-1993',
      date: '1993',
      precision: 'year',
      title: 'From All Star to One Star',
      synopsis:
        'The suede leather All Star returned as the One Star and was adopted by skate culture after early Thrasher advertising.',
      reference:
        'Converse History entry for 1993 (“From All Star to One Star”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2000',
      date: '2000',
      precision: 'year',
      title: 'First fashion collab',
      synopsis:
        'Converse entered its first fashion collaboration with designer John Richmond, including a black leather Jack Purcell with a hint of red smiler on the toe.',
      reference:
        'Converse History entry for 2000 (“First fashion collab”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2003-announce',
      date: '2003-07-09',
      precision: 'exact-day',
      title: 'Nike to acquire Converse',
      synopsis:
        'Nike announced a definitive agreement to acquire Converse for about $305 million — folding the heritage silhouette into a global portfolio while keeping the Converse label distinct.',
      reference:
        'Converse History lists the Nike purchase under 2003 (“Swooshed”). Exact announce day 9 July 2003 corroborated by Nike SEC 8-K “NIKE, INC. TO ACQUIRE CONVERSE, INC.”',
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
      title: 'Swooshed',
      synopsis:
        'Nike completed the acquisition of Converse on 4 September 2003 under the terms announced in July.',
      reference:
        'Converse History (“Swooshed”, 2003). Exact close day 4 September 2003 corroborated by Nike SEC 8-K “NIKE, INC. COMPLETES ACQUISITION OF CONVERSE INC.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2008',
      date: '2008',
      precision: 'year',
      title: 'One Hund(RED)',
      synopsis:
        'The One Hund(RED) artists campaign brought over 100 artists to stamp the All Star — an early Converse campaign empowering communities for a cause.',
      reference:
        'Converse History entry for 2008 (“Red and ready empower” / “Red and power ready”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2009-cons',
      date: '2009',
      precision: 'year',
      title: 'Set to skate',
      synopsis:
        'CONS skateboarding made its global debut with a lineup of skate ambassadors.',
      reference:
        'Converse History entry for 2009 (“Set to skate”).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2009-cdg',
      date: '2009-08',
      precision: 'month',
      title: 'CDG PLAY all day',
      synopsis:
        'Comme des Garçons PLAY put models in Converse and launched a collaboration that became Converse’s longest-running contemporary partnership.',
      reference:
        'Converse History dates the collab to 2009; contemporary press (Interview Magazine, LA Times, FashionNetwork) covered the debut for late August 2009.',
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
      title: 'Throwback, look forward',
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
    {
      id: 'cv-2015',
      date: '2015-06',
      precision: 'month',
      title: 'Proud',
      synopsis:
        'Converse released its first Pride Month collection — rainbow Chucks and apparel framed around tolerance, diversity, and equality.',
      reference:
        'Converse History and later Pride landings date the first annual Pride collection to 2015; contemporary coverage (e.g. Bustle / Pride-month blogs) placed the debut around June 2015.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2017',
      date: '2017-11-02',
      precision: 'exact-day',
      title: 'Tyler team-up',
      synopsis:
        'Converse and Tyler, the Creator introduced the GOLF le FLEUR* signature — the start of a long-term partnership — with a global release on 2 November 2017.',
      reference:
        'Converse History frames the 2017 GOLF le FLEUR* debut; SneakerFiles / FADER reported Kasina (18 Oct) then global (2 Nov 2017).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2019',
      date: '2019',
      precision: 'year',
      title: 'Skate, hoops, and China',
      synopsis:
        'Alexis Sablone joined CONS as its first female rider; Converse relaunched basketball with the All Star BB Pro and Kelly Oubre Jr.; opened a Beijing flagship; and released the GOLF le FLEUR* Gianno with Tyler.',
      reference:
        'Converse History 2019 entries: “Signature Sablone,” “Back to basketball,” “Flagship in China,” and “Gianno.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2020',
      date: '2020',
      precision: 'year',
      title: 'All Stars community',
      synopsis:
        'Converse expanded its hoops roster and launched Converse All Stars — a community ecosystem of nearly 1,500 emerging creative leaders across 56 cities.',
      reference:
        'Converse History 2020 entries: “Revolutionary hoopers” and “All Stars community.”',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2021',
      date: '2021-09-02',
      precision: 'exact-day',
      title: 'The Weapon returns',
      synopsis:
        'The 1986 Weapon returned with a modern CX update; lifestyle coverage dated the Weapon CX drop to 2 September 2021. Draymond Green also helped the U.S. win Olympic gold in Tokyo that summer.',
      reference:
        'Converse History 2021 (“The Weapon returns” / “Tokyo dreams”); Modern Notoriety reported Weapon CX for 2 September 2021.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2023',
      date: '2023-05-02',
      precision: 'exact-day',
      title: 'Sablone & skate legacy',
      synopsis:
        'Converse and Alexis Sablone co-created the AS-1 Pro — her first signature skate silhouette — with a global debut on 2 May 2023 and a Guggenheim-ramp documentary.',
      reference:
        'Converse History (“Sablone & skate legacy”, 2023). Exact global debut 2 May 2023 corroborated by Nike Newsroom AS-1 Pro release notes.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2024',
      date: '2024-10-17',
      precision: 'exact-day',
      title: 'Billie By You',
      synopsis:
        'Converse launched the Billie Eilish By You experience — custom Chucks with insignia and lyrics from Hit Me Hard and Soft — on 17 October 2024.',
      reference:
        'Converse History lists the experience under 2024; Rolling Stone / SNKRDUNK reported the seven-day By You window opening 17 October 2024.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
    },
])

export { HISTORY_URL as CONVERSE_HISTORY_CITE_URL }
