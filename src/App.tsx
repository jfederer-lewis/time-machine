import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BrandConfig } from '../shared/brand'
import type { CulturalEvent, DateQueryResult, ResearchMode } from '../shared/provenance'
import { converseBrand } from '../shared/brands/converse'
import { CitationLine } from './components/CitationLine'
import { ChuckEWidget } from './components/ChuckEWidget'
import { DateDial } from './components/DateDial'
import { GlossableText } from './components/GlossableText'
import { TimelineView, type TimelineAxis } from './components/TimelineView'
import converseLogo from './assets/converse-logo.png'

type View = 'date' | 'timeline'
type ChuckFontSize = 'md' | 'lg' | 'xl'

const MODE_STORAGE_KEY = 'tm-research-mode'
const CHUCK_FONT_STORAGE_KEY = 'tm-chuck-e-font'

const MODE_OPTIONS: { id: ResearchMode; label: string; description: string }[] = [
  {
    id: 'lite',
    label: 'Lite',
    description: 'On This Day + History.com + Wikipedia discovery; Gemini phrasing — no Perplexity cite upgrades.',
  },
  {
    id: 'full',
    label: 'Full',
    description: 'Verify claims, write prose, upgrade cites via Gemini + Perplexity.',
  },
]

const CHUCK_FONT_OPTIONS: { id: ChuckFontSize; label: string; desc: string }[] = [
  { id: 'md', label: 'Medium', desc: 'Compact chat text.' },
  { id: 'lg', label: 'Large', desc: 'Easier desk reading (default).' },
  { id: 'xl', label: 'Extra large', desc: 'Biggest chat text.' },
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

function readStoredChuckFont(): ChuckFontSize {
  try {
    const stored = localStorage.getItem(CHUCK_FONT_STORAGE_KEY)
    if (stored === 'md' || stored === 'lg' || stored === 'xl') return stored
  } catch {
    // ignore
  }
  return 'lg'
}

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const abbrevRegex = /\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|Gen|Sen|Rep|Gov|Col|Capt|Sgt|vs|ca|approx|etc|Co|Corp|Inc|Ltd|U\.S|U\.K|U\.N|B\.B\.C|A\.M|P\.M|A\.D|B\.C)\.$/i

  const sentences: string[] = []
  let currentStart = 0

  const boundaryRegex = /([.!?])(?:\s|$)/g
  let match: RegExpExecArray | null

  while ((match = boundaryRegex.exec(cleaned)) !== null) {
    const puncIndex = match.index
    const sentenceCandidate = cleaned.slice(currentStart, puncIndex + 1).trim()

    const isSingleLetterAbbrev = /[A-Za-z]\.$/.test(sentenceCandidate) && !/[A-Za-z]{2,}\.$/.test(sentenceCandidate)
    const isKnownAbbrev = abbrevRegex.test(sentenceCandidate)

    if (!isSingleLetterAbbrev && !isKnownAbbrev) {
      sentences.push(sentenceCandidate)
      currentStart = boundaryRegex.lastIndex
    }
  }

  const remainder = cleaned.slice(currentStart).trim()
  if (remainder) {
    sentences.push(remainder)
  }

  return sentences
}

function firstSentence(text: string): string {
  const sentences = splitSentences(text)
  return sentences[0] || text.trim()
}

function normalizeCopy(text: string) {
  return text
    .toLowerCase()
    .replace(/[.…]+$/u, '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Hide synopsis when it is just the title repeated (common on unpolished Wiki text). */
function distinctSynopsis(title: string, synopsis: string, opts?: { fullProse?: boolean }): string | null {
  const line = synopsis.trim()
  if (!line) return null
  const t = normalizeCopy(title)
  const s = normalizeCopy(line)
  if (s === t) return null
  return opts?.fullProse ? line : firstSentence(line)
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
  const [chuckFont, setChuckFont] = useState<ChuckFontSize>(readStoredChuckFont)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResearchMode(readStoredMode())
  }, [])

  useEffect(() => {
    document.documentElement.dataset.chuckFont = chuckFont
  }, [chuckFont])

  const selectChuckFont = (size: ChuckFontSize) => {
    setChuckFont(size)
    try {
      localStorage.setItem(CHUCK_FONT_STORAGE_KEY, size)
    } catch {
      // ignore
    }
  }
  useEffect(() => {
    if (!settingsOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [settingsOpen])

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

  const [anyYear, setAnyYear] = useState(false)

  const query = useCallback(
    async (overrideDate?: string, overrideAnyYear?: boolean) => {
      const q = overrideDate ?? date
      if (!q) return
      if (overrideDate) setDate(overrideDate)
      const targetAnyYear = overrideAnyYear ?? anyYear
      setLoading(true)
      setError(null)
      setHasQueried(true)
      try {
        const params = new URLSearchParams({
          date: q,
          brand: brand.id,
          mode: researchMode,
          anyYear: String(targetAnyYear),
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
    [date, brand.id, researchMode, anyYear],
  )

  const spotlight = useMemo(() => (result ? pickSpotlight(result) : null), [result])
  const spotlightLine = useMemo(
    () =>
      spotlight
        ? distinctSynopsis(spotlight.title, spotlight.synopsis, {
            // Multi-sentence prose in both modes — don’t collapse to a title-echo one-liner.
            fullProse: true,
          })
        : null,
    [spotlight],
  )
  const queryYear = result ? Number(result.queryDate.slice(0, 4)) : null
  const yearMismatch =
    spotlight != null && queryYear != null && Number.isFinite(queryYear) && spotlight.year !== queryYear

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
          <img
            className="brand-logo"
            src={converseLogo}
            alt={`${brand.name} ${brand.productLine}`}
            width={160}
            height={108}
          />
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
          <div className="settings-menu" ref={settingsRef}>
            <button
              type="button"
              className={['settings-toggle', settingsOpen ? 'is-open' : ''].filter(Boolean).join(' ')}
              aria-label="Settings"
              aria-expanded={settingsOpen}
              aria-haspopup="true"
              aria-controls="research-settings"
              onClick={() => setSettingsOpen((o) => !o)}
            >
              <svg
                className="settings-toggle__icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </button>
            {settingsOpen ? (
              <div className="settings-dropdown" id="research-settings" role="menu">
                <p className="settings-dropdown__label">Research mode</p>
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

                <p className="settings-dropdown__label" style={{ marginTop: '0.85rem' }}>Year preference</p>
                <div className="settings-modes" role="radiogroup" aria-label="Year preference">
                  {[
                    { id: false, label: 'Specific Year', desc: 'Prioritize events from the selected year.' },
                    { id: true, label: 'Any Year', desc: 'Surface the absolute best event across all of history.' },
                  ].map((opt) => (
                    <button
                      key={String(opt.id)}
                      type="button"
                      role="radio"
                      aria-checked={anyYear === opt.id}
                      className={[
                        'settings-mode',
                        anyYear === opt.id ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => {
                        setAnyYear(opt.id)
                        if (hasQueried) {
                          void query(undefined, opt.id)
                        }
                      }}
                    >
                      <span className="settings-mode__name">{opt.label}</span>
                      <span className="settings-mode__desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                <p className="settings-dropdown__label" style={{ marginTop: '0.85rem' }}>Chuck-E text size</p>
                <div className="settings-modes" role="radiogroup" aria-label="Chuck-E text size">
                  {CHUCK_FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={chuckFont === opt.id}
                      className={[
                        'settings-mode',
                        chuckFont === opt.id ? 'is-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => selectChuckFont(opt.id)}
                    >
                      <span className="settings-mode__name">{opt.label}</span>
                      <span className="settings-mode__desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

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
                {result.researchMode === 'lite' ? (
                  <p className="mode-chip" data-mode="lite">
                    Lite · day indexes
                  </p>
                ) : null}
              </header>

              {spotlight ? (
                <article className="spotlight">
                  {yearMismatch ? (
                    <p className="spotlight-label">Also on this day · {spotlight.year}</p>
                  ) : null}
                  <h3 className="spotlight-title">{spotlight.title}</h3>
                  {spotlightLine ? (
                    <p className="spotlight-line">
                      <GlossableText text={spotlightLine} glosses={spotlight.glosses ?? []} />
                    </p>
                  ) : null}
                  {spotlight.whyItMatters ? (
                    <aside className="spotlight-context" aria-label="Context / Provenance">
                      <p className="spotlight-context__label">Context / Provenance</p>
                      <p className="spotlight-context__body">{spotlight.whyItMatters}</p>
                    </aside>
                  ) : null}
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

      <ChuckEWidget brand={brand} researchMode={researchMode} />
    </div>
  )
}
