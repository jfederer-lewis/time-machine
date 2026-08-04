import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BrandConfig } from '../shared/brand'
import type { CulturalEvent, DateQueryResult } from '../shared/provenance'
import { converseBrand } from '../shared/brands/converse'
import { DateDial } from './components/DateDial'
import { ExportPanel } from './components/ExportPanel'
import { TimelineView, type TimelineAxis } from './components/TimelineView'

type View = 'date' | 'timeline'

function firstSentence(text: string) {
  const trimmed = text.trim()
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/)
  return match ? match[1] : trimmed
}

function pickSpotlight(result: DateQueryResult): CulturalEvent | null {
  const exact = result.events.filter((e) => e.precision === 'exact-day')
  const around = result.events.filter((e) => e.precision !== 'exact-day')
  return exact[0] ?? around[0] ?? result.brandMoments[0] ?? null
}

export default function App() {
  const [brand, setBrand] = useState<BrandConfig>(converseBrand)
  const [view, setView] = useState<View>('date')
  const [timelineAxis, setTimelineAxis] = useState<TimelineAxis>('vertical')
  const [date, setDate] = useState('2003-07-09')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DateQueryResult | null>(null)
  const [hasQueried, setHasQueried] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty('--ink', brand.palette.ink)
    document.documentElement.style.setProperty('--paper', brand.palette.paper)
    document.documentElement.style.setProperty('--muted', brand.palette.muted)
    document.documentElement.style.setProperty('--rule', brand.palette.rule)
    document.documentElement.style.setProperty('--accent', brand.palette.accent)
    document.documentElement.style.setProperty('--accent-soft', brand.palette.accentSoft)
    document.documentElement.style.setProperty('--estimate', brand.palette.estimate)
  }, [brand])

  useEffect(() => {
    fetch('/api/brand')
      .then((r) => r.json())
      .then((b: BrandConfig) => setBrand(b))
      .catch(() => setBrand(converseBrand))
  }, [])

  const query = useCallback(
    async (overrideDate?: string) => {
      const q = overrideDate ?? date
      if (!q) return
      if (overrideDate) setDate(overrideDate)
      setLoading(true)
      setError(null)
      setHasQueried(true)
      try {
        const params = new URLSearchParams({
          date: q,
          brand: brand.id,
        })
        const res = await fetch(`/api/query?${params}`)
        if (!res.ok) throw new Error(`Query failed (${res.status})`)
        const data = (await res.json()) as DateQueryResult
        setResult(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Query failed')
        setResult(null)
      } finally {
        setLoading(false)
      }
    },
    [date, brand.id],
  )

  const spotlight = useMemo(() => (result ? pickSpotlight(result) : null), [result])

  const formulaHeadline = result
    ? `${brand.claimFrame} · ${result.displayDate}`
    : null

  return (
    <div
      className={[
        'shell',
        hasQueried && result ? 'shell--revealed' : '',
        view === 'timeline' ? 'shell--timeline' : '',
        view === 'timeline' && timelineAxis === 'horizontal' ? 'shell--timeline-h' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="topbar">
        <div className="brand-lockup">
          <p className="brand-name">{brand.name}</p>
          <p className="product-line">{brand.productLine}</p>
        </div>
        <nav className="view-nav" aria-label="Primary">
          {(
            [
              ['date', 'Lookup'],
              ['timeline', 'Timeline'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? 'is-active' : undefined}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'date' ? (
        <main className="main main--entry">
          <section className="hero">
            <h1 className="hero-brand">{brand.tagline}</h1>
            <DateDial
              value={date}
              featured={brand.featuredDates}
              onChange={setDate}
              onSubmit={(d) => void query(d)}
              loading={loading}
              autoFocus
            />
          </section>

          {error ? <p className="error-banner">{error}</p> : null}

          {loading && !result ? (
            <p className="results-pending" aria-live="polite">
              Fetching…
            </p>
          ) : null}

          {result && formulaHeadline ? (
            <section className="results results--reveal" aria-live="polite">
              <header className="results-head">
                <h2 className="result-frame">{formulaHeadline}</h2>
                <div className="results-export">
                  <ExportPanel result={result} brand={brand} />
                </div>
              </header>

              {spotlight ? (
                <article className="spotlight">
                  <p className="spotlight-label">Fact</p>
                  <h3 className="spotlight-title">{spotlight.title}</h3>
                  <p className="spotlight-line">{firstSentence(spotlight.synopsis)}</p>
                </article>
              ) : (
                <p className="empty-day">No fact on record for this date.</p>
              )}
            </section>
          ) : null}
        </main>
      ) : null}

      {view === 'timeline' ? (
        <main className="main main--timeline">
          <TimelineView brand={brand} axis={timelineAxis} onAxisChange={setTimelineAxis} />
        </main>
      ) : null}
    </div>
  )
}
