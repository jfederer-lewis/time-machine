import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Gloss } from '../../shared/provenance'

const OPEN_DELAY_MS = 160
const CLOSE_DELAY_MS = 180

/** Compact source link — publication / short article name, not a Harvard dump. */
function certifiedFooter(gloss: Gloss): { href: string; label: string } | null {
  if (!gloss.url || gloss.source === 'ai') return null
  const pub =
    gloss.sourceLabel?.replace(/\s*\(\d{4}\)\s*$/, '').trim() ||
    (gloss.source === 'wikipedia' ? 'Wikipedia' : 'Source')
  const title = gloss.originator?.trim()
  const shortTitle =
    title && title.length <= 40 && !/^converse history$/i.test(title) ? title : null
  return {
    href: gloss.url,
    label: shortTitle ? `Read more — ${shortTitle}` : `Read more — ${pub}`,
  }
}

/** Bloom-inspired dotted term + fixed popover (hover preview, click to pin). */
export function GlossTerm({ gloss, children }: { gloss: Gloss; children: ReactNode }) {
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  const openTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const pinnedRef = useRef(false)
  pinnedRef.current = pinned

  const clearTimers = useCallback(() => {
    if (openTimer.current) window.clearTimeout(openTimer.current)
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    openTimer.current = null
    closeTimer.current = null
  }, [])

  const refreshRect = useCallback(() => {
    if (ref.current) setRect(ref.current.getBoundingClientRect())
  }, [])

  const show = useCallback(() => {
    clearTimers()
    refreshRect()
    setOpen(true)
  }, [clearTimers, refreshRect])

  const hide = useCallback(() => {
    if (pinnedRef.current) return
    clearTimers()
    setOpen(false)
  }, [clearTimers])

  const close = useCallback(() => {
    clearTimers()
    setPinned(false)
    setOpen(false)
  }, [clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  useEffect(() => {
    if (!open) return undefined

    const onScrollOrResize = () => refreshRect()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)

    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (ref.current?.contains(target)) return
      const pop = document.getElementById(id)
      if (pop?.contains(target)) return
      close()
    }

    // Defer so the pin click doesn't immediately close.
    const timer = window.setTimeout(() => {
      window.addEventListener('pointerdown', onPointer)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [close, id, open, refreshRect])

  const footer = certifiedFooter(gloss)
  const sourceClass =
    gloss.source === 'wikipedia'
      ? 'gloss-popover--wiki'
      : gloss.source === 'curated'
        ? 'gloss-popover--curated'
        : 'gloss-popover--ai'

  const popoverStyle = (() => {
    if (!rect) return undefined
    const width = Math.min(280, window.innerWidth - 28)
    const left = Math.max(14, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 14))
    const top = Math.min(rect.bottom + 8, window.innerHeight - 16)
    return { top, left, width }
  })()

  return (
    <>
      <span
        ref={ref}
        role="button"
        tabIndex={0}
        className={`gloss-term${open ? ' is-open' : ''}`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => {
          if (closeTimer.current) window.clearTimeout(closeTimer.current)
          openTimer.current = window.setTimeout(show, OPEN_DELAY_MS)
        }}
        onMouseLeave={() => {
          if (openTimer.current) window.clearTimeout(openTimer.current)
          closeTimer.current = window.setTimeout(hide, CLOSE_DELAY_MS)
        }}
        onFocus={show}
        onBlur={() => {
          if (!pinned) hide()
        }}
        onClick={() => {
          if (pinned) {
            close()
            return
          }
          setPinned(true)
          show()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (pinned) close()
            else {
              setPinned(true)
              show()
            }
          }
        }}
      >
        {children}
      </span>
      {open && rect && popoverStyle
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className={`gloss-popover ${sourceClass}${pinned ? ' is-pinned' : ''}`}
              style={popoverStyle}
              onMouseEnter={() => {
                if (closeTimer.current) window.clearTimeout(closeTimer.current)
              }}
              onMouseLeave={() => {
                closeTimer.current = window.setTimeout(hide, CLOSE_DELAY_MS)
              }}
            >
              <div className="gloss-popover__heading">
                <p className="gloss-term-label">{gloss.term}</p>
                {pinned ? (
                  <button type="button" className="gloss-popover__close" aria-label="Close" onClick={close}>
                    ×
                  </button>
                ) : null}
              </div>
              {gloss.period ? <p className="gloss-period">{gloss.period}</p> : null}
              <p className={`gloss-body${pinned ? ' is-selectable' : ''}`}>{gloss.gloss}</p>
              {footer ? (
                <a
                  href={footer.href}
                  target="_blank"
                  rel="noreferrer"
                  className="gloss-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  {footer.label}
                </a>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
