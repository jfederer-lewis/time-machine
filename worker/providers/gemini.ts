import type { NarrativeBlock } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'
import { toDisplayDate } from '../../shared/source-registry'
import { cleanPressText, looksLikeDateOnlyTitle, endsDangling, titleEchoesBody } from '../lib/clean-text'

const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.6-flash']

export type ClaimCandidate = {
  url: string
  title: string
  snippet?: string
  publisher?: string
  publishedAt?: string
}

export type ClaimVerification = {
  legit: boolean
  confidence: 'high' | 'medium' | 'low'
  betterCitation?: ClaimCandidate
  groundedSources: ClaimCandidate[]
  reason?: string
}

/**
 * Gemini narrative voice.
 * Contract: phrase lede/headline ONLY from supplied event cards — never invent facts.
 */
export async function composeNarrative(opts: {
  apiKey?: string
  brand: BrandConfig
  queryDate: string
  eventSummaries: string[]
}): Promise<NarrativeBlock> {
  const { apiKey, brand, queryDate, eventSummaries } = opts
  const display = formatDisplayDate(queryDate)

  // Formulaic frame keeps the brand claim; date is shown separately in the UI.
  const headline = brand.claimFrame
  const fallbackLede =
    eventSummaries.length > 0
      ? firstSentence(stripSummaryPrefix(eventSummaries[0]))
      : `No fact on record for ${display}.`

  if (!apiKey) {
    return {
      headline,
      lede: fallbackLede,
      voice: 'template',
      disclaimer: '',
    }
  }

  try {
    const prompt = [
      'Task: fact retrieval for a press desk — not a history lesson.',
      `Query date: ${display}`,
      'Return ONE short factual sentence from the sourced item below.',
      'Rules: no storytelling, no context-setting, no “on this day in history” framing, no invented details.',
      'If the source is thin, say so in one plain sentence.',
      'Source:',
      ...eventSummaries.slice(0, 1).map((s, i) => `${i + 1}. ${s}`),
    ].join('\n')

    const text = await generateGeminiText({
      apiKey,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 256,
    })

    if (!text) throw new Error('Empty Gemini response')

    return {
      headline,
      lede: firstSentence(text.replace(/^lede:\s*/i, '')),
      voice: 'gemini',
      disclaimer: '',
    }
  } catch (err) {
    console.error('[time-machine] Gemini failed', err)
    return {
      headline,
      lede: fallbackLede,
      voice: 'template',
      disclaimer: '',
    }
  }
}

/**
 * Rewrite a sourced event into a readable headline + body.
 * Full mode: multi-sentence prose paragraph. Lite: complete headline + one full sentence.
 * Facts must come only from the supplied text — no invention.
 */
export async function polishEventCopy(opts: {
  apiKey: string
  year: number
  title: string
  synopsis: string
  pageTitle?: string
  mode?: 'full' | 'lite'
}): Promise<{ title: string; synopsis: string } | null> {
  const { apiKey, year, title, synopsis, pageTitle, mode = 'full' } = opts
  const cleanTitle = cleanPressText(title)
  const cleanSynopsis = cleanPressText(synopsis)
  const cleanPage = pageTitle ? cleanPressText(pageTitle) : ''

  if (!cleanSynopsis && !cleanTitle) return null

  const isFull = mode === 'full'

  const prompt = [
    'You write press-desk cards for a heritage brand time machine.',
    isFull
      ? 'Rewrite the sourced event below into a clear headline and a short prose paragraph a journalist can read aloud.'
      : 'Rewrite the sourced event below into a clear complete headline and one full summary sentence.',
    '',
    `Year: ${year}`,
    `Current title: ${cleanTitle}`,
    cleanPage ? `Linked article title: ${cleanPage}` : '',
    `Source text: ${cleanSynopsis || cleanTitle}`,
    '',
    'Return JSON only:',
    '{"title":string,"synopsis":string}',
    '',
    'Rules:',
    '- title: short newspaper-style headline (aim under 90 characters). A COMPLETE thought that can stand alone — never end mid-clause, never end on “the/of/a/and/…”, never use ellipsis. Name the event or action — never a bare calendar date.',
    '- CRITICAL: title must NOT be an exact copy of the synopsis (or the synopsis with the period stripped). Near-duplicates with different wording are fine — just don’t paste the body up as the headline.',
    isFull
      ? '- synopsis: 2 to 4 complete sentences of plain prose. State what happened, who was involved, and why it mattered, in natural flowing English. Distinct from the title. No bullet lists, no markdown, no HTML, no table chrome, no pipe characters, no navigation leftovers from web pages.'
      : '- synopsis: exactly ONE complete sentence that reads naturally on its own. Distinct from the title — add place, stakes, or context the title omits. Do not restate the title verbatim. Do not truncate.',
    '- Use ONLY facts present in the source text (and article title for naming). Do not invent details, numbers, or outcomes.',
    `- Write as of the event year (${year}): name people by the role they held then, not by today's titles. Never use “former”, “current”, or “ex-” relative to the present day.`,
    '- Prefer clear past tense for historical events.',
    '- No “on this day”, no brand voice, no storytelling flourishes.',
    '- Ignore any HTML tags, markdown, site chrome, or boilerplate that leaked into the source text.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { text } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.2,
      maxOutputTokens: isFull ? 512 : 320,
      json: true,
      useSearch: false,
    })
    if (!text) return null

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const raw = JSON.parse(cleaned) as { title?: string; synopsis?: string }
    let nextTitle = cleanPressText(raw.title || '').replace(/[.…]+$/u, '').trim()
    const nextSynopsis = cleanPressText(raw.synopsis || '')
    if (!nextTitle || !nextSynopsis) return null
    if (looksLikeDateOnlyTitle(nextTitle)) return null
    if (endsDangling(nextTitle)) return null
    if (titleEchoesBody(nextTitle, nextSynopsis)) return null

    // Soft length cap at a word boundary only — never mid-clause.
    if (nextTitle.length > 110) {
      const cut = nextTitle.slice(0, 110)
      const at = cut.lastIndexOf(' ')
      nextTitle = (at > 50 ? cut.slice(0, at) : cut).trim()
      if (endsDangling(nextTitle) || titleEchoesBody(nextTitle, nextSynopsis)) return null
    }

    return {
      title: nextTitle,
      synopsis: isFull ? clampProse(nextSynopsis, 4, 520) : firstSentence(nextSynopsis),
    }
  } catch (err) {
    console.error('[time-machine] Gemini event polish failed', err)
    return null
  }
}

/**
 * Verify a Wikipedia On This Day claim and propose a better Tier A/B citation.
 * Uses Google Search grounding when available. Gemini is never the citation host.
 */
export async function verifyClaimWithGemini(opts: {
  apiKey: string
  year: number
  title: string
  synopsis: string
  candidates?: ClaimCandidate[]
}): Promise<ClaimVerification | null> {
  const { apiKey, year, title, synopsis, candidates = [] } = opts

  const candidateBlock =
    candidates.length > 0
      ? [
          'Candidate sources (prefer these if they corroborate the claim):',
          ...candidates.map(
            (c, i) => `${i + 1}. ${c.title} — ${c.url}${c.snippet ? ` — ${c.snippet}` : ''}`,
          ),
        ].join('\n')
      : 'No candidate sources supplied — search for a primary or paper-of-record URL.'

  const prompt = [
    'You are a press-desk fact checker for a heritage brand time machine.',
    'A claim was discovered via Wikipedia On This Day. Wikipedia is only a bridge — never the preferred public citation.',
    '',
    `Claim year: ${year}`,
    `Claim title: ${title}`,
    `Claim text: ${synopsis}`,
    '',
    candidateBlock,
    '',
    'Tasks:',
    '1. Decide if this is a real, well-attested historical event (legit true/false).',
    '2. If legit, prefer a national archive, government, museum, wire, or reputable newspaper URL over Wikipedia.',
    '3. Prefer .gov / national archives / Library of Congress / major papers (NYT, Guardian, BBC, Reuters, AP).',
    '4. Do not invent URLs. Only return URLs you can ground in search or the candidate list.',
    '5. Never cite onthisday.com, history.com this-day indexes, or hobby time-machine sites.',
    '',
    'Respond with JSON only, matching:',
    '{"legit":boolean,"confidence":"high"|"medium"|"low","betterCitation":{"url":string,"title":string,"publisher":string,"publishedAt":string,"snippet":string}|null,"reason":string}',
  ].join('\n')

  try {
    // Search grounding + responseMimeType:json can conflict on some models —
    // ask for JSON in the prompt and parse from text instead.
    const { text, groundedSources } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.1,
      maxOutputTokens: 512,
      json: false,
      useSearch: true,
    })

    if (!text && groundedSources.length === 0) return null

    const parsed = text ? parseVerificationJson(text) : null
    if (!parsed) {
      return {
        legit: true,
        confidence: 'low',
        groundedSources,
        reason: text
          ? 'Could not parse verifier JSON; relying on grounded sources only.'
          : 'No verifier text; relying on grounded sources only.',
      }
    }

    return {
      ...parsed,
      groundedSources,
    }
  } catch (err) {
    console.error('[time-machine] Gemini claim verify failed', err)
    return null
  }
}

async function generateGeminiText(opts: {
  apiKey: string
  prompt: string
  temperature: number
  maxOutputTokens: number
}): Promise<string> {
  const { text } = await generateGeminiGrounded({ ...opts, json: false, useSearch: false })
  return text
}

async function generateGeminiGrounded(opts: {
  apiKey: string
  prompt: string
  temperature: number
  maxOutputTokens: number
  json?: boolean
  useSearch?: boolean
}): Promise<{ text: string; groundedSources: ClaimCandidate[] }> {
  const { apiKey, prompt, temperature, maxOutputTokens, json = false, useSearch = true } = opts
  let lastError = ''

  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }
    if (useSearch) {
      body.tools = [{ google_search: {} }]
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      lastError = `${model} ${res.status} ${await res.text().catch(() => '')}`
      continue
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
        groundingMetadata?: {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>
        }
      }>
    }

    const candidate = data.candidates?.[0]
    const parts = candidate?.content?.parts ?? []
    const text = parts.map((p) => p.text || '').join('').trim()
    const groundedSources: ClaimCandidate[] = (candidate?.groundingMetadata?.groundingChunks ?? [])
      .map((chunk) => {
        const url = chunk.web?.uri?.trim()
        if (!url) return null
        return {
          url,
          title: chunk.web?.title?.trim() || url,
        }
      })
      .filter((c): c is ClaimCandidate => Boolean(c))

    if (text || groundedSources.length) {
      return { text, groundedSources }
    }
  }

  throw new Error(lastError || 'Empty Gemini response')
}

function parseVerificationJson(text: string): Omit<ClaimVerification, 'groundedSources'> | null {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const raw = JSON.parse(cleaned) as {
      legit?: boolean
      confidence?: string
      betterCitation?: {
        url?: string
        title?: string
        publisher?: string
        publishedAt?: string
        snippet?: string
      } | null
      reason?: string
    }

    const confidence =
      raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low'
        ? raw.confidence
        : 'low'

    const better =
      raw.betterCitation?.url && typeof raw.betterCitation.url === 'string'
        ? {
            url: raw.betterCitation.url.trim(),
            title: (raw.betterCitation.title || '').trim() || 'Untitled',
            publisher: raw.betterCitation.publisher?.trim(),
            publishedAt: raw.betterCitation.publishedAt?.trim(),
            snippet: raw.betterCitation.snippet?.trim(),
          }
        : undefined

    return {
      legit: Boolean(raw.legit),
      confidence,
      betterCitation: better,
      reason: raw.reason?.trim(),
    }
  } catch {
    return null
  }
}

function stripSummaryPrefix(text: string) {
  // "2003: Title — synopsis" → prefer the synopsis clause when present
  const withoutYear = text.replace(/^\d{4}:\s*/, '')
  const emDash = withoutYear.indexOf(' — ')
  if (emDash !== -1) return withoutYear.slice(emDash + 3)
  const hyphen = withoutYear.indexOf(' - ')
  if (hyphen !== -1) return withoutYear.slice(hyphen + 3)
  return withoutYear
}

function firstSentence(text: string) {
  const trimmed = text.trim()
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/)
  return match ? match[1] : trimmed
}

/** Keep up to `maxSentences` sentences, hard-capped by character length. */
function clampProse(text: string, maxSentences: number, maxChars: number): string {
  const cleaned = cleanPressText(text)
  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [
    cleaned,
  ]
  let out = sentences.slice(0, maxSentences).join(' ').trim()
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars - 1).trimEnd()}…`
  }
  return out
}

function formatDisplayDate(queryDate: string): string {
  return toDisplayDate(queryDate)
}
