import type { BrandMoment } from '../brand'
import {
  CONVERSE_HISTORY_PAGE_UK,
  heritageImageForYear,
} from './converse-heritage-media'

/**
 * Heritage + culture knowledge pack for Chuck-E / date attach.
 * Core narrative: https://www.converse.com/uk/en/landing-converse-history
 * Secondary culture colour (collabs / scenes / cause): claim-relevant dedicated press
 * (GQ / Teen Vogue / WWD / Hypebeast / Fast Company / Vogue / Dazed…) — prefer articles
 * about the named collab or model over “best collaborations” roundups.
 * Not the public Timeline surface (that stays curated in converse.ts).
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
      anniversaryEligible: true,
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
      id: 'cv-1970s-punk-dazed',
      date: '1977',
      precision: 'year',
      title: 'Punk takes the Chuck',
      synopsis:
        'In the 1970s the All Star was adopted by punk — Dazed charts Sex Pistols and Ramones among the early music-scene wearers who treated the shoe as everyday uniform rather than basketball kit.',
      reference:
        'Ted Stansfield / Dazed (30 July 2015) ‘How this shoe became a subcultural icon’. Available at: https://www.dazeddigital.com/fashion/article/25679/1/converse-chuck-taylor-s',
      citation: {
        title: 'How this shoe became a subcultural icon',
        url: 'https://www.dazeddigital.com/fashion/article/25679/1/converse-chuck-taylor-s',
        publisher: 'Dazed',
        author: 'Ted Stansfield',
        publishedAt: '2015-07-30',
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
        'Converse was official footwear sponsor of the 1984 Olympics; the U.S. men’s and women’s basketball teams won gold in Converse shoes — most notably Michael Jordan and Lynette Woodward, both wearing Pro Stars.',
      reference:
        'Converse History entry for 1984 (“Official Olympic footwear”): gold-medal U.S. teams; Jordan and Lynette Woodward in Pro Stars.',
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
      id: 'cv-1986-weapon-highsnobiety',
      date: '2021',
      precision: 'year',
      title: 'Weapon: Bird, Magic, and the court arc',
      synopsis:
        'Highsnobiety’s Weapon history traces the 1986 high-top as Converse’s most advanced basketball shoe of its day — worn by Magic Johnson and Larry Bird in team colourways under “Choose Your Weapon,” with a wider NBA roster (Isiah Thomas, Kevin McHale, and others) before Air Jordan marketing shifted the league. The piece also covers the CX Foam relaunch that kept the 1986 upper blueprint and the Rick Owens DRKSHDW TURBOWPN collaboration.',
      reference:
        'Fabian Gorsler / Highsnobiety ‘Converse Weapon: A Brief History of the Iconic Basketball Shoe’. Available at: https://www.highsnobiety.com/p/converse-weapon-history/',
      citation: {
        title: 'Converse Weapon: A Brief History of the Iconic Basketball Shoe',
        url: 'https://www.highsnobiety.com/p/converse-weapon-history/',
        publisher: 'Highsnobiety',
        author: 'Fabian Gorsler',
        publishedAt: '2021',
      },
      isExactQuote: false,
      storyCluster: 'weapon-basketball-press',
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
      id: 'cv-1990s-grunge-dazed',
      date: '1991',
      precision: 'year',
      title: 'Grunge and the All Star',
      synopsis:
        'Grunge-era culture favoured cheap, durable trainers; Dazed notes Kurt Cobain among the All Star’s iconic music fans as the silhouette moved from court to subcultural staple.',
      reference:
        'Ted Stansfield / Dazed (30 July 2015) ‘How this shoe became a subcultural icon’. Available at: https://www.dazeddigital.com/fashion/article/25679/1/converse-chuck-taylor-s',
      citation: {
        title: 'How this shoe became a subcultural icon',
        url: 'https://www.dazeddigital.com/fashion/article/25679/1/converse-chuck-taylor-s',
        publisher: 'Dazed',
        author: 'Ted Stansfield',
        publishedAt: '2015-07-30',
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
        'Nike announced a definitive agreement to acquire Converse for about $305 million — the blacktop legend folding into Nike’s portfolio while keeping the Converse label distinct.',
      reference:
        'Agreement announced 9 July 2003 (Nike SEC 8-K). Public press: The New York Times (10 July 2003) ‘Nike Purchasing Converse, a Legend on the Blacktop’. Available at: https://www.nytimes.com/2003/07/10/business/nike-purchasing-converse-a-legend-on-the-blacktop.html. Also WSJ same-day deal coverage and WWD (10 July 2003) trade press. Converse History frames the purchase year as “Swooshed.”',
      citation: {
        title: 'Nike Purchasing Converse, a Legend on the Blacktop',
        url: 'https://www.nytimes.com/2003/07/10/business/nike-purchasing-converse-a-legend-on-the-blacktop.html',
        publisher: 'The New York Times',
        publishedAt: '2003-07-10',
      },
      isExactQuote: false,
      storyCluster: 'nike-announce-2003',
      anniversaryEligible: true,
    },
    {
      id: 'cv-2003-announce-wsj',
      date: '2003-07-09',
      precision: 'exact-day',
      title: 'Nike to buy Converse',
      synopsis:
        'The Wall Street Journal reported Nike’s ~$305 million deal for Converse — framing the Swoosh swallowing Chuck Taylor as culturally outsized versus the cash figure, pairing Nike’s high-tech sneakers with Converse’s low-tech blacktop classic.',
      reference:
        'Maureen Tkacik / The Wall Street Journal (9 July 2003) ‘Nike to Buy Converse For About $305 Million’. Available at: https://www.wsj.com/articles/SB105778918424757500',
      citation: {
        title: 'Nike to Buy Converse For About $305 Million',
        url: 'https://www.wsj.com/articles/SB105778918424757500',
        publisher: 'The Wall Street Journal',
        author: 'Maureen Tkacik',
        publishedAt: '2003-07-09',
      },
      isExactQuote: false,
      storyCluster: 'nike-announce-2003',
      anniversaryEligible: true,
    },
    {
      id: 'cv-2003-announce-wwd',
      date: '2003-07-09',
      precision: 'exact-day',
      title: 'Nike acquires Converse',
      synopsis:
        'Women’s Wear Daily reported Nike’s ~$305 million agreement to buy Converse — trade press on the blacktop legend joining Nike’s brand portfolio after Converse’s earlier bankruptcy and revival.',
      reference:
        'WWD Staff / Women’s Wear Daily (10 July 2003) ‘Nike Acquires Converse’. Available at: https://wwd.com/fashion-news/fashion-features/nike-acquires-converse-726154/',
      citation: {
        title: 'Nike Acquires Converse',
        url: 'https://wwd.com/fashion-news/fashion-features/nike-acquires-converse-726154/',
        publisher: "Women's Wear Daily",
        publishedAt: '2003-07-10',
      },
      isExactQuote: false,
      storyCluster: 'nike-announce-2003',
      anniversaryEligible: true,
    },
    {
      id: 'cv-2003',
      date: '2003-09-04',
      precision: 'exact-day',
      title: 'Swooshed',
      synopsis:
        'Nike completed its acquisition of Converse — folding the heritage All Star into a global portfolio while keeping the Converse label distinct.',
      reference:
        'Converse History (“Swooshed”, 2003). Exact close day 4 September 2003 corroborated by Nike SEC 8-K “NIKE, INC. COMPLETES ACQUISITION OF CONVERSE INC.” For the July announcement / purchase story, prefer The New York Times, The Wall Street Journal, and WWD deal coverage.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
      anniversaryEligible: true,
    },
    {
      id: 'cv-2008',
      date: '2008',
      precision: 'year',
      title: 'One Hund(RED)',
      synopsis:
        'The One Hund(RED) artists campaign brought over 100 artists to stamp the All Star — an early Converse × (PRODUCT) RED partnership empowering communities against AIDS and related global health crises.',
      reference:
        'Converse History 2008 (“Red and ready empower” / “Red and power ready”). Corroborated by Nike Magazine “Journey of an Icon” (1HUND(RED) Artists) and British Vogue (26 Feb 2008) on Converse’s (PRODUCT) RED work.',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
      storyCluster: 'product-red-2008',
    },
    {
      id: 'cv-2008-vogue-century',
      date: '2008-02-26',
      precision: 'exact-day',
      title: 'Century collabs & (PRODUCT) RED',
      synopsis:
        'British Vogue noted Converse’s centennial year collaborations with designer John Varvatos and (PRODUCT) RED — “to help assist in the global emergency and epidemic of AIDS, malaria and tuberculosis in Africa.”',
      reference:
        'Ally Pyle / Vogue (26 February 2008) ‘ALL STARS’, British Vogue. Available at: https://www.vogue.co.uk/article/all-stars',
      citation: {
        title: 'ALL STARS',
        url: 'https://www.vogue.co.uk/article/all-stars',
        publisher: 'British Vogue',
        author: 'Ally Pyle',
        publishedAt: '2008-02-26',
      },
      isExactQuote: false,
      storyCluster: 'product-red-2008',
    },
    {
      id: 'cv-2008-cobain-hypebeast',
      date: '2008-03-18',
      precision: 'exact-day',
      title: 'Converse x Kurt Cobain',
      synopsis:
        'Hypebeast reported Converse’s Kurt Cobain collection — notebook artwork, lyric scribbles and distressed wear — across One Star, Chuck Taylor All Star and Jack Purcell, the silhouettes he was often pictured in; retail was slated from May 2008.',
      reference:
        'Hypebeast (18 March 2008) ‘Kurt Cobain Converse Collection’. Available at: https://hypebeast.com/2008/3/kurt-cobain-converse-collection',
      citation: {
        title: 'Kurt Cobain Converse Collection',
        url: 'https://hypebeast.com/2008/3/kurt-cobain-converse-collection',
        publisher: 'Hypebeast',
        publishedAt: '2008-03-18',
      },
      isExactQuote: false,
      storyCluster: 'cobain-converse',
    },
    {
      id: 'cv-2008-cobain-onestar-hbx',
      date: '2008',
      precision: 'year',
      title: 'Cobain and the One Star',
      synopsis:
        'HBX’s One Star history stresses how often Kurt Cobain wore the classic One Star — affirming it as a grunge-era rebellion marker — and notes Converse’s 2008 Kurt Cobain × One Star tribute as part of that silhouette’s street lore.',
      reference:
        'HBX Journal (July 2017) ‘The History Behind the Converse One Star’. Available at: https://hbx.com/journal/2017/7/history-behind-converse-one-star',
      citation: {
        title: 'The History Behind the Converse One Star',
        url: 'https://hbx.com/journal/2017/7/history-behind-converse-one-star',
        publisher: 'HBX',
        publishedAt: '2017-07',
      },
      isExactQuote: false,
      storyCluster: 'cobain-converse',
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
        'Converse History dates the collab to 2009; contemporary press (Interview Magazine, LA Times, FashionNetwork) covered the debut for late August 2009. For the heart-logo Chuck run since 2009 — seasonal restocks, Chuck 70 from 2015, online from 2018 — see Footwear News / WWD (Ian Servantes, 7 Oct 2023).',
      citation: {
        title: 'Converse History',
        url: HISTORY_URL,
        publisher: 'Converse',
      },
      isExactQuote: false,
      storyCluster: 'cdg-play',
    },
    {
      id: 'cv-2009-cdg-wwd',
      date: '2009',
      precision: 'year',
      title: 'Play Comme des Garçons × Converse',
      synopsis:
        'Footwear News traces Play Comme des Garçons × Converse from the 2009 heart-logo Chuck Taylor All Star through Chuck 70 restocks, Pro Leather / Jack Purcell / One Star detours, and the partnership’s shift from Dover Street Market exclusivity to wider online availability in 2018.',
      reference:
        'Ian Servantes / Footwear News via WWD (7 October 2023) ‘A History of Play Comme des Garçon and Converse’s Sneaker Collaborations’. Available at: https://wwd.com/footwear-news/sneaker-news/cdg-converse-play-comme-des-garcon-hearts-sneakers-history-1237702640/',
      citation: {
        title: 'A History of Play Comme des Garçon and Converse’s Sneaker Collaborations',
        url: 'https://wwd.com/footwear-news/sneaker-news/cdg-converse-play-comme-des-garcon-hearts-sneakers-history-1237702640/',
        publisher: 'Footwear News',
        author: 'Ian Servantes',
        publishedAt: '2023-10-07',
      },
      isExactQuote: false,
      storyCluster: 'cdg-play',
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
      id: 'cv-2013-margiela-gq',
      date: '2013-09-04',
      precision: 'exact-day',
      title: 'Converse x Maison Margiela',
      synopsis:
        'GQ revealed Converse × Maison Martin Margiela’s white-painted Chuck Taylor All Stars — a flat-matte coat that chips with wear to show the canvas beneath — with matching Jack Purcell pairs in the First String drop.',
      reference:
        'Mark Byrne / GQ (4 September 2013) ‘GQ Exclusive: Converse x Maison Martin Margiela Revealed’. Available at: https://www.gq.com/story/converse-maison-martin-margiela-collaboration. Corroborated by Teen Vogue (10 Sep 2013), Fast Company (paint / poetry of white; ~20 Sep retail), and Hypebeast First String 2013 release notes.',
      citation: {
        title: 'GQ Exclusive: Converse x Maison Martin Margiela Revealed',
        url: 'https://www.gq.com/story/converse-maison-martin-margiela-collaboration',
        publisher: 'GQ',
        author: 'Mark Byrne',
        publishedAt: '2013-09-04',
      },
      isExactQuote: false,
      storyCluster: 'margiela-paint',
    },
    {
      id: 'cv-2013-margiela-teenvogue',
      date: '2013-09-10',
      precision: 'exact-day',
      title: 'Margiela painted Chucks',
      synopsis:
        'Teen Vogue described the Margiela × Converse paint job as all-out minimalist: white over high-top All Stars and low-top Jack Purcells so wear chips the coat and reveals Converse red, navy, yellow, or black underneath — each pair shaped by how it’s worn.',
      reference:
        'Media Brecher / Teen Vogue (10 September 2013) ‘Maison Martin Margiela Gives Converse the Avant-Garde Treatment’. Available at: https://www.teenvogue.com/story/maison-martin-margiela-converse',
      citation: {
        title: 'Maison Martin Margiela Gives Converse the Avant-Garde Treatment',
        url: 'https://www.teenvogue.com/story/maison-martin-margiela-converse',
        publisher: 'Teen Vogue',
        author: 'Media Brecher',
        publishedAt: '2013-09-10',
      },
      isExactQuote: false,
      storyCluster: 'margiela-paint',
    },
    {
      id: 'cv-2013-margiela-fastco',
      date: '2013-09',
      precision: 'month',
      title: 'Margiela’s white All Stars',
      synopsis:
        'Fast Company reported the Margiela treatment as white paint over Chuck Taylors and Jack Purcells — including a Margiela-exclusive vintage yellow canvas — quoting the Maison’s “poetry” of white and a ~20 September retail window at $200.',
      reference:
        'Fast Company ‘Converse All Stars Get The Margiela Treatment’. Available at: https://www.fastcompany.com/3017816/converse-all-stars-get-the-margiela-treatment. See also Hypebeast First String 2013 release details: https://hypebeast.com/2013/9/maison-martin-margiela-x-converse-first-string-2013-collection-official-release-details',
      citation: {
        title: 'Converse All Stars Get The Margiela Treatment',
        url: 'https://www.fastcompany.com/3017816/converse-all-stars-get-the-margiela-treatment',
        publisher: 'Fast Company',
        publishedAt: '2013-09',
      },
      isExactQuote: false,
      storyCluster: 'margiela-paint',
    },
    {
      id: 'cv-2013-simpsons-complex',
      date: '2013-06-15',
      precision: 'exact-day',
      title: 'Converse x The Simpsons',
      synopsis:
        'Complex covered The Simpsons’ first footwear collab — Chuck Taylor All Stars with character graphics (Homer “D’oh!” / “Woo Hoo!”, Bart’s chalkboard lines, a Family colourway) — releasing 15 June 2013 at Journeys, Converse stores and converse.com.',
      reference:
        'Brennan Hiro Williams / Complex (13 June 2013) ‘The Simpsons x Converse Chuck Taylor All Star Collection’. Available at: https://www.complex.com/sneakers/a/brennan-hiro-williams/the-simpsons-x-converse-chuck-taylor-all-star-collection1',
      citation: {
        title: 'The Simpsons x Converse Chuck Taylor All Star Collection',
        url: 'https://www.complex.com/sneakers/a/brennan-hiro-williams/the-simpsons-x-converse-chuck-taylor-all-star-collection1',
        publisher: 'Complex',
        author: 'Brennan Hiro Williams',
        publishedAt: '2013-06-13',
      },
      isExactQuote: false,
      storyCluster: 'simpsons-converse',
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
      id: 'cv-2015-chuck-ii-adage',
      date: '2015-07-23',
      precision: 'exact-day',
      title: 'Chuck Taylor All Star II',
      synopsis:
        'Ad Age covered Converse’s Chuck Taylor All Star II — the silhouette’s comfort refresh using Nike Lunarlon and related parent-company tech so Chucks could feel more cushioned without abandoning the classic look.',
      reference:
        'Ashley Rodriguez / Ad Age (23 July 2015) ‘Converse Uses Nike Tech to Make Your Chucks a Lot More Comfortable’. Available at: https://adage.com/creativity/work/nike-tech-infused-chuck-taylor-all-star-ii/42820/',
      citation: {
        title: 'Converse Uses Nike Tech to Make Your Chucks a Lot More Comfortable',
        url: 'https://adage.com/creativity/work/nike-tech-infused-chuck-taylor-all-star-ii/42820/',
        publisher: 'Ad Age',
        author: 'Ashley Rodriguez',
        publishedAt: '2015-07-23',
      },
      isExactQuote: false,
      storyCluster: 'chuck-ii-nike-tech',
    },
    {
      id: 'cv-2015-chuck-ii-bof',
      date: '2015-07-23',
      precision: 'exact-day',
      title: 'Chucks that feel like Nikes',
      synopsis:
        'Business of Fashion / Bloomberg-era coverage framed the Chuck II as Converse answering a century of sore feet by importing Nike Lunarlon cushioning — the clearest product story of how Nike ownership changed Chuck engineering.',
      reference:
        'The Business of Fashion ‘After a Billion Sore Feet, Converse Wants Chucks to Feel Like Nikes’ (23 July 2015). Available at: https://www.businessoffashion.com/news/news-analysis/after-a-billion-sore-feet-converse-wants-chucks-to-feel-like-nikes/',
      citation: {
        title: 'After a Billion Sore Feet, Converse Wants Chucks to Feel Like Nikes',
        url: 'https://www.businessoffashion.com/news/news-analysis/after-a-billion-sore-feet-converse-wants-chucks-to-feel-like-nikes/',
        publisher: 'The Business of Fashion',
        publishedAt: '2015-07-23',
      },
      isExactQuote: false,
      storyCluster: 'chuck-ii-nike-tech',
    },
    {
      id: 'cv-2017-tyler-gq',
      date: '2017-08-03',
      precision: 'exact-day',
      title: 'GOLF le FLEUR* One Star',
      synopsis:
        'GQ covered Tyler, the Creator’s early Converse One Star “Golf Le Fleur” colourways — pink, yellow, blue, purple suede with the flower logo around the star, Flower Boy insoles, and a midsole manifesto — dropping 3 August 2017 after the first wave sold out.',
      reference:
        'Jake Woolf / GQ (27 July 2017) ‘Tyler, the Creator’s New Converse Sneakers Are as Bright and Happy as He Is’. Available at: https://www.gq.com/story/tyler-the-creator-new-converse-sneakers',
      citation: {
        title: 'Tyler, the Creator’s New Converse Sneakers Are as Bright and Happy as He Is',
        url: 'https://www.gq.com/story/tyler-the-creator-new-converse-sneakers',
        publisher: 'GQ',
        author: 'Jake Woolf',
        publishedAt: '2017-07-27',
      },
      isExactQuote: false,
      storyCluster: 'tyler-golf-le-fleur',
    },
    {
      id: 'cv-2018-abloh-forbes',
      date: '2018-04-30',
      precision: 'exact-day',
      title: 'Converse x Virgil Abloh',
      synopsis:
        'Forbes covered Virgil Abloh’s translucent “Ghosting” Chuck 70 — red cable tie, “shoelaces” printed laces, “vulcanized” on the foxing — as the Converse chapter of Abloh’s Nike “The Ten” series, which also rebuilt other Nike icons after Nike’s 2003 Converse acquisition.',
      reference:
        'Declan Eytan / Forbes (30 April 2018) ‘Virgil Abloh and Converse Collaborate on Limited Edition Sneaker’. Available at: https://www.forbes.com/sites/declaneytan/2018/04/30/virgil-abloh-and-converse-collaborate-on-limited-edition-sneaker/',
      citation: {
        title: 'Virgil Abloh and Converse Collaborate on Limited Edition Sneaker',
        url: 'https://www.forbes.com/sites/declaneytan/2018/04/30/virgil-abloh-and-converse-collaborate-on-limited-edition-sneaker/',
        publisher: 'Forbes',
        author: 'Declan Eytan',
        publishedAt: '2018-04-30',
      },
      isExactQuote: false,
      storyCluster: 'abloh-the-ten',
    },
    {
      id: 'cv-2018-abloh-hypebeast',
      date: '2018-05',
      precision: 'month',
      title: 'Abloh Chuck 70 — The Ten',
      synopsis:
        'Hypebeast’s closer look at the Converse × Virgil Abloh Chuck 70 framed the Ghosted upper and text-as-detail treatment inside “The Ten” — Abloh’s Off-White reworks of Nike-family icons, with the Chuck 70 as Converse’s seat at that table.',
      reference:
        'Hypebeast (May 2018) ‘Converse Virgil Abloh Chuck 70 The Ten Closer Look’. Available at: https://hypebeast.com/2018/5/converse-virgil-abloh-chuck-70-the-ten-closer-look',
      citation: {
        title: 'Converse Virgil Abloh Chuck 70 The Ten Closer Look',
        url: 'https://hypebeast.com/2018/5/converse-virgil-abloh-chuck-70-the-ten-closer-look',
        publisher: 'Hypebeast',
        publishedAt: '2018-05',
      },
      isExactQuote: false,
      storyCluster: 'abloh-the-ten',
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
      id: 'cv-2019-all-star-pro-bb-forbes',
      date: '2019-04-18',
      precision: 'exact-day',
      title: 'All Star Pro BB — back to performance',
      synopsis:
        'Forbes covered Converse’s 2019 return to performance basketball with the All Star Pro BB — a modern reimagining of the Non-Skid / All Star court lineage, built with Nike design leadership (Eric Avar) and materials such as Quadfit mesh and React foam, while nodding to Weapon via the Star Chevron. Kelly Oubre Jr. was the signed athlete at launch; the shoe tied the lifestyle Chuck’s street power back to on-court performance.',
      reference:
        'Tim Newcomb / Forbes (18 April 2019) ‘Converse Returns To Performance Basketball With History Reimagined’. Available at: https://www.forbes.com/sites/timnewcomb/2019/04/18/converse-returns-to-performance-basketball-with-history-reimagined/',
      citation: {
        title: 'Converse Returns To Performance Basketball With History Reimagined',
        url: 'https://www.forbes.com/sites/timnewcomb/2019/04/18/converse-returns-to-performance-basketball-with-history-reimagined/',
        publisher: 'Forbes',
        author: 'Tim Newcomb',
        publishedAt: '2019-04-18',
      },
      isExactQuote: false,
      storyCluster: 'all-star-pro-bb',
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
      id: 'cv-2021-lofficiel-film',
      date: '2021-03-24',
      precision: 'exact-day',
      title: 'Chucks on screen',
      synopsis:
        'L’Officiel USA surveyed iconic Converse moments in film and TV — from Marty McFly’s skate shoes to Marie Antoinette’s on-screen Chucks — useful desk colour for screen-culture angles.',
      reference:
        'Orquídea Alburquerque / L’Officiel USA (24 March 2021) ‘9 Iconic Converse Moments in Film and TV History’. Available at: https://www.lofficielusa.com/film-tv/converse-movie-moments-marie-antoinette',
      citation: {
        title: '9 Iconic Converse Moments in Film and TV History',
        url: 'https://www.lofficielusa.com/film-tv/converse-movie-moments-marie-antoinette',
        publisher: "L'Officiel USA",
        author: 'Orquídea Alburquerque',
        publishedAt: '2021-03-24',
      },
      isExactQuote: false,
    },
    {
      id: 'cv-2021-tatler-iconic',
      date: '2021-09-06',
      precision: 'exact-day',
      title: 'Iconic closet staples (Tatler Asia)',
      synopsis:
        'Tatler Asia’s 2021 round-up ranked cult Converse staples — Non-Skid roots, Chuck 70, classic All Star, CDG PLAY hearts, Pro Leather, Fear of God ESSENTIALS, Run Star Hike, Kim Jones and Keith Haring — as wardrobe icons rather than one silhouette alone.',
      reference:
        'Tatler Asia (6 September 2021) ‘10 Of The Most Iconic Converse Sneakers To Have In Your Closet’. Available at: https://www.tatlerasia.com/style/fashion/sneaker-series-most-iconic-converse-shoes',
      citation: {
        title: '10 Of The Most Iconic Converse Sneakers To Have In Your Closet',
        url: 'https://www.tatlerasia.com/style/fashion/sneaker-series-most-iconic-converse-shoes',
        publisher: 'Tatler Asia',
        publishedAt: '2021-09-06',
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
      id: 'cv-2022-urban-industry',
      date: '2022-09-05',
      precision: 'exact-day',
      title: 'A brief All Star history (Urban Industry)',
      synopsis:
        'Urban Industry’s overview traces the All Star from court shoe to punk, rock, hip-hop and indie staple, then Nike-era heritage revival after the 2003 acquisition — useful narrative colour; defer to Converse History on contested signature / join years.',
      reference:
        'Urban Industry (5 September 2022; updated 29 May 2026) ‘A Brief History of the Converse Chuck Taylor All Star’. Available at: https://www.urbanindustry.co.uk/blogs/news/a-brief-history-of-the-converse-chuck-taylor-all-star',
      citation: {
        title: 'A Brief History of the Converse Chuck Taylor All Star',
        url: 'https://www.urbanindustry.co.uk/blogs/news/a-brief-history-of-the-converse-chuck-taylor-all-star',
        publisher: 'Urban Industry',
        publishedAt: '2022-09-05',
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
      id: 'cv-2021-rick-owens-surface',
      date: '2021-07-22',
      precision: 'exact-day',
      title: 'Converse x Rick Owens DRKSHDW',
      synopsis:
        'Surface covered Rick Owens’s DRKSHDW × Converse TURBODRK Chuck 70 — square-toe bumper, dramatically extended tongue, punk knee-high nod — shown at Paris Men’s, with retail from 27 July 2021; Owens called earlier SS14 Ramones Chucks a “louder and dumber” precursor.',
      reference:
        'Ryan Waddoups / Surface (22 July 2021) ‘Rick Owens Radically Reshapes the Converse Chuck 70’. Available at: https://www.surfacemag.com/articles/rick-owens-converse-chuck-70-collaboration/',
      citation: {
        title: 'Rick Owens Radically Reshapes the Converse Chuck 70',
        url: 'https://www.surfacemag.com/articles/rick-owens-converse-chuck-70-collaboration/',
        publisher: 'Surface',
        author: 'Ryan Waddoups',
        publishedAt: '2021-07-22',
      },
      isExactQuote: false,
      storyCluster: 'rick-owens-turbodrk',
    },
    {
      id: 'cv-2021-rick-owens-designboom',
      date: '2021-01-28',
      precision: 'exact-day',
      title: 'TURBODRK Chuck 70 debut',
      synopsis:
        'designboom reported the TURBODRK Chuck 70’s Venice / Lido Fall 2021 debut — Owens squaring the toe and extending the tongue for the first time in the silhouette’s century, tying the black-and-white Chuck to punk subculture.',
      reference:
        'Juliana Neira / designboom (28 January 2021) ‘rick owens reshapes the converse chuck 70 with a square-toe execution’. Available at: https://www.designboom.com/design/converse-x-rick-owens-turbodork-chuck-70-01-28-2021/',
      citation: {
        title: 'rick owens reshapes the converse chuck 70 with a square-toe execution',
        url: 'https://www.designboom.com/design/converse-x-rick-owens-turbodork-chuck-70-01-28-2021/',
        publisher: 'designboom',
        author: 'Juliana Neira',
        publishedAt: '2021-01-28',
      },
      isExactQuote: false,
      storyCluster: 'rick-owens-turbodrk',
    },
    {
      id: 'cv-2021-rick-owens-gq-uk',
      date: '2021-07-27',
      precision: 'exact-day',
      title: 'Square-toe TURBODRK retail',
      synopsis:
        'British GQ framed the DRKSHDW × Converse TURBODRK Chuck 70 as square-toe trainers entering the mainstream — high and low, black/white plus a white colourway — on sale 27 July 2021 after the digital Paris show buzz.',
      reference:
        'Zak Maoui / British GQ (27 July 2021) ‘Are square-toe trainers the future? Rick Owens and Converse say yes’. Available at: https://www.gq-magazine.co.uk/fashion/article/rick-owens-converse-drkshdw-turbodrk-chuck-70',
      citation: {
        title: 'Are square-toe trainers the future? Rick Owens and Converse say yes',
        url: 'https://www.gq-magazine.co.uk/fashion/article/rick-owens-converse-drkshdw-turbodrk-chuck-70',
        publisher: 'British GQ',
        author: 'Zak Maoui',
        publishedAt: '2021-07-27',
      },
      isExactQuote: false,
      storyCluster: 'rick-owens-turbodrk',
    },
    {
      id: 'cv-2021-rick-owens-gq-satan',
      date: '2021-08-06',
      precision: 'exact-day',
      title: 'TURBODRK pentagram fuss',
      synopsis:
        'GQ covered the online boycott storm after DRKSHDW’s pentagram imagery appeared with the TURBODRK — Owens’s long-running geometric / “alternative system” motif — while Converse stressed it was the designer’s logo, not a brand religious statement.',
      reference:
        'Rachel Tashjian / GQ (6 August 2021) ‘Is the Sneaker Industry in Bed With Satan?’. Available at: https://www.gq.com/story/rick-owens-converse-satan-controversy',
      citation: {
        title: 'Is the Sneaker Industry in Bed With Satan?',
        url: 'https://www.gq.com/story/rick-owens-converse-satan-controversy',
        publisher: 'GQ',
        author: 'Rachel Tashjian',
        publishedAt: '2021-08-06',
      },
      isExactQuote: false,
      storyCluster: 'rick-owens-turbodrk',
    },
    {
      id: 'cv-2024-billie-si',
      date: '2024-10-17',
      precision: 'exact-day',
      title: 'Billie Eilish By You',
      synopsis:
        'Converse and Billie Eilish opened a seven-day By You experience on 17 October 2024 — custom Chuck Taylor All Star and Lift styles with Hit Me Hard and Soft lyrics, Blosh embroidery, and other insignia from her world.',
      reference:
        'Pat Benson / Sports Illustrated Kicks On SI (16 October 2024) ‘Billie Eilish & Converse Unveil Custom Chuck Taylor Experience’. Available at: https://www.si.com/fannation/sneakers/off-court/billie-eilish-converse-unveil-custom-chuck-taylor-experience',
      citation: {
        title: 'Billie Eilish & Converse Unveil Custom Chuck Taylor Experience',
        url: 'https://www.si.com/fannation/sneakers/off-court/billie-eilish-converse-unveil-custom-chuck-taylor-experience',
        publisher: 'Sports Illustrated',
        author: 'Pat Benson',
        publishedAt: '2024-10-16',
      },
      isExactQuote: false,
      storyCluster: 'billie-eilish-by-you',
    },
    {
      id: 'cv-2024-billie-verge',
      date: '2024-10-17',
      precision: 'exact-day',
      title: 'Billie By You custom Chucks',
      synopsis:
        'Verge Magazine covered the Converse × Billie Eilish By You window — white / black / egret uppers, lyric midsoles, One Box shipping — exclusive for seven days from 17 October 2024 on Converse.com (US EST / Western Europe CET).',
      reference:
        'Taye Rowland-Dixon / Verge Magazine (18 October 2024) ‘Converse Celebrates the Creative Genius of Billie Eilish with Custom Chuck Taylor “By You” Experience’. Available at: https://vergemagazine.co.uk/converse-celebrates-the-creative-genius-of-billie-eilish-with-custom-chuck-taylor-by-you-experience/',
      citation: {
        title:
          'Converse Celebrates the Creative Genius of Billie Eilish with Custom Chuck Taylor “By You” Experience',
        url: 'https://vergemagazine.co.uk/converse-celebrates-the-creative-genius-of-billie-eilish-with-custom-chuck-taylor-by-you-experience/',
        publisher: 'Verge Magazine',
        author: 'Taye Rowland-Dixon',
        publishedAt: '2024-10-18',
      },
      isExactQuote: false,
      storyCluster: 'billie-eilish-by-you',
    },
    {
      id: 'cv-2024-billie-highxtar',
      date: '2024-10-17',
      precision: 'exact-day',
      title: 'Billie Eilish Chuck By You',
      synopsis:
        'HIGHXTAR framed the Billie Eilish × Converse By You drop as a customisable Chuck Taylor All Star / Lift collaboration timed to Hit Me Hard and Soft — limited to seven days on converse.com.',
      reference:
        'Mar Piera / HIGHXTAR (17 October 2024) ‘Billie Eilish revolutionises Converse’s Chuck silhouette with ‘By You’’. Available at: https://highxtar.com/en/billie-eilish-revolutionises-converses-chuck-silhouette-with-by-you/',
      citation: {
        title: 'Billie Eilish revolutionises Converse’s Chuck silhouette with ‘By You’',
        url: 'https://highxtar.com/en/billie-eilish-revolutionises-converses-chuck-silhouette-with-by-you/',
        publisher: 'HIGHXTAR',
        author: 'Mar Piera',
        publishedAt: '2024-10-17',
      },
      isExactQuote: false,
      storyCluster: 'billie-eilish-by-you',
    },
    {
      id: 'cv-2025-tyler-vogue',
      date: '2025-05-27',
      precision: 'exact-day',
      title: 'Tyler, the Creator × Converse',
      synopsis:
        'British Vogue interviewed Tyler, the Creator on his long Converse partnership ahead of the archive-led 1908 collection — his 20th with the brand after roughly nine years — reworking deck trainers and joggers through a Golf le Fleur lens for a 20 June 2025 launch.',
      reference:
        'Riann Phillip / British Vogue (27 May 2025) ‘“This Is The Only Thing I Was Supposed To Do”: Tyler, The Creator On Delusion, Gatekeeping And His Latest Collab With Converse’. Available at: https://www.vogue.co.uk/article/tyler-the-creator-converse-interview',
      citation: {
        title:
          '“This Is The Only Thing I Was Supposed To Do”: Tyler, The Creator On Delusion, Gatekeeping And His Latest Collab With Converse',
        url: 'https://www.vogue.co.uk/article/tyler-the-creator-converse-interview',
        publisher: 'British Vogue',
        author: 'Riann Phillip',
        publishedAt: '2025-05-27',
      },
      isExactQuote: false,
      storyCluster: 'tyler-golf-le-fleur',
    },
    {
      id: 'cv-2025-tyler-1908-highsno',
      date: '2025-06-20',
      precision: 'exact-day',
      title: '1908 Program',
      synopsis:
        'Highsnobiety covered Converse × Tyler’s 1908 Program — archival Coach Jogger (1976 Olympic runner) and Naut-1 (1971) silhouettes reimagined with le FLEUR* script, colour blocking, and Darryl dog motifs — retail 20 June 2025.',
      reference:
        'Tayler Adigun / Highsnobiety ‘Leave It to Tyler the Creator to Make the Coolest Converse In Years’. Available at: https://www.highsnobiety.com/p/leave-it-to-tyler-the-creator-to-make-the-coolest-converse-in-years/',
      citation: {
        title: 'Leave It to Tyler the Creator to Make the Coolest Converse In Years',
        url: 'https://www.highsnobiety.com/p/leave-it-to-tyler-the-creator-to-make-the-coolest-converse-in-years/',
        publisher: 'Highsnobiety',
        author: 'Tayler Adigun',
        publishedAt: '2025-06',
      },
      isExactQuote: false,
      storyCluster: 'tyler-golf-le-fleur',
    },
    {
      id: 'cv-2025-stranger-things',
      date: '2025-12-04',
      precision: 'exact-day',
      title: 'Converse x Stranger Things',
      synopsis:
        'Nike Newsroom announced a Nike × Converse × Netflix Stranger Things pack ahead of the show’s final season — including a Chuck 70 with WSQK radio graphics and a Weapon colourway — a later film/TV collab example beside earlier packs like The Simpsons (not a house-defining fashion moment).',
      reference:
        'Nike Newsroom (20 November 2025) ‘Nike and Converse Enter the Upside Down With New Stranger Things Collection’ (global retail 4 December 2025). Available at: https://about.nike.com/en/newsroom/releases/nike-converse-stranger-things-collection-official-images',
      citation: {
        title: 'Nike and Converse Enter the Upside Down With New Stranger Things Collection',
        url: 'https://about.nike.com/en/newsroom/releases/nike-converse-stranger-things-collection-official-images',
        publisher: 'Nike',
        publishedAt: '2025-11-20',
      },
      isExactQuote: false,
      storyCluster: 'stranger-things-converse',
    },
    {
      id: 'cv-2025-vaquera-highsnobiety',
      date: '2025-03-03',
      precision: 'exact-day',
      title: 'Converse x Vaquera',
      synopsis:
        'Highsnobiety covered Vaquera’s barely-recognisable Chuck — a pile of adjustable canvas that pulls up like a boot or slumps slouchy, with a hidden wedge — an experimental fashion distortion in the same lane as Rick Owens’s TURBODRK rather than a logo slap.',
      reference:
        'Jake Silbert / Highsnobiety ‘Vaquera’s Converse Chuck Is a Giant, Transforming Boot’ (PFW debut 3 March 2025). Available at: https://www.highsnobiety.com/p/vaquera-converse-sneaker/',
      citation: {
        title: "Vaquera's Converse Chuck Is a Giant, Transforming Boot",
        url: 'https://www.highsnobiety.com/p/vaquera-converse-sneaker/',
        publisher: 'Highsnobiety',
        author: 'Jake Silbert',
        publishedAt: '2025-03-03',
      },
      isExactQuote: false,
      storyCluster: 'vaquera-chuck',
    },
    {
      id: 'cv-2025-vaquera-nike',
      date: '2025-11-05',
      precision: 'exact-day',
      title: 'Vaquera Slouch Wedge Chucks',
      synopsis:
        'Nike Newsroom framed the Converse × Vaquera XXXHi and XHi Slouch Wedge — laceless, supersized uppers over hidden wedges in waxed canvas — as the first chapter of a broader NIKE, Inc. × Vaquera partnership (retail from 8–11 November 2025).',
      reference:
        'Nike Newsroom (5 November 2025) ‘Nike and Converse Begin Vaquera Partnership with Two Bold Expressions of the Chuck Taylor All Star’. Available at: https://about.nike.com/en-GB/newsroom/releases/nike-and-converse-begin-vaquera-partnership-with-two-bold-expressions-of-the-chuck-taylor-all-star',
      citation: {
        title: 'Nike and Converse Begin Vaquera Partnership with Two Bold Expressions of the Chuck Taylor All Star',
        url: 'https://about.nike.com/en-GB/newsroom/releases/nike-and-converse-begin-vaquera-partnership-with-two-bold-expressions-of-the-chuck-taylor-all-star',
        publisher: 'Nike',
        publishedAt: '2025-11-05',
      },
      isExactQuote: false,
      storyCluster: 'vaquera-chuck',
    },
])

export { HISTORY_URL as CONVERSE_HISTORY_CITE_URL }
