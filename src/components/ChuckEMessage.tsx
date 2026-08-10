import { useId, useState } from 'react'
import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import type { Citation } from '../../shared/provenance'
import type { ChuckEChatMessage } from '../hooks/chuck-e-types'
import { GlossableText } from './GlossableText'
import { LoadingIndicator } from './LoadingIndicator'

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

/** Article title · publisher · year — linkable, no raw URL text. */
function sourceInventoryLabel(c: Citation): string {
  const title = c.title?.trim() || 'Untitled'
  const pub = c.publisher?.trim() || 'Source'
  const year = c.publishedAt?.match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1]
  if (year) return `${title} · ${pub} · ${year}`
  return `${title} · ${pub}`
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

/** Collapsed-by-default deeper-reading links under assistant replies. */
function MessageReadMore({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const list = citations.slice(0, 8)
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
          Read more
          <span className="chuck-e-msg__sources-count">({count})</span>
        </span>
        <span className="chuck-e-msg__sources-chevron" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="chuck-e-msg__sources-panel">
          <ul className="chuck-e-msg__sources-list">
            {list.map((c) => (
              <li key={c.url}>
                <a
                  className="chuck-e-msg__source-link"
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sourceInventoryLabel(c)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function ChuckEMessage({
  message,
  statusLabel,
}: {
  message: ChuckEChatMessage
  /** Shown while waiting for the first streamed token. */
  statusLabel?: string
}) {
  const isUser = message.role === 'user'
  const isDisclosure = Boolean(message.isDisclosure)
  const isStreaming = Boolean(message.streaming)
  const cites = message.citations ? dedupeCitationsForDisplay(message.citations) : []
  const showReadMore = !isUser && !isDisclosure && !isStreaming && cites.length > 0
  const waitingForTokens = isStreaming && !message.content.trim()

  return (
    <article
      className={[
        'chuck-e-msg',
        isUser ? 'chuck-e-msg--user' : 'chuck-e-msg--assistant',
        isDisclosure ? 'chuck-e-msg--disclosure' : '',
        isStreaming ? 'chuck-e-msg--streaming' : '',
        waitingForTokens ? 'chuck-e-msg--pending' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={isUser ? 'You' : isDisclosure ? 'AI disclosure' : 'Chuck-E'}
      aria-busy={isStreaming || undefined}
    >
      {!isUser && !isDisclosure ? (
        <p className="chuck-e-msg__label">Chuck-E</p>
      ) : null}
      {isDisclosure ? (
        <p className="chuck-e-msg__disclosure-label">About this assistant</p>
      ) : null}
      {waitingForTokens ? (
        <LoadingIndicator compact label={statusLabel || CHUCK_E_KNOBS.streamStatusResearching[0]} />
      ) : (
        <div className="chuck-e-msg__body">
          {isUser || isDisclosure
            ? renderContent(message.content, undefined)
            : renderContent(message.content, isStreaming ? undefined : message.glosses)}
          {isStreaming && message.content ? (
            <span className="chuck-e-msg__cursor" aria-hidden="true" />
          ) : null}
        </div>
      )}
      {showReadMore ? <MessageReadMore citations={cites} /> : null}
    </article>
  )
}
