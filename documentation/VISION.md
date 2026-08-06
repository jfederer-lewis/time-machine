# Time Machine — Agent Brief & Vision

> Living document. Update this as the idea develops. Agents: read this before making product or architecture decisions.

**Last updated:** 2026-08-06 (positive-when-tied ranking)  
**Client (current):** Converse  
**Working title:** Good News, Chuck  
**Live:** https://time-machine.jasminefederer.workers.dev  
**Stack:** Cloudflare Workers + Vite React (Wrangler)  

**Also read (required for agents):**

| Doc | Role |
|-----|------|
| `documentation/PIPELINE.md` | Retrieval → rank → polish → cite → ship |
| `documentation/COPY_CONTRACT.md` | Day-card title / synopsis / Context / Source |
| `documentation/SOURCES_AND_LANDSCAPE.md` | Citation allow/block + Harvard + landscape |
| `documentation/CHUCK_E.md` | Chuck-E chatbot, cliff notes, Art. 50 disclosure |
| `documentation/CHUCK_ECOSYSTEM_KB.md` | Chuck Ecosystem KB (SPSU27 Chuck Reset Internal Comms) |
| `AGENTS.md` | Short non-negotiables entrypoint |

---

## One-line brief

A sourced cultural time machine for press: any date becomes a doorway into what else was happening — so a heritage brand can say “we were there,” with citations, not vibes.

---

## The idea (Idea 01 — Good News, Chuck)

### What it is

Every Chuck launch date (and, more broadly, any date) becomes a doorway into what else happened on that date across a century of culture. Journalists can query a date, pull a sourced story pack, and export press-ready material.

### Why it works

- The claim isn’t “good news” — it’s **Chuck was there**.
- A hundred years of continuous cultural presence is something no competitor silhouette can say.
- It **localises**: the same mechanic produces a genuinely local story in every market (hardest thing to manufacture in a global launch).
- Secondary benefit: a structured, dated, sourced archive is exactly what AI answer engines ingest — long-term discoverability, not just a coverage spike.

### Watch-outs (non-negotiable)

1. **Every historical claim must be human-verified and source-linked.** Invented history on a heritage brand is the worst available failure.
2. Avoid making this a **listicle one-off** — it should feel like a durable press platform / archive tool.
3. AI (Gemini etc.) may **discover** and **phrase** day facts. It must **never** be the public citation, invent quotations, or ship a claim without a **credible allowlisted source** that corroborates the date — so users can verify and read more, and so we don’t publish hallucinations.
4. Contested dates must be labelled **needs human review** / period-estimate — never presented as settled fact. (Chuck signature: brand pack now follows Converse History **1934**; older “1932” secondary lore is superseded for this product.)
5. **Never cite aggregators / hobby time machines as sources** — including onthisday.com, youdidntnotice.com, bdayrecap.com, History.com this-day indexes. They may **discover** events only; pass 2 must find a Tier A/B (or careful C) URL and a Harvard citation.
6. Prefer **full dates** (`YYYY-MM-DD` / `1999/april/1`) — month-day-only tools are not enough for press packs.
7. **Never ship aggregator “#1 song on this date” labels** — not research cards. Real music moments need prose + a proper cite (e.g. Official Charts / Billboard week or article URLs).
8. Prefer **culturally resonant** UK/global news; when NYT / BBC / Guardian (etc.) cites are already logged, prefer those candidates.
9. Day cards must pass the **copy contract** (past tense, Context when required, no title≈synopsis, no mid-sentence cuts). Failing cards never ship — try another candidate or curated fallback.

---

## Provenance pipeline

```
DISCOVER (Wiki + day-indexes; Gemini + Perplexity in Full; NYT/Guardian/LoC/GDELT stubs)
    → FILTER / RANK (culture + premium press; drop chart labels & dumps)
    → POLISH + VALIDATE (copy contract)
    → CITE UPGRADE (Full only, when needed)
    → SHIP one spotlight  (+ human review before export — not built yet)
```

Full detail: `documentation/PIPELINE.md`.

Public Source = `citations[0]` after sanitize (blocklisted hosts dropped). Wikipedia bridge may still render, especially in Lite. `discoveredVia` is internal metadata.

Cultural breadth: politics **and** culture, sport, science, music, design/fashion — each as a full research card with a credible cite. Do **not** surface aggregator “#1 song on this date” labels; real music moments (releases, tours, cultural breakthroughs) yes — Official Charts / Billboard only when they support a proper card.

---

## Product vision (extended)

Build beyond “Chuck launch dates only” into a general **time machine for any date in history**:

| Mode | Behaviour |
|------|-----------|
| **Exact day** | Same calendar day events (Wiki + day-indexes; Full adds Gemini / Perplexity) |
| **Period estimate** | When exact day isn’t attested (e.g. “1917 Non-Skid era”), return year/period context clearly labelled as estimate |
| **Brand timeline** | Vertical heritage archive (Timeline view built; Lookup only attaches brand moments when no cultural hit) |
| **Lite vs Full** | Lite = Wiki + day-indexes + polish. Full = + Gemini discovery + Perplexity + cite upgrade. Same copy rules. Archives still stubs. |

**Reusability:** Prototype for Converse, but **plug-and-play brand packs** so the same tool can be pitched to other heritage brands later (`shared/brands/`).

**Date naming:** API uses `YYYY-MM-DD`; human path uses On This Day–style `1999/april/1` (`datePath` on results). Do not use month-day-only as the primary key.

---

## Design direction

- UX: intuitive, minimal, press-desk calm.
- Visual: Swiss / Japanese / Scandinavian graphic design — sleek, not dashboard-y.
- Typography currently: Schibsted Grotesk + Newsreader; newsprint paper field; single Converse red accent.
- Citations should feel seamless (Bloom gloss / research-card pattern), not like a clunky bibliography dump.
- First viewport: brand + one clear claim + date doorway — not a control panel of widgets.
- Day card: title + synopsis + optional smaller/paler **Context / Provenance** (`whyItMatters`) + Harvard Source. Mode chip shows Lite only when relevant.

---

## Provenance contract (target UX)

Lookup today ships fields 1–3 + 5 (+ optional 6). Reference block, quality labels, and `open hostname →` are schema/target — not on the spotlight UI yet.

1. **Title** — tight outcome hed (see `COPY_CONTRACT.md`)  
2. **Synopsis** — day fact only (past tense aspiration)  
3. **Context** (`whyItMatters`) — era / actors / stakes; UI label **Context / Provenance**  
4. **Reference** — curated evidence; exact wording only inside `"…"`; paraphrase outside (**not on Lookup spotlight**)  
5. **Citation line** — Harvard-style string + URL (`formatHarvardCitation`; no Accessed date)  
6. **Glosses** (optional) — dotted underline definitions (Wikipedia / curated). AI glosses never count as proof.

### Quality labels (schema; not rendered on Lookup)

- `trusted-source-quote`
- `trusted-source-snippet`
- `trusted-discovery-only`
- `curated-fallback`
- `period-estimate`
- `needs-human-review`

### Honesty rules

- Never invent quotation marks.
- Never cite AI as the source of a historical fact.
- Never cite blocklisted discovery hosts as the public source.
- Silence over weak annotation (no fake citation for synthesis-only text).
- Wikipedia = gloss / provisional bridge; upgrade to archives / papers / wires when possible.
- Cite must be **about the claim** (relevance) — a random Tier A page is not enough.

---

## Data / API strategy

| Provider | Role | Status |
|----------|------|--------|
| Wikipedia On This Day | **Discovery** + provisional bridge | **Live** (flags human review) |
| Wikipedia REST Summary | Glosses | Live via gloss service |
| On This Day / History.com | Discovery indexes | Live discovery; never public cite |
| Gemini | Grounded discovery + phrasing; **never** the public cite | Live when keyed (cite-gated) |
| Perplexity Search | Allowlisted discovery → verify | Live when keyed |
| NYT Archive | **Verification** (deepest public US paper API — bdayrecap lesson) | Stub |
| Guardian Open Platform | **Verification** UK/intl ~1999+ | Stub |
| GDELT | Discovery → cite outlet URL | Stub |
| Chronicling America (LoC) | Tier A historic US papers | Stub |
| National Archives (+ Gallica, NDL, Trove…) | Tier A official records | Stub |
| Curated fallback pack | Demo with allowlisted cites | Available via `USE_FALLBACK=true` / `?fallback=1` (**default off** in wrangler) |

Keys go in `.dev.vars` locally and `wrangler secret` in prod. Never commit secrets. See `.dev.vars.example`.

**Critical lesson from Bloom:** Perplexity’s default date filter is “last N days from now,” not “what happened on 12 June 1968.”

**Critical lesson from bdayrecap:** NYT API depth >> Guardian historically; still US-biased — add LoC / archives / regional papers for global desks.

**Why sources exist:** corroborate the date, block hallucination, give users a place to read more — **not** to ban Gemini from retrieving when grounding + an allowlisted cite are present.

---

## Current build status

### Done

- [x] Cloudflare Workers + React SPA scaffold (`wrangler`, Vite plugin)
- [x] Lookup UI: date dial → **one spotlight** day card (title / synopsis / Context / Source + optional glosses)
- [x] Timeline view (Converse heritage moments)
- [x] Plug-and-play brand config (`shared/brands/converse.ts`)
- [x] Curated fallback pack (seeded dates only; else empty-day UI)
- [x] Live discovery path (`USE_FALLBACK=false`; `?fallback=0`)
- [x] Lite / Full research modes + Specific year / Any year (settings)
- [x] Deployed Worker
- [x] Source registry allowlist / blocklist + Harvard formatter
- [x] Citation sanitize guard (`worker/lib/verify.ts`)
- [x] Landscape doc + provenance policy
- [x] Copy contract + knobs + runtime validation
- [x] Interest ranking (culture + premium press)
- [x] Gemini grounded discovery (cite-gated) + polish + pick
- [x] Cite upgrade with claim relevance (Full)
- [x] Aggregator chart labels removed from day-index discovery
- [x] Assemble never ships failing copy-contract cards
- [x] Chuck-E floating chat widget (request/response) with Art. 50 first-message disclosure
- [x] Chuck-E intent routing: date → assemble; product → launch pack; heritage → brand timeline
- [x] Cliff notes extract (bullets + Harvard + AI-origin banner) — not finished press copy
- [x] Brand timeline expanded from Converse History landing + researched exact days/months

### Not built yet (docs previously over-claimed)

- [ ] Featured Chuck date chips (brand data exists; UI passes `featured={[]}`)
- [ ] Multi-card story pack / Bloom `EventCard` + Reference block on the Lookup surface
- [ ] Quality labels / `needsHumanReview` badge on the day card
- [ ] Pipeline / provider catalogue UI (`/api/providers` JSON only)
- [ ] Fallback / live toggle in the UI (env + query param only)
- [ ] Press export JSON / copy brief (Lookup path — Chuck-E cliff notes cover chat export)
- [ ] Human verification workflow before export
- [ ] Converse-supplied new Chuck engineering / feature pack (`shared/products/new-chuck.ts` still placeholder)

### Next (when keys / next sprint)

- [ ] Implement NYT / Guardian / Chronicling America / National Archives verify APIs
- [ ] Market / locale parameter for localised press packs
- [ ] Wire `needsHumanReview` into the UI; editor approve/reject before export
- [ ] Richer press export (PDF / formatted brief with Harvard block)
- [ ] Real music facets via Official Charts / Billboard **week/article** URLs
- [ ] More curated exact-day packs for known Chuck/cultural doorways
- [ ] Re-enable featured dates; optional multi-event pack
---

## How to run / deploy

```bash
npm install
cp .dev.vars.example .dev.vars   # add keys when ready
npm run dev                      # http://localhost:5173
npm run deploy                   # Cloudflare Workers
```

Toggle live vs curated via env / query (no UI toggle yet):

`/api/query?date=YYYY-MM-DD&fallback=0&mode=lite|full&anyYear=true`

UI defaults: research mode **lite**, specific year. API defaults: mode **full** if `mode` omitted.
---

## Repo map (for agents)

```
AGENTS.md
documentation/VISION.md
documentation/PIPELINE.md               ← retrieval / ship rules
documentation/COPY_CONTRACT.md           ← day-card format
documentation/SOURCES_AND_LANDSCAPE.md   ← citation law + competitor notes
documentation/CHUCK_E.md                 ← Chuck-E chatbot + Art. 50
documentation/CHUCK_ECOSYSTEM_KB.md      ← Chuck franchise KB (internal reset deck)
shared/copy-knobs.ts                     ← adjustable aims
shared/chuck-e-knobs.ts                  ← disclosure + cliff-notes rules
shared/source-registry.ts                ← allow/block + Harvard
shared/provenance.ts
shared/brands/
shared/products/                         ← new Chuck launch pack
worker/lib/assemble.ts                   ← orchestration
worker/lib/chuck-e.ts                    ← Chuck-E intent router
worker/lib/chuck-e-contract.ts           ← disclosure / no-story guards
worker/lib/interest.ts                   ← ranking
worker/lib/copy-contract.ts              ← validators
worker/lib/upgrade-claim.ts              ← cite upgrade + relevance
worker/lib/verify.ts                     ← blocks aggregator cites
worker/providers/gemini.ts
worker/providers/day-indexes.ts
worker/providers/archives.ts
src/
```

---

## Decision log

Record material product/architecture choices here as we go.

| Date | Decision | Why |
|------|----------|-----|
| 2026-08-04 | Cloudflare Workers + Vite React | Matches Bloom/JasRag stack instincts; easy deploy via Wrangler |
| 2026-08-04 | Bloom-style research cards + glosses | Proven citation UX; reduces hallucination risk in press context |
| 2026-08-04 | Brand packs in `shared/brands/` | Pitch Converse now; other heritage brands later |
| 2026-08-04 | Fallback default ON | Superseded 2026-08-05 — wrangler `USE_FALLBACK=false` |
| 2026-08-05 | Fallback default OFF; curated via `?fallback=1` | Live path is the product default once keys exist |
| 2026-08-05 | Docs aligned to runtime (Lite day-indexes, stubs, ship gate = copy contract) | Docs had oversold export / Pipeline UI / Tier A/B absolute / Harvard Accessed |
| 2026-08-04 | Two-pass discover → verify → Harvard | Aggregators are ugly + uncitable; press needs archives/papers |
| 2026-08-04 | Block onthisday / youdidntnotice / bdayrecap as cites | Explicit client instruction |
| 2026-08-04 | Full-date path `year/month/day` | Best naming from On This Day without copying UI |
| 2026-08-05 | Gemini may retrieve **if** grounded + allowlisted cite verifies the date | Sources block hallucination + let users read more — not a ban on LLM discovery |
| 2026-08-05 | Supersedes “Gemini = voice only” | Voice-only was too narrow; evidence gate remains |
| 2026-08-05 | No aggregator #1-song labels in the pool | Not research cards; against vision |
| 2026-08-05 | Prefer culture + premium press in ranking | Desk-quality headlines over admin trivia |
| 2026-08-05 | Cite must be claim-relevant | Tier A alone can attach junk (e.g. copyright guide) |
| 2026-08-05 | Assemble: polish → validate → cite → validate; never ship fails | Contract is a ship gate, not just a prompt |
| 2026-08-05 | Context (`whyItMatters`) required by default | Separate era background from day fact |
| 2026-08-05 | Past tense / “Chuck was there”; skip live wire for recent dates | Product reads as settled history |
| 2026-08-05 | Polish `maxOutputTokens` ≥ ~3k (thinking models) | Flash “thoughts” ate a 520 budget → truncated JSON → empty days |
| 2026-08-05 | `looksAbruptlyCut` must not treat `.` as truncation | Character class `[.…]` rejected every finished sentence |
| 2026-08-06 | Chuck-E floating chat on top of Time Machine pipeline | Launch desk needs shoe Q&A + heritage + date nuggets beside Lookup |
| 2026-08-06 | Chuck-E = cliff notes for press, not finished stories | Fine line: convenience vs branded editorial |
| 2026-08-06 | Art. 50: hardcoded first-message AI disclosure + cliff-notes AI banner | Queryable chatbot + synthetic text that may leave the app |
| 2026-08-06 | Brand timeline expanded to mirror Converse History landing | Client surface; press packs need the same beats + better dates |
| 2026-08-06 | Signature year = 1934 (official history), not 1932 secondary lore | Align with Converse.com + archive narrative; flag older 1932 claims |
| 2026-08-06 | Nike close = 2003-09-04 (announce 2003-07-09) | SEC 8-K; prior pack wrongly treated announce day as close |
| 2026-08-06 | Timeline images from Converse History LP CDN + credit link | Visual parity with client page; deep-link only |
| 2026-08-06 | Chuck-E facts ship with citation gloss → original source | Press desks need hoverable provenance, not bare chat prose |
| 2026-08-06 | Chuck Ecosystem KB from SPSU27 Chuck Reset; UI cite Internal Comms | Desk needs franchise architecture; PDF filename must stay out of UI |
| 2026-08-06 | Prefer positive when interest is tied; never soft-pedal landmark defining days | “Good News, Chuck” lean without ignoring 9/11-class dates |
| 2026-08-06 | Interest = significance (primary) + light tone lean + credibility + quality | Balance cultural weight with a slight positive/neutral bias; tone is not a veto |

---

## Open questions

- Exact public calendar day for Non-Skid / All Star 1917 / 1919? (Still year-only on Converse History — keep year precision.)
- Which markets / languages first for localisation?
- Editorial workflow: who human-verifies before export?
- Brand timeline is now a first-class pitch surface — confirm copy tone vs Converse.com marketing voice with client.
- Should “Chuck launch dates” be a curated seed list supplied by Converse, or inferred from brand pack only?
- How aggressively do we auto-scrape primary URLs from Wikipedia footnotes vs require editor pick?
- New Chuck launch pack content (engineering / features / story) for `shared/products/new-chuck.ts`?
- Should Chuck-E cliff-notes download require the same human-review gate as Lookup press export?
- Wire which stable Chuck Ecosystem KB facts into a code product pack (vs markdown-only)?

---

## Voice / messaging notes

- Frame: longevity, cultural continuity, localisation — **not** “the shoe is interesting.”
- Client has said there isn’t much interesting about the new Chuck itself; lean into presence over product novelty.
- Press tone: calm, sourced, desk-ready — not hype marketing copy.
- Always past tense settled history — never present-tense wire voice.

---

## Update protocol

When developing the idea further, agents and humans should:

1. Update **Current build status** checkboxes.
2. Append to **Decision log** for non-trivial choices.
3. Add/resolve **Open questions**.
4. Bump **Last updated** at the top.
5. Keep watch-outs intact unless explicitly superseded (and log why).
6. Keep `SOURCES_AND_LANDSCAPE.md`, `PIPELINE.md`, and `COPY_CONTRACT.md` in sync when behaviour changes.
