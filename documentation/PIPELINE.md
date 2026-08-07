# Retrieval & assemble pipeline

> How a date lookup becomes a day card. Agents: follow this when changing discovery, ranking, polish, or cites.  
> Companion docs: `VISION.md` (product), `SOURCES_AND_LANDSCAPE.md` (citation law), `COPY_CONTRACT.md` (card format).  
> **Last updated:** 2026-08-07 (Converse day-card addon segment)

---

## Why sources matter

Credible cites are **not** a ban on LLM discovery. They exist so that:

1. Every shipped claim is **date-checked** against something outside the model (blocks hallucination).
2. Users can **trace the fact** and read more on the original page.
3. Press export stays honest — Gemini / Perplexity are never the public citation host.

Gemini **may discover and phrase**. It **must never** invent quotations, ship without a corroborating URL when discovery is Gemini-sourced, or appear as the Source line.

---

## Research stack

Always the **full** path: Wikipedia On This Day + onthisday.com + History.com discovery; Gemini pick/polish when keyed; Gemini grounded retrieval + Perplexity date-search (when keyed) + cite upgrade.

Same **copy contract** (`COPY_CONTRACT.md`). Archives (NYT / Guardian / Chronicling / GDELT) remain stubs.

**Stubbed (not live even when keyed):** NYT Archive, Guardian Open Platform, Chronicling America / LoC, GDELT.

API: `/api/query?date=YYYY-MM-DD&anyYear=true|false&fallback=0|1&brand=converse`

---

## Query precision

| Input | Behaviour |
|-------|-----------|
| `YYYY-MM-DD` (`exact-day`) | Full discovery fan-out |
| `YYYY` or `YYYY-MM` | **No** day-index / archive / Gemini discovery → curated fallback (and optional brand moments) |
| `USE_FALLBACK=true` or `?fallback=1` | Skip live pipeline entirely → curated fallback |

---

## Pipeline (runtime)

```
DISCOVER  (exact-day only)
  Wikipedia On This Day
  onthisday.com / History.com           ← discovery metadata only, never public cite
  + anyYear → OTD cross-year scrape
  Gemini + Google Search                ← cite-gated (Tier A/B URL required)
  Perplexity date-search                ← when keyed; skipped if recent/future
  NYT / Guardian / Chronicling / GDELT  ← stubs (always empty)
       │
       ▼
FILTER
  Drop isLowValueDiscovery (#1 song labels) at day-index ingest
  Drop category === 'charts' if ever set (unused today — labels mapped to music)
  Drop wire dumps (looksLikeHeadlineDump), thin stubs (title≈synopsis / synopsis < 48)
  Dedupe by year + normalized synopsis; prefer more citations
       │
       ▼
RANK  (worker/lib/interest.ts)
  Formula: significance (primary) + light positive/neutral tone lean + credibility + quality
  Cultural / UK-global / landmark significance outweighs tone
  Tone is a nudge only (~±3); landmark defining days skip the tone term
  Prefer candidates already cited from premium-press hosts (see interest.ts PREMIUM_PRESS)
  Soft Converse-universe affinity (basketball / skate / punk / youth / canvas…) — light only; see `shared/converse-universe.ts`
  Soft-demote competing footwear brand days (Nike only when the claim is about Converse)
  Converse day segment (separate stack): exact-day KB + curated anniversaries (`anniversaryEligible` / Chuck birthday) + month-precision — not merged into world shortlist
  **Landmark defining days:** no Converse segment; no Chuck bridge beside 9/11-class events
  Soft-penalise admin trivia; wire dumps −40; year proximity (unless anyYear)
  Same-year pool if best same-year interest ≥ 2; else all years by proximity
       │
       ▼
PICK  (Gemini shortlist, optional; top 8)
  Same balance: significance first, positive/neutral lean second, landmark exception; sourceHint when logged
       │
       ▼
POLISH → VALIDATE  (up to 3 candidates)
  Gemini → { title, synopsis, whyItMatters }
  maxOutputTokens ≥ ~3072 (Flash “thoughts” eat smaller budgets → truncated JSON)
  validateCopyContract — hard fails → try deterministic fallbackDistinctCopy, then next candidate
       │
       ▼
CITE UPGRADE  (if needsCiteUpgrade)
  Triggers: Wiki bridge, discovery-channel / empty cites, trusted-discovery-only, review+unknown/C
  Skip if lead cite is already Tier A/B and publisher ≠ Wikipedia
  Else Perplexity allowlisted search + Gemini verify/grounding
  Cite must be *about the claim* (relevance) — Tier A alone ≠ enough
  Charts/music claims prefer Official Charts / Billboard when applicable
  Fail → keep bridge cite, set needsHumanReview — still may ship if copy contract passes
       │
       ▼
VALIDATE AGAIN → SHIP
  Ship gate = validateCopyContract only (prose fields)
  needsHumanReview / Wikipedia bridge do NOT block ship
  If empty pool or all candidates fail → curated fallback (usingFallback: true)
       │
       ▼
GLOSSES (Wikipedia summary) + Converse day segment (`brandMoments`, max 2)
```

UI ships **one world spotlight** (`events[0]`) **plus** an optional Converse addon (`brandMoments`) when heritage matches the query. If world is empty, the first brand moment may fill the spotlight (no double-render). Empty both → “No fact on record for this date.” If the **shipped** world spotlight is landmark-defining → `brandMoments` cleared (no Converse segment).

Code: `worker/lib/assemble.ts`, `shared/brand.ts` (`converseDaySegmentForQuery`), `worker/providers/gemini.ts`, `worker/lib/upgrade-claim.ts`, `worker/lib/interest.ts`, `worker/lib/copy-contract.ts`.

---

## Interest / headline priorities

**Canonical rules:** `documentation/EDITORIAL_SCHEMA.md` (significance → tone → credibility → quality; landmark no Chuck bridge; soft Converse-universe affinity).

Ranking is a **weighted formula** (`scoreInterestBreakdown` in `interest.ts`), not a blunt “positive wins” rule:

| Term | Role |
|------|------|
| **Significance** (primary) | Culture / UK-global / poignant stakes / category / landmark defining day; direct Converse text; soft universe themes |
| **Tone** (secondary lean) | Small positive / neutral nudge, mild routine-tragedy drag — smaller than one culture signal |
| **Credibility** | Premium-press / culture-press / museum cites + discovery lifts |
| **Quality** | Penalties for dumps, thin stubs, admin trivia |

**Prefer**

- Culturally resonant settled history: arts, music (real moments), film, fashion, design, sport, science, human rights, major geopolitics
- UK / Europe / global stakes (“Chuck was there” for a British/international desk)
- Events already carrying **paper-of-record** cites when logged (see `PREMIUM_PRESS` in `interest.ts`)
- Among **similarly significant** candidates: constructive / positive or neutral culture over routine tragedy
- Soft Converse-universe colour when already in the claim — **never invent** or force Chuck over clearer significance

**Still ship (do not soft-pedal)**

- **Landmark defining days** — events that define that calendar date in world memory (e.g. 11 September 2001, Pearl Harbor, Hiroshima, moon landing, Armistice). These score on significance alone (no tone drag). Ignoring them would be editorially wrong. Brand / universe moments **do not compete** for spotlight; Chuck-E must **not** append a Converse bridge.
- A **clearly more significant** hard-news day still beats a mildly positive culture stub — tone is a lean, not a veto. Difficult history still ships.

**Deprioritise / exclude**

- Aggregator “UK #1: Song” / “#1 song on this date” labels — drop at day-index ingest
- Remote administrative trivia (new territories, postal renames, municipal amalgamation)
- Live wire dumps / video index scrapes
- Competing footwear brand days (soft demote; Nike only when about Converse)
- Recent/future lookup dates: skip **Perplexity** date-search only (`recentLiveWireSkipDays`); Gemini discovery still runs in full

Knobs: `preferUkGlobalInterest`, `preferPremiumPress`, `preferPositiveWhenTied` (enables the tone term), `preferBrandAffinity` in `shared/copy-knobs.ts`. Universe: `shared/converse-universe.ts`. Weights live as `W` in `interest.ts`.

Brand heritage: curated `brand.timeline` is Timeline UI only. Full History beats live in `brand.heritageKb` (`shared/brands/converse-heritage-kb.ts`). Assemble / Chuck-E use `heritageMoments(brand)`. Lookup Converse addon lanes (`converseDaySegmentForQuery`): **exact YYYY-MM-DD** always; **yearly anniversary** only when `anniversaryEligible` or a universe people anchor (Chuck birthday/death — not collabs); **month-precision** same `YYYY-MM` as “Also this month · Converse”. World shortlist stays world-only; Converse does not compete for the main spotlight. Landmark **spotlight** → no Converse segment (not “any landmark-shaped row in the discovery pool”).

---

## Gemini roles

| Role | Allowed? | Gate |
|------|----------|------|
| Grounded discovery (full) | Yes | Google Search grounding + allowlisted Tier A/B URL that corroborates the date |
| Pick most interesting shortlist | Yes | From supplied candidates only |
| Polish title / synopsis / Context | Yes | `validateCopyContract` must pass (or deterministic copy fallback) |
| Public citation host | **Never** | — |
| Invent facts / quotes / years | **Never** | — |

---

## Cite upgrade rules

- Discovery hosts (`onthisday.com`, History.com, hobby birthday sites) → **never** the Harvard line.
- Wikipedia → bridge / gloss; upgrade when a primary or paper-of-record URL is findable.
- Candidate URLs must share **claim relevance** (title/snippet tokens). Reject generic research guides.
- If already Tier A/B (non-Wikipedia) → skip upgrade pass.
- If no relevant Tier A/B found → keep bridge cite, flag `needs-human-review`. Prefer silence over a **fake** cite — but the bridge cite may still render on the Source line.

---

## What must never ship

**Enforced by `validateCopyContract`:**

- Title that is an exact or trivial rephrase of the synopsis
- Title that is a chopped “Following…” lead-in from the synopsis
- Mid-word / mid-sentence cuts (trailing `…` / `..+`, dangling function words — **not** a normal period)
- Missing Context when `contextRequired: true`
- Wire dumps / empty fields

**Pipeline / prompt aspirations (not copy-contract hard fails):**

- Past-tense / “Chuck was there” voice (polish prompt only today)
- Aggregator #1-song labels (dropped at discovery ingest when detected)
- Unallowlisted hosts as Source (blocked or flagged `needs-human-review`; unknown hosts kept + flagged)

---

## Code map

| File | Role |
|------|------|
| `worker/index.ts` | `/api/query` params: date, anyYear, fallback, brand |
| `worker/lib/assemble.ts` | Orchestration: discover → filter → rank → pick → polish → cite → ship; Converse day segment |
| `shared/brand.ts` | `converseDaySegmentForQuery` / `anniversaryEligible` match lanes |
| `worker/lib/interest.ts` | Cultural + premium-press + universe ranking (`EDITORIAL_SCHEMA.md`) |
| `shared/converse-universe.ts` | Soft affinity / competitor demote / calendar people anchors |
| `worker/lib/copy-contract.ts` | Hard/soft validation |
| `shared/copy-knobs.ts` | Adjustable length / Context / ranking knobs |
| `worker/providers/gemini.ts` | Discover, pick, polish, verify |
| `worker/providers/wikipedia.ts` | On This Day discovery |
| `worker/providers/wikipedia-summary.ts` | Glosses |
| `worker/providers/day-indexes.ts` | OTD / History.com discovery (chart-label drop) |
| `worker/providers/archives.ts` | Perplexity live; NYT / Guardian / Chronicling stubs |
| `worker/lib/upgrade-claim.ts` | Cite upgrade + relevance |
| `worker/lib/gloss-service.ts` | Attach glosses after pick |
| `shared/source-registry.ts` | Allow / block / Harvard |
| `worker/lib/verify.ts` | Drop blocklisted cites; flag unknown hosts |
