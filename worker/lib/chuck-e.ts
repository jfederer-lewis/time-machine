/**
 * Chuck-E orchestrator — intent route + reply assembly.
 * Doc: documentation/CHUCK_E.md
 */

import { CHUCK_E_KNOBS } from '../../shared/chuck-e-knobs'
import { getBrand } from '../../shared/brands'
import { allProductFacts, getProductPack, type ProductFact } from '../../shared/products'
import type { BrandMoment } from '../../shared/brand'
import { brandMomentQueryRank, heritageMoments } from '../../shared/brand'
import {
  universeAnchorsForQueryDate,
  type ConverseUniverseAnchor,
} from '../../shared/converse-universe'
import type { Citation, CulturalEvent, Gloss } from '../../shared/provenance'
import { withHarvard } from '../../shared/provenance'
import { citationTier, parseQueryDate, toDisplayDate, isCitationAllowed, isCitationBlocked, findRegistryEntry } from '../../shared/source-registry'
import { assembleDateQuery, type Env } from './assemble'
import { chatWithChuckE, enrichChuckEDateSignificance, researchChuckETopic, type ClaimCandidate } from '../providers/gemini'
import { isLandmarkDefiningEvent } from './interest'
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
  rejectYearGlosses,
  cleanGlossSnippet,
} from './chuck-e-glosses'
import { attachWikipediaGlossesForProse, isYearLikeTerm } from './gloss-service'

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
    // US: September 4, 2003 · UK: 4 September 2003
    `\\b(${MONTH_NAMES})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?\\b`,
    `\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})(?:,?\\s*\\d{4})?\\b`,
    '\\b\\d{1,2}[\\/.-]\\d{1,2}[\\/.-]\\d{2,4}\\b',
    '\\b\\d{4}-\\d{2}(?:-\\d{2})?\\b',
    '\\bin\\s+(19|20)\\d{2}\\b',
  ].join('|'),
  'i',
)

const MONTH_TOKEN_RE = new RegExp(`^(${MONTH_NAMES})$`, 'i')

const PRODUCT_INTENT_RE =
  /\b(shoe|sneaker|chuck|all[\s-]?star|feature|features|engineering|sole|canvas|rubber|vulcaniz|material|upper|toe\s*cap|eyelet|launch|silhouette|construction|spec|specs)\b/i

const HERITAGE_INTENT_RE =
  /\b(heritage|history|founded|founding|non[\s-]?skid|chuck\s+taylor|ankle\s+patch|signature|nike\s+acquir|malden|1917|1922|1934|1932|novel\s+nugget|nugget|basketball|olympic|olympics|ncaa|sport|sports|hoops|weapon|pro\s+leather|pro\s+stars?|cultural\s+significance|collab|collaboration|humanitarian|product\s*red|\(product\)\s*red|music|punk|grunge|subculture|varvatos|margiela|comme\s+des\s+gar[cç]ons|cdg|rick\s+owens|drkshdw|turbodrk|simpsons|stranger\s+things|vaquera|golf\s+le\s+fleur|kurt\s+cobain|cobain|one\s+star|virgil|abloh|off[\s-]?white|chuck\s*(ii|2|two)|lunarlon|comfort|engineering)\b/i

/** Theme queries that should surface several sports History beats, not only All Star origin. */
const SPORTS_THEME_RE =
  /\b(basketball|olympic|olympics|ncaa|sport|sports|hoops|weapon|pro\s+leather|pro\s+stars?|jordan|bird|magic)\b/i

/** Music / scenes / collabs / cause — pull fashion-press + History collab beats together. */
const CULTURE_THEME_RE =
  /\b(music|punk|grunge|subculture|collab|collaboration|fashion|artist|humanitarian|product\s*red|\(product\)\s*red|varvatos|comme\s+des\s+gar[cç]ons|cdg|youth\s+culture|scenes?|margiela|rick\s+owens|drkshdw|turbodrk|vaquera|simpsons|stranger\s+things|cobain|one\s+star|virgil|abloh|off[\s-]?white|the\s+ten|film|movie|television|tv|warhol|experimental|weird)\b/i

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

  // US order: September 4, 2003 / September 4th 2003
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

  // UK / intl order: 4 September 2003 / 4th September 2003 (opening hint style)
  const dayMonthYear = text.match(
    new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES}),?\\s*((?:18|19|20)\\d{2})\\b`, 'i'),
  )
  if (dayMonthYear) {
    const month = monthIndex(dayMonthYear[2])
    if (month != null) {
      const d = String(Number(dayMonthYear[1])).padStart(2, '0')
      const m = String(month + 1).padStart(2, '0')
      return parseQueryDate(`${dayMonthYear[3]}-${m}-${d}`)
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
  const tier = citationTier(moment.citation.url)
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
    tier: tier === 'unknown' ? 'C' : tier,
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

function heritageStoryCluster(m: BrandMoment): string | null {
  if (m.storyCluster) return m.storyCluster
  const hay = `${m.title} ${m.synopsis}`.toLowerCase()
  // Fallback heuristic for RED / (PRODUCT) RED family if cluster unset
  if (/\(product\)\s*red|product red|hund\(red\)|one hund/.test(hay)) return 'product-red'
  return null
}

function preferHistoryPublisher(m: BrandMoment): number {
  return /^(converse|converse history)$/i.test(m.citation.publisher.trim()) ||
    /converse history/i.test(m.citation.title)
    ? 1
    : 0
}

/** Roundup listicles are maps — not the preferred cite once a named collab has dedicated coverage. */
function looksLikeCollabRoundup(url: string, title = ''): boolean {
  return /most-iconic-collaborations|iconic-collaborations|best[- ].*collaborat|collaborations-maison/i.test(
    `${url} ${title}`,
  )
}

/**
 * Prefer History, then dedicated collab / model features (GQ, WWD, Teen Vogue…),
 * over “best collaborations” roundups.
 */
function preferCollabCiteQuality(m: BrandMoment): number {
  if (preferHistoryPublisher(m)) return 4
  const url = m.citation.url || ''
  const title = m.citation.title || ''
  if (looksLikeCollabRoundup(url, title)) return 0
  if (
    /gq\.com|gq-magazine\.co\.uk|nytimes\.com|wsj\.com|wwd\.com|teenvogue\.com|fastcompany\.com|hypebeast\.com|hbx\.com|surfacemag\.com|designboom\.com|complex\.com|forbes\.com|businessoffashion\.com|adage\.com|highsnobiety\.com|vogue\.|dazeddigital\.com/i.test(
      url,
    )
  ) {
    return 3
  }
  return 1
}

/** Named house / model asks — allow several dedicated articles on the same collab. */
const SPECIFIC_COLLAB_RE =
  /\b(margiela|maison\s+martin\s+margiela|comme\s+des\s+gar[cç]ons|cdg|rick\s+owens|drkshdw|turbodrk|vaquera|simpsons|stranger\s+things|varvatos|golf\s+le\s+fleur|tyler|john\s+richmond|kurt\s+cobain|cobain|one\s+star|virgil|abloh|off[\s-]?white|the\s+ten|chuck\s*(ii|2|two)|lunarlon)\b/i

/** Keep one beat per story cluster — unless a named collab ask wants dedicated depth. */
function pickHeritageHits(
  scored: Array<{ m: BrandMoment; score: number }>,
  limit: number,
  opts: { spreadClusters?: boolean } = {},
): BrandMoment[] {
  const sorted = scored
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const q = preferCollabCiteQuality(b.m) - preferCollabCiteQuality(a.m)
      if (q !== 0) return q
      return preferHistoryPublisher(b.m) - preferHistoryPublisher(a.m)
    })

  const out: BrandMoment[] = []
  const seenClusters = new Set<string>()
  const clusterCounts = new Map<string, number>()
  for (const { m } of sorted) {
    const cluster = heritageStoryCluster(m)
    if (cluster) {
      if (opts.spreadClusters) {
        const n = clusterCounts.get(cluster) || 0
        if (n >= 3) continue
        clusterCounts.set(cluster, n + 1)
      } else if (seenClusters.has(cluster)) {
        continue
      } else {
        seenClusters.add(cluster)
      }
    }
    out.push(m)
    if (out.length >= limit) break
  }
  return out
}

function matchHeritageMoments(
  query: string,
  brandId: string,
  limit = 3,
  opts: { softFallback?: boolean } = {},
): BrandMoment[] {
  const brand = getBrand(brandId)
  const q = query.toLowerCase()
  const sportsTheme = SPORTS_THEME_RE.test(q)
  const cultureTheme = CULTURE_THEME_RE.test(q)
  const specificCollab = SPECIFIC_COLLAB_RE.test(q)
  const nikeTechAsk =
    /\b(lunarlon|chuck\s*(ii|2|two)|comfort|cushion|engineering|tech(?:nology)?|sore\s+feet)\b/.test(q) ||
    (/\bnike\b/.test(q) && /\b(tech|technology|comfort|cushion|engineer|feel like)\b/.test(q))
  const nikeDealAsk =
    /\b(acquir|acquisition|purchas|bought|buyout|swooshed)\b/.test(q) ||
    (/\bnike\b/.test(q) && /\b(buy|bought|purchase|deal|takeover|acquir)\b/.test(q))
  const queryDate = extractDateFromMessage(query)
  // Dated asks (e.g. Nike close) stay on that day — don't spray collab colour from month-name tokens.
  const datedFocus = Boolean(queryDate && queryDate.length >= 10)
  const effectiveLimit = datedFocus
    ? Math.min(limit, 2)
    : specificCollab
      ? Math.max(limit, 4)
      : sportsTheme || cultureTheme
        ? Math.max(limit, 5)
        : limit
  const scored = heritageMoments(brand).map((m) => {
    const hay = `${m.title} ${m.synopsis} ${m.date}`.toLowerCase()
    const citeUrl = m.citation.url || ''
    let score = datedFocus && queryDate ? brandMomentQueryRank(m, queryDate) : 0
    if (datedFocus && score === 0) return { m, score: 0 }
    for (const token of q.split(/\W+/).filter((t) => t.length > 2)) {
      // Month names alone pull wrong-year hits (September → Simpsons 2014).
      if (MONTH_TOKEN_RE.test(token)) continue
      if (hay.includes(token)) score += 1
    }
    // Boost well-known years if mentioned
    if (!datedFocus && q.includes(m.date.slice(0, 4))) score += 2
    if (sportsTheme && !datedFocus) {
      if (/\bolympic/.test(hay)) score += 3
      if (/\bweapon\b/.test(hay)) score += 2
      if (/\bjordan\b|\bpro leather\b/.test(hay)) score += 2
      if (/\bncaa\b/.test(hay)) score += 2
      if (/\bedmonton|grads\b/.test(hay)) score += 1
      if (/\bbasketball\b|\bnon-skid\b|\ball star\b/.test(hay)) score += 1
    }
    if (cultureTheme && !datedFocus) {
      if (/\bpunk|grunge|ramones|cobain|subcultur/.test(hay)) score += 3
      if (
        /\bcollab|varvatos|comme des gar|cdg|richmond|golf le fleur|tyler|margiela|rick owens|vaquera|simpsons|abloh|virgil|off-white|the ten|warhol/.test(
          hay,
        )
      )
        score += 3
      if (/\b\(product\)\s*red|product red|hund\(red\)|aids|humanitarian|malaria/.test(hay)) score += 3
      if (/\bfilm|movie|television|mcfly|antoinette|simpsons|stranger things/.test(hay)) score += 2
      if (/\bmusic|skate|youth|fashion|artist/.test(hay)) score += 1
      // Film/TV collab asks: Simpsons + screen-wear colour + later packs like Stranger Things.
      if (/\b(film|movie|television|\btv\b|screen)/.test(q)) {
        if (/simpsons|stranger things|chucks on screen|film and tv|marie antoinette|mcfly/.test(hay))
          score += 2
      }
      // Experimental / weird fashion collabs: Owens + Vaquera.
      if (/\b(experimental|weird|radical|distort|avant[\s-]?garde)\b/.test(q)) {
        if (/rick owens|turbodrk|vaquera|slouch wedge|margiela/.test(hay)) score += 3
      }
    }
    // Named collab / model: lift dedicated coverage; soft-demote roundup listicles.
    if (specificCollab && !datedFocus) {
      if (looksLikeCollabRoundup(citeUrl, m.citation.title)) score -= 4
      if (/margiela/.test(q) && /margiela|martin margiela/.test(hay)) score += 4
      if (/\b(cdg|comme)\b/.test(q) && /cdg|comme des gar|play comme/.test(hay)) score += 4
      if (/rick\s+owens|drkshdw|turbodrk/.test(q) && /rick owens|drkshdw|turbodrk/.test(hay))
        score += 4
      if (/vaquera/.test(q) && /vaquera|slouch wedge/.test(hay)) score += 4
      if (/cobain|one\s+star/.test(q) && /cobain|one star/.test(hay)) score += 4
      if (/simpsons/.test(q) && /simpsons/.test(hay)) score += 4
      if (/stranger\s+things/.test(q) && /stranger things/.test(hay)) score += 4
      if (/abloh|virgil|off[\s-]?white|the\s+ten/.test(q) && /abloh|virgil|off-white|the ten|ghosting/.test(hay))
        score += 4
      if (/chuck\s*(ii|2|two)|lunarlon/.test(q) && /chuck ii|chuck taylor all star ii|lunarlon|feel like nikes/.test(hay))
        score += 4
      if (
        /gq\.com|gq-magazine\.co\.uk|wwd\.com|teenvogue\.com|fastcompany\.com|hypebeast\.com|hbx\.com|surfacemag\.com|designboom\.com|complex\.com|forbes\.com|about\.nike\.com|nytimes\.com|wsj\.com|adage\.com|businessoffashion\.com|highsnobiety\.com/i.test(
          citeUrl,
        )
      ) {
        score += 2
      }
    }
    // Nike purchase / acquisition: prefer NYT + WSJ deal coverage.
    if (!datedFocus && nikeDealAsk) {
      if (/nytimes\.com|wsj\.com/i.test(citeUrl) && /nike|acquir|purchas|blacktop|to buy converse/.test(hay))
        score += 5
      if (/swooshed|nike to acquire|nike completed|nike to buy/.test(hay)) score += 2
    }
    // Nike tech / comfort / how ownership changed the shoe.
    if (!datedFocus && nikeTechAsk) {
      if (/chuck ii|all star ii|lunarlon|feel like nikes|nike tech/.test(hay)) score += 5
      if (/adage\.com|businessoffashion\.com/i.test(citeUrl)) score += 2
    }
    return { m, score }
  })
  const hits = scored.filter((x) => x.score > 0)
  const pickOpts = {
    spreadClusters: (specificCollab || nikeTechAsk || nikeDealAsk) && !datedFocus,
  }
  if (datedFocus && hits.length && queryDate) {
    const exact = hits.filter((x) => x.m.date === queryDate)
    if (exact.length) return pickHeritageHits(exact, effectiveLimit, pickOpts)
  }
  if (hits.length) return pickHeritageHits(hits, effectiveLimit, pickOpts)
  // Soft fallback: return a couple of core moments when user asks generally about heritage
  if (opts.softFallback !== false && !datedFocus) return brand.timeline.slice(0, effectiveLimit)
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

function themeHeritageLeadIn(query: string): string {
  const q = query.toLowerCase()
  if (SPORTS_THEME_RE.test(q)) {
    return 'The All Star began as a basketball shoe and kept returning on court at hinge moments — Olympics, college finals, signature players.'
  }
  if (
    CULTURE_THEME_RE.test(q) ||
    /\b(music|youth|scene|fashion|culture|collab|collaboration)\b/.test(q)
  ) {
    return 'The Chuck left the court through music scenes and later fashion and cause collaborations — these are some of the clearest sourced turns.'
  }
  if (/\b(humanitarian|product\s*red|\(product\)\s*red|cause|charity)\b/.test(q)) {
    return 'Converse’s cause partnerships show up most clearly in a handful of History-backed campaigns.'
  }
  if (/\b(silhouette|non[\s-]?skid|chuck\s*70|origin|founded|founding)\b/.test(q)) {
    return 'A few History-backed moments that mark how the silhouette took shape:'
  }
  return 'Here’s what Converse History backs on that theme:'
}

function formatHeritageReply(
  moments: BrandMoment[],
  opts: { query?: string } = {},
): {
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

  // Theme spreads: short grounding line, then examples — not a raw bullet dump.
  if (moments.length > 1) {
    lines.push(themeHeritageLeadIn(opts.query || ''))
    lines.push('')
  }

  for (const m of moments) {
    const flag = m.precision === 'period-estimate' ? ' _(period estimate — contested)_' : ''
    // Lead with the beat title — not a date list. Year stays light context when spreading themes.
    if (moments.length === 1) {
      lines.push(`**${m.title}**${flag}`, m.synopsis)
    } else {
      const when = m.date.length === 4 ? m.date : toDisplayDate(m.date)
      lines.push(`• **${m.title}**${flag} (${when}) — ${m.synopsis}`)
    }
    citations.push(citationFromBrandMoment(m))
  }
  return {
    content: lines.join(moments.length === 1 ? '\n\n' : '\n'),
    citations: dedupeCitationsByUrl(citations),
    glosses: glossesFromBrandMoments(moments),
  }
}

function citationFromUniverseAnchor(anchor: ConverseUniverseAnchor): Citation {
  return withHarvard({
    title: anchor.citation.title,
    url: anchor.citation.url,
    publisher: anchor.citation.publisher,
    author: anchor.citation.author,
    publishedAt: anchor.citation.publishedAt ?? anchor.date,
    accessedAt: new Date().toISOString().slice(0, 10),
    sourceQuality: 'trusted-source-snippet',
    evidenceKind: 'paraphrase',
    reference: anchor.reference,
    provider: 'brand-timeline',
    isExactQuote: false,
    tier: citationTier(anchor.citation.url) === 'unknown' ? 'C' : citationTier(anchor.citation.url),
  })
}

/**
 * Light optional Converse colour when the day answer is otherwise world-only.
 * Never a second full beat card — one short prose nudge, only when sourced.
 */
function formatLightConverseBridge(opts: {
  brandSpotlight: CulturalEvent | null
  universeAnchors: ConverseUniverseAnchor[]
}): { content: string; citations: Citation[]; glosses: Gloss[] } | null {
  const { brandSpotlight, universeAnchors } = opts
  if (brandSpotlight) {
    return {
      content: `Also on this calendar day for Converse — **${brandSpotlight.title}**: ${brandSpotlight.synopsis}`,
      citations: [...(brandSpotlight.citations ?? [])],
      glosses: sourceGlossFromEvent(brandSpotlight),
    }
  }
  const anchor = universeAnchors[0]
  if (!anchor) return null
  return {
    content: `${anchor.synopsis} ${anchor.converseTie}`,
    citations: [citationFromUniverseAnchor(anchor)],
    glosses: [],
  }
}

function formatDateSpotlight(event: CulturalEvent, _displayDate?: string): {
  content: string
  citations: Citation[]
  glosses: Gloss[]
} {
  // Lead with the fact — not “On {date}…” (the user already asked for that day).
  const parts = [`**${event.title}**`, event.synopsis]
  if (event.whyItMatters) {
    parts.push(event.whyItMatters)
  }
  if (event.needsHumanReview || event.precision === 'period-estimate') {
    parts.push('_Period estimate / needs a human check before press use._')
  }
  const content = parts.join('\n\n')
  const citations = dedupeCitationsByUrl(event.citations ?? [])
  return {
    content,
    citations,
    glosses: rejectYearGlosses([
      ...(event.glosses ?? []).filter((g) => g.source === 'wikipedia'),
      ...glossesFromCitations(citations, content),
    ]),
  }
}

/**
 * Source gloss on the beat title + Wikipedia entity glosses on named things in the reply.
 * Years / calendar dates are never underlined.
 */
function sourceGlossFromEvent(event: CulturalEvent): Gloss[] {
  if (isYearLikeTerm(event.title)) return []
  const cite = event.citations?.[0]
  if (!cite?.url) return []
  return [
    {
      term: event.title,
      gloss: cleanGlossSnippet(event.synopsis, 140),
      url: cite.url,
      source: 'curated' as const,
      sourceLabel: /converse history/i.test(cite.title || '')
        ? 'Converse History'
        : cite.publisher || 'Source',
      matchMode: 'exact' as const,
    },
  ]
}

async function finalizeChuckEGlosses(
  content: string,
  sourceGlosses: Gloss[],
): Promise<Gloss[]> {
  const sources = rejectYearGlosses(sourceGlosses)
  // Wikipedia entity glosses: people / venues / iconic events — quiet, helpful, not brand noise
  const wiki = await attachWikipediaGlossesForProse(content, {
    excludeTerms: sources.map((g) => g.term),
    max: 4,
  })
  const seen = new Set(sources.map((g) => g.term.toLowerCase()))
  const merged = [...sources]
  for (const g of wiki) {
    const key = g.term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(g)
  }
  return rejectYearGlosses(merged)
}

/** Allowlisted grounding URLs from Gemini search — Gemini itself is never the cite host. */
function citationsFromGroundedSources(
  sources: ClaimCandidate[],
  opts: { demoteCollabRoundups?: boolean } = {},
): Citation[] {
  const out: Citation[] = []
  const seen = new Set<string>()
  const ranked = [...sources].sort((a, b) => {
    if (!opts.demoteCollabRoundups) return 0
    const ar = looksLikeCollabRoundup(a.url || '', a.title || '') ? 1 : 0
    const br = looksLikeCollabRoundup(b.url || '', b.title || '') ? 1 : 0
    return ar - br
  })
  for (const s of ranked) {
    const url = s.url?.trim()
    if (!url || seen.has(url.toLowerCase())) continue
    if (isCitationBlocked(url) || !isCitationAllowed(url)) continue
    if (/generativelanguage\.googleapis|gemini\.google/i.test(url)) continue
    // Prefer dedicated collab coverage already on the pack over generic “best collabs” lists.
    if (opts.demoteCollabRoundups && looksLikeCollabRoundup(url, s.title || '')) continue
    seen.add(url.toLowerCase())
    const entry = findRegistryEntry(url)
    out.push(
      withHarvard({
        title: s.title || entry?.label || 'Source',
        url,
        publisher: s.publisher || entry?.label || 'Source',
        accessedAt: new Date().toISOString().slice(0, 10),
        sourceQuality: 'trusted-source-snippet',
        evidenceKind: 'paraphrase',
        reference: s.snippet?.trim() || s.title || 'Grounded press source for the date beat.',
        provider: 'gemini',
        isExactQuote: false,
        tier: citationTier(url) === 'unknown' ? 'C' : citationTier(url),
      }),
    )
    if (out.length >= 4) break
  }
  return out
}

function buildSystemContext(brandId: string): string {
  const brand = getBrand(brandId)
  const pack = getProductPack()
  const heritageLines = heritageMoments(brand)
    .slice(0, 55)
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
          // Calendar-day fan-out so universe anchors (e.g. Chuck’s birthday) + cultural news can compete
          anyYear: true,
        })
        const q = lastUser.content.toLowerCase()
        const preferBrand =
          /\bwithin\s+converse\b|\bconverse\b.*\b(significance|history|heritage)\b|\b(significance|history|heritage)\b.*\bconverse\b/i.test(
            q,
          )
        const worldSpotlight =
          result.events.find((e) => e.precision === 'exact-day') ?? result.events[0] ?? null
        const brandSpotlight = result.brandMoments[0] ?? null
        const universeAnchors = universeAnchorsForQueryDate(date)
        const worldIsLandmark = Boolean(worldSpotlight && isLandmarkDefiningEvent(worldSpotlight))
        // Landmark defining days (9/11-class) always lead — never let a brand beat or sit beside them.
        const spotlight = worldIsLandmark
          ? worldSpotlight
          : preferBrand
            ? brandSpotlight ?? worldSpotlight
            : worldSpotlight ?? brandSpotlight

        if (spotlight) {
          const displayDate = result.displayDate || toDisplayDate(date)
          const formatted = formatDateSpotlight(spotlight)
          let content = formatted.content
          const citations = [...formatted.citations]
          let sourceGlosses: Gloss[] = [
            ...sourceGlossFromEvent(spotlight),
            ...glossesFromCitations(citations, content),
          ]
          const allowConverseTie = !worldIsLandmark && !isLandmarkDefiningEvent(spotlight)

          // Converse-framed date asks: lead with History beat + Gemini-researched colour on that day only
          if (allowConverseTie && preferBrand && brandSpotlight && env.GEMINI_API_KEY) {
            const enriched = await enrichChuckEDateSignificance({
              apiKey: env.GEMINI_API_KEY,
              queryDate: date,
              displayDate,
              userQuestion: lastUser.content,
              beat: {
                title: brandSpotlight.title,
                synopsis: brandSpotlight.synopsis,
                whyItMatters: brandSpotlight.whyItMatters,
              },
            })
            if (enriched?.content) {
              content = ensureCompleteChatReply(
                coerceChatAwayFromStory(enriched.content),
              )
              citations.length = 0
              citations.push(...(brandSpotlight.citations ?? []))
              citations.push(...citationsFromGroundedSources(enriched.groundedSources))
              sourceGlosses = [
                ...sourceGlossFromEvent(brandSpotlight),
                ...glossesFromCitations(citations, content),
              ]
            } else {
              content = formatDateSpotlight(brandSpotlight).content
              citations.length = 0
              citations.push(...(brandSpotlight.citations ?? []))
              sourceGlosses = [
                ...sourceGlossFromEvent(brandSpotlight),
                ...glossesFromCitations(citations, content),
              ]
            }
          }

          // Already on a Converse beat (framed ask or brand spotlight) → stay there.
          // Do NOT append world “cultural backdrop” beside a Converse-tied answer.
          // Only when the day answer is world-only: optional light Converse bridge if a
          // sourced same-day / calendar-day tie exists — never invent, never force.
          const answerAlreadyConverse =
            spotlight.category === 'brand' ||
            Boolean(preferBrand && brandSpotlight && spotlight.id === brandSpotlight.id)

          if (
            allowConverseTie &&
            !answerAlreadyConverse &&
            spotlight.category !== 'brand'
          ) {
            const bridgeBrand =
              brandSpotlight && brandSpotlight.id !== spotlight.id ? brandSpotlight : null
            const bridge = formatLightConverseBridge({
              brandSpotlight: bridgeBrand,
              universeAnchors: bridgeBrand
                ? []
                : universeAnchors.filter((a) => a.id !== brandSpotlight?.id),
            })
            if (bridge) {
              content = [content, '', bridge.content].join('\n\n')
              citations.push(...bridge.citations)
              sourceGlosses.push(...bridge.glosses)
            }
          }

          const glosses = await finalizeChuckEGlosses(content, sourceGlosses)

          return {
            sessionId,
            intent,
            spotlight,
            message: {
              role: 'assistant',
              content: coerceChatAwayFromStory(content),
              citations: dedupeCitationsByUrl(citations),
              glosses,
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
        const heritage = formatHeritageReply(moments, { query: lastUser.content })
        const content = coerceChatAwayFromStory(
          `${formatted.content}\n\nMeanwhile, from the heritage timeline:\n${heritage.content}`,
        )
        return {
          sessionId,
          intent: 'heritage',
          message: {
            role: 'assistant',
            content,
            citations: heritage.citations,
            glosses: await finalizeChuckEGlosses(content, heritage.glosses),
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
          glosses: await finalizeChuckEGlosses(formatted.content, formatted.glosses),
          intent,
        },
      }
    }
  }

  if (intent === 'heritage') {
    // Prefer scored pack beats (no soft timeline dump). Web search fills gaps / adds colour.
    const moments = matchHeritageMoments(lastUser.content, brandId, 5, { softFallback: false })
    const systemContext = buildSystemContext(brandId)
    const specificCollab = SPECIFIC_COLLAB_RE.test(lastUser.content)

    if (env.GEMINI_API_KEY) {
      const researched = await researchChuckETopic({
        apiKey: env.GEMINI_API_KEY,
        userQuestion: lastUser.content,
        systemContext,
        preferDedicatedCollabCoverage: specificCollab,
        packBeats: moments.map((m) => ({
          date: m.date,
          title: m.title,
          synopsis: m.synopsis,
          citeUrl: m.citation.url,
        })),
      })
      if (researched?.content) {
        const content = ensureCompleteChatReply(
          coerceChatAwayFromStory(researched.content),
        )
        const citations = dedupeCitationsByUrl([
          ...moments.map((m) => citationFromBrandMoment(m)),
          ...citationsFromGroundedSources(researched.groundedSources, {
            demoteCollabRoundups: specificCollab,
          }),
        ])
        return {
          sessionId,
          intent,
          message: {
            role: 'assistant',
            content,
            citations,
            glosses: await finalizeChuckEGlosses(content, [
              ...glossesFromBrandMoments(moments),
              ...glossesFromCitations(citations, content),
            ]),
            intent,
          },
        }
      }
    }

    // Offline / research miss — pack-only fallback (may soft-fill)
    const formatted = formatHeritageReply(
      moments.length
        ? moments
        : matchHeritageMoments(lastUser.content, brandId, 5, { softFallback: true }),
      { query: lastUser.content },
    )
    const content = coerceChatAwayFromStory(formatted.content)
    return {
      sessionId,
      intent,
      message: {
        role: 'assistant',
        content,
        citations: formatted.citations,
        glosses: await finalizeChuckEGlosses(content, formatted.glosses),
        intent,
      },
    }
  }

  // General (and cliff_notes-as-chat, date-without-parseable-date, product miss): Gemini when keyed
  const systemContext = buildSystemContext(brandId)
  let reply: string | null = null
  let chatGrounded: ClaimCandidate[] = []

  if (env.GEMINI_API_KEY) {
    const chat = await chatWithChuckE({
      apiKey: env.GEMINI_API_KEY,
      systemContext,
      messages: messages
        .filter((m) => !m.isDisclosure)
        .map((m) => ({ role: m.role, content: m.content })),
      // Web search OK for general / date-nudge turns — not for inventing product specs
      useSearch: intent !== 'product',
    })
    if (chat) {
      reply = chat.content
      chatGrounded = chat.groundedSources
    }
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
  const grounded = formatHeritageReply(groundedMoments, { query: lastUser.content })
  const replyLooksHeritage = groundedMoments.length > 0

  const citations = dedupeCitationsByUrl([
    ...(replyLooksHeritage ? grounded.citations : []),
    ...citationsFromGroundedSources(chatGrounded),
  ])
  const glosses = await finalizeChuckEGlosses(
    content,
    [
      ...(replyLooksHeritage ? grounded.glosses : []),
      ...glossesFromCitations(citations, content),
    ],
  )

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
