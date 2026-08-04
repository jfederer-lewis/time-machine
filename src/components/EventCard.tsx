import type { ReactNode } from 'react'
import type { CulturalEvent } from '../../shared/provenance'
import { CitationLine } from './CitationLine'
import { GlossTerm } from './GlossTerm'
import { ReferenceText } from './ReferenceText'

function injectGlosses(text: string, event: CulturalEvent) {
  const glosses = event.glosses ?? []
  if (!glosses.length) return text

  const parts: ReactNode[] = []
  let remaining = text
  let key = 0

  for (const gloss of glosses) {
    const idx = remaining.toLowerCase().indexOf(gloss.term.toLowerCase())
    if (idx === -1) continue
    if (idx > 0) parts.push(remaining.slice(0, idx))
    const matched = remaining.slice(idx, idx + gloss.term.length)
    parts.push(
      <GlossTerm key={`g-${key++}`} gloss={gloss}>
        {matched}
      </GlossTerm>,
    )
    remaining = remaining.slice(idx + gloss.term.length)
  }
  if (remaining) parts.push(remaining)
  return parts.length ? parts : text
}

export function EventCard({ event, accent }: { event: CulturalEvent; accent?: boolean }) {
  const citation = event.citations[0]

  return (
    <article className={`event-card${accent ? ' event-card--brand' : ''}`}>
      <header className="event-card__meta">
        <span className="event-year">{event.year}</span>
      </header>

      <h3 className="event-title">{event.title}</h3>
      <p className="event-synopsis">{injectGlosses(event.synopsis, event)}</p>

      {citation?.reference ? (
        <div className="reference-block">
          <ReferenceText text={citation.reference} />
        </div>
      ) : null}

      {citation ? <CitationLine citation={citation} /> : null}
    </article>
  )
}
