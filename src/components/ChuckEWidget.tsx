import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { BrandConfig } from '../../shared/brand'
import type { ResearchMode } from '../../shared/provenance'
import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import { useChuckEChat } from '../hooks/useChuckEChat'
import { looksLikeCompleteQuery, useSpeechDictation } from '../hooks/useSpeechDictation'
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
  const draftRef = useRef(draft)
  draftRef.current = draft

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

  const loadingRef = useRef(loading)
  loadingRef.current = loading

  const onUtteranceEnd = useCallback(
    (text: string) => {
      if (loadingRef.current) return
      if (!looksLikeCompleteQuery(text)) {
        setDraft(text)
        return
      }
      setDraft('')
      void send(text)
    },
    [send],
  )

  const {
    supported: voiceSupported,
    listening,
    error: voiceError,
    clearError: clearVoiceError,
    toggle: toggleVoice,
    abort: abortVoice,
  } = useSpeechDictation({
    onTranscript: setDraft,
    getBaseDraft: () => draftRef.current,
    onUtteranceEnd,
  })

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
    } else {
      abortVoice()
    }
  }, [open, abortVoice])

  useEffect(() => {
    if (loading) abortVoice()
  }, [loading, abortVoice])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    abortVoice()
    setDraft('')
    void send(text)
  }

  const showPromptHints =
    !loading && messages.length > 0 && messages.every((m) => m.isDisclosure)

  const sendHint = (text: string) => {
    abortVoice()
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
                className="chuck-e-icon-btn chuck-e-icon-btn--minimise"
                onClick={() => setOpen(false)}
                aria-label="Minimise Chuck-E"
                title="Minimise"
              >
                <span className="chuck-e-minimise-glyph" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className="chuck-e-panel__body" ref={listRef}>
            {messages.map((m, i) => (
              <ChuckEMessage key={`${m.role}-${i}-${m.content.slice(0, 24)}`} message={m} />
            ))}
            {showPromptHints ? (
              <div className="chuck-e-hints" aria-label={CHUCK_E_KNOBS.promptHintsLabel}>
                <p className="chuck-e-hints__label">{CHUCK_E_KNOBS.promptHintsLabel}</p>
                <ul className="chuck-e-hints__list">
                  {CHUCK_E_KNOBS.promptHints.map((hint) => (
                    <li key={hint}>
                      <button
                        type="button"
                        className="chuck-e-hints__prompt"
                        onClick={() => sendHint(hint)}
                      >
                        {hint}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {loading ? (
              <p className="chuck-e-pending" aria-live="polite">
                Looking that up…
              </p>
            ) : null}
            {error ? <p className="chuck-e-error">{error}</p> : null}
            {voiceError ? (
              <p className="chuck-e-error" role="status">
                {voiceError}{' '}
                <button type="button" className="chuck-e-inline-dismiss" onClick={clearVoiceError}>
                  Dismiss
                </button>
              </p>
            ) : null}

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
              <div
                className={[
                  'chuck-e-composer__field',
                  voiceSupported ? 'chuck-e-composer__field--with-mic' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <textarea
                  ref={inputRef}
                  className="chuck-e-composer__input"
                  rows={4}
                  placeholder={
                    listening
                      ? 'Listening… pause when finished'
                      : CHUCK_E_KNOBS.composerPlaceholder
                  }
                  value={draft}
                  onChange={(e) => {
                    if (listening) abortVoice()
                    setDraft(e.target.value)
                    clearVoiceError()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      onSubmit(e)
                    }
                  }}
                  disabled={loading}
                  aria-label="Message Chuck-E"
                />
                {voiceSupported ? (
                  <button
                    type="button"
                    className={[
                      'chuck-e-composer__mic',
                      listening ? 'chuck-e-composer__mic--listening' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => toggleVoice()}
                    disabled={loading}
                    aria-pressed={listening}
                    aria-label={listening ? 'Stop dictation' : 'Dictate with microphone'}
                    title={listening ? 'Stop dictation' : 'Dictate (Chrome / Edge)'}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                    </svg>
                  </button>
                ) : null}
              </div>
              <button
                type="submit"
                className="chuck-e-composer__send"
                disabled={loading || !draft.trim()}
                aria-label="Send message"
                title="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.4 20.6 21 12 3.4 3.4l.05 6.65L15 12 3.45 13.95l-.05 6.65z" />
                </svg>
              </button>
            </form>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className={['chuck-e-launcher', open ? 'chuck-e-launcher--open' : ''].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-label={open ? 'Minimise Chuck-E' : CHUCK_E_KNOBS.launcherLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <span className="chuck-e-launcher__minimise" aria-hidden="true" />
        ) : (
          <>
            <span className="chuck-e-launcher__mark" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                {/* All Star–style five-point star */}
                <path d="M12 2.2l2.55 7.05H22l-5.85 4.35 2.2 7.1L12 16.9l-6.35 3.8 2.2-7.1L2 9.25h7.45L12 2.2z" />
              </svg>
            </span>
            <span className="chuck-e-launcher__label">{CHUCK_E_KNOBS.launcherLabel}</span>
          </>
        )}
      </button>
    </div>
  )
}
