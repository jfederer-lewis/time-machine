import { useEffect, useState } from 'react'

interface DateDialProps {
  value: string
  featured: Array<{ date: string; label: string }>
  onChange: (date: string) => void
  onSubmit: (date?: string) => void
  loading?: boolean
}

export function DateDial({ value, featured, onChange, onSubmit, loading }: DateDialProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  return (
    <section className="date-dial" aria-label="Choose a date">
      <div className="date-dial__row">
        <input
          id="tm-date"
          type="date"
          aria-label="Date"
          value={draft}
          min="1800-01-01"
          max="2099-12-31"
          onChange={(e) => {
            setDraft(e.target.value)
            onChange(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit(draft)
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => onSubmit(draft)}
          disabled={loading || !draft}
        >
          {loading ? 'Loading…' : 'Go'}
        </button>
      </div>

      <ul className="featured-dates">
        {featured.map((f) => (
          <li key={f.date}>
            <button
              type="button"
              className={draft === f.date ? 'is-active' : undefined}
              onClick={() => {
                setDraft(f.date)
                onChange(f.date)
                onSubmit(f.date)
              }}
            >
              {f.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
