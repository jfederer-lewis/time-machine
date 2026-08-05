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

/**
 * Wire / video-index scrapes that concatenate many unrelated headlines.
 * These must never become the day card body.
 */
export function looksLikeHeadlineDump(text: string): boolean {
  const t = cleanPressText(text)
  if (t.length < 160) return false
  const ellipses = (t.match(/\.{2,}|…/g) || []).length
  const separators = (t.match(/\s[—–-]\s/g) || []).length
  const storyish = (t.match(/\b(says|fans celebrate|return home|signs|defeats|slumped|aborted)\b/gi) || [])
    .length
  if (ellipses >= 3) return true
  if (separators >= 4 && t.length > 280) return true
  if (storyish >= 4 && t.length > 320) return true
  if (t.length > 600) return true
  return false
}

/** First 1–2 sentences, hard-capped — for snippets fed into polish / display. */
export function clipToShortProse(text: string, maxChars = 280): string {
  const cleaned = cleanPressText(text)
  if (!cleaned) return ''
  if (looksLikeHeadlineDump(cleaned)) {
    // Keep only up to the first ellipsis / dash break — often the lead hed.
    const lead = cleaned.split(/\s*(?:\.{2,}|…|\s[—–]\s)\s*/)[0]?.trim() || cleaned.slice(0, maxChars)
    return lead.length > maxChars ? lead.slice(0, maxChars).trim() : lead
  }
  const sentences =
    cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [cleaned]
  let out = sentences.slice(0, 2).join(' ').trim()
  if (out.length > maxChars) {
    const cut = out.slice(0, maxChars)
    const at = cut.lastIndexOf(' ')
    out = (at > 80 ? cut.slice(0, at) : cut).trim()
  }
  return out
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
  return /\b(the|a|an|of|in|on|at|to|for|from|by|with|and|or|as|into|onto|upon)$/i.test(
    text.trim(),
  )
}

/** ALL CAPS magazine teasers, ellipses, trail-offs — not usable as headlines. */
export function isIncompleteHeadline(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (/\?$/.test(t)) return true
  if (/\.{2,}|…/u.test(t)) return true
  if (endsDangling(t)) return true
  if (/\b(tale|story|look|account|history)\s+of$/i.test(t)) return true
  if (/,\s*a\s+(tense|dramatic|remarkable|extraordinary|untold)\b/i.test(t) && endsDangling(t)) {
    return true
  }
  // Mostly shouty caps (excluding short strings)
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length >= 12) {
    const upper = (letters.match(/[A-Z]/g) || []).length
    if (upper / letters.length >= 0.75) return true
  }
  return false
}

/**
 * Turn shouty / teaser titles into readable sentence-case prose.
 * Does not invent wording — only case + ellipsis cleanup.
 */
export function toSentenceCaseHeadline(title: string): string {
  let t = cleanPressText(title)
    .replace(/\.{2,}|…/gu, ' ')
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .trim()

  const letters = t.replace(/[^A-Za-z]/g, '')
  const upper = (letters.match(/[A-Z]/g) || []).length
  if (letters.length >= 8 && upper / letters.length >= 0.55) {
    t = t.toLowerCase()
    t = t.replace(/^\p{L}/u, (c) => c.toUpperCase())
  }

  return t.trim()
}

export function splitSentences(text: string): string[] {
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

    // It's a single letter initial if there's exactly one letter before the period
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

export function firstSentence(text: string): string {
  const sentences = splitSentences(text)
  return sentences[0] || text.trim()
}

/** Prefer a complete sentence; strip trailing period for use as a title. */
export function firstCompleteClause(text: string): string {
  return firstSentence(text).replace(/[.!?]$/, '').trim()
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

/**
 * Title is just a chopped lead-in from the synopsis — e.g. synopsis
 * “Following X, Hasina resigns…” with title “Following X”.
 * Headlines must state the outcome, not the subordinate clause alone.
 */
export function titleIsCutFromBody(title: string, body: string): boolean {
  const rawTitle = cleanPressText(title).replace(/[,:;]+$/g, '').trim()
  const rawBody = cleanPressText(body)
  if (!rawTitle || !rawBody || rawTitle.length < 10) return false

  const t = normalizeCopy(rawTitle)
  const b = normalizeCopy(rawBody)

  // Body opens with the title, then continues with the real news.
  if (b.startsWith(t) && b.length >= t.length + 12 && !hasOutcomeVerb(rawTitle)) {
    const rest = rawBody.slice(rawTitle.length).trim()
    if (/^[,:;]/.test(rest) || /^[a-z]/.test(rest)) return true
  }

  // Dependent-clause lead-ins that never reach the payoff.
  if (
    /^(following|after|during|amid|despite|before|when|while|as|with)\b/i.test(rawTitle) &&
    !hasOutcomeVerb(rawTitle)
  ) {
    return true
  }

  return false
}

const OUTCOME_VERB =
  /\b(resigns?|resigned|flees?|fled|dies?|died|wins?|won|signs?|signed|launches?|launched|ends?|ended|falls?|fell|opens?|opened|founded|establishes?|established|assassinated|elected|defeats?|defeated|invades?|invaded|abolishes?|abolished|declares?|declared|announces?|announced|becomes?|became|takes?|took|leaves?|left|overthrows?|overthrown|collapses?|collapsed|acquits?|acquitted|convicts?|convicted|arrests?|arrested|sentenced?|crashes?|crashed|bombs?|bombed|attacks?|attacked|strikes?|struck|kills?|killed|seizes?|seized|fires?|fired|releases?|released|marries?|married|crowned|born|passes|discovers?|discovered|invents?|invented)\b/i

function hasOutcomeVerb(text: string): boolean {
  return OUTCOME_VERB.test(text)
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
 * Prefers “Subject + action …” over a bare place/person name or lead-in clause.
 */
export function descriptiveFallbackTitle(synopsis: string, pageTitle?: string): string {
  const sentence = firstCompleteClause(synopsis)
  if (!sentence) return pageTitle?.trim() || 'Untitled event'

  // “Following X, SUBJECT verb…” → headline the payoff, not the subordinate clause.
  const afterLead = sentence.match(
    /^(?:Following|After|During|Amid|Despite|Before|When|While|As)\b[^,]{8,160},\s*(.+)$/i,
  )
  const focus = (afterLead?.[1] || sentence).trim()

  const tightened = focus
    .replace(/\b(is|are|was|were)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (
    tightened.length <= 85 &&
    !endsDangling(tightened) &&
    !titleIsCutFromBody(tightened, sentence)
  ) {
    return tightened
  }

  const cut = tightened.match(
    /^(.{18,85}?\b(?:resigns?|resigned|flees?|fled|territory|treaty|independence|election|war|invasion|bombing|launched|founded|established|signed|opened|discovered|abolished|assassinated|elected|crowned|released|championship|olympics)\b)/i,
  )
  if (cut && !endsDangling(cut[1]) && !titleIsCutFromBody(cut[1], sentence)) {
    return cut[1].trim()
  }

  const clause = tightened.match(/^(.{18,85}?)(?:,| — | – |:|;)\s/)
  if (
    clause &&
    !endsDangling(clause[1]) &&
    hasOutcomeVerb(clause[1]) &&
    !titleIsCutFromBody(clause[1], sentence)
  ) {
    return clause[1].trim()
  }

  if (pageTitle && !looksLikeBareName(pageTitle) && pageTitle.length <= 90) {
    return pageTitle.trim()
  }

  const soft = tightened.slice(0, 85)
  const at = soft.lastIndexOf(' ')
  const candidate = (at > 40 ? soft.slice(0, at) : soft).trim()
  if (
    !endsDangling(candidate) &&
    candidate.length >= 18 &&
    !titleIsCutFromBody(candidate, sentence)
  ) {
    return candidate
  }

  return tightened
}
