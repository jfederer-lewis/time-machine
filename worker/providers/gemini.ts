import type { NarrativeBlock, CulturalEvent } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'
import {
  toDisplayDate,
  citationTier,
  findRegistryEntry,
  isCitationBlocked,
} from '../../shared/source-registry'
import { cleanPressText, looksLikeDateOnlyTitle, titleEchoesBody, titleIsCutFromBody, titleTooCloseToBody, looksLikeBareName, isIncompleteHeadline, toSentenceCaseHeadline, clipToShortProse, looksLikeHeadlineDump, descriptiveFallbackTitle, firstSentence, splitSentences } from '../lib/clean-text'
import { COPY_KNOBS, polishedCopyJsonSchemaHint, validateCopyContract, keepWholeSentences } from '../lib/copy-contract'
import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'

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
 * (Retrieval lives in discoverEventsWithGemini — Gemini may find events, but only with a credible cite.)
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
    polishedCopyJsonSchemaHint(),
    '',
    'Field jobs:',
    `1) title — one tight line / sentence-synopsis of the OUTCOME (aim ~${COPY_KNOBS.titleAimChars} chars, not a hard cut). Who/what + the action. Complete thought. No ?, no ellipsis, no ALL CAPS. Never truncate mid-word or mid-sentence.`,
    '   Bad: “Following the non-cooperation movement against the government of Bangladesh” (lead-in only).',
    '   Good: “Sheikh Hasina resigns and flees Bangladesh”.',
    '   Never chop the opening subordinate clause off the synopsis and call it a title.',
    `2) synopsis — ONLY the day fact. Optimal about ${COPY_KNOBS.synopsisOptimalMin}–${COPY_KNOBS.synopsisOptimalMax} complete sentences (up to ~${COPY_KNOBS.synopsisSoftMax} if needed). As much as the source supports — never pad, never cut mid-word or mid-sentence. No era essay, no wire roundup.`,
    COPY_KNOBS.contextRequired
      ? '3) whyItMatters — REQUIRED Context: about a paragraph, or as much as needed, for a general reader (era, actors, stakes). Never empty. Never cut mid-sentence. Do not invent contested day-specific details or quotations.'
      : '3) whyItMatters — Context: about a paragraph, or as much as needed. Null only if the day fact is fully self-explanatory. Never cut mid-sentence.',
    '',
    'Rules:',
    '- HARD: every field must read well as complete prose — never mid-word or mid-sentence cutoffs, never trailing ellipsis from truncation.',
    '- Length aims above are recommendations, not quotas to force or pad toward.',
    '- Voice: always past tense. Never present-tense breaking news or open questions.',
    '- title must NOT copy the synopsis, and must NOT be a truncated prefix / “Following… / After…” clause of the synopsis.',
    '- title must NOT be a trivial rephrase of the same fact (e.g. “UK #1: Song” vs “UK #1 song on this date: Song”) — expand the synopsis into real prose.',
    '- Put “why / era / stakes” material in whyItMatters, not synopsis.',
    COPY_KNOBS.contextRequired
      ? '- Never return null or empty for whyItMatters under any circumstances.'
      : '- whyItMatters may be null when the day fact needs no background.',
    `- Write as of ${year}: name people by the role they held then. Never “former/current/ex-” relative to today.`,
    '- No “on this day”, no brand voice, no storytelling flourishes.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    // Flash models spend a large share of maxOutputTokens on hidden "thoughts".
    // 520 was finishing MAX_TOKENS with ~20 visible tokens → truncated JSON → empty day cards.
    const { text } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 3072,
      json: true,
      useSearch: false,
    })
    if (!text) return null

    const raw = parsePolishedCopyJson(text)
    if (!raw) return null
    let nextTitle = toSentenceCaseHeadline(raw.title || '')
    let nextSynopsis = cleanPressText(raw.synopsis || '')
    if (!nextTitle || !nextSynopsis) return null
    if (looksLikeHeadlineDump(nextSynopsis)) {
      nextSynopsis = clipToShortProse(nextSynopsis, 400)
    }
    if (looksLikeDateOnlyTitle(nextTitle)) return null
    if (looksLikeBareName(nextTitle)) return null
    if (isIncompleteHeadline(nextTitle)) return null
    if (titleEchoesBody(nextTitle, nextSynopsis) || titleTooCloseToBody(nextTitle, nextSynopsis)) {
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
      titleTooCloseToBody(nextTitle, nextSynopsis) ||
      titleIsCutFromBody(nextTitle, nextSynopsis)
    ) {
      return null
    }

    if (nextTitle.length > COPY_KNOBS.titleAimChars * 1.5) {
      // Prefer a rebuilt outcome hed over character-slicing (never mid-word / mid-sentence).
      const rebuilt = descriptiveFallbackTitle(nextSynopsis, cleanPage)
      if (
        rebuilt &&
        !isIncompleteHeadline(rebuilt) &&
        !titleTooCloseToBody(rebuilt, nextSynopsis) &&
        !titleIsCutFromBody(rebuilt, nextSynopsis)
      ) {
        nextTitle = rebuilt
      }
    }

    const whyRaw =
      typeof raw.whyItMatters === 'string' ? cleanPressText(raw.whyItMatters) : ''

    const split = splitFactAndContext(nextSynopsis, whyRaw)
    const checked = validateCopyContract({
      title: nextTitle,
      synopsis: split.synopsis,
      ...(split.whyItMatters ? { whyItMatters: split.whyItMatters } : {}),
    })

    if (!checked.ok) {
      console.warn(
        '[time-machine] copy contract failed',
        checked.issues.map((i) => i.code).join(', '),
      )
      return null
    }
    if (checked.warnings.length) {
      console.info(
        '[time-machine] copy contract warnings',
        checked.warnings.map((w) => w.code).join(', '),
      )
    }

    return checked.value
  } catch (err) {
    console.error('[time-machine] Gemini event polish failed', err)
    return null
  }
}

/**
 * Prefer keeping whole sentences. Soft-peel only above synopsisSoftMax into Context.
 * Never character-truncate mid-sentence.
 */
function splitFactAndContext(
  synopsis: string,
  whyRaw: string,
): { synopsis: string; whyItMatters?: string } {
  const sentences = splitSentences(cleanPressText(synopsis))
  const softMax = COPY_KNOBS.synopsisSoftMax

  const day =
    sentences.length > softMax
      ? keepWholeSentences(synopsis, softMax)
      : sentences.join(' ').trim()
  const overflow = sentences.length > softMax ? sentences.slice(softMax).join(' ').trim() : ''

  let why = whyRaw && !looksLikeHeadlineDump(whyRaw) ? cleanPressText(whyRaw) : ''
  if (!why && overflow) why = overflow

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
  candidates: Array<{ title: string; synopsis: string; year: number; sourceHint?: string }>
}): Promise<number | null> {
  const { apiKey, queryDate, targetYear, candidates } = opts
  if (candidates.length === 0) return null
  if (candidates.length === 1) return 0

  const list = candidates
    .slice(0, 8)
    .map((c, i) => {
      const src = c.sourceHint ? ` {source: ${c.sourceHint}}` : ''
      return `${i}. [${c.year}]${src} ${cleanPressText(c.title)} — ${clipToShortProse(c.synopsis, 180)}`
    })
    .join('\n')

  const prompt = [
    'You are a UK press-desk editor for a heritage brand time machine (“Chuck was there”).',
    `Lookup date: ${queryDate} (prefer events in ${targetYear} when they are genuinely interesting historical moments).`,
    '',
    'Pick the SINGLE most culturally significant settled historical event for a British / international reader.',
    'Primary: cultural / historical significance (arts, music, film, fashion, design, sport, science, human-rights, major geopolitics) with real prose.',
    'Brand affinity: when a candidate is clearly about Converse, Chuck Taylor, All Star / Non-Skid, or Nike’s acquisition of Converse, prefer it over a merely adjacent culture stub of similar weight — that is the product’s “Chuck was there” doorway. Do not invent Converse ties; only prefer when the candidate text already shows them. Soft preference also for Converse-universe culture already in the text (basketball clinics / Olympic hoops / skate / punk / grunge / canvas youth culture) over a competing footwear brand’s day with no Converse claim — but never force Chuck over clearly more significant world news. Standalone iconic Nike / Adidas / Vans sports or product days without a Converse claim do not get this preference.',
    'Secondary lean: among candidates of similar significance, prefer constructive / positive or neutral culture over routine tragedy, crime, or disaster — a nudge, not a veto. A clearly more significant hard-news day still wins. Do not avoid negative history when it is the significant story of the date.',
    'When a candidate already carries a paper-of-record source (NYT / TimesMachine, BBC, Guardian, Reuters, FT, Telegraph, AP), strongly prefer it over aggregator-only discovery stubs.',
    'Exception — never soft-pedal a landmark defining day. If the shortlist includes an event that defines that calendar date in world memory (e.g. 11 September 2001 attacks, Pearl Harbor, Hiroshima, moon landing, Armistice), pick that event. Ignoring it would be editorially wrong. Do not prefer a brand campaign or product story beside such a day.',
    'Deprioritise: remote administrative changes (new territories/provinces); local municipal trivia; routine NBA/MLB milestone counts; live wire roundups; reaction stories that are not the day event itself; bare “#1 song” labels without a story.',
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
 * Grounded discovery: Gemini + Google Search may propose day facts.
 * Hard gate — every candidate must carry an allowlisted Tier A/B URL from
 * grounding (or an explicit cite in the JSON that also appears in grounding).
 * Gemini is never the public citation host; the cite exists so users can
 * verify the date and read more (and so we don't ship hallucinations).
 */
export async function discoverEventsWithGemini(opts: {
  apiKey: string
  queryDate: string
}): Promise<CulturalEvent[]> {
  const { apiKey, queryDate } = opts
  const m = queryDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return []
  const year = Number(m[1])
  const display = toDisplayDate(queryDate)

  const prompt = [
    'You are a UK press-desk researcher for a heritage brand time machine (“Chuck was there”).',
    `Find culturally resonant, settled historical events that happened on ${display} (${queryDate}).`,
    'Prefer arts, music, film, fashion, design, sport, science, human rights, and major geopolitics of interest to a British / international reader.',
    'Rank by cultural significance first; among similarly significant events, lean constructive / positive or neutral culture over routine tragedy — but never omit a landmark defining day for that date (e.g. 11 September 2001).',
    '',
    'Rules:',
    '- Use Google Search grounding. Do not invent events, dates, or URLs.',
    '- Every event MUST be corroborated by at least one credible primary or paper-of-record page (NYT, BBC, Guardian, Reuters, AP, FT, Telegraph, national archives, museums, Official Charts week pages, etc.).',
    '- The source must support that this happened on that calendar date (or clearly on that day in that year).',
    '- Never cite onthisday.com, history.com this-day indexes, hobby birthday sites, or Wikipedia as the public citation (Wikipedia footnotes OK only to find the underlying primary).',
    '- Prefer the queried year when there is a strong story that day; otherwise a poignant same-calendar-day event in another year is fine if the source is clear.',
    '',
    'Return JSON only (no markdown):',
    '{"events":[{"year":number,"title":string,"synopsis":string,"sourceUrl":string,"sourceTitle":string,"publisher":string}]}',
    'Return 1–3 events max. synopsis = day fact only, 2–4 sentences, past tense. Empty events array if nothing credible is grounded.',
  ].join('\n')

  try {
    const { text, groundedSources } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 900,
      json: false,
      useSearch: true,
    })

    if (!text) return []

    const parsed = parseDiscoveryJson(text)
    if (!parsed.length) return []

    const groundedUrls = new Set(groundedSources.map((g) => normalizeUrlKey(g.url)))
    const accessedAt = new Date().toISOString()
    const out: CulturalEvent[] = []

    for (const [index, row] of parsed.entries()) {
      const sourceUrl = (row.sourceUrl || '').trim()
      if (!sourceUrl || isCitationBlocked(sourceUrl)) continue
      if (!isCredibleCiteUrl(sourceUrl)) continue

      // Prefer URLs that appeared in grounding; also accept if a grounded chunk shares the same host+path family
      const urlKey = normalizeUrlKey(sourceUrl)
      const groundedHit =
        groundedUrls.has(urlKey) ||
        groundedSources.some((g) => sameAllowlistedHost(g.url, sourceUrl))
      if (!groundedHit && groundedSources.length > 0) {
        // Fall back: pick best grounded allowlisted URL for this claim text
        const fallback = pickBestGroundedCite(groundedSources, `${row.title} ${row.synopsis}`)
        if (!fallback) continue
        row.sourceUrl = fallback.url
        row.sourceTitle = fallback.title || row.sourceTitle
        row.publisher = fallback.publisher || row.publisher
      } else if (!groundedHit) {
        continue
      }

      const citeUrl = row.sourceUrl!.trim()
      if (!isCredibleCiteUrl(citeUrl)) continue

      const title = toSentenceCaseHeadline(row.title || '')
      const synopsis = cleanPressText(row.synopsis || '')
      if (!title || !synopsis || synopsis.length < 48) continue
      if (looksLikeHeadlineDump(synopsis)) continue

      const entry = findRegistryEntry(citeUrl)
      const publisher =
        cleanPressText(row.publisher || '') || entry?.label || hostnameOf(citeUrl)
      const citeTitle =
        cleanPressText(row.sourceTitle || '') || title

      out.push({
        id: `gemini-${queryDate}-${index}`,
        year: Number.isFinite(row.year) ? row.year : year,
        title,
        synopsis,
        category: 'other',
        precision: 'exact-day',
        discoveredVia: ['gemini'],
        needsHumanReview: false,
        citations: [
          withHarvard({
            title: citeTitle && !looksLikeDateOnlyTitle(citeTitle) ? citeTitle : title,
            url: citeUrl,
            publisher,
            publishedAt: String(Number.isFinite(row.year) ? row.year : year),
            accessedAt,
            sourceQuality: 'trusted-source-snippet',
            evidenceKind: 'paraphrase',
            reference: synopsis,
            provider: 'gemini',
            isExactQuote: false,
            tier: citationTier(citeUrl),
          }),
        ],
      })
    }

    return out.slice(0, 3)
  } catch (err) {
    console.error('[time-machine] Gemini discovery failed', err)
    return []
  }
}

function isCredibleCiteUrl(url: string): boolean {
  if (isCitationBlocked(url)) return false
  const entry = findRegistryEntry(url)
  return entry?.role === 'citation' && (entry.tier === 'A' || entry.tier === 'B')
}

function pickBestGroundedCite(
  grounded: ClaimCandidate[],
  claimText: string,
): ClaimCandidate | undefined {
  const claim = claimText.toLowerCase()
  const scored = grounded
    .filter((g) => isCredibleCiteUrl(g.url))
    .map((g) => {
      const hay = `${g.title || ''} ${g.url}`.toLowerCase()
      let score = citationTier(g.url) === 'A' ? 4 : 3
      for (const token of claim.split(/[^a-z0-9]+/).filter((t) => t.length >= 5)) {
        if (hay.includes(token)) score += 1
      }
      return { g, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0]?.g
}

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/$/, '')}`
  } catch {
    return url.toLowerCase()
  }
}

function sameAllowlistedHost(a: string, b: string): boolean {
  try {
    const ha = new URL(a).hostname.replace(/^www\./, '').toLowerCase()
    const hb = new URL(b).hostname.replace(/^www\./, '').toLowerCase()
    return ha === hb || ha.endsWith(`.${hb}`) || hb.endsWith(`.${ha}`)
  } catch {
    return false
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function parseDiscoveryJson(
  text: string,
): Array<{
  year: number
  title: string
  synopsis: string
  sourceUrl?: string
  sourceTitle?: string
  publisher?: string
}> {
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start < 0 || end <= start) return []
    const raw = JSON.parse(cleaned.slice(start, end + 1)) as {
      events?: Array<Record<string, unknown>>
    }
    if (!Array.isArray(raw.events)) return []
    return raw.events
      .map((e) => ({
        year: typeof e.year === 'number' ? e.year : Number(e.year),
        title: typeof e.title === 'string' ? e.title : '',
        synopsis: typeof e.synopsis === 'string' ? e.synopsis : '',
        sourceUrl: typeof e.sourceUrl === 'string' ? e.sourceUrl : undefined,
        sourceTitle: typeof e.sourceTitle === 'string' ? e.sourceTitle : undefined,
        publisher: typeof e.publisher === 'string' ? e.publisher : undefined,
      }))
      .filter((e) => e.title && e.synopsis)
  } catch {
    return []
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

/**
 * Chuck-E chat turn — non-streaming, persona-guarded.
 * Never a public citation host. No Google Search grounding for product Q&A
 * (shoe facts must come from the supplied knowledge pack / heritage timeline).
 * Historical world claims should already be injected via context from assembleDateQuery.
 */
export async function chatWithChuckE(opts: {
  apiKey: string
  systemContext: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<string | null> {
  const { apiKey, systemContext, messages } = opts
  if (!messages.length) return null

  const history = messages
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'Journalist' : 'Chuck-E'}: ${m.content}`)
    .join('\n\n')

  const prompt = [
    systemContext,
    '',
    'Conversation so far:',
    history,
    '',
    'Reply as Chuck-E only — conversational prose, optional simple bullets. Not a memo, brief, or day-card.',
    'No markdown headings (#), no section labels (Beat Summary, Pointers to Cite, etc.), no sources block in the body.',
    'Do not write a finished press story, dateline, or byline-ready narrative.',
    'Finish every sentence. Never trail off mid-clause or end on a dangling word (of / the / our / from…).',
    `Keep it concise (soft ~${CHUCK_E_KNOBS.chatReplySoftMaxChars} chars): sharp, no jargon, no padding or repetition. Finish cleanly — never truncate mid-thought.`,
    'If the knowledge context does not contain a product detail, say you do not have that detail yet.',
  ].join('\n')

  try {
    const text = await generateGeminiText({
      apiKey,
      prompt,
      temperature: 0.35,
      // Flash models spend a large share of maxOutputTokens on hidden "thoughts".
      maxOutputTokens: CHUCK_E_KNOBS.chatMaxOutputTokens,
    })
    return text?.trim() || null
  } catch (err) {
    console.error('[chuck-e] Gemini chat failed', err)
    return null
  }
}

/**
 * Converse-framed date significance: grounded research colour on the queried day only.
 * Gemini may search; it is never the public citation host — callers attach allowlisted URLs.
 */
export async function enrichChuckEDateSignificance(opts: {
  apiKey: string
  queryDate: string
  displayDate: string
  userQuestion: string
  beat: { title: string; synopsis: string; whyItMatters?: string }
}): Promise<{ content: string; groundedSources: ClaimCandidate[] } | null> {
  const { apiKey, queryDate, displayDate, userQuestion, beat } = opts

  const prompt = [
    ...CHUCK_E_KNOBS.personaGuardrails,
    '',
    'Task: answer a Converse History date question in chat — one tight summary, not a research report.',
    'Use Google Search grounding for interesting, claim-relevant colour (deal context, why it mattered, what changed). Keep only details that earn their place.',
    'Stay on the queried calendar day only. Do not introduce sibling milestone dates for the same deal',
    '(e.g. do not mention an announcement day when the query is the close day, or vice versa) unless the user explicitly asked about that other date.',
    'Do not invent strategy, quotations, or post-History outcomes. If search does not support a detail, omit it.',
    'Shape: 1 short paragraph (optionally 2–4 plain bullets for distinct facts). Weave the beat title into the opening — do NOT open with the calendar date, “On [date]…”, or a titled report header.',
    'Never use ### headings or labelled sections. Never add Pointers to Cite / Source Anchor / Desk Guidance — the UI handles cites.',
    'Plain English only. Skip corporate jargon and repeated themes (identity preserved / global reach / cultural pillar said three ways).',
    'The user already asked about this day; weave the date into prose only if needed for clarity.',
    'Do not mention other years or related deal dates unless the user asked about them.',
    'Past tense. Never cite yourself, Gemini, or AI as a source.',
    `Soft length ~${Math.min(CHUCK_E_KNOBS.chatReplySoftMaxChars, 700)} chars.`,
    '',
    `Queried date (context only — do not lead with it): ${displayDate} (ISO ${queryDate})`,
    `User question: ${userQuestion}`,
    `Anchor title: ${beat.title}`,
    `Anchor synopsis: ${beat.synopsis}`,
    beat.whyItMatters ? `Anchor context: ${beat.whyItMatters}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { text, groundedSources } = await generateGeminiGrounded({
      apiKey,
      prompt,
      temperature: 0.4,
      maxOutputTokens: CHUCK_E_KNOBS.chatMaxOutputTokens,
      json: false,
      useSearch: true,
    })
    const content = text?.trim()
    if (!content) return null
    return { content, groundedSources }
  } catch (err) {
    console.error('[chuck-e] date significance enrich failed', err)
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

/** Parse polish JSON; tolerate markdown fences and minor wrapper noise. */
function parsePolishedCopyJson(
  text: string,
): { title?: string; synopsis?: string; whyItMatters?: string | null } | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(cleaned) as {
      title?: string
      synopsis?: string
      whyItMatters?: string | null
    }
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as {
        title?: string
        synopsis?: string
        whyItMatters?: string | null
      }
    } catch {
      return null
    }
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

function formatDisplayDate(queryDate: string): string {
  return toDisplayDate(queryDate)
}
