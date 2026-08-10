import type { BrandMoment } from '../../shared/brand'
import type { Citation, Gloss } from '../../shared/provenance'
import type { ProductFact } from '../../shared/products'
import { clipToCompleteSentences } from './clean-text'
import { isYearLikeTerm } from './gloss-service'

/** Soft ceiling for popover body — desks skim; always whole sentences. */
const GLOSS_BODY_MAX = 160

/**
 * Clean source snippets for gloss popovers: short readable prose only.
 * Strip bibliographic wrappers, title echoes, and History-meta asides.
 * Never cut mid-sentence.
 */
export function cleanGlossSnippet(raw: string, max = GLOSS_BODY_MAX): string {
  let s = String(raw || '')
    .replace(/\u00a0/g, ' ')
    .replace(/^Converse History:\s*/i, '')
    .replace(/^Converse History entry for[^.]*\.?\s*/i, '')
    .replace(/\bConverse History marks[^.]*[.!]?\s*/gi, '')
    .replace(/\(\s*pp?\.\s*\d+[^)]*\)/gi, '')
    .replace(/\bpp?\.\s*\d+([-–—]\d+)?\b/gi, '')
    .replace(/[“”«»„]/g, '')
    .replace(/[‘’‚‛']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }

  s = s.replace(/\s*Available at:\s*\S+/gi, '').trim()
  s = s.replace(/\s+per\s+[A-Z][^.]{2,40}\.\s*$/g, '').trim()

  return clipToCompleteSentences(s, max)
}

/** Avoid “Swooshed. Swooshed was…” — drop a leading title echo. */
function stripTitleEcho(body: string, title: string): string {
  const t = title.trim()
  if (!t || t.length < 3) return body
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return body
    .replace(new RegExp(`^(${escaped})\\s*[—–\\-:.]\\s*`, 'i'), '')
    .replace(new RegExp(`^(${escaped})\\s+`, 'i'), '')
    .trim()
}

function publisherLabel(publisher: string): string {
  return publisher.trim() || 'Source'
}

/**
 * Trade / culture publishers that desks may not instantly place —
 * short establishment gloss + official site (not the article cite).
 * Used only when we lack a claim cite for that outlet in this turn.
 */
const PUBLISHER_ESTABLISHMENT: Record<string, { gloss: string; url: string; aliases?: string[] }> = {
  'footwear news': {
    gloss: 'US trade title for footwear design, retail and collaborations.',
    url: 'https://footwearnews.com/',
    aliases: ['Footwear News', 'FN'],
  },
  'tatler asia': {
    gloss: 'Asia-Pacific luxury and society magazine (Tatler group).',
    url: 'https://www.tatlerasia.com/',
    aliases: ['Tatler Asia'],
  },
  "l'officiel usa": {
    gloss: 'US edition of the French fashion magazine L’Officiel.',
    url: 'https://www.lofficielusa.com/',
    aliases: ["L'Officiel USA", 'L’Officiel USA'],
  },
  'urban industry': {
    gloss: 'UK streetwear retailer and editorial site.',
    url: 'https://www.urbanindustry.co.uk/',
    aliases: ['Urban Industry'],
  },
  'esquire middle east': {
    gloss: 'Middle East edition of Esquire — style and culture.',
    url: 'https://www.esquireme.com/',
    aliases: ['Esquire Middle East'],
  },
  dazed: {
    gloss: 'London youth-culture and fashion magazine (Dazed Digital).',
    url: 'https://www.dazeddigital.com/',
    aliases: ['Dazed', 'Dazed Digital'],
  },
}

/**
 * Well-known outlets — when named in the reply, underline → article cite for this turn
 * (not a generic “who is this magazine” gloss).
 */
const PUBLISHER_PROSE_ALIASES: Record<string, string[]> = {
  gq: ['GQ'],
  'british gq': ['British GQ'],
  forbes: ['Forbes'],
  hypebeast: ['Hypebeast'],
  hbx: ['HBX'],
  highsnobiety: ['Highsnobiety'],
  complex: ['Complex'],
  surface: ['Surface'],
  designboom: ['designboom', 'Designboom'],
  dazed: ['Dazed', 'Dazed Digital'],
  'british vogue': ['British Vogue'],
  vogue: ['Vogue'],
  'teen vogue': ['Teen Vogue'],
  wwd: ['WWD', 'Women’s Wear Daily', "Women's Wear Daily"],
  'footwear news': ['Footwear News', 'FN'],
  'the business of fashion': ['Business of Fashion', 'BoF'],
  'business of fashion': ['Business of Fashion', 'BoF'],
  'ad age': ['Ad Age'],
  'fast company': ['Fast Company'],
  'the new york times': ['New York Times', 'NYT'],
  'the wall street journal': ['Wall Street Journal', 'WSJ'],
  'sports illustrated': ['Sports Illustrated', 'SI'],
  converse: ['Converse History'],
}

/** One clear sentence for a History / brand beat — not a second title stack. */
function brandCitationGlossBody(m: BrandMoment): string {
  const fromSynopsis = stripTitleEcho(cleanGlossSnippet(m.synopsis, GLOSS_BODY_MAX), m.title)
  if (fromSynopsis.length >= 24) return fromSynopsis

  const fromRef = cleanGlossSnippet(m.reference, GLOSS_BODY_MAX)
  const looksMeta =
    !fromRef ||
    fromRef.length < 28 ||
    /^(see |cf\.|ibid|converse history)/i.test(fromRef)
  if (!looksMeta) return stripTitleEcho(fromRef, m.title)

  return cleanGlossSnippet(m.synopsis || m.title, GLOSS_BODY_MAX)
}

function citationProvenanceBody(c: Citation): string {
  const fromRef = cleanGlossSnippet(c.reference || '', GLOSS_BODY_MAX)
  if (fromRef.length >= 24 && !/^(see |cf\.|ibid)/i.test(fromRef)) return fromRef
  const title = (c.title || '').trim()
  const pub = (c.publisher || '').trim()
  if (title && pub) return cleanGlossSnippet(`${title} (${pub}).`, GLOSS_BODY_MAX)
  return cleanGlossSnippet(title || pub || 'Sourced press coverage.', GLOSS_BODY_MAX)
}

/** Beat title for citation gloss — keep the collab/product name, not a bare person alias. */
function titleGlossAnchors(title: string): string[] {
  const t = title.replace(/\s+/g, ' ').trim()
  if (!t) return []
  const out: string[] = [t]
  const stripped = t
    .replace(/^converse\s*[x×]\s*/i, '')
    .replace(/\s*[—–-]\s*the\s+ten\s*$/i, '')
    .trim()
  // “Converse x Virgil Abloh” → don’t also cite-gloss bare “Virgil Abloh” (that’s Wikipedia).
  if (
    stripped &&
    stripped.toLowerCase() !== t.toLowerCase() &&
    stripped.length >= 4 &&
    !looksLikeCollabPartnerName(stripped)
  ) {
    out.push(stripped)
  }
  return out
}

/** True when a phrase is the partner / house, not the shoe or drop name. */
export function looksLikeCollabPartnerName(term: string): boolean {
  const t = term.replace(/\s+/g, ' ').trim()
  if (!t || t.length < 3) return false
  if (
    /\b(chuck|star|weapon|ten|program|collab|all\s*star|purcell|non[\s-]?skid|swooshed|turbodrk|turbowpn|ghosting|1908|by\s+you|one\s+star|jack\s+purcell|pro\s+bb|pro\s+leather|pro\s+stars?)\b/i.test(
      t,
    )
  ) {
    return false
  }
  if (/^(maison|comme(\s+des)?|golf(\s+le)?|off[\s-]?white|vaquera|cdg)\b/i.test(t)) return true
  const words = t.split(/\s+/).filter(Boolean)
  if (words.length >= 2 && words.length <= 5) {
    if (/^(the|a|an)\b/i.test(t) && !/,/.test(t)) return false
    // “Tyler, the Creator” / “Virgil Abloh” / “Rick Owens”
    if (words.every((w) => /^[A-Z]/.test(w) || /^(de|van|von|da|di|la|le|of|y|the)$/i.test(w))) {
      return true
    }
  }
  return false
}

/**
 * Collab partners / houses → Wikipedia entity glosses (who / what they are).
 * Not citation anchors — the collab article attaches to the drop / title instead.
 */
export function wikiPartnerSeedsFromMoments(moments: BrandMoment[]): string[] {
  const out: string[] = []
  const push = (term: string) => {
    const t = term.replace(/\s+/g, ' ').trim()
    if (t.length < 3 || isYearLikeTerm(t)) return
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) return
    out.push(t)
  }

  for (const m of moments) {
    const hay = `${m.title} ${m.synopsis}`
    if (/virgil\s+abloh|abloh/i.test(hay)) {
      push('Virgil Abloh')
      if (/off[\s-]?white/i.test(hay)) push('Off-White')
    }
    if (/tyler|golf\s+le\s+fleur|le\s*fleur|1908\s+program/i.test(hay)) {
      push('Tyler, the Creator')
      push('GOLF le FLEUR')
    }
    if (/margiela|maison\s+martin\s+margiela/i.test(hay)) push('Maison Margiela')
    if (/comme\s+des\s+gar|cdg\s+play|play\s+comme/i.test(hay)) push('Comme des Garçons')
    if (/rick\s+owens/i.test(hay)) push('Rick Owens')
    if (/kurt\s+cobain|cobain/i.test(hay)) push('Kurt Cobain')
    if (/billie\s+eilish|eilish/i.test(hay)) push('Billie Eilish')
    if (/john\s+richmond/i.test(hay)) push('John Richmond')
    if (/john\s+varvatos/i.test(hay)) push('John Varvatos')
    if (/vaquera/i.test(hay)) push('Vaquera')
    if (/larry\s+bird/i.test(hay)) push('Larry Bird')
    if (/magic\s+johnson/i.test(hay)) push('Magic Johnson')
    if (/chuck\s+taylor/i.test(hay) && !/all\s+star/i.test(m.title)) push('Chuck Taylor')
    if (/\bthe\s+simpsons\b/i.test(hay)) push('The Simpsons')
  }
  return out
}

/**
 * Release / silhouette / drop phrases — dotted underlines that open the collab article.
 * Exact match. Partner / house names are intentionally omitted (Wikipedia instead).
 */
function releasePhraseAnchors(m: BrandMoment): string[] {
  const hay = `${m.title} ${m.synopsis}`
  const out: string[] = []
  const push = (term: string) => {
    const t = term.replace(/\s+/g, ' ').trim()
    if (t.length < 3 || isYearLikeTerm(t)) return
    if (out.some((x) => x.toLowerCase() === t.toLowerCase())) return
    out.push(t)
  }

  const rules: Array<[RegExp, string]> = [
    [/\bthe\s+ten\b/i, 'The Ten'],
    [/\bghosting\b/i, 'Ghosting'],
    [/\bturbodrk\b/i, 'TURBODRK'],
    [/\bturbowpn\b/i, 'TURBOWPN'],
    [/\b1908\s+program\b/i, '1908 Program'],
    [/\bgolf\s+le\s+fleur\*?\s+one\s+star\b/i, 'GOLF le FLEUR* One Star'],
    [/\bone\s+star\b/i, 'One Star'],
    [/\bnon[\s-]?skid\b/i, 'Non-Skid'],
    [/\bswooshed\b/i, 'Swooshed'],
    [/\bchoose\s+your\s+weapon\b/i, 'Choose Your Weapon'],
    [/\ball\s+star\s+pro\s+bb\b/i, 'All Star Pro BB'],
    [/\bpro\s+stars?\b/i, 'Pro Stars'],
    [/\bpro\s+leather\b/i, 'Pro Leather'],
    [/\bjack\s+purcell\b/i, 'Jack Purcell'],
    [/\bcdg\s+play\b|play\s+comme/i, 'CDG PLAY'],
    [/\b\(product\)\s*red\b|product\s+red|hund\(red\)/i, '(PRODUCT) RED'],
    [/\bfirst fashion collab\b/i, 'First fashion collab'],
    [/\bbillie\s+by\s+you\b|\bby\s+you\b/i, 'By You'],
    [/\bstranger\s+things\b/i, 'Stranger Things'],
  ]

  for (const [re, term] of rules) {
    if (re.test(hay)) push(term)
  }
  return out
}

/**
 * Source / provenance glosses for Chuck-E.
 *
 * - Citation gloss → beat title (+ product aliases) and named drops → article URL
 * - Partner / house names are NOT citation glosses — Wikipedia covers those
 * - Publisher in prose → article cite when we have one this turn
 */
export function glossesFromBrandMoments(moments: BrandMoment[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()

  const push = (g: Gloss) => {
    if (isYearLikeTerm(g.term)) return
    const key = g.term.toLowerCase()
    if (seen.has(key) || g.term.length < 3) return
    seen.add(key)
    glosses.push(g)
  }

  for (const m of moments) {
    const body = brandCitationGlossBody(m)
    const sourceLabel = /converse history/i.test(m.citation.title)
      ? 'Converse History'
      : publisherLabel(m.citation.publisher)

    for (const term of titleGlossAnchors(m.title)) {
      push({
        term,
        gloss: body,
        url: m.citation.url,
        source: 'curated',
        sourceLabel,
        matchMode: 'exact',
      })
    }

    for (const term of releasePhraseAnchors(m)) {
      push({
        term,
        gloss: body,
        url: m.citation.url,
        source: 'curated',
        sourceLabel,
        matchMode: 'exact',
      })
    }

    const hay = `${m.title} ${m.synopsis}`.toLowerCase()
    const pubKey = (m.citation.publisher || '').trim().toLowerCase()
    const establishment = PUBLISHER_ESTABLISHMENT[pubKey]
    if (establishment && hay.includes(pubKey)) {
      push({
        term: m.citation.publisher,
        gloss: establishment.gloss,
        url: establishment.url,
        source: 'curated',
        sourceLabel: m.citation.publisher,
        matchMode: 'exact',
      })
    }
  }

  return glosses
}

function publisherKeysForCitation(c: Citation): string[] {
  const pub = (c.publisher || '').trim().toLowerCase()
  const title = (c.title || '').trim().toLowerCase()
  const keys: string[] = []
  if (pub) keys.push(pub)
  if (/converse history/i.test(title) || /^converse$/i.test(pub)) keys.push('converse')
  return keys
}

/** Short outlet label for in-reply cues (so a source gloss can attach). */
export function shortOutletLabel(publisher: string): string | null {
  const key = (publisher || '').trim().toLowerCase()
  if (!key || key === 'converse') return null
  const aliases = PUBLISHER_PROSE_ALIASES[key]
  if (aliases?.length) return aliases[0]
  const raw = publisher.trim()
  return raw.length >= 2 && raw.length <= 28 ? raw : null
}

/**
 * When the reply names an outlet (or a distinctive cite title), underline → that
 * article’s provenance — desks see the source on the text, not only in Read more.
 */
export function glossesFromCitations(citations: Citation[], content?: string): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()
  const hay = (content || '').toLowerCase()
  if (!hay) return glosses

  const push = (g: Gloss) => {
    if (isYearLikeTerm(g.term)) return
    const key = g.term.toLowerCase()
    if (seen.has(key) || g.term.length < 2) return
    // Only attach when the term actually appears in this reply
    if (!hay.includes(key) && !termAppearsLoosely(hay, g.term)) return
    seen.add(key)
    glosses.push(g)
  }

  for (const c of citations) {
    if (!c.url?.trim()) continue
    const body = citationProvenanceBody(c)
    const label = /converse history/i.test(c.title || '')
      ? 'Converse History'
      : publisherLabel(c.publisher || 'Source')

    for (const key of publisherKeysForCitation(c)) {
      const aliases = PUBLISHER_PROSE_ALIASES[key] || [c.publisher].filter(Boolean)
      for (const term of aliases) {
        if (!term) continue
        push({
          term,
          gloss: body,
          url: c.url,
          source: 'curated',
          sourceLabel: label,
          matchMode: 'exact',
        })
      }
    }

    // Distinctive multi-word article title fragment (when Gemini echoes it)
    const citeTitle = (c.title || '').replace(/\s+/g, ' ').trim()
    if (citeTitle.length >= 12 && citeTitle.split(/\s+/).length >= 3) {
      const short = citeTitle.split(/[—–:]/)[0]?.trim()
      if (short && short.length >= 12 && short.length <= 48) {
        push({
          term: short,
          gloss: body,
          url: c.url,
          source: 'curated',
          sourceLabel: label,
          matchMode: 'exact',
        })
      }
    }
  }

  // Establishment-only for lesser-known outlets named in prose with no article cite above
  for (const c of citations) {
    const pub = (c.publisher || '').trim()
    const pubKey = pub.toLowerCase()
    const establishment = PUBLISHER_ESTABLISHMENT[pubKey]
    if (!establishment || !pub) continue
    for (const term of establishment.aliases || [pub]) {
      if (seen.has(term.toLowerCase())) continue
      if (!hay.includes(term.toLowerCase())) continue
      seen.add(term.toLowerCase())
      glosses.push({
        term,
        gloss: establishment.gloss,
        url: establishment.url,
        source: 'curated',
        sourceLabel: pub,
        matchMode: 'exact',
      })
    }
  }

  return glosses
}

/** Loose appearance check for multi-word terms (punctuation-tolerant). */
function termAppearsLoosely(hayLower: string, term: string): boolean {
  const parts = term
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 1)
  if (parts.length < 2) return hayLower.includes(parts[0] || '')
  // All content tokens present near each other is enough for alias attach
  return parts.every((p) => hayLower.includes(p))
}

export function glossesFromProductFacts(facts: ProductFact[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()
  for (const f of facts) {
    if (!f.citation) continue
    if (isYearLikeTerm(f.label)) continue
    const key = f.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    glosses.push({
      term: f.label,
      gloss: cleanGlossSnippet(f.body, GLOSS_BODY_MAX),
      url: f.citation.url,
      source: 'curated',
      sourceLabel: publisherLabel(f.citation.publisher),
      matchMode: 'exact',
    })
  }
  return glosses
}

/** Drop year-like terms that should never be underlined. */
export function rejectYearGlosses(glosses: Gloss[]): Gloss[] {
  return glosses.filter((g) => !isYearLikeTerm(g.term))
}

/**
 * Prefer glosses that can actually underline in this reply — keeps popovers honest
 * and stops unused title aliases crowding the payload.
 */
export function preferGlossesPresentInContent(content: string, glosses: Gloss[]): Gloss[] {
  const hay = String(content || '')
  if (!hay.trim()) return glosses
  const hayLower = hay.toLowerCase()
  const present: Gloss[] = []
  const rest: Gloss[] = []
  for (const g of glosses) {
    const term = g.term || ''
    const exact = hayLower.includes(term.toLowerCase()) || termAppearsLoosely(hayLower, term)
    const surname =
      g.matchMode !== 'exact' &&
      term.split(/\s+/).length >= 2 &&
      (() => {
        const last = term.split(/\s+/).filter(Boolean).pop() || ''
        return last.length >= 3 && hayLower.includes(last.toLowerCase())
      })()
    if (exact || surname) present.push(g)
    else rest.push(g)
  }
  // Keep a few unused title glosses in case of light markdown/punctuation mismatch
  return [...present, ...rest.slice(0, 4)]
}
