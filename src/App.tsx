import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BrandConfig } from '../shared/brand'
import type { DateQueryResult, ProviderStatus } from '../shared/provenance'
import { converseBrand } from '../shared/brands/converse'
import { DateDial } from './components/DateDial'
import { EventCard } from './components/EventCard'
import { ExportPanel } from './components/ExportPanel'
import { ProviderRail } from './components/ProviderRail'
import { TimelineView } from './components/TimelineView'

type View = 'doorway' | 'timeline' | 'pipeline'

export default function App() {
  const [brand, setBrand] = useState<BrandConfig>(converseBrand)
  const [view, setView] = useState<View>('doorway')
  const [date, setDate] = useState('1917-01-01')
  const [liveWiki, setLiveWiki] = useState(false)
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
          fallback: liveWiki ? '0' : '1',
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
    [date, brand.id, liveWiki],
  )

  useEffect(() => {
    void query()
    // initial load only once brand/date settle — intentional single shot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const modeLabel = useMemo(() => {
    if (!result) return null
    if (result.resolvedMode === 'exact') return 'Exact calendar matches'
    if (result.resolvedMode === 'period-estimate') return 'Period estimate'
    return 'Mixed exact + estimate'
  }, [result])

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
              ['doorway', 'Doorway'],
              ['timeline', 'Timeline'],
              ['pipeline', 'Pipeline'],
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

      {view === 'doorway' ? (
        <main className="main">
          <section className="hero">
            <p className="eyebrow">Idea 01</p>
            <h1 className="hero-title">{brand.tagline}</h1>
            <p className="hero-claim">{brand.claimFrame}</p>
            <p className="hero-note">{brand.heritageNote}</p>

            <DateDial
              value={date}
              featured={brand.featuredDates}
              onChange={setDate}
              onSubmit={(d) => void query(d)}
              loading={loading}
            />

            <label className="live-toggle">
              <input
                type="checkbox"
                checked={liveWiki}
                onChange={(e) => setLiveWiki(e.target.checked)}
              />
              <span>
                Live Wikipedia On This Day
                <em> (off = curated fallback for demos)</em>
              </span>
            </label>
          </section>

          {error ? <p className="error-banner">{error}</p> : null}

          {result ? (
            <section className="results" aria-live="polite">
              <header className="results-head">
                <div>
                  <p className="eyebrow">{modeLabel}</p>
                  <h2>{result.narrative.headline}</h2>
                  <p className="date-path">
                    {result.displayDate}
                    <span aria-hidden="true"> · </span>
                    <code>{result.datePath}</code>
                  </p>
                  <p className="lede">{result.narrative.lede}</p>
                  <p className="disclaimer">{result.narrative.disclaimer}</p>
                </div>
                <div className="results-meta">
                  <p>
                    Voice · <strong>{result.narrative.voice}</strong>
                  </p>
                  <p>
                    Providers · {result.providersUsed.join(', ') || '—'}
                  </p>
                  {result.usingFallback ? <p className="fallback-flag">Fallback pack</p> : null}
                  <ExportPanel result={result} brand={brand} />
                </div>
              </header>

              {result.brandMoments.length > 0 ? (
                <div className="card-stack">
                  <h3 className="stack-label">{brand.name} on this date / year</h3>
                  {result.brandMoments.map((event) => (
                    <EventCard key={event.id} event={event} accent />
                  ))}
                </div>
              ) : null}

              <div className="card-stack">
                <h3 className="stack-label">Culture on this date</h3>
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

      {view === 'pipeline' ? (
        <main className="main">
          <ProviderRail providers={providers} />
        </main>
      ) : null}

      <footer className="site-footer">
        <p>
          Time Machine press prototype · citations before claims · plug-and-play brand packs
        </p>
      </footer>
    </div>
  )
}
