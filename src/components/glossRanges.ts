const PERSON_NAME_STOP_WORDS = new Set([
  'A',
  'An',
  'And',
  'As',
  'At',
  'By',
  'For',
  'From',
  'In',
  'Into',
  'Of',
  'On',
  'Or',
  'The',
  'To',
  'Via',
  'With',
  'Without',
  'Wikipedia',
  'Chuck',
  'Converse',
])

function wordsMatch(w1: string, w2: string) {
  const clean = (w: string) =>
    String(w || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/k/g, 'c')

  const n1 = clean(w1)
  const n2 = clean(w2)

  if (!n1 || !n2) return false
  if (n1 === n2) return true

  let commonPrefixLen = 0
  const minLen = Math.min(n1.length, n2.length)
  while (commonPrefixLen < minLen && n1[commonPrefixLen] === n2[commonPrefixLen]) {
    commonPrefixLen++
  }

  if (commonPrefixLen < 4) return false

  const r1 = n1.slice(commonPrefixLen)
  const r2 = n2.slice(commonPrefixLen)

  const allowedEndings = new Set([
    '',
    's',
    'es',
    'y',
    'ies',
    'ed',
    'ing',
    'er',
    'ers',
    'or',
    'ors',
    'ic',
    'ica',
    'ical',
    'ically',
    'ist',
    'ists',
    'ism',
    'isms',
    'ian',
    'ians',
    'ize',
    'izes',
    'ised',
    'ized',
    'ising',
    'izing',
    'isation',
    'ization',
    'isations',
    'izations',
    'al',
    'ale',
    'el',
    'on',
    'con',
    'kon',
    'a',
    'um',
    'us',
    'i',
    'n',
    'logy',
    'logies',
    'logical',
    'logically',
    'logist',
    'logists',
    'tic',
    'tical',
    'tically',
    'tist',
    'tists',
    'ive',
    'ively',
    'ity',
    'ities',
    'ment',
    'ments',
    'ness',
    'nesses',
  ])

  return allowedEndings.has(r1) && allowedEndings.has(r2)
}

export type GlossLike = {
  term: string
  gloss: string
  /** When `exact`, only the full term matches — no surname fallback. */
  matchMode?: 'default' | 'exact'
}

export type GlossRange<T extends GlossLike = GlossLike> = {
  start: number
  end: number
  gloss: T
}

/** Bloom-style non-overlapping gloss spans — longest phrases first, then singles / surnames. */
export function buildGlossRanges<T extends GlossLike>(
  text: string,
  glosses: T[] = [],
): GlossRange<T>[] {
  const source = String(text || '')
  if (!source || !Array.isArray(glosses) || glosses.length === 0) return []

  const used: Array<{ start: number; end: number }> = []
  const ranges: GlossRange<T>[] = []

  const words: Array<{ text: string; start: number; end: number }> = []
  // Letter–hyphen compounds (Non-Skid) stay one token; digit dates still split on '-'.
  const wordRegex = /[a-zA-Z\x7f-\xff]+(?:-[a-zA-Z\x7f-\xff]+)+|[a-zA-Z0-9\x7f-\xff]+/g
  let match: RegExpExecArray | null
  while ((match = wordRegex.exec(source)) !== null) {
    words.push({
      text: match[0],
      start: match.index,
      end: wordRegex.lastIndex,
    })
  }

  if (words.length === 0) return []

  const isOverlapping = (start: number, end: number) =>
    used.some((range) => start < range.end && end > range.start)
  const markUsed = (start: number, end: number) => {
    used.push({ start, end })
  }

  const candidates = glosses
    .filter((gloss) => gloss?.term && gloss?.gloss)
    .filter((gloss) => !/^\d{4}$/.test(String(gloss.term).trim()))
    .filter((gloss) => !/^\d{4}-\d{2}(-\d{2})?$/.test(String(gloss.term).trim()))
    .sort((left, right) => String(right.term).length - String(left.term).length)

  for (const gloss of candidates) {
    const glossWords = String(gloss.term).split(/\s+/).filter(Boolean)
    if (glossWords.length < 2) continue

    for (let i = 0; i <= words.length - glossWords.length; i++) {
      let matchAll = true
      for (let j = 0; j < glossWords.length; j++) {
        if (!wordsMatch(words[i + j].text, glossWords[j])) {
          matchAll = false
          break
        }
      }

      if (matchAll) {
        const start = words[i].start
        const end = words[i + glossWords.length - 1].end
        if (!isOverlapping(start, end)) {
          markUsed(start, end)
          ranges.push({ start, end, gloss })
        }
      }
    }
  }

  for (const gloss of candidates) {
    const glossWords = String(gloss.term).split(/\s+/).filter(Boolean)
    const exactOnly = gloss.matchMode === 'exact'

    if (glossWords.length === 1) {
      const needle = glossWords[0]
      for (const word of words) {
        if (!isOverlapping(word.start, word.end) && wordsMatch(word.text, needle)) {
          markUsed(word.start, word.end)
          ranges.push({ start: word.start, end: word.end, gloss })
        }
      }
    } else if (!exactOnly) {
      // Surname / last-token fallback for people and entity phrases — not citation titles
      const isProperNounPhrase = glossWords.every((w) => /^[A-Z]/.test(w))
      // Skip "The Simpsons"-style phrases: last token alone would steal an entity/cite gloss
      const leadingThe = /^the$/i.test(glossWords[0] || '')
      if (isProperNounPhrase && glossWords.length >= 2 && !leadingThe) {
        const surname = glossWords[glossWords.length - 1]
        if (surname && surname.length >= 3 && !PERSON_NAME_STOP_WORDS.has(surname)) {
          for (const word of words) {
            if (!isOverlapping(word.start, word.end) && wordsMatch(word.text, surname)) {
              markUsed(word.start, word.end)
              ranges.push({ start: word.start, end: word.end, gloss })
            }
          }
        }
      }
    }
  }

  return ranges.sort((left, right) => left.start - right.start)
}
