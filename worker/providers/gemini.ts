import type { NarrativeBlock } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'
import { toDisplayDate } from '../../shared/source-registry'
import { cleanPressText, looksLikeDateOnlyTitle, titleEchoesBody, titleIsCutFromBody, looksLikeBareName, isIncompleteHeadline, toSentenceCaseHeadline, clipToShortProse, looksLikeHeadlineDump, descriptiveFallbackTitle, firstSentence, splitSentences } from '../lib/clean-text'

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
 * Rewrite a sourced event into a readable headline + body (+ context).
 * Past-tense day fact (~1–4 sentences); era background goes in whyItMatters.
 */
export async function polishEventCopy(opts: {
  apiKey: string
  year: number
  title: string
  synopsis: string
  pageTitle?: string
  mode?: 'full' | 'lite'
}): Promise<{ title: string; synopsis: string; whyItMatters?: string } | null> {
  const { apiKey, year, title, synopsis, pageTitle } = opts
  const cleanTitle = toSentenceCaseHeadline(title)
  // Never feed wire roundups into the model — clip dumps; otherwise leave room for 1–4 sentences.
  const cleanSynopsis = looksLikeHeadlineDump(synopsis)
    ? clipToShortProse(title, 160)
    : clipToShortProse(synopsis || title, 900)
  const cleanPage = pageTitle ? toSentenceCaseHeadline(pageTitle) : ''

  if (!cleanSynopsis && !cleanTitle) return null

  const prompt = [
    'You write press-desk cards for a heritage brand time machine that looks backward in time.',
    'The reader experiences the day as settled history (“Chuck was there”) — never as breaking news.',
    'Split the card into THREE fields with different jobs. Do not put everything in synopsis.',
    '',
    `Event year: ${year}`,
    `Current title: ${cleanTitle}`,
    cleanPage ? `Linked article title: ${cleanPage}` : '',
    `Source text: ${cleanSynopsis || cleanTitle}`,
    '',
    'Return JSON only:',
    '{"title":string,"synopsis":string,"whyItMatters":string}',
    '',
    'Field jobs:',
    '1) title — short sentence-case hed stating the OUTCOME of the day (under 80 chars). Must include who/what + the action. Complete thought. No ?, no ellipsis, no ALL CAPS.',
    '   Bad: “Following the non-cooperation movement against the government of Bangladesh” (lead-in only).',
    '   Good: “Sheikh Hasina resigns and flees Bangladesh”.',
    '   Never chop the opening subordinate clause off the synopsis and call it a title.',
    '2) synopsis — ONLY the day fact. Guideline: about 1–4 complete sentences, as long as the source honestly supports — never pad to hit a count, never cut mid-thought for a character quota. What happened that day, from the source only. No era essay, no wire roundup.',
    '3) whyItMatters — SEPARATE background for a general reader: the larger era, who the actors were, how long it had been going, why the day had weight. 1–2 short sentences. This is a REQUIRED field and must NEVER be empty or null; always provide historical context, background, or explanation of the event\'s significance or legacy.',
    '',
    'Rules:',
    '- Voice: always past tense. Never present-tense breaking news or open questions.',
    '- title must NOT copy the synopsis, and must NOT be a truncated prefix / “Following… / After…” clause of the synopsis.',
    '- Put “why / era / stakes” material in whyItMatters, not synopsis.',
    '- Never return null or empty for whyItMatters under any circumstances. Always write a meaningful 1-2 sentence context of the era or significance of the event.',
    `- Write as of ${year}: name people by the role they held then. Never “former/current/ex-” relative to today.`,
    '- No “on this day”, no brand voice, no storytelling flourishes.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { text } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 520,
      json: true,
      useSearch: false,
    })
    if (!text) return null

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const raw = JSON.parse(cleaned) as {
      title?: string
      synopsis?: string
      whyItMatters?: string | null
    }
    let nextTitle = toSentenceCaseHeadline(raw.title || '')
    let nextSynopsis = cleanPressText(raw.synopsis || '')
    if (!nextTitle || !nextSynopsis) return null
    if (looksLikeHeadlineDump(nextSynopsis)) {
      nextSynopsis = clipToShortProse(nextSynopsis, 400)
    }
    if (looksLikeDateOnlyTitle(nextTitle)) return null
    if (looksLikeBareName(nextTitle)) return null
    if (isIncompleteHeadline(nextTitle)) return null
    if (titleEchoesBody(nextTitle, nextSynopsis)) {
      nextTitle = descriptiveFallbackTitle(nextSynopsis, cleanPage)
    }
    if (titleIsCutFromBody(nextTitle, nextSynopsis)) {
      nextTitle = descriptiveFallbackTitle(nextSynopsis, cleanPage)
    }
    if (
      !nextTitle ||
      looksLikeBareName(nextTitle) ||
      isIncompleteHeadline(nextTitle) ||
      titleEchoesBody(nextTitle, nextSynopsis) ||
      titleIsCutFromBody(nextTitle, nextSynopsis)
    ) {
      return null
    }

    if (nextTitle.length > 120) {
      const cut = nextTitle.slice(0, 120)
      const at = cut.lastIndexOf(' ')
      nextTitle = (at > 60 ? cut.slice(0, at) : cut).trim()
      if (
        isIncompleteHeadline(nextTitle) ||
        looksLikeBareName(nextTitle) ||
        titleEchoesBody(nextTitle, nextSynopsis) ||
        titleIsCutFromBody(nextTitle, nextSynopsis)
      ) {
        nextTitle = descriptiveFallbackTitle(nextSynopsis, cleanPage)
      }
      if (
        !nextTitle ||
        isIncompleteHeadline(nextTitle) ||
        titleIsCutFromBody(nextTitle, nextSynopsis)
      ) {
        return null
      }
    }

    const whyRaw =
      typeof raw.whyItMatters === 'string' ? cleanPressText(raw.whyItMatters) : ''

    // Keep day fact to ~1–4 sentences; peel true overflow into context.
    const split = splitFactAndContext(nextSynopsis, whyRaw)

    return {
      title: nextTitle,
      synopsis: split.synopsis,
      ...(split.whyItMatters ? { whyItMatters: split.whyItMatters } : {}),
    }
  } catch (err) {
    console.error('[time-machine] Gemini event polish failed', err)
    return null
  }
}

/** Day fact ~1–4 sentences; leftover beyond that can become context. */
function splitFactAndContext(
  synopsis: string,
  whyRaw: string,
): { synopsis: string; whyItMatters?: string } {
  const sentences =
    cleanPressText(synopsis)
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [cleanPressText(synopsis)]

  // Guideline ceiling: 4 sentences. Soft runaway guard only (not a harsh length quota).
  let day = sentences.slice(0, 4).join(' ').trim()
  let overflow = sentences.slice(4).join(' ').trim()

  day = clampProse(day, 4, 1200)

  let why = whyRaw && !looksLikeHeadlineDump(whyRaw) ? clampProse(whyRaw, 3, 500) : ''
  if (!why && overflow) {
    why = clampProse(overflow, 3, 500)
  }

  if (why && (titleEchoesBody(why, day) || normalizeLoose(why) === normalizeLoose(day))) {
    why = ''
  }

  return {
    synopsis: day,
    ...(why ? { whyItMatters: why } : {}),
  }
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
 * Pick the most poignant / press-worthy event from a shortlist.
 * Bias: UK & global cultural significance over remote administrative trivia.
 * Returns the chosen index into `candidates`, or null on failure.
 */
export async function pickMostInterestingEvent(opts: {
  apiKey: string
  queryDate: string
  targetYear: number
  candidates: Array<{ title: string; synopsis: string; year: number }>
}): Promise<number | null> {
  const { apiKey, queryDate, targetYear, candidates } = opts
  if (candidates.length === 0) return null
  if (candidates.length === 1) return 0

  const list = candidates
    .slice(0, 8)
    .map(
      (c, i) =>
        `${i}. [${c.year}] ${cleanPressText(c.title)} — ${clipToShortProse(c.synopsis, 180)}`,
    )
    .join('\n')

  const prompt = [
    'You are a UK press-desk editor for a heritage brand time machine (“Chuck was there”).',
    `Lookup date: ${queryDate} (prefer events in ${targetYear} when they are genuinely interesting historical moments).`,
    '',
    'Pick the SINGLE most interesting, poignant, or culturally resonant settled historical event for a British / international reader.',
    'Prefer: major geopolitics, war & peace, culture, sport, science, music, design, human-rights moments, UK/Europe/global stakes.',
    'Deprioritise: remote administrative changes, local municipal trivia, live wire roundups, breaking-news question headlines, obscure territorial reorganisations.',
    'Do not invent events — choose only by index from the list.',
    '',
    'Candidates:',
    list,
    '',
    'Return JSON only: {"index":number,"reason":string}',
  ].join('\n')

  try {
    const { text } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.1,
      maxOutputTokens: 128,
      json: true,
      useSearch: false,
    })
    if (!text) return null
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const raw = JSON.parse(cleaned) as { index?: number }
    const index = typeof raw.index === 'number' ? Math.floor(raw.index) : -1
    if (index < 0 || index >= Math.min(candidates.length, 8)) return null
    return index
  } catch (err) {
    console.error('[time-machine] Gemini event pick failed', err)
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

// Remove localized duplicate functions as we now import from clean-text


/** Keep up to `maxSentences`; `maxChars` is only a runaway guard, not a target length. */
function clampProse(text: string, maxSentences: number, maxChars: number): string {
  const cleaned = cleanPressText(text)
  const sentences = splitSentences(cleaned)
  let out = sentences.slice(0, maxSentences).join(' ').trim()
  if (out.length > maxChars) {
    // Prefer ending on a sentence boundary inside the guard, else soft word cut.
    const within = out.slice(0, maxChars)
    const lastStop = Math.max(within.lastIndexOf('.'), within.lastIndexOf('!'), within.lastIndexOf('?'))
    if (lastStop > maxChars * 0.45) {
      out = within.slice(0, lastStop + 1).trim()
    } else {
      const at = within.lastIndexOf(' ')
      out = `${(at > 80 ? within.slice(0, at) : within).trimEnd()}…`
    }
  }
  return out
}

function formatDisplayDate(queryDate: string): string {
  return toDisplayDate(queryDate)
}
