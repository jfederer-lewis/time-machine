import { useCallback, useState } from 'react'
import type { ChuckECliffNotes } from '../hooks/chuck-e-types'
import { CitationLine } from './CitationLine'

interface CliffNotesPanelProps {
  notes: ChuckECliffNotes
  onClose: () => void
}

function FootnoteMarks({ noteIds }: { noteIds: number[] }) {
  if (!noteIds.length) return null
  return (
    <span className="cliff-notes__marks">
      {noteIds.map((n) => (
        <a
          key={n}
          className="cliff-notes__mark"
          href={`#cliff-note-${n}`}
          aria-label={`Note ${n}`}
        >
          [{n}]
        </a>
      ))}
    </span>
  )
}

export function CliffNotesPanel({ notes, onClose }: CliffNotesPanelProps) {
  const [copied, setCopied] = useState(false)

  const copyPlain = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(notes.plainText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [notes.plainText])

  const download = useCallback(() => {
    const blob = new Blob([notes.plainText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chuck-e-cliff-notes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [notes.plainText])

  return (
    <aside className="cliff-notes" aria-label="Editorial cliff notes">
      <header className="cliff-notes__head">
        <h3 className="cliff-notes__title">Cliff notes</h3>
        <button type="button" className="cliff-notes__close" onClick={onClose} aria-label="Close cliff notes">
          ×
        </button>
      </header>

      <p className="cliff-notes__banner" role="note">
        {notes.aiBanner}
      </p>

      <h4 className="cliff-notes__heading">{notes.title}</h4>

      <ul className="cliff-notes__bullets">
        {notes.bullets.map((b, i) => (
          <li key={i}>
            {b.text}
            <FootnoteMarks noteIds={b.noteIds} />
          </li>
        ))}
      </ul>

      {notes.citations.length > 0 ? (
        <div className="cliff-notes__sources">
          <p className="cliff-notes__sources-label">Notes</p>
          <ol className="cliff-notes__notes-list">
            {notes.citations.map((c, i) => {
              const n = i + 1
              return (
                <li key={c.url + c.title} id={`cliff-note-${n}`} className="cliff-notes__note">
                  <span className="cliff-notes__note-num" aria-hidden="true">
                    [{n}]
                  </span>
                  <div className="cliff-notes__note-body">
                    <CitationLine citation={c} />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      ) : null}

      <p className="cliff-notes__footer">{notes.footer}</p>

      <div className="cliff-notes__actions">
        <button type="button" className="btn-secondary" onClick={() => void copyPlain()}>
          {copied ? 'Copied' : 'Copy brief'}
        </button>
        <button type="button" className="btn-secondary" onClick={download}>
          Download .txt
        </button>
      </div>
    </aside>
  )
}
