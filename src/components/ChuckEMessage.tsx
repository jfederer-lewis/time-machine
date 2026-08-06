import type { ChuckEChatMessage } from '../hooks/chuck-e-types'
import { CitationLine } from './CitationLine'

/** Render light markdown-ish bold + newlines without a full markdown parser. */
function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean)
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>
          }
          if (part.startsWith('_') && part.endsWith('_')) {
            return <em key={j}>{part.slice(1, -1)}</em>
          }
          return <span key={j}>{part}</span>
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
      {!isUser ? (
        <p className="chuck-e-msg__label">{isDisclosure ? 'Chuck-E · disclosure' : 'Chuck-E'}</p>
      ) : null}
      <div className="chuck-e-msg__body">{renderContent(message.content)}</div>
      {message.citations && message.citations.length > 0 ? (
        <div className="chuck-e-msg__cites">
          {message.citations.slice(0, 3).map((c) => (
            <CitationLine key={c.url + c.title} citation={c} />
          ))}
        </div>
      ) : null}
    </article>
  )
}
