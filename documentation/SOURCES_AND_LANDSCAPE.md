# Landscape, naming & source policy

> Companion to `VISION.md` and `PIPELINE.md`. Agents must follow the citation rules here.  
> **Last updated:** 2026-08-05  
> **Visual note:** Existing “on this day” products are functional references only — **do not copy their UI.**

---

## Why sources matter

Allowlisted cites are required so that:

1. Every shipped claim is **corroborated for that date** (blocks LLM hallucination).
2. Users can **open the original** and read more.
3. Press export stays honest — **Gemini / Perplexity / aggregators are never the public citation**.

Gemini **may discover** events via grounded search. Candidates only enter the pool when an allowlisted Tier A/B URL backs the date. See `PIPELINE.md`.

---

## Competitive / adjacent products (research)

| Site | URL pattern (naming) | Strengths | Gaps | Our use |
|------|----------------------|-----------|------|---------|
| **History.com This Day** | `/this-day-in-history/august-4` (month + day, **no year**) | Strong editorial day-of-year framing | Not searchable by full date/year | Discovery inspiration only — never cite as authority |
| **BBC On This Day** | `/onthisday/hi/dates/stories/february/20/` (month/day) | Desk-quality storytelling | ~1950–2005 only; incomplete calendar; year **or** date, not always both | Discovery / tone reference — cite **BBC article** pages as primary, not the index shell alone when thin |
| **On This Day** | `/date/1999/april/1` (**year / month-name / day**) | Full date in URL; breadth | Aggregator; not Harvard-grade; ships thin “#1 song” labels | **Best naming convention**; discovery only — **never the citation**; **do not ingest chart labels** |
| **You Didn’t Notice** | birthday → personal timeline | UX for “your date in world history” | Personal product; not a citable archive | Study **mechanic** only — **blocked as citation** |
| **NYT On This Day (Learning Blog)** | archived learning.blogs…/on-this-day/ | NYT-adjacent | Day-of-year; no year in the classic tool | Prefer **NYT Archive / Article Search / TimesMachine issue** for real cites |
| **NYT TimesMachine** | `timesmachine.nytimes.com/browser` | Front pages of issues | Often front-page display, not a structured event API | Credible **when linking a specific issue/article** |
| **Birthday Recap** | birthday headlines | Documents **why NYT API** (depth to ~1950s) vs Guardian (~1990s) | US-centric; hobby tool | **API strategy lesson** — **blocked as citation** |

### Preferred date naming for *our* product

Use ISO in APIs: `YYYY-MM-DD`.  
In human URLs / export titles, prefer On This Day’s clarity:

`{year}/{month-name}/{day}` → e.g. `1999/april/1`  
Display: `1 April 1999` (en-GB) or localised per market.

Do **not** ship month-day-only URLs as the primary key — year is required for press packs.

### Cultural breadth

A press doorway should not be politics-only. Prefer culturally resonant headlines. Facets:

- world / national events  
- culture & arts  
- sport  
- science / tech  
- music (releases, tours, cultural moments — **not** aggregator “#1 on this date” labels)  
- design / fashion (relevant to Converse)  
- brand moments (separate stack)

Each facet still needs a **credible, claim-relevant citation** — not the aggregator that listed the song, and not a random Tier A research guide.

**Ranking bias:** when NYT / BBC / Guardian / Reuters / FT / Telegraph / AP cites are already logged on a candidate, lift them above aggregator-only discovery (`preferPremiumPress`).

---

## Pipeline (mandatory)

```
1. DISCOVER  →  calendar indexes, Wikipedia On This Day, Gemini grounded search,
                GDELT, hobby aggregators, internal seeds
                    │
                    ▼
2. FILTER / RANK  →  drop chart labels & dumps; prefer culture + premium press
                    │
                    ▼
3. POLISH + VALIDATE  →  copy contract (title / synopsis / Context)
                    │
                    ▼
4. VERIFY / CITE  →  claim-relevant primary or paper-of-record URL + Harvard
                    │
                    ▼
5. HUMAN     →  editor review before press export (esp. contested / estimate)
```

- Discovery hosts may appear in **internal metadata** (`discoveredVia`) for debugging.  
- Discovery hosts must **never** appear in the public citation line, export pack, or Harvard string.  
- If verification fails → keep the card as `needs-human-review` or `trusted-discovery-only` **without** promoting the aggregator to “source.” Prefer silence over a fake cite.  
- Cite upgrade skips when a Tier A/B non-Wikipedia lead cite is already present.  
- Cite relevance: title/snippet must match the claim; reject generic `/help-with-your-research/` / copyright-guide style pages.

Full runtime map: `documentation/PIPELINE.md`.

---

## Never cite (blocklist)

These may be used for **discovery / UX research only**:

- youdidntnotice.com  
- bdayrecap.com  
- onthisday.com  
- history.com/this-day-in-history *(index pages — prefer primary docs)*  
- Similar birthday / “what happened on my birthday” hobby sites  
- AI chat answers, unsourced social posts, SEO content farms  
- Gemini / Perplexity as the bibliographic host (they may retrieve; they are not the Source)

Wikipedia: allowed as **bridge** (gloss + On This Day discovery) and as a **provisional** cite only when the article itself is the best available public summary — prefer upgrading to the footnote’s underlying primary (archive, paper, official body). Label quality honestly.

---

## Credible cite allowlist (tiered)

### Tier A — institutional / official (prefer)

| Source | Region | Notes |
|--------|--------|-------|
| nationalarchives.gov.uk | UK | Official **records** about the claim — not generic help/copyright guides |
| archives.gov | US | NARA |
| loc.gov / Chronicling America | US | Library of Congress; historic papers |
| Europa / EUR-Lex / official EU institutions | EU | Official |
| un.org / unesco.org | Global | Treat carefully; prefer specific document URLs |
| National Diet Library (ndl.go.jp) | Japan | |
| Bibliothèque nationale de France (bnf.fr / Gallica) | France | |
| Deutsche Nationalbibliothek / Bundesarchiv | Germany | |
| National Library of Australia (nla.gov.au / Trove) | AU | |
| LAC-BAC (canada.ca library/archives) | CA | |
| Official Charts, RIAA, Billboard (primary chart / week pages) | UK/US | Music facets — full cards only |
| Museum collection pages (V&A, MoMA, Smithsonian, etc.) | Global | Design/culture |

### Tier B — papers / wires of record (prefer when logged)

| Source | Region | Notes |
|--------|--------|-------|
| nytimes.com / NYT Archive API / TimesMachine **issue** | US | Strongest public newspaper API depth |
| theguardian.com / Open Platform | UK/intl | Strong from ~1999 via API |
| telegraph.co.uk | UK | |
| reuters.com | Global wire | |
| apnews.com / AP Media API | Global wire | Often licensed |
| afp.com / AFP API | Global wire | FR/multilingual |
| bbc.co.uk / bbc.com **article** URLs | UK/intl | Prefer article over On This Day index |
| ft.com | UK/global | |
| washingtonpost.com | US | |
| lemonde.fr | FR | |
| asahi.com / nikkei.com | JP | |
| scmp.com | HK/Asia | |
| thehindu.com / indianexpress.com | IN | |
| smh.com.au / theage.com.au | AU | |

### Tier C — acceptable with care

- Peer-reviewed journals / DOI links  
- University digital collections  
- Brand official history pages (Converse, Nike About) for **brand** claims only — still prefer independent corroboration for cultural claims  
- Encyclopaedia Britannica (better than random web; still secondary)

### Market localisation

Global launch ⇒ prefer a **local Tier A/B** source when the desk is local (e.g. Le Monde for FR, Asahi for JP, The Hindu for IN). Western bias in default APIs is known; mitigate with locale parameter + regional allowlist scoring (same idea as Bloom’s Source Wiki).

---

## Harvard-style citation (press export)

Target shape (author-date; adapt when no personal author):

```
Author Surname, Initial. (Year) 'Article or page title', Publisher or Site Name, Day Month Year [if known]. Available at: URL (Accessed: Day Month Year).
```

Examples:

```
National Archives (1917) 'Declaration of war…', The National Archives. Available at: https://… (Accessed: 4 August 2026).

Associated Press (1969) 'Apollo 11…', AP News, 21 July 1969. Available at: https://… (Accessed: 4 August 2026).
```

UI may show a compact line + `open hostname →`; **export packs must include the full Harvard string**. Don’t double the year in the display string.

---

## Lessons for our API stack

From **bdayrecap.com** (method, not branding):

1. **NYT Archive / Article Search** is the deepest easily accessible US newspaper API (~1950s+ for their use-case; Archive metadata claims back further).  
2. **Guardian** is the next-best open newspaper API but shallower historically (~1990s).  
3. One western paper ≠ global product — we need LoC / National Archives / wires / regional papers.

From **On This Day** naming: full date in the path; culture breadth yes — **chart label lists no**.

From **BBC / History.com**: month-day indexes are great for serendipity, bad as a sole press key without year.

---

## Code hooks

| File | Role |
|------|------|
| `shared/source-registry.ts` | Allowlist / blocklist / tiers / Harvard formatter |
| `shared/provenance.ts` | `discoveredVia`, citation fields, facets |
| `worker/lib/verify.ts` | Guard: blocklisted hosts cannot become citations |
| `worker/lib/upgrade-claim.ts` | Cite upgrade + claim relevance |
| `worker/lib/interest.ts` | Premium-press ranking boost |
| `documentation/PIPELINE.md` | Full assemble path |
| `documentation/VISION.md` | Product brief — keep in sync |

---

## Decision log (sources)

| Date | Decision |
|------|----------|
| 2026-08-04 | Two-pass discover → verify → Harvard cite |
| 2026-08-04 | Block hobby aggregators as citations forever |
| 2026-08-04 | Prefer On This Day-style full-date naming; ISO in API |
| 2026-08-04 | NYT + Guardian + archives/LOC as first verification targets |
| 2026-08-05 | Cultural facets yes; aggregator #1-song labels out of the pool |
| 2026-08-05 | Cite must be claim-relevant; prefer premium press when logged |
| 2026-08-05 | Gemini may retrieve when grounded + Tier A/B cite verifies the date |
| 2026-08-05 | Sources exist to verify date + let users read more — not to ban LLM discovery |
