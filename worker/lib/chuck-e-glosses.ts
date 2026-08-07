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
 */
const PUBLISHER_ESTABLISHMENT: Record<string, { gloss: string; url: string }> = {
  'footwear news': {
    gloss: 'US trade title for footwear design, retail and collaborations.',
    url: 'https://footwearnews.com/',
  },
  'tatler asia': {
    gloss: 'Asia-Pacific luxury and society magazine (Tatler group).',
    url: 'https://www.tatlerasia.com/',
  },
  "l'officiel usa": {
    gloss: 'US edition of the French fashion magazine L’Officiel.',
    url: 'https://www.lofficielusa.com/',
  },
  'urban industry': {
    gloss: 'UK streetwear retailer and editorial site.',
    url: 'https://www.urbanindustry.co.uk/',
  },
  'esquire middle east': {
    gloss: 'Middle East edition of Esquire — style and culture.',
    url: 'https://www.esquireme.com/',
  },
  dazed: {
    gloss: 'London youth-culture and fashion magazine (Dazed Digital).',
    url: 'https://www.dazeddigital.com/',
  },
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

/**
 * Source / provenance glosses for Chuck-E.
 *
 * - Citation gloss → the beat **title** only (e.g. Swooshed → Converse History)
 * - Publisher establishment → lesser-known outlets named in prose
 * - Years / calendar dates are never gloss terms
 * - Entity “what is this?” glosses come from Wikipedia API (gloss-service), not here
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
    push({
      term: m.title,
      gloss: brandCitationGlossBody(m),
      url: m.citation.url,
      source: 'curated',
      sourceLabel: /converse history/i.test(m.citation.title)
        ? 'Converse History'
        : publisherLabel(m.citation.publisher),
      matchMode: 'exact',
    })

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

/**
 * Publisher establishment only when the outlet name appears in the reply.
 * Do not turn every citation title into a gloss (that stacked meta / years).
 */
export function glossesFromCitations(citations: Citation[], content?: string): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()
  const hay = (content || '').toLowerCase()
  if (!hay) return glosses

  for (const c of citations) {
    const pub = (c.publisher || '').trim()
    const pubKey = pub.toLowerCase()
    const establishment = PUBLISHER_ESTABLISHMENT[pubKey]
    if (!establishment || !pub || seen.has(pubKey) || !hay.includes(pubKey)) continue
    if (isYearLikeTerm(pub)) continue
    seen.add(pubKey)
    glosses.push({
      term: pub,
      gloss: establishment.gloss,
      url: establishment.url,
      source: 'curated',
      sourceLabel: pub,
      matchMode: 'exact',
    })
  }

  return glosses
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
