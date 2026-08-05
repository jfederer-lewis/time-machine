/**
 * Runtime validation for polished day-card copy.
 * Knobs: shared/copy-knobs.ts · Doc: documentation/COPY_CONTRACT.md
 *
 * HARD: must read well; never mid-word / mid-sentence cutoffs; no dumps / broken titles.
 * SOFT: length aims (2–4 synopsis sentences, one-line title, paragraph Context) — warn only.
 */

import { COPY_KNOBS } from '../../shared/copy-knobs'
import {
  cleanPressText,
  endsDangling,
  isIncompleteHeadline,
  looksLikeBareName,
  looksLikeDateOnlyTitle,
  looksLikeHeadlineDump,
  splitSentences,
  titleEchoesBody,
  titleIsCutFromBody,
  titleTooCloseToBody,
} from './clean-text'

export type PolishedCopy = {
  title: string
  synopsis: string
  whyItMatters?: string
}

export type CopyValidationIssue = {
  field: 'title' | 'synopsis' | 'whyItMatters' | 'card'
  code: string
  message: string
}

export type CopyValidationResult =
  | { ok: true; value: PolishedCopy; warnings: CopyValidationIssue[] }
  | { ok: false; issues: CopyValidationIssue[]; value?: PolishedCopy }

function countSentences(text: string): number {
  return splitSentences(cleanPressText(text)).length
}

function normalizeLoose(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.…]+$/u, '')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** HARD: truncated prose — trailing ellipsis, dangling function word, or mid-word hyphen junk. */
export function looksAbruptlyCut(text: string): boolean {
  const t = cleanPressText(text)
  if (!t) return false
  if (/[.…]$/u.test(t)) return true
  if (endsDangling(t)) return true
  // Mid-word truncation often leaves a lone hyphenated stub or letter scrap.
  if (/\b[A-Za-z]{1,2}-$/.test(t)) return true
  return false
}

/**
 * Validate polished day-card copy against the contract.
 * Call after Gemini returns (and after any title repair attempts).
 */
export function validateCopyContract(input: PolishedCopy): CopyValidationResult {
  const issues: CopyValidationIssue[] = []
  const warnings: CopyValidationIssue[] = []

  const title = cleanPressText(input.title)
  const synopsis = cleanPressText(input.synopsis)
  const why = input.whyItMatters ? cleanPressText(input.whyItMatters) : ''

  if (!title) {
    issues.push({ field: 'title', code: 'title.empty', message: 'Title is required.' })
  } else {
    if (looksLikeDateOnlyTitle(title)) {
      issues.push({
        field: 'title',
        code: 'title.date_only',
        message: 'Title must not be a bare calendar date.',
      })
    }
    if (looksLikeBareName(title)) {
      issues.push({
        field: 'title',
        code: 'title.bare_name',
        message: 'Title must not be a bare place/person name — state the outcome.',
      })
    }
    if (isIncompleteHeadline(title) || looksAbruptlyCut(title)) {
      issues.push({
        field: 'title',
        code: 'title.incomplete',
        message: 'Title must read as a complete line — never cut mid-word or mid-sentence.',
      })
    }
    if (title.length > COPY_KNOBS.titleAimChars) {
      warnings.push({
        field: 'title',
        code: 'title.soft_long',
        message: `Title is longer than the one-line aim (~${COPY_KNOBS.titleAimChars} chars) — still OK if it reads well.`,
      })
    }
    if (synopsis && titleEchoesBody(title, synopsis)) {
      issues.push({
        field: 'title',
        code: 'title.echoes_body',
        message: 'Title must not be an exact copy of the synopsis.',
      })
    }
    if (synopsis && titleTooCloseToBody(title, synopsis)) {
      issues.push({
        field: 'title',
        code: 'title.too_close',
        message: 'Title must not be a trivial rephrase of the synopsis — write a tight outcome hed.',
      })
    }
    if (synopsis && titleIsCutFromBody(title, synopsis)) {
      issues.push({
        field: 'title',
        code: 'title.cut_from_body',
        message: 'Title must state the outcome — not a chopped lead-in from the synopsis.',
      })
    }
  }

  if (!synopsis) {
    issues.push({ field: 'synopsis', code: 'synopsis.empty', message: 'Synopsis is required.' })
  } else {
    if (looksLikeHeadlineDump(synopsis)) {
      issues.push({
        field: 'synopsis',
        code: 'synopsis.headline_dump',
        message: 'Synopsis must not be a multi-headline wire dump.',
      })
    }
    if (looksAbruptlyCut(synopsis)) {
      issues.push({
        field: 'synopsis',
        code: 'synopsis.abrupt_cut',
        message: 'Synopsis must never be cut mid-word or mid-sentence.',
      })
    }
    const n = countSentences(synopsis)
    if (n < COPY_KNOBS.synopsisOptimalMin) {
      warnings.push({
        field: 'synopsis',
        code: 'synopsis.short',
        message: `Synopsis is under the optimal ~${COPY_KNOBS.synopsisOptimalMin}–${COPY_KNOBS.synopsisOptimalMax} sentence aim.`,
      })
    } else if (n > COPY_KNOBS.synopsisSoftMax) {
      warnings.push({
        field: 'synopsis',
        code: 'synopsis.long',
        message: `Synopsis is above the soft ~${COPY_KNOBS.synopsisSoftMax}-sentence aim — prefer moving background into Context.`,
      })
    } else if (n > COPY_KNOBS.synopsisOptimalMax) {
      warnings.push({
        field: 'synopsis',
        code: 'synopsis.above_optimal',
        message: `Synopsis is above the optimal ~${COPY_KNOBS.synopsisOptimalMax} sentences (still within soft max).`,
      })
    }
  }

  if (COPY_KNOBS.contextRequired && !why) {
    issues.push({
      field: 'whyItMatters',
      code: 'context.required',
      message: 'Context (whyItMatters) is required under current knobs.',
    })
  }
  if (why) {
    if (looksLikeHeadlineDump(why)) {
      issues.push({
        field: 'whyItMatters',
        code: 'context.headline_dump',
        message: 'Context must not be a wire dump.',
      })
    }
    if (looksAbruptlyCut(why)) {
      issues.push({
        field: 'whyItMatters',
        code: 'context.abrupt_cut',
        message: 'Context must never be cut mid-word or mid-sentence.',
      })
    }
    if (synopsis && (titleEchoesBody(why, synopsis) || normalizeLoose(why) === normalizeLoose(synopsis))) {
      issues.push({
        field: 'whyItMatters',
        code: 'context.restates_synopsis',
        message: 'Context must not restate the synopsis.',
      })
    }
  }

  const value: PolishedCopy = {
    title,
    synopsis,
    ...(why ? { whyItMatters: why } : {}),
  }

  if (issues.length) return { ok: false, issues, value }
  return { ok: true, value, warnings }
}

export function polishedCopyJsonSchemaHint(): string {
  return COPY_KNOBS.contextRequired
    ? '{"title":string,"synopsis":string,"whyItMatters":string}'
    : '{"title":string,"synopsis":string,"whyItMatters":string|null}'
}

/** Keep whole sentences only — never mid-word / mid-sentence cuts. */
export function keepWholeSentences(text: string, maxSentences: number): string {
  const sentences = splitSentences(cleanPressText(text))
  if (sentences.length <= maxSentences) return sentences.join(' ').trim()
  return sentences.slice(0, maxSentences).join(' ').trim()
}

export { COPY_KNOBS }
