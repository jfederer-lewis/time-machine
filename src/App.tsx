import { useCallback, useEffect, useState } from 'react'
import type { BrandConfig } from '../shared/brand'
import type { DateQueryResult, ProviderStatus } from '../shared/provenance'
import { converseBrand } from '../shared/brands/converse'
import { DateDial } from './components/DateDial'
import { EventCard } from './components/EventCard'
import { ExportPanel } from './components/ExportPanel'
import { ProviderRail } from './components/ProviderRail'
import { TimelineView } from './components/TimelineView'

type View = 'date' | 'timeline' | 'sources'

export default function App() {
  const [brand, setBrand] = useState<BrandConfig>(converseBrand)
  const [view, setView] = useState<View>('date')
  const [date, setDate] = useState('2003-07-09')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DateQueryResult | null>(null)
  const [providers, setProviders] = useState<ProviderStatus[]>([])

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

    fetch('/api/providers')
      .then((r) => r.json())
      .then((p: ProviderStatus[]) => setProviders(p))
      .catch(() => setProviders([]))
  }, [])

  const query = useCallback(
    async (overrideDate?: string) => {
      const q = overrideDate ?? date
      if (!q) return
      if (overrideDate) setDate(overrideDate)
      setLoading(true)
      setError(null)
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
      } finally {
        setLoading(false)
      }
    },
    [date, brand.id],
  )

  useEffect(() => {
    void query()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-lockup">
          <p className="brand-name">{brand.name}</p>
          <p className="product-line">{brand.productLine}</p>
        </div>
        <nav className="view-nav" aria-label="Primary">
          {(
            [
              ['date', 'Date'],
              ['timeline', 'Timeline'],
              ['sources', 'Sources'],
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
        <main className="main">
          <section className="hero">
            <h1 className="hero-title">{brand.tagline}</h1>
            <p className="hero-claim">{brand.claimFrame}</p>

            <DateDial
              value={date}
              featured={brand.featuredDates}
              onChange={setDate}
              onSubmit={(d) => void query(d)}
              loading={loading}
            />
          </section>

          {error ? <p className="error-banner">{error}</p> : null}

          {result ? (
            <section className="results" aria-live="polite">
              <header className="results-head">
                <div>
                  <h2>{result.narrative.headline}</h2>
                  <p className="lede">{result.narrative.lede}</p>
                </div>
                <ExportPanel result={result} brand={brand} />
              </header>

              {result.brandMoments.length > 0 ? (
                <div className="card-stack">
                  <h3 className="stack-label">{brand.name}</h3>
                  {result.brandMoments.map((event) => (
                    <EventCard key={event.id} event={event} accent />
                  ))}
                </div>
              ) : null}

              <div className="card-stack">
                <h3 className="stack-label">On this day</h3>
                {result.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}
        </main>
      ) : null}

      {view === 'timeline' ? (
        <main className="main">
          <TimelineView brand={brand} />
        </main>
      ) : null}

      {view === 'sources' ? (
        <main className="main">
          <ProviderRail providers={providers} />
        </main>
      ) : null}
    </div>
  )
}
