import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import type { BrandConfig, BrandMoment } from '../../shared/brand'
import { toDisplayDate } from '../../shared/source-registry'

export type TimelineAxis = 'vertical' | 'horizontal'

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []

  const abbrevRegex = /\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mr|Mrs|Ms|Dr|St|Prof|Sr|Jr|Gen|Sen|Rep|Gov|Col|Capt|Sgt|vs|ca|approx|etc|Co|Corp|Inc|Ltd|U\.S|U\.K|U\.N|B\.B\.C|A\.M|P\.M|A\.D|B\.C)\.$/i

  const sentences: string[] = []
  let currentStart = 0

  const boundaryRegex = /([.!?])(?:\s|$)/g
  let match: RegExpExecArray | null

  while ((match = boundaryRegex.exec(cleaned)) !== null) {
    const puncIndex = match.index
    const sentenceCandidate = cleaned.slice(currentStart, puncIndex + 1).trim()

    const isSingleLetterAbbrev = /[A-Za-z]\.$/.test(sentenceCandidate) && !/[A-Za-z]{2,}\.$/.test(sentenceCandidate)
    const isKnownAbbrev = abbrevRegex.test(sentenceCandidate)

    if (!isSingleLetterAbbrev && !isKnownAbbrev) {
      sentences.push(sentenceCandidate)
      currentStart = boundaryRegex.lastIndex
    }
  }

  const remainder = cleaned.slice(currentStart).trim()
  if (remainder) {
    sentences.push(remainder)
  }

  return sentences
}

function firstSentence(text: string): string {
  const sentences = splitSentences(text)
  return sentences[0] || text.trim()
}

function spineYear(moment: BrandMoment): string {
  return moment.date.slice(0, 4)
}

function spineSubdate(moment: BrandMoment): string | null {
  if (moment.precision === 'exact-day' && moment.date.length === 10) {
    return toDisplayDate(moment.date).replace(/\s+\d{4}$/, '')
  }
  if (
    (moment.precision === 'month' || moment.date.length === 7) &&
    moment.date.length >= 7
  ) {
    return toDisplayDate(moment.date.slice(0, 7)).replace(/\s+\d{4}$/, '')
  }
  return null
}

function useScrollReveal<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setVisible(true)
      return
    }
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          io.unobserve(el)
        }
      },
      { threshold: 0.22, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [active])

  return { ref, visible }
}

function MomentMedia({ moment }: { moment: BrandMoment }) {
  const image = moment.image
  if (!image) return null
  return (
    <figure className="tl-media">
      <a
        className="tl-media__link"
        href={image.sourcePageUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open source: ${image.credit || 'Converse History'}`}
      >
        <img
          className="tl-media__img"
          src={image.url}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      </a>
      <figcaption className="tl-media__credit">
        <a href={image.sourcePageUrl} target="_blank" rel="noreferrer">
          {image.credit || 'Converse History'}
        </a>
        <span aria-hidden="true"> · </span>
        <a href={moment.citation.url} target="_blank" rel="noreferrer">
          Source
        </a>
      </figcaption>
    </figure>
  )
}

function MomentCopy({ moment }: { moment: BrandMoment }) {
  return (
    <>
      <MomentMedia moment={moment} />
      <h2 className="tl-copy__headline">{moment.title}</h2>
      <p className="tl-copy__summary">{firstSentence(moment.synopsis)}</p>
      {moment.precision === 'period-estimate' ? (
        <p className="tl-copy__note">Year contested — verify before press use</p>
      ) : null}
    </>
  )
}

function VerticalItem({
  moment,
  side,
  index,
}: {
  moment: BrandMoment
  side: 'left' | 'right'
  index: number
}) {
  const { ref, visible } = useScrollReveal<HTMLLIElement>(true)
  const sub = spineSubdate(moment)

  return (
    <li
      ref={ref}
      className={`tl-v__item tl-v__item--${side}${visible ? ' is-in' : ''}`}
      style={{ '--i': index } as CSSProperties}
    >
      <div className="tl-v__marker">
        <span className="tl-year">{spineYear(moment)}</span>
        {sub ? <span className="tl-subdate">{sub}</span> : null}
      </div>
      <article className="tl-v__copy">
        <MomentCopy moment={moment} />
      </article>
    </li>
  )
}

function VerticalTimeline({ moments }: { moments: BrandMoment[] }) {
  const railRef = useRef<HTMLOListElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = railRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const view = window.innerHeight
      const total = rect.height - view * 0.45
      const scrolled = Math.min(Math.max(-rect.top + view * 0.2, 0), Math.max(total, 1))
      setProgress(scrolled / Math.max(total, 1))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [moments.length])

  return (
    <div className="tl-v">
      <div className="tl-v__track" aria-hidden="true">
        <div className="tl-v__track-fill" style={{ transform: `scaleY(${progress})` }} />
      </div>
      <ol className="tl-v__list" ref={railRef}>
        {moments.map((moment, index) => (
          <VerticalItem
            key={moment.id}
            moment={moment}
            side={index % 2 === 0 ? 'left' : 'right'}
            index={index}
          />
        ))}
      </ol>
    </div>
  )
}

function HorizontalTimeline({ moments }: { moments: BrandMoment[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)

  const sync = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const p = max > 0 ? el.scrollLeft / max : 0
    setProgress(p)
    const cards = Array.from(el.querySelectorAll<HTMLElement>('[data-h-card]'))
    if (!cards.length) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestDist = Infinity
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2
      const dist = Math.abs(center - mid)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    setActive(best)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    sync()
    el.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync)
    return () => {
      el.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [sync, moments.length])

  const scrollTo = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const card = el.querySelectorAll<HTMLElement>('[data-h-card]')[index]
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollTo(Math.min(active + 1, moments.length - 1))
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollTo(Math.max(active - 1, 0))
    }
  }

  // Convert vertical wheel into horizontal scroll when over the track.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: 'auto' })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div className="tl-h">
      <div className="tl-h__chrome">
        <button
          type="button"
          className="tl-h__nav"
          aria-label="Previous moment"
          disabled={active <= 0}
          onClick={() => scrollTo(active - 1)}
        >
          ←
        </button>
        <div className="tl-h__progress" aria-hidden="true">
          <div className="tl-h__progress-fill" style={{ transform: `scaleX(${progress})` }} />
          <div className="tl-h__years">
            {moments.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`tl-h__year-dot${i === active ? ' is-active' : ''}`}
                onClick={() => scrollTo(i)}
                aria-label={`Go to ${spineYear(m)}`}
                aria-current={i === active ? 'true' : undefined}
              >
                {spineYear(m)}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="tl-h__nav"
          aria-label="Next moment"
          disabled={active >= moments.length - 1}
          onClick={() => scrollTo(active + 1)}
        >
          →
        </button>
      </div>

      <div
        className="tl-h__scroller"
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Horizontal timeline"
        onKeyDown={onKeyDown}
      >
        <div className="tl-h__rail" aria-hidden="true" />
        <ol className="tl-h__list">
          {moments.map((moment, index) => {
            const sub = spineSubdate(moment)
            const isActive = index === active
            return (
              <li
                key={moment.id}
                data-h-card
                className={`tl-h__item${isActive ? ' is-active' : ''}`}
                style={{ '--i': index } as CSSProperties}
              >
                <button
                  type="button"
                  className="tl-h__card"
                  onClick={() => scrollTo(index)}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="tl-h__marker">
                    <span className="tl-year">{spineYear(moment)}</span>
                    {sub ? <span className="tl-subdate">{sub}</span> : null}
                  </div>
                  <div className="tl-h__copy">
                    <MomentCopy moment={moment} />
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </div>

      <p className="tl-h__hint">Scroll or use arrow keys</p>
    </div>
  )
}

export function TimelineView({
  brand,
  axis,
  onAxisChange,
}: {
  brand: BrandConfig
  axis: TimelineAxis
  onAxisChange: (axis: TimelineAxis) => void
}) {
  const moments = brand.timeline

  return (
    <section
      className={`timeline-page timeline-page--${axis}`}
      aria-label={`${brand.name} timeline`}
    >
      <header className="timeline-page__head">
        <div className="timeline-page__intro">
          <p className="timeline-page__eyebrow">{brand.name}</p>
          <h1 className="timeline-page__title">{brand.timelineTitle}</h1>
          <p className="timeline-page__lede">{brand.heritageNote}</p>
        </div>

        <div className="timeline-axis" role="group" aria-label="Timeline orientation">
          {(
            [
              ['vertical', 'Vertical'],
              ['horizontal', 'Horizontal'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={axis === id ? 'is-active' : undefined}
              aria-pressed={axis === id}
              onClick={() => onAxisChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {axis === 'vertical' ? (
        <VerticalTimeline moments={moments} />
      ) : (
        <HorizontalTimeline moments={moments} />
      )}
    </section>
  )
}
