import type { Citation } from '../../shared/provenance'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function CitationLine({ citation }: { citation: Citation }) {
  const year = citation.publishedAt?.slice(0, 4)
  const lead = [citation.author, year ? `(${year})` : null, citation.title]
    .filter(Boolean)
    .join(' ')

  return (
    <footer className="citation-line">
      <p className="citation-lead">
        <span className="citation-publisher">{citation.publisher}</span>
        {lead ? <span className="citation-meta"> · {lead}</span> : null}
      </p>
      <a className="citation-open" href={citation.url} target="_blank" rel="noreferrer">
        open {hostname(citation.url)} →
      </a>
      <p className="citation-quality">
        {citation.sourceQuality.replace(/-/g, ' ')}
        {citation.isExactQuote ? ' · quoted' : ' · paraphrase'}
      </p>
    </footer>
  )
}
