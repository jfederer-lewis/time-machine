/**
 * Calendar-day helpers for Lookup / API date bounds.
 *
 * UI uses the visitor’s **local** calendar (`calendarDateLocal`).
 * Worker / API uses **UTC** (`calendarDateUtc`) so edge nodes share one rule.
 * Near midnight, local vs UTC can disagree by one day — acceptable for this product.
 */

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local calendar date as YYYY-MM-DD (not UTC — avoids off-by-one near midnight in the UI). */
export function calendarDateLocal(now = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

/** UTC calendar date as YYYY-MM-DD — canonical for Worker / API future checks. */
export function calendarDateUtc(now = new Date()): string {
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`
}

/**
 * True when the query is strictly after `todayYmd` (YYYY-MM-DD).
 * - Exact day: date > today
 * - Month: year-month after today’s year-month
 * - Year: year after today’s year
 */
export function isFutureQueryDate(queryDate: string, todayYmd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(todayYmd)) return false
  const [ty, tm] = todayYmd.split('-').map(Number)

  if (/^\d{4}$/.test(queryDate)) {
    return Number(queryDate) > ty
  }

  if (/^\d{4}-\d{2}$/.test(queryDate)) {
    const [y, m] = queryDate.split('-').map(Number)
    if (y !== ty) return y > ty
    return m > tm
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(queryDate)) {
    return queryDate > todayYmd
  }

  return false
}

/** Exact-day query that matches today’s calendar date (YYYY-MM-DD). */
export function isTodayQueryDate(queryDate: string, todayYmd: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(queryDate) && queryDate === todayYmd
}
