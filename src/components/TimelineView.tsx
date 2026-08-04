import type { BrandConfig } from '../../shared/brand'
import { EventCard } from './EventCard'
import type { CulturalEvent } from '../../shared/provenance'

export function TimelineView({ brand }: { brand: BrandConfig }) {
  const events: CulturalEvent[] = brand.timeline.map((m) => ({
    id: m.id,
    year: Number(m.date.slice(0, 4)),
    title: m.title,
    synopsis: m.synopsis,
    category: 'brand',
    precision: m.precision,
    needsHumanReview: m.precision === 'period-estimate',
    citations: [
      {
        title: m.citation.title,
        url: m.citation.url,
        publisher: m.citation.publisher,
        author: m.citation.author,
        publishedAt: m.citation.publishedAt,
        accessedAt: new Date().toISOString(),
        sourceQuality: m.precision === 'period-estimate' ? 'needs-human-review' : 'curated-fallback',
        evidenceKind: m.isExactQuote ? 'quote' : 'paraphrase',
        reference: m.reference,
        provider: 'brand-timeline',
        isExactQuote: m.isExactQuote,
      },
    ],
  }))

  return (
    <section className="timeline-view" aria-label={`${brand.name} timeline`}>
      <header className="section-head">
        <h2>{brand.name}</h2>
        <p className="section-lede">{brand.heritageNote}</p>
      </header>
      <ol className="timeline-rail">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} accent />
          </li>
        ))}
      </ol>
    </section>
  )
}
