/**
 * Stubs for archive providers — swap implementations when keys arrive.
 * Each returns [] until configured so the assemble pipeline stays plug-and-play.
 */

export async function fetchNytForDate(_date: string, _apiKey?: string) {
  if (!_apiKey) return []
  // TODO: GET https://api.nytimes.com/svc/archive/v1/{year}/{month}.json
  // then filter pub_date to the day. Responses are large — cache in KV/R2.
  return []
}

export async function fetchGuardianForDate(_date: string, _apiKey?: string) {
  if (!_apiKey) return []
  // TODO: content.guardianapis.com/search?from-date=&to-date=
  return []
}

export async function fetchPerplexityForDate(_date: string, _apiKey?: string) {
  if (!_apiKey) return []
  // TODO: api.perplexity.ai/search with allowlisted domains + date filters.
  // Note (from Bloom): default lookback is rolling, not calendar-historical.
  return []
}

export async function fetchChroniclingAmerica(_date: string) {
  // Free LoC API — stubbed for structure; enable in next pass.
  return []
}
