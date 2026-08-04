import type { NarrativeBlock } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'
import { toDisplayDate } from '../../shared/source-registry'

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

    const models = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-3.6-flash']
    let text = ''
    let lastError = ''

    for (const model of models) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
      })

      if (!res.ok) {
        lastError = `${model} ${res.status} ${await res.text().catch(() => '')}`
        continue
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const parts = data.candidates?.[0]?.content?.parts ?? []
      text = parts.map((p) => p.text || '').join('').trim()
      if (text) break
    }

    if (!text) {
      throw new Error(lastError || 'Empty Gemini response')
    }

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

function formatDisplayDate(queryDate: string): string {
  return toDisplayDate(queryDate)
}
