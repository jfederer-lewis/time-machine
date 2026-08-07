/**
 * Chuck-E orchestrator — intent route + reply assembly.
 * Doc: documentation/CHUCK_E.md
 */

import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import { getBrand } from '../../shared/brands'
import { allProductFacts, getProductPack, type ProductFact } from '../../shared/products'
import type { BrandMoment } from '../../shared/brand'
import { heritageMoments } from '../../shared/brand'
import type { Citation, CulturalEvent, Gloss, ResearchMode } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { parseQueryDate, toDisplayDate } from '../../shared/source-registry'
import { assembleDateQuery, type Env } from './assemble'
import { chatWithChuckE } from '../providers/gemini'
import {
  buildDisclosureMessage,
  coerceChatAwayFromStory,
  coerceToCliffNotesBullets,
  ensureCompleteChatReply,
  validateChatReply,
  withCliffNotesMarking,
} from './chuck-e-contract'
import {
  glossesFromBrandMoments,
  glossesFromCitations,
  glossesFromProductFacts,
} from './chuck-e-glosses'

export type ChuckEIntent = 'date' | 'product' | 'heritage' | 'general' | 'cliff_notes'

export interface ChuckEChatMessage {
  role: 'user' | 'assistant'
  content: string
  isDisclosure?: boolean
  citations?: Citation[]
  /** Dotted source glosses — hover for original cite. */
  glosses?: Gloss[]
  intent?: ChuckEIntent
}

export interface ChuckEChatRequest {
  messages: ChuckEChatMessage[]
  sessionId?: string
  brandId?: string
  researchMode?: ResearchMode
}

export interface ChuckEChatResponse {
  sessionId: string
  message: ChuckEChatMessage
  /** Echo of routed intent for UI/debug. */
  intent: ChuckEIntent
  /** When date intent hit the pipeline, include the spotlight event. */
  spotlight?: CulturalEvent | null
}

export interface ChuckECliffNotesRequest {
  messages: ChuckEChatMessage[]
  brandId?: string
  title?: string
}

export interface ChuckECliffNotesResponse {
  title: string
  bullets: string[]
  citations: Citation[]
  aiBanner: string
  footer: string
  plainText: string
}

const MONTH_NAMES =
  'january|february|march|april|may|june|july|august|september|october|november|december'

const DATE_INTENT_RE = new RegExp(
  [
    '\\b(on\\s+this\\s+day|what\\s+happened|what\\s+else\\s+happened|timeline|that\\s+day|this\\s+date)\\b',
    `\\b(${MONTH_NAMES})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?\\b`,
    '\\b\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4}\\b',
    '\\b\\d{4}-\\d{2}(?:-\\d{2})?\\b',
    '\\bin\\s+(19|20)\\d{2}\\b',
  ].join('|'),
  'i',
)

const PRODUCT_INTENT_RE =
  /\b(shoe|sneaker|chuck|all[\s-]?star|feature|features|engineering|sole|canvas|rubber|vulcaniz|material|upper|toe\s*cap|eyelet|launch|silhouette|construction|spec|specs)\b/i

const HERITAGE_INTENT_RE =
  /\b(heritage|history|founded|founding|non[\s-]?skid|chuck\s+taylor|ankle\s+patch|signature|nike\s+acquir|malden|1917|1922|1934|1932|novel\s+nugget|nugget)\b/i

export function classifyIntent(text: string): ChuckEIntent {
  const t = text.trim()
  if (!t) return 'general'
  if (/\b(cliff\s*notes|press\s*brief|export|extract|journalist\s*pack)\b/i.test(t)) {
    return 'cliff_notes'
  }
  if (extractDateFromMessage(t) || DATE_INTENT_RE.test(t)) return 'date'
  if (PRODUCT_INTENT_RE.test(t)) return 'product'
  if (HERITAGE_INTENT_RE.test(t)) return 'heritage'
  return 'general'
}

/** Pull YYYY | YYYY-MM | YYYY-MM-DD from free text when possible. */
export function extractDateFromMessage(text: string): string | null {
  const iso = text.match(/\b((?:18|19|20)\d{2}-\d{2}-\d{2})\b/)
  if (iso) return parseQueryDate(iso[1])

  const ym = text.match(/\b((?:18|19|20)\d{2}-\d{2})\b/)
  if (ym) return parseQueryDate(ym[1])

  const yearOnly = text.match(/\b(?:in|year|during)\s+((?:18|19|20)\d{2})\b/i)
  if (yearOnly) return parseQueryDate(yearOnly[1])

  const monthDayYear = text.match(
    new RegExp(`\\b(${MONTH_NAMES})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*((?:18|19|20)\\d{2})\\b`, 'i'),
  )
  if (monthDayYear) {
    const month = monthIndex(monthDayYear[1])
    if (month != null) {
      const d = String(Number(monthDayYear[2])).padStart(2, '0')
      const m = String(month + 1).padStart(2, '0')
      return parseQueryDate(`${monthDayYear[3]}-${m}-${d}`)
    }
  }

  const bareYear = text.match(/\b((?:18|19|20)\d{2})\b/)
  if (bareYear && /\b(what\s+happened|on\s+this\s+day|timeline|history)\b/i.test(text)) {
    return parseQueryDate(bareYear[1])
  }

  return null
}

function monthIndex(name: string): number | null {
  const idx = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ].indexOf(name.toLowerCase())
  return idx >= 0 ? idx : null
}

function newSessionId(): string {
  return `chuck-e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function citationFromProductFact(fact: ProductFact): Citation | null {
  if (!fact.citation) return null
  const accessedAt = new Date().toISOString().slice(0, 10)
  return withHarvard({
    title: fact.citation.title,
    url: fact.citation.url,
    publisher: fact.citation.publisher,
    publishedAt: fact.citation.publishedAt,
    accessedAt,
    sourceQuality: fact.needsHumanReview || fact.precision === 'period-estimate'
      ? 'needs-human-review'
      : 'trusted-source-snippet',
    evidenceKind: 'paraphrase',
    reference: fact.body,
    provider: 'brand-timeline',
    isExactQuote: false,
    tier: 'C',
  })
}

function citationFromBrandMoment(moment: BrandMoment): Citation {
  const accessedAt = new Date().toISOString().slice(0, 10)
  return withHarvard({
    title: moment.citation.title,
    url: moment.citation.url,
    publisher: moment.citation.publisher,
    author: moment.citation.author,
    publishedAt: moment.citation.publishedAt,
    accessedAt,
    sourceQuality:
      moment.precision === 'period-estimate' ? 'period-estimate' : 'trusted-source-snippet',
    evidenceKind: moment.isExactQuote ? 'quote' : 'paraphrase',
    reference: moment.reference,
    provider: 'brand-timeline',
    isExactQuote: moment.isExactQuote,
    tier: 'C',
  })
}

/** One Harvard line per URL — same History LP / pack page must not repeat in chat. */
function dedupeCitationsByUrl(citations: Citation[]): Citation[] {
  const seen = new Set<string>()
  const out: Citation[] = []
  for (const c of citations) {
    const key = (c.url || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

function scoreFact(fact: ProductFact, query: string): number {
  const q = query.toLowerCase()
  let score = 0
  const hay = `${fact.label} ${fact.body} ${(fact.tags || []).join(' ')}`.toLowerCase()
  for (const token of q.split(/\W+/).filter((t) => t.length > 2)) {
    if (hay.includes(token)) score += 1
  }
  return score
}

function matchProductFacts(query: string, limit = 4): ProductFact[] {
  const pack = getProductPack()
  const facts = allProductFacts(pack)
  if (!facts.length) return []
  return facts
    .map((f) => ({ f, score: scoreFact(f, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.f)
}

function matchHeritageMoments(
  query: string,
  brandId: string,
  limit = 3,
  opts: { softFallback?: boolean } = {},
): BrandMoment[] {
  const brand = getBrand(brandId)
  const q = query.toLowerCase()
  const scored = heritageMoments(brand).map((m) => {
    const hay = `${m.title} ${m.synopsis} ${m.date}`.toLowerCase()
    let score = 0
    for (const token of q.split(/\W+/).filter((t) => t.length > 2)) {
      if (hay.includes(token)) score += 1
    }
    // Boost well-known years if mentioned
    if (q.includes(m.date.slice(0, 4))) score += 2
    return { m, score }
  })
  const hits = scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score)
  if (hits.length) return hits.slice(0, limit).map((x) => x.m)
  // Soft fallback: return a couple of core moments when user asks generally about heritage
  if (opts.softFallback !== false) return brand.timeline.slice(0, limit)
  return []
}

function formatProductReply(facts: ProductFact[], packIsPlaceholder: boolean): {
  content: string
  citations: Citation[]
  glosses: Gloss[]
} {
  if (!facts.length) {
    if (packIsPlaceholder) {
      return {
        content:
          "I don't have Converse-supplied engineering or feature details for the new Chuck yet — that launch pack is still pending. I can help with heritage timeline nuggets, on-this-day cultural lookups, or cliff notes from what we've already discussed. Ask me about All Star history, or give me a date.",
        citations: [],
        glosses: [],
      }
    }
    return {
      content:
        "I don't have that product detail in the launch pack. Try asking about a specific feature, or switch to heritage / a date lookup.",
      citations: [],
      glosses: [],
    }
  }

  const lines: string[] = []
  const citations: Citation[] = []
  for (const fact of facts) {
    const flag =
      fact.precision === 'period-estimate' || fact.needsHumanReview
        ? ' _(period estimate / needs human review)_'
        : ''
    lines.push(`• **${fact.label}**${flag} — ${fact.body}`)
    const cite = citationFromProductFact(fact)
    if (cite) citations.push(cite)
  }
  return {
    content: lines.join('\n'),
    citations: dedupeCitationsByUrl(citations),
    glosses: glossesFromProductFacts(facts),
  }
}

function formatHeritageReply(moments: BrandMoment[]): {
  content: string
  citations: Citation[]
  glosses: Gloss[]
} {
  if (!moments.length) {
    return {
      content: "I don't have a matching heritage moment for that. Try a year (e.g. 1917) or ask about Non-Skid / Chuck Taylor / Nike acquisition.",
      citations: [],
      glosses: [],
    }
  }
  const lines: string[] = []
  const citations: Citation[] = []
  for (const m of moments) {
    const flag = m.precision === 'period-estimate' ? ' _(period estimate — contested)_' : ''
    lines.push(`• **${m.date}: ${m.title}**${flag} — ${m.synopsis}`)
    citations.push(citationFromBrandMoment(m))
  }
  return {
    content: lines.join('\n'),
    citations: dedupeCitationsByUrl(citations),
    glosses: glossesFromBrandMoments(moments),
  }
}

function formatDateSpotlight(event: CulturalEvent, displayDate: string): {
  content: string
  citations: Citation[]
  glosses: Gloss[]
} {
  const parts = [
    `On **${displayDate}** (sourced Time Machine lookup):`,
    `**${event.title}**`,
    event.synopsis,
  ]
  if (event.whyItMatters) {
    parts.push(`Context: ${event.whyItMatters}`)
  }
  if (event.needsHumanReview || event.precision === 'period-estimate') {
    parts.push('_Flagged for human review / period estimate — verify before press use._')
  }
  const content = parts.join('\n\n')
  const citations = dedupeCitationsByUrl(event.citations ?? [])
  return {
    content,
    citations,
    glosses: [
      ...(event.glosses ?? []),
      ...glossesFromCitations(citations, content),
    ],
  }
}

function buildSystemContext(brandId: string): string {
  const brand = getBrand(brandId)
  const pack = getProductPack()
  const heritageLines = heritageMoments(brand)
    .slice(0, 40)
    .map(
      (m) =>
        `- ${m.date}: ${m.title} — ${m.synopsis} [source: ${m.citation.url}]`,
    )
    .join('\n')
  const productLines = allProductFacts(pack)
    .slice(0, 20)
    .map((f) => `- [${f.id}] ${f.label}: ${f.body}`)
    .join('\n')

  return [
    ...CHUCK_E_KNOBS.personaGuardrails,
    '',
    `Brand: ${brand.name} · ${brand.productLine}`,
    `Frame: ${brand.claimFrame}`,
    '',
    `Launch pack: ${pack.name} (${pack.isPlaceholder ? 'PLACEHOLDER — no invented specs' : 'live'})`,
    pack.summary,
    productLines ? `Product facts:\n${productLines}` : 'Product facts: (none loaded yet)',
    '',
    `Heritage timeline (cite Converse History for these — never invent):\n${heritageLines}`,
  ].join('\n')
}

/**
 * Ensure every session starts with the Art. 50 disclosure bubble.
 * Returns messages with disclosure prepended when missing.
 */
export function ensureDisclosure(messages: ChuckEChatMessage[]): ChuckEChatMessage[] {
  if (messages.length === 0) {
    return [buildDisclosureMessage()]
  }
  const first = messages[0]
  if (first.role === 'assistant' && (first.isDisclosure || first.content === CHUCK_E_KNOBS.disclosureText)) {
    return messages
  }
  return [buildDisclosureMessage(), ...messages]
}

export function openingPayload(sessionId?: string): ChuckEChatResponse {
  const disclosure = buildDisclosureMessage()
  return {
    sessionId: sessionId || newSessionId(),
    message: disclosure,
    intent: 'general',
  }
}

export async function handleChuckEChat(
  body: ChuckEChatRequest,
  env: Env,
): Promise<ChuckEChatResponse> {
  const brandId = body.brandId || env.BRAND_ID || 'converse'
  const sessionId = body.sessionId || newSessionId()
  const researchMode: ResearchMode = body.researchMode === 'full' ? 'full' : 'lite'
  const messages = ensureDisclosure(body.messages || [])

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (!lastUser?.content?.trim()) {
    return {
      sessionId,
      message: buildDisclosureMessage(),
      intent: 'general',
    }
  }

  const intent = classifyIntent(lastUser.content)

  if (intent === 'date') {
    const date = extractDateFromMessage(lastUser.content)
    if (date) {
      try {
        const result = await assembleDateQuery(date, env, {
          brandId,
          researchMode,
          anyYear: false,
        })
        const spotlight =
          result.events.find((e) => e.precision === 'exact-day') ??
          result.events[0] ??
          result.brandMoments[0] ??
          null

        if (spotlight) {
          const formatted = formatDateSpotlight(spotlight, result.displayDate || toDisplayDate(date))
          return {
            sessionId,
            intent,
            spotlight,
            message: {
              role: 'assistant',
              content: coerceChatAwayFromStory(formatted.content),
              citations: formatted.citations,
              glosses: formatted.glosses,
              intent,
            },
          }
        }

        return {
          sessionId,
          intent,
          spotlight: null,
          message: {
            role: 'assistant',
            content: `No sourced fact on record for ${toDisplayDate(date)} in the Time Machine yet. Try another date, or ask about Converse heritage (1917 Non-Skid, 1922 Chuck Taylor joins, etc.).`,
            intent,
          },
        }
      } catch (err) {
        console.error('[chuck-e] date assemble failed', err)
      }
    }
    // Date-ish language but no parseable date → fall through to general with a nudge
  }

  if (intent === 'product') {
    const pack = getProductPack()
    const facts = matchProductFacts(lastUser.content)
    const formatted = formatProductReply(facts, pack.isPlaceholder)
    // If we have pack hits, return them; otherwise try heritage as soft assist then Gemini
    if (facts.length || pack.isPlaceholder) {
      // When placeholder and no facts, still offer heritage if query also smells heritage
      if (!facts.length && HERITAGE_INTENT_RE.test(lastUser.content)) {
        const moments = matchHeritageMoments(lastUser.content, brandId)
        const heritage = formatHeritageReply(moments)
        return {
          sessionId,
          intent: 'heritage',
          message: {
            role: 'assistant',
            content: coerceChatAwayFromStory(
              `${formatted.content}\n\nMeanwhile, from the heritage timeline:\n${heritage.content}`,
            ),
            citations: heritage.citations,
            glosses: heritage.glosses,
            intent: 'heritage',
          },
        }
      }
      return {
        sessionId,
        intent,
        message: {
          role: 'assistant',
          content: coerceChatAwayFromStory(formatted.content),
          citations: formatted.citations,
          glosses: formatted.glosses,
          intent,
        },
      }
    }
  }

  if (intent === 'heritage') {
    const moments = matchHeritageMoments(lastUser.content, brandId)
    const formatted = formatHeritageReply(moments)
    return {
      sessionId,
      intent,
      message: {
        role: 'assistant',
        content: coerceChatAwayFromStory(formatted.content),
        citations: formatted.citations,
        glosses: formatted.glosses,
        intent,
      },
    }
  }

  // General (and cliff_notes-as-chat, date-without-parseable-date, product miss): Gemini when keyed
  const systemContext = buildSystemContext(brandId)
  let reply: string | null = null

  if (env.GEMINI_API_KEY) {
    reply = await chatWithChuckE({
      apiKey: env.GEMINI_API_KEY,
      systemContext,
      messages: messages
        .filter((m) => !m.isDisclosure)
        .map((m) => ({ role: m.role, content: m.content })),
    })
  }

  if (!reply) {
    reply =
      intent === 'date'
        ? "I couldn't parse a full date from that. Try ISO (YYYY-MM-DD) or a phrase like “1 April 1999”, or ask about Converse heritage years (1917, 1922…)."
        : "I can help with Converse heritage nuggets, on-this-day cultural lookups (give me a date), and — once the launch pack is loaded — new Chuck engineering and features. What would you like to pull?"
  }

  const checked = validateChatReply(reply)
  const content = ensureCompleteChatReply(
    checked.ok ? reply : coerceChatAwayFromStory(reply),
  )

  // Attach Converse History cites for any heritage beats the reply (or query) touches
  const groundedMoments = matchHeritageMoments(`${lastUser.content}\n${content}`, brandId, 4, {
    softFallback: false,
  })
  const grounded = formatHeritageReply(groundedMoments)
  const replyLooksHeritage = groundedMoments.length > 0

  const citations = replyLooksHeritage ? grounded.citations : []
  const glosses = replyLooksHeritage ? grounded.glosses : []

  return {
    sessionId,
    intent: intent === 'cliff_notes' ? 'general' : intent,
    message: {
      role: 'assistant',
      content,
      citations: citations.length ? citations : undefined,
      glosses: glosses.length ? glosses : undefined,
      intent,
    },
  }
}

export function handleChuckECliffNotes(body: ChuckECliffNotesRequest): ChuckECliffNotesResponse {
  const brand = getBrand(body.brandId || 'converse')
  const messages = body.messages || []

  const citations: Citation[] = []
  const seenUrls = new Set<string>()
  const bulletCandidates: string[] = []

  for (const m of messages) {
    if (m.role !== 'assistant' || m.isDisclosure) continue
    if (m.citations) {
      for (const c of m.citations) {
        if (c.url && !seenUrls.has(c.url)) {
          seenUrls.add(c.url)
          citations.push(c)
        }
      }
    }
    const fromMsg = coerceToCliffNotesBullets(m.content, CHUCK_E_KNOBS.cliffNotesMaxBullets)
    for (const b of fromMsg) {
      if (bulletCandidates.length >= CHUCK_E_KNOBS.cliffNotesMaxBullets) break
      if (!bulletCandidates.includes(b)) bulletCandidates.push(b)
    }
  }

  // If conversation is thin, seed from heritage timeline so export isn't empty
  if (bulletCandidates.length === 0) {
    for (const moment of brand.timeline.slice(0, 4)) {
      bulletCandidates.push(`${moment.date}: ${moment.title} — ${moment.synopsis}`)
      citations.push(citationFromBrandMoment(moment))
    }
  }

  const title =
    body.title?.trim() ||
    `${brand.name} · ${CHUCK_E_KNOBS.agentName} editorial cliff notes`

  const draft = withCliffNotesMarking({
    title,
    bullets: bulletCandidates.slice(0, CHUCK_E_KNOBS.cliffNotesMaxBullets),
    citations: dedupeCitationsByUrl(citations),
  })

  const plainText = [
    draft.aiBanner,
    '',
    draft.title,
    '',
    ...draft.bullets.map((b) => `• ${b}`),
    '',
    'Sources',
    ...draft.citations.map((c) => `- ${c.harvard || `${c.publisher}: ${c.url}`}`),
    '',
    draft.footer,
  ].join('\n')

  return {
    title: draft.title,
    bullets: draft.bullets,
    citations: draft.citations,
    aiBanner: draft.aiBanner!,
    footer: draft.footer!,
    plainText,
  }
}
