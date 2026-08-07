import { useEffect, useId, useState } from 'react'
import { calendarDateLocal, isFutureQueryDate } from '../../shared/date-bounds'
import { parseQueryDate } from '../../shared/source-registry'

interface DateDialProps {
  value: string
  featured: Array<{ date: string; label: string }>
  onChange: (date: string) => void
  onSubmit: (date?: string) => void
  loading?: boolean
  autoFocus?: boolean
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const value = String(i + 1).padStart(2, '0')
  return { value, label: String(i + 1) }
})

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function parsePartial(value: string) {
  const parts = value.split('-')
  const year = parts[0] ?? ''
  const monthRaw = parts[1] ?? ''
  const dayRaw = parts[2] ?? ''
  const monthNum = Number(monthRaw)
  const dayNum = Number(dayRaw)
  return {
    year,
    month:
      monthRaw && Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12
        ? pad2(monthNum)
        : '',
    day:
      dayRaw && Number.isInteger(dayNum) && dayNum >= 1 && dayNum <= 31
        ? pad2(dayNum)
        : '',
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
  const [invalidReason, setInvalidReason] = useState<'invalid' | 'future' | null>(null)

  useEffect(() => {
    const next = parsePartial(value)
    setYear(next.year)
    setMonth(next.month)
    setDay(next.day)
    setInvalidReason(null)
  }, [value])

  const commit = (y: string, m: string, d: string, submit: boolean) => {
    const query = toQueryDate(y, m, d)
    if (!query) {
      setInvalidReason('invalid')
      return
    }
    if (isFutureQueryDate(query, calendarDateLocal())) {
      setInvalidReason('future')
      return
    }
    setInvalidReason(null)
    onChange(query)
    if (submit) onSubmit(query)
  }

  const trySubmit = () => commit(year, month, day, true)
  const canSubmit = year.length === 4 && (!day || Boolean(month))
  const invalid = invalidReason != null

  return (
    <section className="date-dial" aria-label="Enter a date">
      <div className="date-dial__row">
        <div className="date-fields">
          <div className="date-field date-field--day">
            <label htmlFor={`${baseId}-day`}>Day</label>
            <select
              id={`${baseId}-day`}
              value={day}
              aria-invalid={invalid}
              onChange={(e) => {
                setDay(e.target.value)
                setInvalidReason(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trySubmit()
              }}
            >
              <option value="">Any</option>
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="date-field date-field--month">
            <label htmlFor={`${baseId}-month`}>Month</label>
            <select
              id={`${baseId}-month`}
              value={month}
              aria-invalid={invalid}
              onChange={(e) => {
                const next = e.target.value
                setMonth(next)
                if (!next) setDay('')
                setInvalidReason(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') trySubmit()
              }}
            >
              <option value="">Any</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
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
                setInvalidReason(null)
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
          aria-busy={loading || undefined}
        >
          {loading ? 'Fetching…' : 'Look up'}
        </button>
      </div>

      {invalidReason === 'future' ? (
        <p className="date-invalid">That day hasn’t happened yet.</p>
      ) : invalidReason === 'invalid' ? (
        <p className="date-invalid">That date isn’t valid.</p>
      ) : null}

      {featured.length > 0 ? (
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
                  setInvalidReason(null)
                  if (isFutureQueryDate(f.date, calendarDateLocal())) {
                    setInvalidReason('future')
                    return
                  }
                  onChange(f.date)
                  onSubmit(f.date)
                }}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
