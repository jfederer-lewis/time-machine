/**
 * Strip scrape artifacts so Gemini / the UI never see raw HTML, wiki markup, or table dumps.
 */

export function cleanPressText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\|+/g, ' ')
    .replace(/\*{1,3}|_{1,3}|`+/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCopy(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.…]+$/u, '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Titles that are just a calendar date — useless as headlines. */
export function looksLikeDateOnlyTitle(title: string): boolean {
  const t = title.trim()
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(t)) return true
  if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(t)) return true
  if (/^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/.test(t)) return true
  if (/^[A-Za-z]+\s+\d{1,2}\s+\d{4}$/.test(t)) return true
  return false
}

/** Mid-clause cuts like “…carved out of the”. */
export function endsDangling(text: string): boolean {
  return /\b(the|a|an|of|in|on|at|to|for|from|by|with|and|or|as)$/i.test(text.trim())
}

/** Prefer a complete sentence; strip trailing period for use as a title. */
export function firstCompleteClause(text: string): string {
  const match = text.trim().match(/^(.+?[.!?])(?:\s|$)/)
  if (match) return match[1].replace(/[.!?]$/, '').trim()
  return text.trim()
}

/**
 * True when the title is essentially the body pasted up as a headline
 * (exact / period-stripped match of the body or its first sentence).
 * Near-duplicates with different wording are fine.
 */
export function titleEchoesBody(title: string, body: string): boolean {
  const t = normalizeCopy(title)
  const b = normalizeCopy(body)
  if (!t || !b) return false
  if (t === b) return true

  const first = normalizeCopy(firstCompleteClause(body))
  return Boolean(first) && t === first
}

/** "Nunavut", "Donald Trump" — fine as gloss terms, poor as event headlines alone. */
export function looksLikeBareName(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (/\b(of|the|in|at|and|for|from|on|by|as|into)\b/i.test(t)) return false
  const words = t.split(/\s+/)
  return words.length <= 4 && t.length <= 32
}

/**
 * Build a short descriptive headline from synopsis when Gemini is unavailable.
 * Prefers “Subject + action …” over a bare place/person name.
 */
export function descriptiveFallbackTitle(synopsis: string, pageTitle?: string): string {
  const sentence = firstCompleteClause(synopsis)
  if (!sentence) return pageTitle?.trim() || 'Untitled event'

  // Drop helper verbs for a tighter headline, then cut at a natural noun.
  const tightened = sentence
    .replace(/\b(is|are|was|were)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (tightened.length <= 85 && !endsDangling(tightened)) return tightened

  const cut = tightened.match(
    /^(.{18,85}?\b(?:territory|treaty|independence|election|war|invasion|bombing|launched|founded|established|signed|opened|discovered|abolished|assassinated|elected|crowned|released|championship|olympics|independence)\b)/i,
  )
  if (cut && !endsDangling(cut[1])) return cut[1].trim()

  const clause = tightened.match(/^(.{18,85}?)(?:,| — | – |:|;)\s/)
  if (clause && !endsDangling(clause[1])) return clause[1].trim()

  if (pageTitle && !looksLikeBareName(pageTitle) && pageTitle.length <= 90) {
    return pageTitle.trim()
  }

  const soft = tightened.slice(0, 85)
  const at = soft.lastIndexOf(' ')
  const candidate = (at > 40 ? soft.slice(0, at) : soft).trim()
  if (!endsDangling(candidate) && candidate.length >= 18) return candidate

  return tightened
}
