import { useId, useState } from 'react'
import type { ChuckEChatMessage } from '../hooks/chuck-e-types'
import type { Citation } from '../../shared/provenance'
import { GlossableText } from './GlossableText'

/** Same source URL only once in the chat footer. */
function dedupeCitationsForDisplay(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of citations) {
    const key = (c.url || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function compactSourceLabel(c: Citation): string {
  const year = c.publishedAt?.slice(0, 4)
  const pub = c.publisher?.trim() || 'Source'
  const title = c.title?.trim()
  if (title && title.length <= 36 && !/^converse history$/i.test(title)) {
    return year ? `${title} · ${year}` : title
  }
  return year ? `${pub} · ${year}` : pub
}

/** Render light markdown-ish bold + newlines without a full markdown parser. */
function isBulletLine(line: string): boolean {
  return /^\s*(?:[•●▪◦*-]|\d+[.)])\s+\S/.test(line)
}

function renderInline(text: string, glosses: ChuckEChatMessage['glosses']) {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean)
  return parts.map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2)
      return (
        <strong key={j}>
          <GlossableText text={inner} glosses={glosses ?? []} />
        </strong>
      )
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={j}>{part.slice(1, -1)}</em>
    }
    return (
      <span key={j}>
        <GlossableText text={part} glosses={glosses ?? []} />
      </span>
    )
  })
}

function renderContent(text: string, glosses: ChuckEChatMessage['glosses']) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (!line.trim()) {
      return <div key={i} className="chuck-e-msg__gap" aria-hidden="true" />
    }
    const bullet = isBulletLine(line)
    return (
      <p
        key={i}
        className={['chuck-e-msg__line', bullet ? 'chuck-e-msg__line--bullet' : '']
          .filter(Boolean)
          .join(' ')}
      >
        {renderInline(line, glosses)}
      </p>
    )
  })
}

/** Collapsed-by-default source inventory under assistant replies. */
function MessageSources({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const list = citations.slice(0, 6)
  const count = list.length
  if (count === 0) return null

  return (
    <div className={['chuck-e-msg__sources', open ? 'is-open' : ''].filter(Boolean).join(' ')}>
      <button
        type="button"
        className="chuck-e-msg__sources-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="chuck-e-msg__sources-label">
          {count === 1 ? 'Source' : 'Sources'}
          <span className="chuck-e-msg__sources-count">({count})</span>
        </span>
        <span className="chuck-e-msg__sources-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <ul id={panelId} className="chuck-e-msg__sources-list">
          {list.map((c) => (
            <li key={c.url}>
              <a
                className="chuck-e-msg__source-link"
                href={c.url}
                target="_blank"
                rel="noreferrer"
              >
                {compactSourceLabel(c)}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function ChuckEMessage({ message }: { message: ChuckEChatMessage }) {
  const isUser = message.role === 'user'
  const isDisclosure = Boolean(message.isDisclosure)
  const cites = message.citations ? dedupeCitationsForDisplay(message.citations) : []
  const showSources = !isUser && !isDisclosure && cites.length > 0

  return (
    <article
      className={[
        'chuck-e-msg',
        isUser ? 'chuck-e-msg--user' : 'chuck-e-msg--assistant',
        isDisclosure ? 'chuck-e-msg--disclosure' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isUser ? 'You' : isDisclosure ? 'AI disclosure' : 'Chuck-E'}
    >
      {!isUser && !isDisclosure ? (
        <p className="chuck-e-msg__label">Chuck-E</p>
      ) : null}
      {isDisclosure ? (
        <p className="chuck-e-msg__disclosure-label">About this assistant</p>
      ) : null}
      <div className="chuck-e-msg__body">
        {isUser || isDisclosure
          ? renderContent(message.content, undefined)
          : renderContent(message.content, message.glosses)}
      </div>
      {showSources ? <MessageSources citations={cites} /> : null}
    </article>
  )
}
