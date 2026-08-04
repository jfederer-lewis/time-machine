import type { Citation } from '../../shared/provenance'
import { isCitationBlocked } from '../../shared/source-registry'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function CitationLine({ citation }: { citation: Citation }) {
  const blocked = isCitationBlocked(citation.url)
  const harvard =
    citation.harvard ||
    `${citation.publisher} (${citation.publishedAt?.slice(0, 4) || 'n.d.'}) '${citation.title}'. Available at: ${citation.url}`

  return (
    <footer className="citation-line">
      {blocked ? (
        <p className="citation-quality chip--warn">
          citation blocked — discovery host cannot be used as source
        </p>
      ) : (
        <>
          <p className="citation-harvard">{harvard}</p>
          <a className="citation-open" href={citation.url} target="_blank" rel="noreferrer">
            open {hostname(citation.url)} →
          </a>
          <p className="citation-quality">
            {citation.tier ? `tier ${citation.tier} · ` : ''}
            {citation.sourceQuality.replace(/-/g, ' ')}
            {citation.isExactQuote ? ' · quoted' : ' · paraphrase'}
          </p>
        </>
      )}
    </footer>
  )
}
