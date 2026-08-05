# Time Machine — Agent Brief & Vision

> Living document. Update this as the idea develops. Agents: read this before making product or architecture decisions.

**Last updated:** 2026-08-05  
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
4. Contested dates (e.g. when Chuck’s signature hit the ankle patch) must be labelled **needs human review** / period-estimate — never presented as settled fact.
5. **Never cite aggregators / hobby time machines as sources** — including onthisday.com, youdidntnotice.com, bdayrecap.com, History.com this-day indexes. They may **discover** events only; pass 2 must find a Tier A/B (or careful C) URL and a Harvard citation.
6. Prefer **full dates** (`YYYY-MM-DD` / `1999/april/1`) — month-day-only tools are not enough for press packs.
7. **Never ship aggregator “#1 song on this date” labels** — not research cards. Real music moments need prose + a proper cite (e.g. Official Charts / Billboard week or article URLs).
8. Prefer **culturally resonant** UK/global news; when NYT / BBC / Guardian (etc.) cites are already logged, prefer those candidates.
9. Day cards must pass the **copy contract** (past tense, Context when required, no title≈synopsis, no mid-sentence cuts). Failing cards never ship — try another candidate or curated fallback.

---

## Provenance pipeline

```
DISCOVER (indexes, Wiki, Gemini grounded search, GDELT, aggregators…)
    → FILTER / RANK (culture + premium press; drop chart labels & dumps)
    → POLISH + VALIDATE (copy contract)
    → VERIFY / CITE UPGRADE (claim-relevant Tier A/B; Harvard string)
    → HUMAN REVIEW (before press export)
```

Full detail: `documentation/PIPELINE.md`.

Public citation line = allowlisted host only. `discoveredVia` is internal metadata.

Cultural breadth: politics **and** culture, sport, science, music, design/fashion — each as a full research card with a credible cite. Do **not** surface aggregator “#1 song on this date” labels; real music moments (releases, tours, cultural breakthroughs) yes — Official Charts / Billboard only when they support a proper card.

---

## Product vision (extended)

Build beyond “Chuck launch dates only” into a general **time machine for any date in history**:

| Mode | Behaviour |
|------|-----------|
| **Exact day** | Same calendar day events (Wikipedia On This Day, archives, Gemini grounded) |
| **Period estimate** | When exact day isn’t attested (e.g. “1917 Non-Skid era”), return year/period context clearly labelled as estimate |
| **Brand timeline** | Vertical heritage archive with the same citation contract (extended idea — partially built) |
| **Lite vs Full** | Lite = Wiki (+ polish). Full = archives + Gemini retrieval + cite upgrade. Same copy rules. |

**Reusability:** Prototype for Converse, but **plug-and-play brand packs** so the same tool can be pitched to other heritage brands later (`shared/brands/`).

**Date naming:** API uses `YYYY-MM-DD`; human path uses On This Day–style `1999/april/1` (`datePath` on results). Do not use month-day-only as the primary key.

---

## Design direction

- UX: intuitive, minimal, press-desk calm.
- Visual: Swiss / Japanese / Scandinavian graphic design — sleek, not dashboard-y.
- Typography currently: Schibsted Grotesk + Newsreader; newsprint paper field; single Converse red accent.
- Citations should feel seamless (Bloom gloss / research-card pattern), not like a clunky bibliography dump.
- First viewport: brand + one clear claim + date doorway — not a control panel of widgets.
- Day card: title + synopsis + optional smaller/paler **Context** (`whyItMatters`) + Harvard Source. Mode chip shows Lite only when relevant.

---

## Provenance contract (copy from Bloom)

Every cultural claim is a **research card**:

1. **Title** — tight outcome hed (see `COPY_CONTRACT.md`)  
2. **Synopsis** — day fact only (past tense)  
3. **Context** (`whyItMatters`) — era / actors / stakes for a general reader  
4. **Reference** — curated evidence; exact wording only inside `"…"`; paraphrase outside  
5. **Citation line** — Harvard-style bibliographic string + `open hostname →`  
6. **Glosses** (optional) — dotted underline definitions (Wikipedia / curated). AI glosses never count as proof.

### Quality labels

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
| Wikipedia REST Summary | Glosses | Pattern ready |
| Gemini | Grounded discovery + phrasing; **never** the public cite | Live when keyed (cite-gated) |
| Perplexity Search | Allowlisted discovery → verify | Live when keyed |
| NYT Archive | **Verification** (deepest public US paper API — bdayrecap lesson) | Stub |
| Guardian Open Platform | **Verification** UK/intl ~1999+ | Stub |
| GDELT | Discovery → cite outlet URL | Stub |
| Chronicling America (LoC) | Tier A historic US papers | Stub |
| National Archives (+ Gallica, NDL, Trove…) | Tier A official records | Stub |
| Curated fallback pack | Demo with allowlisted cites | **Default on** |

Keys go in `.dev.vars` locally and `wrangler secret` in prod. Never commit secrets. See `.dev.vars.example`.

**Critical lesson from Bloom:** Perplexity’s default date filter is “last N days from now,” not “what happened on 12 June 1968.”

**Critical lesson from bdayrecap:** NYT API depth >> Guardian historically; still US-biased — add LoC / archives / regional papers for global desks.

**Why sources exist:** corroborate the date, block hallucination, give users a place to read more — **not** to ban Gemini from retrieving when grounding + an allowlisted cite are present.

---

## Current build status

### Done

- [x] Cloudflare Workers + React SPA scaffold (`wrangler`, Vite plugin)
- [x] Doorway UI: date query, featured Chuck dates, research cards, export JSON / copy brief
- [x] Timeline view (Converse heritage moments)
- [x] Pipeline view (provider catalogue)
- [x] Plug-and-play brand config (`shared/brands/converse.ts`)
- [x] Curated fallback with source URLs
- [x] Live Wikipedia On This Day path (`fallback=0` / UI toggle)
- [x] Deployed to `time-machine.jasminefederer.workers.dev`
- [x] Source registry allowlist / blocklist + Harvard formatter
- [x] Citation sanitize guard (`worker/lib/verify.ts`)
- [x] Landscape doc + two-pass provenance policy
- [x] Copy contract + knobs + runtime validation
- [x] Interest ranking (culture + premium press)
- [x] Gemini grounded discovery (cite-gated) + polish + pick
- [x] Cite upgrade with claim relevance
- [x] Aggregator chart labels removed from discovery
- [x] Assemble never ships failing copy-contract cards

### Next (when keys / next sprint)

- [ ] Implement NYT / Guardian / Chronicling America / National Archives verify APIs
- [ ] Market / locale parameter for localised press packs (Le Monde, Asahi, The Hindu…)
- [ ] Human verification workflow (approve / reject before export)
- [ ] Richer press export (PDF / formatted brief with Harvard block)
- [ ] Real music facets via Official Charts / Billboard **week/article** URLs (full cards only)
- [ ] Expand brand timeline as a first-class pitch surface
- [ ] More curated exact-day packs for known Chuck/cultural doorways

---

## How to run / deploy

```bash
npm install
cp .dev.vars.example .dev.vars   # add keys when ready
npm run dev                      # http://localhost:5173
npm run deploy                   # Cloudflare Workers
```

Toggle **Live Wikipedia On This Day** in the UI, or call:

`/api/query?date=YYYY-MM-DD&fallback=0`

---

## Repo map (for agents)

```
AGENTS.md
documentation/VISION.md
documentation/PIPELINE.md               ← retrieval / ship rules
documentation/COPY_CONTRACT.md           ← day-card format
documentation/SOURCES_AND_LANDSCAPE.md   ← citation law + competitor notes
shared/copy-knobs.ts                     ← adjustable aims
shared/source-registry.ts                ← allow/block + Harvard
shared/provenance.ts
shared/brands/
worker/lib/assemble.ts                   ← orchestration
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
| 2026-08-04 | Fallback default ON | Demo-safe until keys; live Wiki available via toggle |
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

---

## Open questions

- Exact public calendar day for Non-Skid / All Star 1917? (Likely year-only — keep as period estimate.)
- Which markets / languages first for localisation?
- Editorial workflow: who human-verifies before export?
- Is the brand timeline part of v1 pitch, or hold as extended idea?
- Should “Chuck launch dates” be a curated seed list supplied by Converse, or inferred from brand pack only?
- How aggressively do we auto-scrape primary URLs from Wikipedia footnotes vs require editor pick?

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
