type LoadingIndicatorProps = {
  label?: string
  /** Compact variant for chat / tight UI */
  compact?: boolean
  className?: string
}

/** Editorial loading cue — animated clock + label so long fetches don’t feel stuck. */
export function LoadingIndicator({
  label = 'Fetching…',
  compact = false,
  className,
}: LoadingIndicatorProps) {
  return (
    <div
      className={['loading-indicator', compact ? 'loading-indicator--compact' : '', className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loading-indicator__clock" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none" className="loading-indicator__svg">
          <circle cx="16" cy="16" r="10" className="loading-indicator__face" />
          <g className="loading-indicator__hand-group">
            <path d="M16 8v8l5 3" className="loading-indicator__hand" />
          </g>
        </svg>
      </span>
      <span className="loading-indicator__label">
        <span className="loading-indicator__text">{label}</span>
        <span className="loading-indicator__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </span>
    </div>
  )
}
