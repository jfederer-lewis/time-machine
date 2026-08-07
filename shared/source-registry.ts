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
  {
    host: 'reddit.com',
    label: 'Reddit',
    tier: 'blocked',
    role: 'blocked',
    notes: 'Forum / UGC — not a citable cultural publisher.',
  },
  {
    host: 'old.reddit.com',
    label: 'Reddit',
    tier: 'blocked',
    role: 'blocked',
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
  { host: 'hoophall.com', label: 'Naismith Basketball Hall of Fame', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'smithsonianmag.com', label: 'Smithsonian Magazine', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'vam.ac.uk', label: 'V&A', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'moma.org', label: 'MoMA', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'metmuseum.org', label: 'The Met', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'tate.org.uk', label: 'Tate', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'britishmuseum.org', label: 'British Museum', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'guggenheim.org', label: 'Guggenheim', tier: 'A', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'whitney.org', label: 'Whitney Museum', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'nga.gov', label: 'National Gallery of Art', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'nationalgallery.org.uk', label: 'National Gallery', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'artic.edu', label: 'Art Institute of Chicago', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'sfmoma.org', label: 'SFMOMA', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'lacma.org', label: 'LACMA', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'rijksmuseum.nl', label: 'Rijksmuseum', tier: 'A', regions: ['NL'], role: 'citation' },
  { host: 'designmuseum.org', label: 'Design Museum', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'fashionmuseum.co.uk', label: 'Fashion Museum Bath', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'fitnyc.edu', label: 'FIT / Fashion Institute of Technology', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'museumatfit.com', label: 'The Museum at FIT', tier: 'A', regions: ['US'], role: 'citation' },
  { host: 'palaisgalliera.paris.fr', label: 'Palais Galliera', tier: 'A', regions: ['FR'], role: 'citation' },
  { host: 'madparis.fr', label: 'Musée des Arts Décoratifs', tier: 'A', regions: ['FR'], role: 'citation' },
  { host: 'kci.or.jp', label: 'Kyoto Costume Institute', tier: 'A', regions: ['JP'], role: 'citation' },
  { host: 'europeana.eu', label: 'Europeana', tier: 'A', regions: ['EU', 'GLOBAL'], role: 'citation', notes: 'Prefer item / exhibition records about the claim.' },
  { host: 'fashionheritage.eu', label: 'European Fashion Heritage', tier: 'A', regions: ['EU'], role: 'citation' },
  { host: 'cfda.com', label: 'CFDA', tier: 'A', regions: ['US'], role: 'citation', notes: 'Trade body — claim-relevant announcements / archives only.' },
  { host: 'britishfashioncouncil.co.uk', label: 'British Fashion Council', tier: 'A', regions: ['UK'], role: 'citation' },
  { host: 'londonfashionweek.co.uk', label: 'London Fashion Week', tier: 'A', regions: ['UK'], role: 'citation' },

  // Tier B — papers / wires
  { host: 'nytimes.com', label: 'The New York Times', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'timesmachine.nytimes.com', label: 'NYT TimesMachine', tier: 'B', regions: ['US'], role: 'citation', notes: 'Cite specific issues/articles, not the browser shell alone.' },
  { host: 'theguardian.com', label: 'The Guardian', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'telegraph.co.uk', label: 'The Telegraph', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'independent.co.uk', label: 'The Independent', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'reuters.com', label: 'Reuters', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'apnews.com', label: 'Associated Press', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'afp.com', label: 'AFP', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'bbc.co.uk', label: 'BBC', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation', notes: 'Prefer article URLs over On This Day index pages.' },
  { host: 'bbc.com', label: 'BBC', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'ft.com', label: 'Financial Times', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'washingtonpost.com', label: 'The Washington Post', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'latimes.com', label: 'Los Angeles Times', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'newyorker.com', label: 'The New Yorker', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'theatlantic.com', label: 'The Atlantic', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'time.com', label: 'TIME', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'vanityfair.com', label: 'Vanity Fair', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'lemonde.fr', label: 'Le Monde', tier: 'B', regions: ['FR'], role: 'citation' },
  { host: 'asahi.com', label: 'Asahi Shimbun', tier: 'B', regions: ['JP'], role: 'citation' },
  { host: 'nikkei.com', label: 'Nikkei', tier: 'B', regions: ['JP'], role: 'citation' },
  { host: 'scmp.com', label: 'South China Morning Post', tier: 'B', regions: ['HK', 'ASIA'], role: 'citation' },
  { host: 'thehindu.com', label: 'The Hindu', tier: 'B', regions: ['IN'], role: 'citation' },
  { host: 'indianexpress.com', label: 'The Indian Express', tier: 'B', regions: ['IN'], role: 'citation' },
  { host: 'smh.com.au', label: 'Sydney Morning Herald', tier: 'B', regions: ['AU'], role: 'citation' },
  { host: 'theage.com.au', label: 'The Age', tier: 'B', regions: ['AU'], role: 'citation' },

  // Tier B — fashion / culture press (claim-relevant articles only; not Reddit / forums / pure commerce dumps)
  { host: 'vogue.co.uk', label: 'British Vogue', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'vogue.com', label: 'Vogue', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'teenvogue.com', label: 'Teen Vogue', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'vogue.fr', label: 'Vogue France', tier: 'B', regions: ['FR'], role: 'citation' },
  { host: 'vogue.it', label: 'Vogue Italia', tier: 'B', regions: ['IT'], role: 'citation' },
  { host: 'vogue.de', label: 'Vogue Germany', tier: 'B', regions: ['DE'], role: 'citation' },
  { host: 'vogue.es', label: 'Vogue España', tier: 'B', regions: ['ES'], role: 'citation' },
  { host: 'vogue.jp', label: 'Vogue Japan', tier: 'B', regions: ['JP'], role: 'citation' },
  { host: 'vogue.com.au', label: 'Vogue Australia', tier: 'B', regions: ['AU'], role: 'citation' },
  { host: 'vogue.in', label: 'Vogue India', tier: 'B', regions: ['IN'], role: 'citation' },
  { host: 'vogue.me', label: 'Vogue Arabia', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'vogue.sg', label: 'Vogue Singapore', tier: 'B', regions: ['ASIA'], role: 'citation' },
  { host: 'vogue.hk', label: 'Vogue Hong Kong', tier: 'B', regions: ['HK', 'ASIA'], role: 'citation' },
  { host: 'vogue.mx', label: 'Vogue México', tier: 'B', regions: ['MX'], role: 'citation' },
  { host: 'vogue.pt', label: 'Vogue Portugal', tier: 'B', regions: ['PT'], role: 'citation' },
  { host: 'vogue.ua', label: 'Vogue Ukraine', tier: 'B', regions: ['UA'], role: 'citation' },
  { host: 'voguescandinavia.com', label: 'Vogue Scandinavia', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'dazeddigital.com', label: 'Dazed', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'i-d.co', label: 'i-D', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'anothermag.com', label: 'Another Magazine', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'nowness.com', label: 'NOWNESS', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'system-magazine.com', label: 'System Magazine', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'highsnobiety.com', label: 'Highsnobiety', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'hypebeast.com', label: 'Hypebeast', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'wwd.com', label: "Women's Wear Daily", tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'businessoffashion.com', label: 'The Business of Fashion', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'footwearnews.com', label: 'Footwear News', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'yahoo.com', label: 'Yahoo', tier: 'B', regions: ['GLOBAL'], role: 'citation', notes: 'Prefer original publisher when syndicated (e.g. Footwear News); claim-relevant lifestyle/fashion only.' },
  { host: 'harpersbazaar.com', label: "Harper's Bazaar", tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'harpersbazaar.com.au', label: "Harper's Bazaar Australia", tier: 'B', regions: ['AU'], role: 'citation' },
  { host: 'harpersbazaar.co.uk', label: "Harper's Bazaar UK", tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'elle.com', label: 'ELLE', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'elleuk.com', label: 'ELLE UK', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'gq.com', label: 'GQ', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'gq-magazine.co.uk', label: 'British GQ', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'esquire.com', label: 'Esquire', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'esquireme.com', label: 'Esquire Middle East', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'tatler.com', label: 'Tatler', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'tatlerasia.com', label: 'Tatler Asia', tier: 'B', regions: ['ASIA', 'GLOBAL'], role: 'citation' },
  { host: 'lofficielusa.com', label: "L'Officiel USA", tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'lofficiel.com', label: "L'Officiel", tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'wallpaper.com', label: 'Wallpaper*', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'frieze.com', label: 'Frieze', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'artforum.com', label: 'Artforum', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'interviewmagazine.com', label: 'Interview', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'rollingstone.com', label: 'Rolling Stone', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'pitchfork.com', label: 'Pitchfork', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'nme.com', label: 'NME', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'thefader.com', label: 'The FADER', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'forbes.com', label: 'Forbes', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation', notes: 'Prefer reported features over listicle / affiliate dumps.' },
  // Fashion journalism / trade / indie press
  { host: 'voguebusiness.com', label: 'Vogue Business', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'wmagazine.com', label: 'W Magazine', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'thecut.com', label: 'The Cut', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'nymag.com', label: 'New York Magazine', tier: 'B', regions: ['US'], role: 'citation' },
  { host: 'fashionista.com', label: 'Fashionista', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'fashionnetwork.com', label: 'FashionNetwork', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'fashionunited.com', label: 'FashionUnited', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'showstudio.com', label: 'SHOWstudio', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'theface.com', label: 'The Face', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'hungertv.com', label: 'Hunger', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: '10magazine.com', label: '10 Magazine', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'hero-magazine.com', label: 'Hero Magazine', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'wonderlandmagazine.com', label: 'Wonderland', tier: 'B', regions: ['UK', 'GLOBAL'], role: 'citation' },
  { host: 'documentjournal.com', label: 'Document Journal', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: '032c.com', label: '032c', tier: 'B', regions: ['DE', 'GLOBAL'], role: 'citation' },
  { host: 'numero.com', label: 'Numéro', tier: 'B', regions: ['FR', 'GLOBAL'], role: 'citation' },
  { host: 'purple.fr', label: 'Purple', tier: 'B', regions: ['FR', 'GLOBAL'], role: 'citation' },
  { host: 'models.com', label: 'Models.com', tier: 'B', regions: ['GLOBAL'], role: 'citation', notes: 'Industry coverage — prefer reported features over casting dumps.' },
  { host: 'whowhatwear.com', label: 'Who What Wear', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'refinery29.com', label: 'Refinery29', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation', notes: 'Prefer reported culture features over affiliate shopping posts.' },
  { host: 'marieclaire.com', label: "Marie Claire", tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'marieclaire.co.uk', label: "Marie Claire UK", tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'graziamagazine.com', label: 'Grazia', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'graziadaily.co.uk', label: 'Grazia UK', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'stylist.co.uk', label: 'Stylist', tier: 'B', regions: ['UK'], role: 'citation' },
  { host: 'fashionjournal.com.au', label: 'Fashion Journal', tier: 'B', regions: ['AU'], role: 'citation' },
  { host: 'russh.com', label: 'RUSSH', tier: 'B', regions: ['AU', 'GLOBAL'], role: 'citation' },
  { host: 'complex.com', label: 'Complex', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation', notes: 'Prefer reported fashion / culture features.' },
  { host: 'sneakernews.com', label: 'Sneaker News', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'nicekicks.com', label: 'Nice Kicks', tier: 'B', regions: ['US', 'GLOBAL'], role: 'citation' },
  { host: 'hypebae.com', label: 'Hypebae', tier: 'B', regions: ['GLOBAL'], role: 'citation' },
  { host: 'ssense.com', label: 'SSENSE', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Editorial essays OK; commerce product pages are weak cites.' },
  { host: 'net-a-porter.com', label: 'NET-A-PORTER', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Magazine / editorial features only — not PDP commerce URLs.' },
  { host: 'mrporter.com', label: 'MR PORTER', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Journal / editorial features only — not PDP commerce URLs.' },
  {
    host: 'urbanindustry.co.uk',
    label: 'Urban Industry',
    tier: 'C',
    regions: ['UK'],
    role: 'citation',
    notes: 'Retail journal — secondary colour only; defer to Converse History on contested dates (e.g. signature year).',
  },

  // Tier C / bridge
  { host: 'britannica.com', label: 'Encyclopaedia Britannica', tier: 'C', regions: ['GLOBAL'], role: 'citation' },
  { host: 'converse.com', label: 'Converse', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Brand claims only.' },
  { host: 'about.nike.com', label: 'Nike', tier: 'C', regions: ['GLOBAL'], role: 'citation', notes: 'Brand claims only — e.g. Nike Magazine Chuck history features.' },
  {
    host: 'wikipedia.org',
    label: 'Wikipedia',
    tier: 'bridge',
    regions: ['GLOBAL'],
    role: 'gloss-bridge',
    notes: 'Discovery + glosses; upgrade to underlying primary / footnote hosts when possible. Useful for Chuck Taylor All-Stars overview + backlinks.',
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
  | 'nyt-archive'
  | 'guardian'
  | 'perplexity-search'
  | 'chronicling-america'
  | 'gemini'
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

  // Skip publishedDisplay when it only repeats the year already in (YYYY).
  const publishedBit = publishedDisplayBit(input.publishedDisplay, year)

  return `${authorBit} '${input.title}', ${input.publisher}${publishedBit}. Available at: ${input.url}`
}

function publishedDisplayBit(publishedDisplay: string | undefined, year: string): string {
  if (!publishedDisplay?.trim()) return ''
  const raw = publishedDisplay.trim()

  // Year-only or ISO year-only → already covered by (YYYY)
  if (/^\d{4}$/.test(raw) || raw === year) return ''

  // ISO day → human date; if that still collapses to the year alone, omit
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const display = toDisplayDate(raw)
    if (display === year) return ''
    return `, ${display}`
  }

  if (/^\d{4}-\d{2}$/.test(raw)) {
    const display = toDisplayDate(raw)
    if (display === year) return ''
    return `, ${display}`
  }

  // "April 1, 1999" / "1 April 1999" still useful as a day stamp beside (1999)
  return `, ${raw}`
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
