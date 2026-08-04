import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Gloss } from '../../shared/provenance'

export function GlossTerm({ gloss, children }: { gloss: Gloss; children: ReactNode }) {
  const id = useId()
  const ref = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)

  const show = () => {
    if (ref.current) setRect(ref.current.getBoundingClientRect())
    setOpen(true)
  }

  const hide = () => {
    if (pinned) return
    setOpen(false)
  }

  useEffect(() => {
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="gloss-term"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => {
          if (closeTimer.current) window.clearTimeout(closeTimer.current)
          openTimer.current = window.setTimeout(show, 160)
        }}
        onMouseLeave={() => {
          if (openTimer.current) window.clearTimeout(openTimer.current)
          closeTimer.current = window.setTimeout(hide, 180)
        }}
        onClick={() => {
          setPinned((p) => !p)
          show()
        }}
      >
        {children}
      </button>
      {open && rect
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className="gloss-popover"
              style={{
                top: rect.bottom + window.scrollY + 8,
                left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
              }}
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current)
              }}
              onMouseLeave={() => {
                closeTimer.current = window.setTimeout(hide, 180)
              }}
            >
              <p className="gloss-term-label">{gloss.term}</p>
              {gloss.period ? <p className="gloss-period">{gloss.period}</p> : null}
              <p className="gloss-body">{gloss.gloss}</p>
              {gloss.source !== 'ai' && gloss.url ? (
                <a href={gloss.url} target="_blank" rel="noreferrer" className="gloss-link">
                  open {gloss.sourceLabel || gloss.source} →
                </a>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
