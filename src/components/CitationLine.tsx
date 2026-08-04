import type { Citation } from '../../shared/provenance'
import { isCitationBlocked } from '../../shared/source-registry'

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

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
  const afterMarker = text.slice(start + marker.length)
  const accessedAt = afterMarker.indexOf(' (Accessed:')
  const linkedUrl = accessedAt === -1 ? afterMarker.trim() : afterMarker.slice(0, accessedAt).trim()
  const after = accessedAt === -1 ? '' : afterMarker.slice(accessedAt)

  return (
    <p className="citation-harvard">
      {before}
      <a className="citation-inline-link" href={url} target="_blank" rel="noreferrer">
        {linkedUrl || url}
      </a>
      {after}
    </p>
  )
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
          <HarvardWithLink text={harvard} url={citation.url} />
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
