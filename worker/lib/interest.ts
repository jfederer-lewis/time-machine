import type { CulturalEvent } from '../../shared/provenance'

/**
 * Press-desk interest scoring — bias toward poignant global / UK-relevant news
 * over remote administrative trivia (e.g. a new Canadian territory).
 *
 * Heuristic only; Gemini may re-rank a shortlist when a key is present.
 */

const BOOST =
  /\b(uk|u\.k\.|britain|british|england|scotland|wales|london|ireland|northern ireland|europe|european|eu\b|nato|united nations|\bun\b|world war|wwii|wwi|cold war|berlin|paris|berlin wall|soviet|russia|ukraine|china|japan|india|africa|middle east|israel|palestine|gaza|iraq|iran|afghanistan|kosovo|bosnia|rwanda|apartheid|mandela|churchill|thatcher|blair|beatles|rolling stones|olympics|world cup|wimbledon|premier league|fa cup|nobel|moon landing|apollo|chernobyl|aids|covid|pandemic|climate|brexit|eu referendum|royal|queen elizabeth|king charles|princess diana|beatles|woodstock|berlin wall|911|september 11|hiroshima|nagasaki|holocaust|suffrage|civil rights|martin luther king|nelson mandela|gandhi|vatican|pope|euro\b|single currency)\b/i

const CULTURE =
  /\b(music|album|single|chart|film|cinema|oscar|bafta|fashion|design|art|museum|theatre|novel|literature|football|cricket|rugby|tennis|athletics|space|scientist|discovery|invention|radio|television|bbc|guardian|times)\b/i

const POIGNANT =
  /\b(war|invasion|bombing|siege|genocide|massacre|assassination|murder|terror|coup|revolution|independence|liberation|treaty|peace|ceasefire|referendum|election|landslide|resign|impeach|crash|disaster|earthquake|tsunami|famine|refugees|protest|riot|strike|abolition|rights|equality|first woman|first black|landing|launch)\b/i

const ADMIN_TRIVIA =
  /\b(territory|territories|province|county|municipality|borough|incorporated|renamed|amalgamat|redistrict|census|postal code|administrative division|carved out of|northwest territories|nunavut|yukon)\b/i

const LOCAL_US_CANADA =
  /\b(state of|governor of|mayor of|city council|township|alberta|manitoba|saskatchewan|newfoundland|nova scotia|prince edward|new brunswick|ohio|idaho|iowa|nebraska|wyoming|montana|dakota)\b/i

export function scoreCulturalInterest(event: CulturalEvent): number {
  const text = `${event.title} ${event.synopsis}`
  let score = 0

  if (BOOST.test(text)) score += 8
  if (POIGNANT.test(text)) score += 6
  if (CULTURE.test(text)) score += 4

  // Brand / culture moments already curated — slight lift
  if (event.category === 'brand') score += 3
  if (event.category === 'music' || event.category === 'culture' || event.category === 'sport') {
    score += 2
  }

  // Soft-penalise dry admin geography (Nunavut-style)
  if (ADMIN_TRIVIA.test(text)) score -= 10
  if (LOCAL_US_CANADA.test(text) && !BOOST.test(text) && !POIGNANT.test(text)) score -= 4

  // Prefer a bit of substance in the blurb
  if (event.synopsis.length >= 80) score += 1
  if (event.synopsis.length >= 160) score += 1

  return score
}

/** Sort in place: closer year first, then higher interest. */
export function rankByInterest(events: CulturalEvent[], targetYear: number): CulturalEvent[] {
  return [...events].sort((a, b) => {
    const yearDiff = Math.abs(a.year - targetYear) - Math.abs(b.year - targetYear)
    if (yearDiff !== 0) return yearDiff
    const interestDiff = scoreCulturalInterest(b) - scoreCulturalInterest(a)
    if (interestDiff !== 0) return interestDiff
    const wikiA = a.discoveredVia?.includes('wikipedia-onthisday') ? 1 : 0
    const wikiB = b.discoveredVia?.includes('wikipedia-onthisday') ? 1 : 0
    if (wikiB !== wikiA) return wikiB - wikiA
    return b.year - a.year
  })
}
