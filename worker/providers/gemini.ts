import type { NarrativeBlock } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'

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

  if (!apiKey) {
    return {
      headline: `${brand.claimFrame} · ${display}`,
      lede:
        eventSummaries.length > 0
          ? `On this date across the years, ${eventSummaries.length} sourced moment${eventSummaries.length === 1 ? '' : 's'} from the archive.`
          : `The archive is still thin for ${display}. Brand moments from nearby years appear below.`,
      voice: 'template',
      disclaimer: '',
    }
  }

  try {
    const prompt = [
      `Brand frame: ${brand.claimFrame}`,
      `Product: ${brand.productLine}`,
      `Query date: ${display}`,
      'Write a 1-line headline and then a blank line and a 2-sentence lede for press.',
      'Use ONLY these sourced facts — do not invent quotations, dates, or events:',
      ...eventSummaries.slice(0, 8).map((s, i) => `${i + 1}. ${s}`),
      'If facts are thin, say the archive is sparse rather than inventing.',
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
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

    const [firstLine, ...rest] = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    return {
      headline:
        firstLine.replace(/^#+\s*/, '').replace(/^headline:\s*/i, '') ||
        `${brand.claimFrame} · ${display}`,
      lede: rest.join(' ').replace(/^lede:\s*/i, '') || text,
      voice: 'gemini',
      disclaimer: '',
    }
  } catch (err) {
    console.error('[time-machine] Gemini failed', err)
    return {
      headline: `${brand.claimFrame} · ${display}`,
      lede:
        eventSummaries.length > 0
          ? `On this date across the years, ${eventSummaries.length} sourced moment${eventSummaries.length === 1 ? '' : 's'} from the archive.`
          : `The archive is still thin for ${display}.`,
      voice: 'template',
      disclaimer: '',
    }
  }
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
