import type { BrandMoment } from '../../shared/brand'
import type { Citation, Gloss } from '../../shared/provenance'
import type { ProductFact } from '../../shared/products'

/**
 * Clean source snippets for gloss popovers: no curly quotes, page refs,
 * or “Converse History: …” wrappers — short readable prose only.
 */
export function cleanGlossSnippet(raw: string, max = 200): string {
  let s = String(raw || '')
    .replace(/\u00a0/g, ' ')
    .replace(/^Converse History:\s*/i, '')
    .replace(/^Converse History entry for[^.]*\.?\s*/i, '')
    .replace(/\(\s*pp?\.\s*\d+[^)]*\)/gi, '')
    .replace(/\bpp?\.\s*\d+([-–—]\d+)?\b/gi, '')
    .replace(/[“”«»„]/g, '')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim()
  }

  // Drop leftover bibliographic noise that isn't prose
  s = s.replace(/\s*Available at:\s*\S+/gi, '').trim()

  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(', '))
  return (at > max * 0.45 ? cut.slice(0, at + 1) : `${cut.trimEnd()}…`).trim()
}

function publisherLabel(publisher: string, year?: string): string {
  const pub = publisher.trim() || 'Source'
  return year ? `${pub} (${year})` : pub
}

/**
 * Build dotted citation glosses so Chuck-E facts stay traceable to the
 * original source (typically Converse History) on hover.
 * Gloss body = clean prose; link + publisher/year live in the popover footer.
 */
export function glossesFromBrandMoments(moments: BrandMoment[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()

  for (const m of moments) {
    const year = m.citation.publishedAt?.slice(0, 4) || m.date.slice(0, 4)
    const fromSynopsis = cleanGlossSnippet(m.synopsis, 220)
    const fromRef = cleanGlossSnippet(m.reference, 220)
    const looksMeta =
      !fromRef ||
      fromRef.length < 28 ||
      /^(see |cf\.|ibid|converse history entry)/i.test(fromRef)
    const glossBody =
      fromSynopsis ||
      (looksMeta ? cleanGlossSnippet(`${m.title}. ${m.synopsis}`, 220) : fromRef)

    const candidates = [
      ...titleTokens(m.title),
      m.title,
      year,
      m.date.length > 4 ? m.date : '',
    ].filter(Boolean)
    for (const term of candidates) {
      const key = term.toLowerCase()
      if (seen.has(key) || term.length < 3) continue
      seen.add(key)
      glosses.push({
        term,
        gloss: glossBody,
        url: m.citation.url,
        source: 'curated',
        sourceLabel: publisherLabel(m.citation.publisher, year),
        period: year,
        originator: m.citation.title,
      })
    }
  }

  return glosses
}

export function glossesFromCitations(citations: Citation[], content?: string): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()
  const hay = (content || '').toLowerCase()

  for (const c of citations) {
    const year = c.publishedAt?.slice(0, 4)
    const yearBit = year && year !== 'n.d.' ? year : undefined
    const note = cleanGlossSnippet(c.reference || '', 160)
    const glossBody =
      note ||
      cleanGlossSnippet(c.title, 120) ||
      'Open the original source for the full cite.'
    const terms = [c.title, yearBit, c.publisher].filter(Boolean) as string[]
    for (const term of terms) {
      const key = term.toLowerCase()
      if (seen.has(key) || term.length < 3) continue
      if (hay && !hay.includes(key) && term !== c.title) continue
      seen.add(key)
      glosses.push({
        term,
        gloss: glossBody,
        url: c.url,
        source: c.tier === 'bridge' || /wikipedia\.org/i.test(c.url) ? 'wikipedia' : 'curated',
        sourceLabel: publisherLabel(c.publisher, yearBit),
        period: yearBit,
        originator: c.title,
      })
    }
  }

  return glosses
}

export function glossesFromProductFacts(facts: ProductFact[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()
  for (const f of facts) {
    if (!f.citation) continue
    const key = f.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const year = f.citation.publishedAt?.slice(0, 4)
    glosses.push({
      term: f.label,
      gloss: cleanGlossSnippet(f.body, 200),
      url: f.citation.url,
      source: 'curated',
      sourceLabel: publisherLabel(f.citation.publisher, year),
      period: year,
      originator: f.citation.title,
    })
  }
  return glosses
}

function titleTokens(title: string): string[] {
  const out: string[] = []
  const known = [
    'All Star',
    'Non-Skid',
    'Chuck Taylor',
    'Jack Purcell',
    'One Star',
    'Pro Leather',
    'Chuck 70',
    'GOLF le FLEUR',
    'Comme des Garçons',
    'CDG PLAY',
    'Maison Margiela',
    'Rick Owens',
    'The Simpsons',
    'Kurt Cobain',
    'AS-1 Pro',
    'Billie Eilish',
  ]
  const lower = title.toLowerCase()
  for (const k of known) {
    if (lower.includes(k.toLowerCase())) out.push(k)
  }
  return out
}
