/**
 * Runtime validation for polished day-card copy.
 * Knobs: shared/copy-knobs.ts · Doc: documentation/COPY_CONTRACT.md
 */

import { COPY_KNOBS } from '../../shared/copy-knobs'
import {
  cleanPressText,
  isIncompleteHeadline,
  looksLikeBareName,
  looksLikeDateOnlyTitle,
  looksLikeHeadlineDump,
  splitSentences,
  titleEchoesBody,
  titleIsCutFromBody,
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
    if (isIncompleteHeadline(title)) {
      issues.push({
        field: 'title',
        code: 'title.incomplete',
        message: 'Title is incomplete (ellipsis, ALL CAPS teaser, question, or dangling clause).',
      })
    }
    if (title.length > COPY_KNOBS.titleHardMaxChars) {
      issues.push({
        field: 'title',
        code: 'title.too_long',
        message: `Title exceeds hard max of ${COPY_KNOBS.titleHardMaxChars} characters.`,
      })
    } else if (title.length > COPY_KNOBS.titleSoftMaxChars) {
      warnings.push({
        field: 'title',
        code: 'title.soft_long',
        message: `Title is longer than soft aim of ${COPY_KNOBS.titleSoftMaxChars} characters.`,
      })
    }
    // Exact echo always fails; near-duplicates are fine when the knob says so.
    if (synopsis && titleEchoesBody(title, synopsis)) {
      issues.push({
        field: 'title',
        code: 'title.echoes_body',
        message: 'Title must not be an exact copy of the synopsis.',
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
    const n = countSentences(synopsis)
    if (n < COPY_KNOBS.synopsisSentenceGuideMin) {
      warnings.push({
        field: 'synopsis',
        code: 'synopsis.short',
        message: `Synopsis is under the ${COPY_KNOBS.synopsisSentenceGuideMin}–${COPY_KNOBS.synopsisSentenceGuideMax} sentence guide.`,
      })
    }
    if (n > COPY_KNOBS.synopsisSentenceGuideMax) {
      issues.push({
        field: 'synopsis',
        code: 'synopsis.too_many_sentences',
        message: `Synopsis exceeds guideline of ${COPY_KNOBS.synopsisSentenceGuideMax} sentences — move overflow to Context.`,
      })
    }
    if (synopsis.length > COPY_KNOBS.synopsisRunawayMaxChars) {
      issues.push({
        field: 'synopsis',
        code: 'synopsis.runaway',
        message: `Synopsis exceeds runaway guard of ${COPY_KNOBS.synopsisRunawayMaxChars} characters.`,
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
    if (synopsis && (titleEchoesBody(why, synopsis) || normalizeLoose(why) === normalizeLoose(synopsis))) {
      issues.push({
        field: 'whyItMatters',
        code: 'context.restates_synopsis',
        message: 'Context must not restate the synopsis.',
      })
    }
    const cn = countSentences(why)
    if (cn > COPY_KNOBS.contextSentenceGuideMax + 1) {
      warnings.push({
        field: 'whyItMatters',
        code: 'context.long',
        message: `Context is longer than the ~${COPY_KNOBS.contextSentenceGuideMax}-sentence guide.`,
      })
    }
    if (why.length > COPY_KNOBS.contextRunawayMaxChars) {
      issues.push({
        field: 'whyItMatters',
        code: 'context.runaway',
        message: `Context exceeds runaway guard of ${COPY_KNOBS.contextRunawayMaxChars} characters.`,
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

export { COPY_KNOBS }
