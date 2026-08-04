import type { NarrativeBlock } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'

/**
 * Gemini narrative voice — stub until GEMINI_API_KEY is provided.
 * Contract: Gemini may write lede/headline only from supplied event cards.
 * It must not invent facts, years, or quotations.
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
          ? `Across the same calendar day in other years, the record holds ${eventSummaries.length} sourced marker${eventSummaries.length === 1 ? '' : 's'} — material for a local desk to cut into a launch story without inventing heritage.`
          : `No exact-day cultural markers resolved yet for ${display}. Period estimates and brand timeline moments remain available below.`,
      voice: 'template',
      disclaimer:
        'Template voice active. Add GEMINI_API_KEY to enable LLM press phrasing. Citations remain authoritative either way.',
    }
  }

  // Placeholder for @google/genai call — kept offline until key lands.
  // When wired: send only eventSummaries + brand.claimFrame; forbid novel facts.
  try {
    const prompt = [
      `Brand frame: ${brand.claimFrame}`,
      `Product: ${brand.productLine}`,
      `Query date: ${display}`,
      'Write a 1-line headline and 2-sentence lede for press. Use ONLY these sourced facts:',
      ...eventSummaries.map((s, i) => `${i + 1}. ${s}`),
      'Do not invent quotations. If facts are thin, say so.',
    ].join('\n')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 280 },
        }),
      },
    )

    if (!res.ok) {
      throw new Error(`Gemini ${res.status}`)
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) throw new Error('Empty Gemini response')

    const [firstLine, ...rest] = text.split('\n').map((l) => l.trim()).filter(Boolean)

    return {
      headline: firstLine.replace(/^#+\s*/, '').replace(/^headline:\s*/i, '') || `${brand.claimFrame} · ${display}`,
      lede: rest.join(' ').replace(/^lede:\s*/i, '') || text,
      voice: 'gemini',
      disclaimer:
        'Gemini phrasing only. All factual claims must remain attached to the source cards below — do not publish narrative without human verification.',
    }
  } catch {
    return {
      headline: `${brand.claimFrame} · ${display}`,
      lede: `Gemini request failed; falling back to template voice. ${eventSummaries.length} sourced cards remain available for the desk.`,
      voice: 'template',
      disclaimer: 'Gemini unavailable — template voice in use. Citations unchanged.',
    }
  }
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
