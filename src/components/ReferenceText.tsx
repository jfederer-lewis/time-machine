import type { ReactNode } from 'react'

/** Renders "quoted" slices in italic full-strength; paraphrase glue quieter — Bloom pattern. */
export function ReferenceText({ text }: { text: string }) {
  const nodes: ReactNode[] = []
  const re = /"([^"]+)"/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <span key={`p-${i++}`} className="ref-paraphrase">
          {text.slice(last, match.index)}
        </span>,
      )
    }
    nodes.push(
      <span key={`q-${i++}`} className="ref-quote">
        “{match[1]}”
      </span>,
    )
    last = match.index + match[0].length
  }

  if (last < text.length) {
    nodes.push(
      <span key={`p-${i++}`} className="ref-paraphrase">
        {text.slice(last)}
      </span>,
    )
  }

  return <p className="reference-text">{nodes}</p>
}
