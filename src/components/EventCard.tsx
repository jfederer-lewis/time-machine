import type { CulturalEvent } from '../../shared/provenance'
import { CitationLine } from './CitationLine'
import { GlossableText } from './GlossableText'
import { ReferenceText } from './ReferenceText'

export function EventCard({ event, accent }: { event: CulturalEvent; accent?: boolean }) {
  const citation = event.citations[0]

  return (
    <article className={`event-card${accent ? ' event-card--brand' : ''}`}>
      <header className="event-card__meta">
        <span className="event-year">{event.year}</span>
      </header>

      <h3 className="event-title">{event.title}</h3>
      <p className="event-synopsis">
        <GlossableText text={event.synopsis} glosses={event.glosses ?? []} />
      </p>

      {citation?.reference ? (
        <div className="reference-block">
          <ReferenceText text={citation.reference} />
        </div>
      ) : null}

      {citation ? <CitationLine citation={citation} /> : null}
    </article>
  )
}
