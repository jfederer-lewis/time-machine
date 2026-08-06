import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { BrandConfig } from '../../shared/brand'
import type { ResearchMode } from '../../shared/provenance'
import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import { useChuckEChat } from '../hooks/useChuckEChat'
import { ChuckEMessage } from './ChuckEMessage'
import { CliffNotesPanel } from './CliffNotesPanel'

interface ChuckEWidgetProps {
  brand: BrandConfig
  researchMode?: ResearchMode
}

export function ChuckEWidget({ brand, researchMode = 'lite' }: ChuckEWidgetProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    loading,
    error,
    cliffNotes,
    cliffLoading,
    openSession,
    send,
    extractCliffNotes,
    reset,
    clearCliffNotes,
  } = useChuckEChat({ brandId: brand.id, researchMode })

  useEffect(() => {
    if (open && messages.length === 0) {
      void openSession()
    }
  }, [open, messages.length, openSession])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open, cliffNotes, loading])

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void send(text)
  }

  return (
    <div className={['chuck-e', open ? 'chuck-e--open' : ''].filter(Boolean).join(' ')}>
      {open ? (
        <section className="chuck-e-panel" aria-label={`${CHUCK_E_KNOBS.agentName} chat`} role="dialog" aria-modal="false">
          <header className="chuck-e-panel__head">
            <div>
              <p className="chuck-e-panel__name">{CHUCK_E_KNOBS.agentName}</p>
              <p className="chuck-e-panel__sub">Press research notes · not finished copy</p>
            </div>
            <div className="chuck-e-panel__head-actions">
              <button
                type="button"
                className="chuck-e-icon-btn"
                onClick={() => reset()}
                aria-label="New conversation"
                title="New conversation"
              >
                ↻
              </button>
              <button
                type="button"
                className="chuck-e-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close Chuck-E"
              >
                ×
              </button>
            </div>
          </header>

          <div className="chuck-e-panel__body" ref={listRef}>
            {messages.map((m, i) => (
              <ChuckEMessage key={`${m.role}-${i}-${m.content.slice(0, 24)}`} message={m} />
            ))}
            {loading ? (
              <p className="chuck-e-pending" aria-live="polite">
                Looking that up…
              </p>
            ) : null}
            {error ? <p className="chuck-e-error">{error}</p> : null}

            {cliffNotes ? (
              <CliffNotesPanel notes={cliffNotes} onClose={clearCliffNotes} />
            ) : null}
          </div>

          <footer className="chuck-e-panel__foot">
            <div className="chuck-e-panel__tools">
              <button
                type="button"
                className="btn-secondary chuck-e-cliff-btn"
                disabled={cliffLoading || messages.filter((m) => !m.isDisclosure).length < 2}
                onClick={() => void extractCliffNotes()}
              >
                {cliffLoading ? 'Extracting…' : 'Extract cliff notes'}
              </button>
            </div>
            <form className="chuck-e-composer" onSubmit={onSubmit}>
              <textarea
                ref={inputRef}
                className="chuck-e-composer__input"
                rows={2}
                placeholder="Ask about the new Chuck, heritage, or a date…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSubmit(e)
                  }
                }}
                disabled={loading}
                aria-label="Message Chuck-E"
              />
              <button type="submit" className="btn-primary chuck-e-composer__send" disabled={loading || !draft.trim()}>
                Send
              </button>
            </form>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className="chuck-e-launcher"
        aria-expanded={open}
        aria-controls={open ? undefined : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="chuck-e-launcher__mark" aria-hidden="true">
          E
        </span>
        <span className="chuck-e-launcher__label">{open ? 'Close' : CHUCK_E_KNOBS.agentName}</span>
      </button>
    </div>
  )
}
