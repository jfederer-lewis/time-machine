import { useEffect, useId, useState } from 'react'
import { parseQueryDate } from '../../shared/source-registry'

interface DateDialProps {
  value: string
  featured: Array<{ date: string; label: string }>
  onChange: (date: string) => void
  onSubmit: (date?: string) => void
  loading?: boolean
  autoFocus?: boolean
}

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function parsePartial(value: string) {
  const parts = value.split('-')
  return {
    year: parts[0] ?? '',
    month: parts[1] ?? '',
    day: parts[2] ?? '',
  }
}

function toQueryDate(year: string, month: string, day: string): string | null {
  if (year.length === 4 && !month && !day) return parseQueryDate(year)
  if (year.length === 4 && month && !day) {
    const m = Number(month)
    if (!Number.isInteger(m) || m < 1 || m > 12) return null
    return parseQueryDate(`${year}-${pad2(m)}`)
  }
  if (year.length === 4 && month && day) {
    const m = Number(month)
    const d = Number(day)
    if (!Number.isInteger(m) || m < 1 || m > 12) return null
    if (!Number.isInteger(d) || d < 1 || d > 31) return null
    return parseQueryDate(`${year}-${pad2(m)}-${pad2(d)}`)
  }
  return null
}

export function DateDial({
  value,
  featured,
  onChange,
  onSubmit,
  loading,
  autoFocus,
}: DateDialProps) {
  const baseId = useId()
  const parsed = parsePartial(value)
  const [year, setYear] = useState(parsed.year)
  const [month, setMonth] = useState(parsed.month)
  const [day, setDay] = useState(parsed.day)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const next = parsePartial(value)
    setYear(next.year)
    setMonth(next.month)
    setDay(next.day)
    setInvalid(false)
  }, [value])

  const commit = (y: string, m: string, d: string, submit: boolean) => {
    const query = toQueryDate(y, m, d)
    if (!query) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onChange(query)
    if (submit) onSubmit(query)
  }

  const trySubmit = () => commit(year, month, day, true)
  const canSubmit = year.length === 4 && (!day || Boolean(month))

  return (
    <section className="date-dial" aria-label="Enter a date">
      <label className="date-prompt" htmlFor={`${baseId}-year`}>
        Enter a date
      </label>
      <p className="date-prompt-hint">
        Day and month are optional — only fill what you know.
      </p>

      <div className="date-dial__row">
        <div className="date-fields">
          <div className="date-field date-field--day">
            <label htmlFor={`${baseId}-day`}>Day</label>
            <input
              id={`${baseId}-day`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="—"
              maxLength={2}
              value={day}
              aria-invalid={invalid}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 2)
                setDay(next)
                setInvalid(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trySubmit()
              }}
            />
          </div>
          <div className="date-field date-field--month">
            <label htmlFor={`${baseId}-month`}>Month</label>
            <input
              id={`${baseId}-month`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="—"
              maxLength={2}
              value={month}
              aria-invalid={invalid}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 2)
                setMonth(next)
                setInvalid(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trySubmit()
              }}
            />
          </div>
          <div className="date-field date-field--year">
            <label htmlFor={`${baseId}-year`}>Year</label>
            <input
              id={`${baseId}-year`}
              inputMode="numeric"
              autoComplete="off"
              placeholder="2003"
              maxLength={4}
              value={year}
              autoFocus={autoFocus}
              aria-invalid={invalid}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 4)
                setYear(next)
                setInvalid(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trySubmit()
              }}
            />
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={trySubmit}
          disabled={loading || !canSubmit}
        >
          {loading ? 'Fetching…' : 'Look up'}
        </button>
      </div>

      {invalid ? (
        <p className="date-invalid">
          That date isn’t valid — use a year, month + year, or a full day.
        </p>
      ) : null}

      <ul className="featured-dates">
        {featured.map((f) => (
          <li key={f.date}>
            <button
              type="button"
              className={value === f.date ? 'is-active' : undefined}
              onClick={() => {
                const next = parsePartial(f.date)
                setYear(next.year)
                setMonth(next.month)
                setDay(next.day)
                setInvalid(false)
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
