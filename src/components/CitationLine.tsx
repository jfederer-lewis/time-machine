import type { Citation } from '../../shared/provenance'
import { isCitationBlocked } from '../../shared/source-registry'

/** Split Harvard text so the Available at: URL is a real hyperlink. */
function HarvardWithLink({ text, url }: { text: string; url: string }) {
  const marker = 'Available at: '
  const start = text.indexOf(marker)
  if (start === -1) {
    return (
      <p className="citation-harvard">
        {text}{' '}
        <a className="citation-inline-link" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      </p>
    )
  }

  const before = text.slice(0, start + marker.length)
  const afterMarker = text.slice(start + marker.length).trim()

  return (
    <p className="citation-harvard">
      {before}
      <a className="citation-inline-link" href={url} target="_blank" rel="noreferrer">
        {afterMarker || url}
      </a>
    </p>
  )
}

export function CitationLine({ citation }: { citation: Citation }) {
  const blocked = isCitationBlocked(citation.url)
  const harvard =
    citation.harvard ||
    `${citation.publisher} (${citation.publishedAt?.slice(0, 4) || 'n.d.'}) '${citation.title}'. Available at: ${citation.url}`

  if (blocked) {
    return (
      <footer className="citation-line">
        <p className="citation-blocked">Source unavailable for citation</p>
      </footer>
    )
  }

  return (
    <footer className="citation-line">
      <HarvardWithLink text={harvard} url={citation.url} />
    </footer>
  )
}
