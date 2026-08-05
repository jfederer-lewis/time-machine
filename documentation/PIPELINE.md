# Retrieval & assemble pipeline

> How a date lookup becomes a day card. Agents: follow this when changing discovery, ranking, polish, or cites.  
> Companion docs: `VISION.md` (product), `SOURCES_AND_LANDSCAPE.md` (citation law), `COPY_CONTRACT.md` (card format).  
> **Last updated:** 2026-08-05

---

## Why sources matter

Credible cites are **not** a ban on LLM discovery. They exist so that:

1. Every shipped claim is **date-checked** against something outside the model (blocks hallucination).
2. Users can **trace the fact** and read more on the original page.
3. Press export stays honest — Gemini / Perplexity are never the public citation host.

Gemini **may discover and phrase**. It **must never** invent quotations, ship without an allowlisted corroborating URL, or appear as the Source line.

---

## Modes

| Mode | Stack |
|------|--------|
| **Lite** | Wikipedia On This Day (+ Gemini polish / Context). No paid archive fan-out. |
| **Full** | Day-indexes + Wiki + Gemini grounded retrieval + Perplexity / NYT / Guardian when keyed + cite upgrade. |

Same **copy contract** in both modes (`COPY_CONTRACT.md`). Full adds discovery breadth and cite upgrade — not looser prose rules.

---

## Pipeline (runtime)

```
DISCOVER
  Wikipedia On This Day
  onthisday.com / History.com   ← discovery metadata only, never public cite
  Gemini + Google Search        ← full mode; cite-gated (Tier A/B allowlisted URL required)
  Perplexity / NYT / Guardian / LoC (when keyed)
       │
       ▼
FILTER
  Drop aggregator “#1 song on this date” labels / charts category stubs
  Drop wire dumps, title≈synopsis stubs, thin blurbs
       │
       ▼
RANK  (worker/lib/interest.ts)
  Prefer culturally resonant UK/global news
  Prefer candidates already cited from NYT / BBC / Guardian / Reuters / FT / Telegraph / AP
  Soft-penalise admin trivia (Nunavut-style)
       │
       ▼
PICK  (Gemini shortlist, optional)
  Same cultural + premium-press bias; sourceHint shown when logged
       │
       ▼
POLISH → VALIDATE  (up to 3 candidates)
  Gemini → { title, synopsis, whyItMatters }
  validateCopyContract — hard fails skip candidate
       │
       ▼
CITE UPGRADE  (full, if needed)
  Skip if lead cite is already Tier A/B and not Wikipedia
  Else Perplexity allowlisted search + Gemini verify/grounding
  Cite must be *about the claim* (relevance) — Tier A alone ≠ enough
  Charts/music claims prefer Official Charts / Billboard when applicable
       │
       ▼
VALIDATE AGAIN → SHIP
  Never ship a card that fails the copy contract
  If all candidates fail → curated fallback pack (usingFallback: true)
       │
       ▼
GLOSSES + brand moments
```

Code: `worker/lib/assemble.ts`, `worker/providers/gemini.ts`, `worker/lib/upgrade-claim.ts`, `worker/lib/interest.ts`, `worker/lib/copy-contract.ts`.

---

## Interest / headline priorities

**Prefer**

- Culturally resonant settled history: arts, music (real moments), film, fashion, design, sport, science, human rights, major geopolitics
- UK / Europe / global stakes (“Chuck was there” for a British/international desk)
- Events already carrying **paper-of-record** cites when logged: NYT / TimesMachine, BBC article URLs, Guardian, Reuters, FT, Telegraph, AP, etc.

**Deprioritise / exclude**

- Aggregator “UK #1: Song” / “#1 song on this date” labels — **do not ingest** (not research cards)
- Remote administrative trivia (new territories, postal renames, municipal amalgamation)
- Live wire dumps / video index scrapes / present-tense breaking news
- Recent/future lookup dates: skip live wire date-search (`recentLiveWireSkipDays`)

Knobs: `preferUkGlobalInterest`, `preferPremiumPress` in `shared/copy-knobs.ts`.

---

## Gemini roles

| Role | Allowed? | Gate |
|------|----------|------|
| Grounded discovery (full) | Yes | Google Search grounding + allowlisted Tier A/B URL that corroborates the date |
| Pick most interesting shortlist | Yes | From supplied candidates only |
| Polish title / synopsis / Context | Yes | `validateCopyContract` must pass |
| Public citation host | **Never** | — |
| Invent facts / quotes / years | **Never** | — |

---

## Cite upgrade rules

- Discovery hosts (`onthisday.com`, History.com indexes, hobby birthday sites) → **never** the Harvard line.
- Wikipedia → bridge / gloss; upgrade when a primary or paper-of-record URL is findable.
- Candidate URLs must share **claim relevance** (title/snippet tokens). Reject generic research guides (e.g. National Archives copyright / “help with your research” pages) that don’t corroborate the day fact.
- If already Tier A/B (non-Wikipedia) → skip upgrade pass.
- If no relevant Tier A/B found → keep bridge cite, flag `needs-human-review` — silence over a fake cite.

---

## What must never ship

- Title that is an exact or trivial rephrase of the synopsis
- Title that is a chopped “Following…” lead-in from the synopsis
- Mid-word / mid-sentence cuts in any field
- Missing Context when `contextRequired: true`
- Present-tense breaking news voice
- Aggregator #1-song labels as the day card
- Unallowlisted or irrelevant Tier A pages as the Source

---

## Code map

| File | Role |
|------|------|
| `worker/lib/assemble.ts` | Orchestration: discover → rank → polish → validate → cite → ship |
| `worker/lib/interest.ts` | Cultural + premium-press ranking |
| `worker/lib/copy-contract.ts` | Hard/soft validation |
| `shared/copy-knobs.ts` | Adjustable length / Context / ranking knobs |
| `worker/providers/gemini.ts` | Discover, pick, polish, verify |
| `worker/providers/day-indexes.ts` | OTD / History.com discovery (no chart stubs) |
| `worker/providers/archives.ts` | Perplexity / NYT / Guardian stubs |
| `worker/lib/upgrade-claim.ts` | Cite upgrade + relevance |
| `shared/source-registry.ts` | Allow / block / Harvard |
| `worker/lib/verify.ts` | Block discovery hosts as public cites |
