/**
 * Slim Bloom-style gloss attach for claim cards.
 * Prefer Wikipedia summary; silence over weak AI glosses.
 */

import type { CulturalEvent, Gloss } from '../../shared/provenance'
import { fetchWikipediaSummary } from '../providers/wikipedia-summary'
import { firstSentence, clipToCompleteSentences } from './clean-text'

const STOP = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'via',
  'with',
  'without',
  'was',
  'were',
  'is',
  'are',
  'be',
  'been',
  'being',
  'that',
  'this',
  'these',
  'those',
  'when',
  'where',
  'which',
  'who',
  'whom',
  'whose',
  'after',
  'before',
  'during',
  'while',
  'about',
  'over',
  'under',
  'between',
  'through',
  'against',
  'near',
  'upon',
  'within',
  'without',
  'across',
  'around',
  'among',
  'along',
  'following',
  'including',
  'such',
  'than',
  'then',
  'also',
  'only',
  'just',
  'not',
  'no',
  'nor',
  'but',
  'so',
  'if',
  'because',
  'although',
  'though',
  'until',
  'unless',
  'once',
  'year',
  'years',
  'day',
  'days',
  'month',
  'months',
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
])

/**
 * Everyday geography / weather / concepts a general reader already knows.
 * Prefer silence over a dotted underline on "United States" or "tornadoes".
 */
const TOO_OBVIOUS = new Set([
  'united states',
  'united states of america',
  'u.s.',
  'u.s.a.',
  'usa',
  'america',
  'united kingdom',
  'great britain',
  'england',
  'scotland',
  'wales',
  'france',
  'germany',
  'italy',
  'spain',
  'canada',
  'mexico',
  'australia',
  'china',
  'japan',
  'india',
  'russia',
  'europe',
  'asia',
  'africa',
  'north america',
  'south america',
  'earth',
  'world',
  'tornado',
  'tornadoes',
  'hurricane',
  'hurricanes',
  'cyclone',
  'cyclones',
  'typhoon',
  'typhoons',
  'earthquake',
  'earthquakes',
  'flood',
  'floods',
  'storm',
  'storms',
  'blizzard',
  'blizzards',
  'drought',
  'droughts',
  'wildfire',
  'wildfires',
  'tsunami',
  'tsunamis',
  'volcano',
  'volcanoes',
  'war',
  'wars',
  'peace',
  'government',
  'president',
  'prime minister',
  // Household brands / product words — desks already know; don't litter the reply.
  // Obscure fashion / streetwear houses still get Wikipedia glosses when named.
  'nike',
  'adidas',
  'converse',
  'vans',
  'puma',
  'reebok',
  'new balance',
  'chucks',
  'chuck',
  'all star',
  'all stars',
  'sneakers',
  'sneaker',
  'basketball',
  'olympics',
  'olympic games',
])

/** Cap resolved glosses — keep the claim readable (quiet underlines). */
const MAX_GLOSSES = 2

type GlossCandidate = { term: string; wikipediaTitle: string }

function normalizeGlossKey(term: string): string {
  return term
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when the term (or Wikipedia description) is too familiar to bother glossing. */
function isTooObvious(term: string, wikiDescription?: string): boolean {
  const key = normalizeGlossKey(term)
  if (!key) return true
  if (TOO_OBVIOUS.has(key)) return true
  // Plural / morphological near-matches already listed in singular form
  if (key.endsWith('es') && TOO_OBVIOUS.has(key.slice(0, -2))) return true
  if (key.endsWith('s') && TOO_OBVIOUS.has(key.slice(0, -1))) return true

  const desc = String(wikiDescription || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  if (!desc) return false
  if (/^(country|sovereign state|continent|nation|republic|kingdom)\b/.test(desc)) return true
  if (/\b(weather phenomenon|natural disaster|type of storm)\b/.test(desc)) return true
  return false
}

/**
 * Wikipedia entity glosses should help without noise:
 * people, venues, iconic events, and obscure brands someone may have heard of but not place —
 * not household brands, countries, or everyday concepts.
 */
export function looksLikePersonName(term: string): boolean {
  const words = term.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  // Reject clear non-person phrases
  if (/^(the|a|an)\b/i.test(term)) return false
  if (/\b(war|battle|stadium|arena|company|inc|corp|ltd)\b/i.test(term)) return false
  return words.every((w) => /^[A-Z]/.test(w) || /^(de|van|von|da|di|la|le|of|y)$/i.test(w))
}

export function isGlossWorthyEntity(term: string, wikiDescription?: string): boolean {
  if (isYearLikeTerm(term) || isTooObvious(term, wikiDescription)) return false

  const words = term.trim().split(/\s+/).filter(Boolean)
  const desc = String(wikiDescription || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  // Person-shaped names: accept when Wikipedia resolved (even thin descriptions).
  // Obscure people often lack rich short-descriptions — still worth a gloss.
  if (looksLikePersonName(term)) {
    if (!desc) return true
    if (
      /\b(player|coach|athlete|musician|singer|rapper|designer|artist|salesperson|salesman|saleswoman|entrepreneur|executive|founder|politician|activist|author|writer|actor|actress|filmmaker|director|olympian|businessman|businesswoman|inventor|engineer|photographer|model|rapper|producer|choreographer|dancer|hall of fame)\b/.test(
        desc,
      )
    ) {
      return true
    }
    // Nationality + any role-ish, or bare nationality on a person page
    if (/^(american|british|canadian|australian|french|german|italian|japanese|chinese|brazilian|mexican|irish|scottish|welsh|dutch|swedish|norwegian|danish|russian|indian|south african|new zealand)\b/.test(desc)) {
      if (!/\b(company|corporation|brand|multinational|album|film|song|novel|magazine)\b/.test(desc)) return true
    }
    // Any human-ish description without being clearly a company page
    if (!/\b(company|corporation|brand|multinational|album|film|song|novel|website|social network)\b/.test(desc)) {
      return true
    }
  }

  // People — Wikipedia short description without requiring First Last shape on the term
  if (
    /\b(basketball player|athlete|coach|salesperson|salesman|musician|singer|rapper|designer|fashion designer|artist|painter|photographer|entrepreneur|businessman|businesswoman|executive|founder|politician|statesman|activist|author|writer|actor|actress|filmmaker|director|olympian|hall of fame|inventor)\b/.test(
      desc,
    )
  ) {
    return true
  }

  // Obscure brands / houses / labels — helpful; household names are already in TOO_OBVIOUS
  if (
    /\b(fashion house|fashion brand|fashion label|clothing brand|streetwear|luxury brand|designer brand|apparel brand|footwear brand|shoe brand|sneaker brand)\b/.test(
      desc,
    ) ||
    (/\b(brand|label|house)\b/.test(desc) &&
      !/\b(multinational|fortune 500|public company|social network|website|search engine)\b/.test(desc))
  ) {
    return true
  }
  // Smaller companies that aren't household megabrands
  if (
    /\b(company|manufacturer|retailer)\b/.test(desc) &&
    !/\b(multinational|fortune 500|conglomerate|social network|website|search engine|technology company|airline)\b/.test(
      desc,
    )
  ) {
    return true
  }

  // Skip remaining mass media / web platforms as brand noise
  if (/\b(website|social network|search engine|television series|american animated|newspaper|magazine)\b/.test(desc)) {
    return false
  }

  // Venues / places people may have heard of
  if (
    /\b(stadium|arena|theatre|theater|coliseum|colosseum|pavilion|auditorium|ballpark|amphitheatre|amphitheater|concert hall|museum|gallery|opera house)\b/.test(
      desc,
    ) ||
    /\b(stadium|arena|garden|coliseum|hall|theatre|theater)\b/i.test(term)
  ) {
    return true
  }

  // Iconic events (named wars, games, turning points) — not bare “war”
  if (
    words.length >= 2 &&
    /\b(war|battle|olympics|olympic games|world cup|championship|massacre|treaty|revolution|riot|uprising|invasion|landing|assassination|coup|summit|exposition|world's fair)\b/.test(
      desc + ' ' + term.toLowerCase(),
    )
  ) {
    return true
  }

  return false
}

// Imported firstSentence from clean-text


function termAppearsIn(claim: string, term: string): boolean {
  const hay = claim.toLowerCase()
  const needle = term.toLowerCase().trim()
  if (!needle) return false
  if (hay.includes(needle)) return true
  // Surname-only: "Neil Armstrong" → "Armstrong"
  const parts = needle.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const surname = parts[parts.length - 1]
    if (surname.length >= 3 && hay.includes(surname)) return true
  }
  return false
}

/** Capitalized multi-word phrases + person / venue / event names from prose. */
function extractProperNounCandidates(claim: string): GlossCandidate[] {
  const out: GlossCandidate[] = []
  const seen = new Set<string>()

  const push = (term: string, wikipediaTitle?: string) => {
    const clean = term.replace(/\s+/g, ' ').trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key) || clean.split(/\s+/).length > 6) return
    seen.add(key)
    out.push({ term: clean, wikipediaTitle: (wikipediaTitle || clean).trim() })
  }

  // “Tyler, the Creator” / “Billie, something” — comma breaks the plain multi-cap regex
  const commaNames =
    claim.match(
      /\b([A-Z][\w'’-]+),\s+((?:the|The)\s+[A-Z][\w'’-]+(?:\s+[A-Z][\w'’-]+)*)\b/g,
    ) ?? []
  for (const raw of commaNames) {
    push(raw.replace(/\s+/g, ' ').trim())
  }

  // Multi-word Capitalized sequences: "World War I", "Neil Armstrong", "Madison Square Garden"
  const multi =
    claim.match(/\b([A-Z][\w'’-]*\.?(?:\s+(?:of|the|and|de|van|von|da|di|le|la)?\s*[A-Z][\w'’-]*\.?)+)\b/g) ??
    []

  for (const raw of multi) {
    const term = raw.replace(/\s+/g, ' ').trim()
    const content = term.split(/\s+/).filter((w) => !STOP.has(w.toLowerCase()))
    if (content.length === 0) continue
    push(term)
  }

  // All-caps fashion labels: GOLF le FLEUR / CDG PLAY (mixed case already handled above)
  const golf = claim.match(/\bGOLF\s+le\s+FLEUR\*?\b/gi)
  if (golf) {
    for (const g of golf) push(g.replace(/\*/g, '').replace(/\s+/g, ' ').trim(), 'Golf le Fleur')
  }

  return out
}

function collectCandidates(claim: string, event: CulturalEvent): GlossCandidate[] {
  const out: GlossCandidate[] = []
  const seen = new Set<string>()

  const push = (term: string, wikipediaTitle?: string) => {
    const clean = term.replace(/\s+/g, ' ').trim()
    if (!clean || clean.length < 3) return
    if (isYearLikeTerm(clean)) return
    if (isTooObvious(clean)) return
    if (!termAppearsIn(claim, clean)) return
    const key = normalizeGlossKey(clean)
    if (seen.has(key)) return
    seen.add(key)
    out.push({ term: clean, wikipediaTitle: (wikipediaTitle || clean).trim() })
  }

  // Prefer On This Day / existing gloss seeds when the term actually appears in the claim.
  for (const g of event.glosses ?? []) {
    push(g.term, g.term)
  }

  for (const c of extractProperNounCandidates(claim)) {
    push(c.term, c.wikipediaTitle)
  }

  // Title words sometimes name the entity
  if (event.title) {
    const titleBits = event.title.split(/[—–:,(]/)[0]?.trim()
    if (titleBits) push(titleBits, titleBits)
  }

  return out.slice(0, 12)
}

/**
 * Resolve a few Wikipedia glosses for less-obvious entities named in the claim.
 * Prefer silence over weak or everyday definitions.
 */
export async function attachGlosses(event: CulturalEvent): Promise<CulturalEvent> {
  const claim = firstSentence(event.synopsis)
  if (!claim) return { ...event, glosses: [] }

  const candidates = collectCandidates(claim, event)
  if (!candidates.length) return { ...event, glosses: [] }

  const resolved: Gloss[] = []
  for (const candidate of candidates) {
    if (resolved.length >= MAX_GLOSSES) break
    const hit = await fetchWikipediaSummary(candidate.wikipediaTitle)
    if (!hit) continue
    if (isYearLikeTerm(candidate.term) || isYearLikeTerm(hit.title)) continue
    if (isTooObvious(candidate.term, hit.originator) || isTooObvious(hit.title, hit.originator)) {
      continue
    }
    if (!isGlossWorthyEntity(candidate.term, hit.originator) && !isGlossWorthyEntity(hit.title, hit.originator)) {
      continue
    }
    if (!termAppearsIn(claim, candidate.term) && !termAppearsIn(claim, hit.title)) continue
    resolved.push({
      term: candidate.term,
      gloss: hit.extract,
      url: hit.url,
      source: 'wikipedia',
      sourceLabel: 'Wikipedia',
      originator: hit.originator || undefined,
    })
  }

  return {
    ...event,
    glosses: resolved,
  }
}

/** Calendar years / ISO dates are never gloss anchors (acknowledge in prose instead). */
export function isYearLikeTerm(term: string): boolean {
  const t = String(term || '').trim()
  if (!t) return true
  if (/^\d{4}$/.test(t)) return true
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(t)) return true
  if (/^\d{1,2}\s+[A-Za-z]+(?:\s+\d{4})?$/.test(t)) return true // 4 September / 4 September 2003
  if (/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/.test(t)) return true // September 4, 2003
  return false
}

/**
 * Wikipedia entity glosses for free prose (Chuck-E replies).
 * People, venues, iconic events, obscure brands — resolve via summary + OpenSearch.
 */
export async function attachWikipediaGlossesForProse(
  prose: string,
  opts: { excludeTerms?: string[]; max?: number } = {},
): Promise<Gloss[]> {
  const text = String(prose || '').trim()
  if (!text) return []

  const max = opts.max ?? Math.max(MAX_GLOSSES, 3)
  const excluded = new Set(
    (opts.excludeTerms || []).map((t) => normalizeGlossKey(t)).filter(Boolean),
  )

  // Strip light markdown so **Phil Knight** still yields a candidate
  const plain = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')

  const scanWindow = plain.length > 1200 ? `${plain.slice(0, 1200)}…` : plain

  const stub: CulturalEvent = {
    id: 'chuck-e-prose',
    year: 0,
    title: '',
    synopsis: scanWindow,
    category: 'culture',
    precision: 'exact-day',
    citations: [],
  }

  // Prefer person-shaped candidates first so familiar desk names aren't crowded out by phrases
  const candidates = collectCandidates(scanWindow, stub)
    .filter((c) => !isYearLikeTerm(c.term))
    .filter((c) => !excluded.has(normalizeGlossKey(c.term)))
    .sort((a, b) => Number(looksLikePersonName(b.term)) - Number(looksLikePersonName(a.term)))

  const resolved: Gloss[] = []
  for (const candidate of candidates) {
    if (resolved.length >= max) break
    const hit = await fetchWikipediaSummary(candidate.wikipediaTitle)
    if (!hit) continue
    if (isYearLikeTerm(hit.title)) continue
    if (isTooObvious(candidate.term, hit.originator) || isTooObvious(hit.title, hit.originator)) {
      continue
    }
    if (!isGlossWorthyEntity(candidate.term, hit.originator) && !isGlossWorthyEntity(hit.title, hit.originator)) {
      continue
    }
    if (!termAppearsIn(plain, candidate.term) && !termAppearsIn(plain, hit.title)) continue

    // Prefer underlining the name as it appears in the reply
    const term =
      termAppearsIn(plain, candidate.term) ? candidate.term : hit.title

    resolved.push({
      term,
      gloss: cleanWikiGlossBody(hit.extract),
      url: hit.url,
      source: 'wikipedia',
      sourceLabel: 'Wikipedia',
    })
  }
  return resolved
}

function cleanWikiGlossBody(extract: string): string {
  return clipToCompleteSentences(firstSentence(extract) || extract, 160)
}
