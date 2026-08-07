import type { BrandMoment } from '../../shared/brand'
import type { Citation, Gloss } from '../../shared/provenance'
import type { ProductFact } from '../../shared/products'
import { formatHarvardCitation } from '../../shared/source-registry'

/** Short Harvard line for gloss popovers — title, date, publisher always present. */
function harvardCiteLine(opts: {
  title: string
  publisher: string
  url: string
  author?: string
  publishedAt?: string
  fallbackYear?: string
}): string {
  return formatHarvardCitation({
    author: opts.author,
    year: opts.publishedAt?.slice(0, 4) || opts.fallbackYear,
    title: opts.title,
    publisher: opts.publisher,
    publishedDisplay: opts.publishedAt,
    url: opts.url,
  })
}

/**
 * Build dotted citation glosses so Chuck-E facts stay traceable to the
 * original source (typically Converse History) on hover.
 */
export function glossesFromBrandMoments(moments: BrandMoment[]): Gloss[] {
  const glosses: Gloss[] = []
  const seen = new Set<string>()

  for (const m of moments) {
    const year = m.citation.publishedAt?.slice(0, 4) || m.date.slice(0, 4)
    const citeLine = harvardCiteLine({
      title: m.citation.title,
      publisher: m.citation.publisher,
      url: m.citation.url,
      author: m.citation.author,
      publishedAt: m.citation.publishedAt,
      fallbackYear: year,
    })
    const body =
      m.reference.replace(/\s+/g, ' ').trim().slice(0, 220) ||
      `${m.title} — ${m.synopsis}`.slice(0, 220)
    const glossBody = `${body}\n\n${citeLine}`

    // Prefer short, matchable terms that survive Gemini paraphrase + markdown bold.
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
        sourceLabel: `${m.citation.publisher} (${year})`,
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
    const year = c.publishedAt?.slice(0, 4) || 'n.d.'
    const citeLine =
      c.harvard ||
      harvardCiteLine({
        title: c.title,
        publisher: c.publisher,
        url: c.url,
        author: c.author,
        publishedAt: c.publishedAt,
        fallbackYear: year,
      })
    const note = (c.reference || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    const glossBody = note ? `${note}\n\n${citeLine}` : citeLine
    const terms = [c.title, year, c.publisher].filter(Boolean) as string[]
    for (const term of terms) {
      const key = term.toLowerCase()
      if (seen.has(key) || term.length < 3) continue
      // Prefer terms that actually appear in the reply when content is known
      if (hay && !hay.includes(key) && term !== c.title) continue
      seen.add(key)
      glosses.push({
        term,
        gloss: glossBody,
        url: c.url,
        source: c.tier === 'bridge' || /wikipedia\.org/i.test(c.url) ? 'wikipedia' : 'curated',
        sourceLabel: `${c.publisher} (${year})`,
        period: year === 'n.d.' ? undefined : year,
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
    const citeLine = harvardCiteLine({
      title: f.citation.title,
      publisher: f.citation.publisher,
      url: f.citation.url,
      publishedAt: f.citation.publishedAt,
      fallbackYear: year,
    })
    glosses.push({
      term: f.label,
      gloss: `${f.body.slice(0, 200)}\n\n${citeLine}`,
      url: f.citation.url,
      source: 'curated',
      sourceLabel: `${f.citation.publisher}${year ? ` (${year})` : ''}`,
      period: year,
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
