import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BrandConfig } from '../shared/brand'
import type { CulturalEvent, DateQueryResult, ResearchMode } from '../shared/provenance'
import { converseBrand } from '../shared/brands/converse'
import { CitationLine } from './components/CitationLine'
import { DateDial } from './components/DateDial'
import { TimelineView, type TimelineAxis } from './components/TimelineView'

type View = 'date' | 'timeline'

const MODE_STORAGE_KEY = 'tm-research-mode'

const MODE_OPTIONS: { id: ResearchMode; label: string; description: string }[] = [
  {
    id: 'lite',
    label: 'Lite',
    description: 'Wikipedia On This Day only — free, no API credits.',
  },
  {
    id: 'full',
    label: 'Full',
    description: 'Perplexity discovery + Gemini phrasing — uses paid keys.',
  },
]

function readStoredMode(): ResearchMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY)
    if (stored === 'lite' || stored === 'full') return stored
  } catch {
    // ignore — private mode / SSR
  }
  return 'lite'
}

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

/** Local calendar date as YYYY-MM-DD (not UTC — avoids off-by-one near midnight). */
function todayQueryDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function App() {
  const [brand, setBrand] = useState<BrandConfig>(converseBrand)
  const [view, setView] = useState<View>('date')
  const [timelineAxis, setTimelineAxis] = useState<TimelineAxis>('vertical')
  const [date, setDate] = useState(todayQueryDate)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DateQueryResult | null>(null)
  const [hasQueried, setHasQueried] = useState(false)
  const [researchMode, setResearchMode] = useState<ResearchMode>('lite')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setResearchMode(readStoredMode())
  }, [])

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

  const selectMode = useCallback((mode: ResearchMode) => {
    setResearchMode(mode)
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode)
    } catch {
      // ignore
    }
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
          mode: researchMode,
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
    [date, brand.id, researchMode],
  )

  const spotlight = useMemo(() => (result ? pickSpotlight(result) : null), [result])

  return (
    <div
      className={[
        'shell',
        hasQueried && result ? 'shell--revealed' : '',
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
        <div className="topbar-actions">
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
          <button
            type="button"
            className={['settings-toggle', settingsOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
            aria-expanded={settingsOpen}
            aria-controls="research-settings"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            Settings
          </button>
        </div>
      </header>

      {settingsOpen ? (
        <div className="settings-bar" id="research-settings">
          <p className="settings-bar__label">Research mode</p>
          <div className="settings-modes" role="radiogroup" aria-label="Research mode">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={researchMode === opt.id}
                className={[
                  'settings-mode',
                  researchMode === opt.id ? 'is-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectMode(opt.id)}
              >
                <span className="settings-mode__name">{opt.label}</span>
                <span className="settings-mode__desc">{opt.description}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {view === 'date' ? (
        <main className="main main--entry">
          <section className="hero">
            <h1 className="hero-brand">{brand.tagline}</h1>
            <p className="hero-lede">{brand.lookupIntro}</p>
            <DateDial
              value={date}
              featured={[]}
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

          {result ? (
            <section className="results results--reveal" aria-live="polite">
              <header className="results-head">
                <h2 className="result-frame">
                  <span className="result-frame__claim">{brand.claimFrame}</span>
                  <span className="result-frame__date">{result.displayDate}</span>
                </h2>
                <p className="mode-chip" data-mode={result.researchMode}>
                  {result.researchMode === 'lite' ? 'Lite · Wikipedia' : 'Full · Perplexity + Gemini'}
                </p>
              </header>

              {spotlight ? (
                <article className="spotlight">
                  <h3 className="spotlight-title">{spotlight.title}</h3>
                  <p className="spotlight-line">{firstSentence(spotlight.synopsis)}</p>
                  {spotlight.citations[0] ? (
                    <div className="spotlight-source">
                      <p className="spotlight-label">Source</p>
                      <CitationLine citation={spotlight.citations[0]} />
                    </div>
                  ) : null}
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
