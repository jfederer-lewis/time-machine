import type { ChuckEChatMessage } from '../hooks/chuck-e-types'
import type { Citation } from '../../shared/provenance'
import { CitationLine } from './CitationLine'
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

/** Render light markdown-ish bold + newlines without a full markdown parser. */
function renderContent(text: string, glosses: ChuckEChatMessage['glosses']) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean)
    return (
      <span key={i}>
        {parts.map((part, j) => {
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
        })}
        {i < lines.length - 1 ? <br /> : null}
      </span>
    )
  })
}

export function ChuckEMessage({ message }: { message: ChuckEChatMessage }) {
  const isUser = message.role === 'user'
  const isDisclosure = Boolean(message.isDisclosure)

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
      {message.citations && message.citations.length > 0 ? (
        <div className="chuck-e-msg__cites">
          {dedupeCitationsForDisplay(message.citations)
            .slice(0, 4)
            .map((c) => (
              <CitationLine key={c.url} citation={c} />
            ))}
        </div>
      ) : null}
    </article>
  )
}
