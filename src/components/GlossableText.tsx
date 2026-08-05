import { useMemo, type ReactNode } from 'react'
import type { Gloss } from '../../shared/provenance'
import { buildGlossRanges } from './glossRanges'
import { GlossTerm } from './GlossTerm'

/** Inject Bloom-style dotted gloss terms into claim / synopsis prose. */
export function GlossableText({ text, glosses = [] }: { text: string; glosses?: Gloss[] }) {
  const ranges = useMemo(() => buildGlossRanges(text, glosses), [text, glosses])
  if (!ranges.length) return <>{text}</>

  const parts: ReactNode[] = []
  let cursor = 0
  ranges.forEach((range, index) => {
    const textBefore = range.start > cursor ? text.slice(cursor, range.start) : ''
    const termEl = (
      <GlossTerm key={`${range.gloss.term}-${range.start}-${index}`} gloss={range.gloss}>
        {text.slice(range.start, range.end)}
      </GlossTerm>
    )
    if (textBefore) parts.push(textBefore)
    parts.push(termEl)
    cursor = range.end
  })
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <>{parts}</>
}
