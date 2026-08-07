/**
 * Chuck-E output contract — disclosure, cliff-notes shape, no finished stories.
 * Knobs: shared/chuck-e-knobs.ts · Doc: documentation/CHUCK_E.md
 */

import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import type { Citation } from '../../shared/provenance'
import { endsDangling } from './clean-text'
import { looksAbruptlyCut } from './copy-contract'

export type ChuckEContractIssue =
  | 'disclosure.missing'
  | 'cliff.narrative_shape'
  | 'cliff.empty'
  | 'cliff.too_many_bullets'
  | 'cliff.missing_ai_banner'
  | 'chat.finished_story_shape'
  | 'chat.abrupt_cut'

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
  if (looksLikeIncompleteChatReply(text)) issues.push('chat.abrupt_cut')
  return { ok: issues.length === 0, issues }
}

/**
 * Token-budget / model truncations must never ship (e.g. “…details from our”).
 * Soft length aims are prompt-only — never hard-cut mid-sentence.
 */
export function looksLikeIncompleteChatReply(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (looksAbruptlyCut(t)) return true

  const lastLine = (t.split('\n').filter((l) => l.trim()).pop() || t).trim()
  const lastPlain = lastLine.replace(/^[\s•*\d.)-]+/, '').trim()
  if (looksAbruptlyCut(lastPlain) || endsDangling(lastPlain)) return true

  // Trailing fragment after the last finished sentence
  const afterLastStop = t.match(/[.!?]["')\]]*[\s\n]+([^.!?]+)$/)
  if (afterLastStop) {
    const frag = afterLastStop[1].trim()
    if (frag && (endsDangling(frag) || frag.split(/\s+/).length >= 4)) return true
  }

  // Long single-run with no terminal punctuation — almost always a cut.
  // Skip structured bullet replies (heritage / product packs already end cleanly).
  const lines = t.split('\n').map((l) => l.trim()).filter(Boolean)
  const bulletish = lines.filter((l) => /^([•*\-]|\d+[.)])\s/.test(l)).length
  if (bulletish >= 1 && bulletish >= lines.length - 1) return false

  const plainEnd = t.replace(/\*+/g, '').trim()
  if (!/[.!?…]["')\]]*$/u.test(plainEnd) && plainEnd.split(/\s+/).length >= 12) {
    return true
  }

  return false
}

/**
 * Drop a trailing incomplete fragment; keep prior complete sentences / lines.
 * Returns null when nothing shippable remains.
 */
export function salvageCompleteChatReply(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  if (!looksLikeIncompleteChatReply(trimmed)) return trimmed

  const lines = trimmed.split('\n')
  if (lines.length >= 2) {
    const kept: string[] = []
    for (const line of lines) {
      const bare = line.replace(/^[\s•*\d.)-]+/, '').trim()
      if (!bare) {
        kept.push(line)
        continue
      }
      if (looksLikeIncompleteChatReply(bare) || endsDangling(bare)) break
      if (!/[.!?…]["')\]]*$/u.test(bare.replace(/\*+/g, '').trim()) && bare.split(/\s+/).length >= 8) {
        break
      }
      kept.push(line)
    }
    const out = kept.join('\n').trim()
    if (out && !looksLikeIncompleteChatReply(out)) return out
  }

  // Sentence-level salvage
  const sentences =
    trimmed.match(/[^.!?]+[.!?]+(?:["')\]]+)?/g)?.map((s) => s.trim()).filter(Boolean) ?? []
  if (sentences.length) {
    const out = sentences.join(' ').trim()
    if (out && !looksLikeIncompleteChatReply(out)) return out
  }

  return null
}

const ABRUPT_CUT_FALLBACK =
  'My last reply got cut short before it finished. Ask again and I’ll keep the answer tighter — or name a year, date, or heritage beat.'

/**
 * Never ship mid-sentence truncation. Prefer salvaged complete prose, then a short retry cue.
 * Also strips report-brief scaffolding before ship.
 */
export function ensureCompleteChatReply(text: string): string {
  const cleaned = stripChatReportScaffolding(text)
  if (!looksLikeIncompleteChatReply(cleaned)) return cleaned
  return salvageCompleteChatReply(cleaned) || ABRUPT_CUT_FALLBACK
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

/**
 * Strip report-brief scaffolding Gemini sometimes invents (### headings, Pointers to Cite, etc.).
 * Chat should stay prose + optional bullets; cites live in the UI.
 */
const REPORT_SECTION_LINE =
  /^(beat summary|strategic(?:\s*&\s*|\s+and\s+)?cultural significance|heritage preservation|global infrastructure|cultural positioning|pointers? to cite|source anchor|desk guidance|transaction terms|operating model|press desk research notes)\s*:?\s*$/i

const REPORT_BULLET_DROP =
  /^\s*([-*•]|\d+[.)])\s*(source anchor|desk guidance)\s*:/i

const REPORT_BULLET_UNLABEL =
  /^\s*([-*•]|\d+[.)])\s*(event|transaction terms|operating model|heritage preservation|global infrastructure|cultural positioning)\s*:\s*/i

export function stripChatReportScaffolding(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let skippingCiteTail = false

  for (const raw of lines) {
    const line = raw.trimEnd()
    const trimmed = line.trim()

    if (/^#{1,6}\s/.test(trimmed)) {
      // Keep a useful title fragment after hashes when it's just the beat name
      const bare = trimmed
        .replace(/^#{1,6}\s+/, '')
        .replace(/\s*[—–-]\s*Press Desk.*$/i, '')
        .trim()
      if (bare && !REPORT_SECTION_LINE.test(bare) && !/^press desk\b/i.test(bare)) {
        out.push(`**${bare}**`)
      }
      continue
    }

    if (REPORT_SECTION_LINE.test(trimmed)) {
      if (/^pointers? to cite/i.test(trimmed)) skippingCiteTail = true
      continue
    }

    if (skippingCiteTail || REPORT_BULLET_DROP.test(trimmed)) continue

    // Drop inline “Source Anchor:” / “Desk Guidance:” lines even without a bullet
    if (/^(source anchor|desk guidance)\s*:/i.test(trimmed)) continue

    if (REPORT_BULLET_UNLABEL.test(trimmed)) {
      const rest = trimmed.replace(REPORT_BULLET_UNLABEL, '').trim()
      if (rest) out.push(`• ${rest}`)
      continue
    }

    out.push(line)
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Soft rewrite when chat reply looks like a finished story. */
export function coerceChatAwayFromStory(text: string): string {
  const cleaned = stripChatReportScaffolding(text)
  if (!looksLikeFinishedStory(cleaned)) return ensureCompleteChatReply(cleaned)
  const bullets = coerceToCliffNotesBullets(cleaned, 6)
  if (bullets.length === 0) {
    return "I can share sourced facts and short notes, but I don't write finished press stories. Ask me for cliff notes, a feature, or a date in the timeline."
  }
  return ensureCompleteChatReply(bullets.map((b) => `• ${b}`).join('\n'))
}
