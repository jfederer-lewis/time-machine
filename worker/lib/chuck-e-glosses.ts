import type { BrandMoment } from '../../shared/brand'
import type { Citation, Gloss } from '../../shared/provenance'
import type { ProductFact } from '../../shared/products'

/**
 * Build dotted citation glosses so Chuck-E facts stay traceable to the
 * original source (typically Converse History) on hover.
 */
export function glossesFromBrandMoments(moments: BrandMoment[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()

  for (const m of moments) {
    const year = m.date.slice(0, 4)
    const sourceLabel = m.citation.publisher || 'Converse History'
    const body =
      m.reference.replace(/\s+/g, ' ').trim().slice(0, 280) ||
      `${m.title} — ${m.synopsis}`.slice(0, 280)

    const candidates = [m.title, year, ...titleTokens(m.title)]
    for (const term of candidates) {
      const key = term.toLowerCase()
      if (seen.has(key) || term.length < 3) continue
      seen.add(key)
      glosses.push({
        term,
        gloss: body,
        url: m.citation.url,
        source: 'curated',
        sourceLabel,
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
    const body =
      (c.harvard || c.reference || `${c.publisher}: ${c.title}`).replace(/\s+/g, ' ').trim().slice(0, 280)
    const terms = [c.title, year, c.publisher].filter(Boolean) as string[]
    for (const term of terms) {
      const key = term.toLowerCase()
      if (seen.has(key) || term.length < 3) continue
      // Prefer terms that actually appear in the reply when content is known
      if (hay && !hay.includes(key) && term !== c.title) continue
      seen.add(key)
      glosses.push({
        term,
        gloss: body,
        url: c.url,
        source: 'curated',
        sourceLabel: c.publisher,
        period: year,
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
    glosses.push({
      term: f.label,
      gloss: f.body.slice(0, 280),
      url: f.citation.url,
      source: 'curated',
      sourceLabel: f.citation.publisher,
      period: f.citation.publishedAt?.slice(0, 4),
      originator: f.citation.title,
    })
  }
  return glosses
}

function titleTokens(title: string): string[] {
  // Keep multi-word proper-ish chunks (All Star, Non-Skid, Chuck Taylor…)
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
    'AS-1 Pro',
    'Billie Eilish',
  ]
  const lower = title.toLowerCase()
  for (const k of known) {
    if (lower.includes(k.toLowerCase())) out.push(k)
  }
  return out
}
