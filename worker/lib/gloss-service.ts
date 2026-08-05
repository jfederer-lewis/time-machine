/**
 * Slim Bloom-style gloss attach for claim cards.
 * Prefer Wikipedia summary; silence over weak AI glosses.
 */

import type { CulturalEvent, Gloss } from '../../shared/provenance'
import { fetchWikipediaSummary } from '../providers/wikipedia-summary'

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
])

/** Cap resolved glosses — keep the claim readable. */
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

function firstSentence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/)
  return match ? match[1] : trimmed
}

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

/** Capitalized multi-word phrases + obvious person names from the claim sentence. */
function extractProperNounCandidates(claim: string): GlossCandidate[] {
  const out: GlossCandidate[] = []
  const seen = new Set<string>()

  // Multi-word Capitalized sequences: "World War I", "Neil Armstrong", "United Nations"
  const multi =
    claim.match(/\b([A-Z][\w'’-]*(?:\s+(?:of|the|and|de|van|von|da|di|le|la)?\s*[A-Z][\w'’-]*)+)\b/g) ??
    []

  for (const raw of multi) {
    const term = raw.replace(/\s+/g, ' ').trim()
    const key = term.toLowerCase()
    if (seen.has(key) || term.split(/\s+/).length > 5) continue
    // Skip if mostly stop words
    const content = term.split(/\s+/).filter((w) => !STOP.has(w.toLowerCase()))
    if (content.length === 0) continue
    seen.add(key)
    out.push({ term, wikipediaTitle: term })
  }

  // "Firstname Lastname" already covered by multi; add single significant Caps only sparingly
  return out
}

function collectCandidates(claim: string, event: CulturalEvent): GlossCandidate[] {
  const out: GlossCandidate[] = []
  const seen = new Set<string>()

  const push = (term: string, wikipediaTitle?: string) => {
    const clean = term.replace(/\s+/g, ' ').trim()
    if (!clean || clean.length < 3) return
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

  return out.slice(0, 4)
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
    // Drop pages that resolve to everyday geography / weather / nations
    if (isTooObvious(candidate.term, hit.originator) || isTooObvious(hit.title, hit.originator)) {
      continue
    }
    // Ensure the resolved page title still relates to something we can underline
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
