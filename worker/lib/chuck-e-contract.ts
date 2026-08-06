/**
 * Chuck-E output contract — disclosure, cliff-notes shape, no finished stories.
 * Knobs: shared/chuck-e-knobs.ts · Doc: documentation/CHUCK_E.md
 */

import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import type { Citation } from '../../shared/provenance'

export type ChuckEContractIssue =
  | 'disclosure.missing'
  | 'cliff.narrative_shape'
  | 'cliff.empty'
  | 'cliff.too_many_bullets'
  | 'cliff.missing_ai_banner'
  | 'chat.finished_story_shape'

export interface ChuckEContractResult {
  ok: boolean
  issues: ChuckEContractIssue[]
}

/** Opening assistant message for a new session — hardcoded, never LLM. */
export function buildDisclosureMessage(): {
  role: 'assistant'
  content: string
  isDisclosure: true
} {
  return {
    role: 'assistant',
    content: CHUCK_E_KNOBS.disclosureText,
    isDisclosure: true,
  }
}

export function validateDisclosurePresent(messages: Array<{ role: string; isDisclosure?: boolean; content?: string }>): ChuckEContractResult {
  const issues: ChuckEContractIssue[] = []
  const first = messages[0]
  const hasDisclosure =
    first?.role === 'assistant' &&
    (first.isDisclosure === true || first.content === CHUCK_E_KNOBS.disclosureText)
  if (!hasDisclosure) issues.push('disclosure.missing')
  return { ok: issues.length === 0, issues }
}

/**
 * Detect byline-ready / press-release shaped text.
 * Cliff notes and chat replies must stay research-shaped.
 */
export function looksLikeFinishedStory(text: string): boolean {
  const t = text.trim()
  if (!t) return false

  // Dateline / press-release openers
  if (/^(FOR\s+IMMEDIATE\s+RELEASE|PRESS\s+RELEASE|DATELINE:|BOSTON\s*[—–-]|\[[A-Z][A-Za-z\s]+\]\s*[—–-])/im.test(t)) {
    return true
  }

  const paragraphs = t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const bulletLines = t.split('\n').filter((l) => /^\s*[-*•]/.test(l) || /^\s*\d+[.)]/.test(l))

  // Multi-paragraph narrative with almost no bullets → finished story shape
  if (paragraphs.length >= 3 && bulletLines.length < 2) {
    const longParas = paragraphs.filter((p) => p.split(/\s+/).length >= 40)
    if (longParas.length >= 2) return true
  }

  // Very long continuous prose without list structure
  if (bulletLines.length === 0 && t.length > 900 && paragraphs.length >= 2) {
    return true
  }

  return false
}

export function validateChatReply(text: string): ChuckEContractResult {
  const issues: ChuckEContractIssue[] = []
  if (looksLikeFinishedStory(text)) issues.push('chat.finished_story_shape')
  return { ok: issues.length === 0, issues }
}

export interface CliffNotesDraft {
  title: string
  bullets: string[]
  citations: Citation[]
  aiBanner?: string
  footer?: string
}

export function validateCliffNotes(draft: CliffNotesDraft): ChuckEContractResult {
  const issues: ChuckEContractIssue[] = []
  const joined = [draft.title, ...draft.bullets].join('\n\n')

  if (!draft.bullets.length) issues.push('cliff.empty')
  if (draft.bullets.length > CHUCK_E_KNOBS.cliffNotesMaxBullets) {
    issues.push('cliff.too_many_bullets')
  }
  if (looksLikeFinishedStory(joined)) issues.push('cliff.narrative_shape')

  const banner = draft.aiBanner ?? ''
  if (!banner.includes('AI-assisted') && banner !== CHUCK_E_KNOBS.cliffNotesAiBanner) {
    // Banner must be present on the payload before ship
    if (!draft.aiBanner) issues.push('cliff.missing_ai_banner')
  }

  return { ok: issues.length === 0, issues }
}

/** Ensure cliff notes always carry Art. 50 synthetic-content marking. */
export function withCliffNotesMarking(draft: Omit<CliffNotesDraft, 'aiBanner' | 'footer'> & {
  aiBanner?: string
  footer?: string
}): CliffNotesDraft {
  return {
    ...draft,
    bullets: draft.bullets.slice(0, CHUCK_E_KNOBS.cliffNotesMaxBullets),
    aiBanner: draft.aiBanner || CHUCK_E_KNOBS.cliffNotesAiBanner,
    footer: draft.footer || CHUCK_E_KNOBS.cliffNotesFooter,
  }
}

/**
 * If the model drifted into story shape, collapse to short bullets from sentences.
 * Prefer silence / short notes over shipping finished copy.
 */
export function coerceToCliffNotesBullets(text: string, max: number = CHUCK_E_KNOBS.cliffNotesMaxBullets): string[] {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean)

  if (lines.length >= 2) return lines.slice(0, max)

  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)

  return sentences.slice(0, max)
}

/** Soft rewrite when chat reply looks like a finished story. */
export function coerceChatAwayFromStory(text: string): string {
  if (!looksLikeFinishedStory(text)) return text
  const bullets = coerceToCliffNotesBullets(text, 6)
  if (bullets.length === 0) {
    return "I can share research notes and sourced facts, but I don't write finished press stories. Ask me for cliff notes, a feature, or a date in the timeline."
  }
  return [
    'Here are research notes (not a finished story):',
    ...bullets.map((b) => `• ${b}`),
  ].join('\n')
}
