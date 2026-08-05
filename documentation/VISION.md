# Time Machine — Agent Brief & Vision

> Living document. Update this as the idea develops. Agents: read this before making product or architecture decisions.

**Last updated:** 2026-08-04 (sources / landscape pass)  
**Client (current):** Converse  
**Working title:** Good News, Chuck  
**Live:** https://time-machine.jasminefederer.workers.dev  
**Stack:** Cloudflare Workers + Vite React (Wrangler)  
**Also read:** `documentation/SOURCES_AND_LANDSCAPE.md` (citation law), `documentation/COPY_CONTRACT.md` (day-card format)

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
3. AI (Gemini etc.) may **phrase** narrative from already-cited cards. It must **never invent** facts, years, or quotations.
4. Contested dates (e.g. when Chuck’s signature hit the ankle patch) must be labelled **needs human review** / period-estimate — never presented as settled fact.
5. **Never cite aggregators / hobby time machines as sources** — including onthisday.com, youdidntnotice.com, bdayrecap.com, History.com this-day indexes. They may **discover** events only; pass 2 must find a Tier A/B (or careful C) URL and a Harvard citation.
6. Prefer **full dates** (`YYYY-MM-DD` / `1999/april/1`) — month-day-only tools are not enough for press packs.

---

## Provenance pipeline

```
DISCOVER (indexes, Wiki On This Day, GDELT, aggregators)
    → VERIFY (National Archives, LoC, NYT, Guardian, wires, museums, regional papers of record)
    → CITE (Harvard string + open original →)
    → HUMAN REVIEW (before press export)
```

Public citation line = allowlisted host only. `discoveredVia` is internal metadata.

Cultural breadth (from On This Day naming research): politics **and** culture, sport, science, music/**charts**, design/fashion — each facet still needs a credible cite (e.g. Official Charts, not the aggregator that listed the song).

---

## Product vision (extended)

Build beyond “Chuck launch dates only” into a general **time machine for any date in history**:

| Mode | Behaviour |
|------|-----------|
| **Exact day** | Same calendar day events (Wikipedia On This Day, archives filtered to day) |
| **Period estimate** | When exact day isn’t attested (e.g. “1917 Non-Skid era”), return year/period context clearly labelled as estimate |
| **Brand timeline** | Vertical heritage archive with the same citation contract (extended idea — partially built) |

**Reusability:** Prototype for Converse, but **plug-and-play brand packs** so the same tool can be pitched to other heritage brands later (`shared/brands/`).

**Date naming:** API uses `YYYY-MM-DD`; human path uses On This Day–style `1999/april/1` (`datePath` on results). Do not use month-day-only as the primary key.

---

## Design direction

- UX: intuitive, minimal, press-desk calm.
- Visual: Swiss / Japanese / Scandinavian graphic design — sleek, not dashboard-y.
- Typography currently: Schibsted Grotesk + Newsreader; newsprint paper field; single Converse red accent.
- Citations should feel seamless (Bloom gloss / research-card pattern), not like a clunky bibliography dump.
- First viewport: brand + one clear claim + date doorway — not a control panel of widgets.

---

## Provenance contract (copy from Bloom)

Every cultural claim is a **research card**:

1. **Synopsis** — paraphrase: what it means here  
2. **Reference** — curated evidence; exact wording only inside `"…"`; paraphrase outside  
3. **Citation line** — Harvard-style bibliographic string + `open hostname →`  
4. **Glosses** (optional) — dotted underline definitions (Wikipedia / curated). AI glosses never count as proof.

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

---

## Data / API strategy

| Provider | Role | Status |
|----------|------|--------|
| Wikipedia On This Day | **Discovery** + provisional bridge | **Live** (flags human review) |
| Wikipedia REST Summary | Glosses | Pattern ready |
| Gemini | Press voice only | Stub / key-ready |
| Perplexity Search | Allowlisted discovery → verify | Stub |
| NYT Archive | **Verification** (deepest public US paper API — bdayrecap lesson) | Stub |
| Guardian Open Platform | **Verification** UK/intl ~1999+ | Stub |
| GDELT | Discovery → cite outlet URL | Stub |
| Chronicling America (LoC) | Tier A historic US papers | Stub |
| National Archives (+ Gallica, NDL, Trove…) | Tier A official records | Stub |
| Curated fallback pack | Demo with allowlisted cites | **Default on** |

Keys go in `.dev.vars` locally and `wrangler secret` in prod. Never commit secrets. See `.dev.vars.example`.

**Critical lesson from Bloom:** Perplexity’s default date filter is “last N days from now,” not “what happened on 12 June 1968.”

**Critical lesson from bdayrecap:** NYT API depth >> Guardian historically; still US-biased — add LoC / archives / regional papers for global desks.

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

### Next (when keys / next sprint)

- [ ] Wire Gemini narrative over cited cards only
- [ ] Implement NYT / Guardian / Chronicling America / National Archives verify step
- [ ] Auto-upgrade Wikipedia discoveries to Tier A/B URLs where findable
- [ ] Market / locale parameter for localised press packs (Le Monde, Asahi, The Hindu…)
- [ ] Human verification workflow (approve / reject before export)
- [ ] Richer press export (PDF / formatted brief with Harvard block)
- [ ] Real chart facets via Official Charts / Billboard week URLs
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
documentation/VISION.md
documentation/SOURCES_AND_LANDSCAPE.md   ← citation law + competitor notes
shared/source-registry.ts                ← allow/block + Harvard
shared/provenance.ts
shared/brands/
worker/lib/verify.ts                     ← blocks aggregator cites
worker/providers/
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
| 2026-08-04 | Gemini = voice only | Separates rhetoric from evidence |
| 2026-08-04 | Two-pass discover → verify → Harvard | Aggregators are ugly + uncitable; press needs archives/papers |
| 2026-08-04 | Block onthisday / youdidntnotice / bdayrecap as cites | Explicit client instruction |
| 2026-08-04 | Full-date path `year/month/day` | Best naming from On This Day without copying UI |
| 2026-08-04 | Charts/culture facets in scope | Doorway ≠ geopolitics listicle |

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

---

## Update protocol

When developing the idea further, agents and humans should:

1. Update **Current build status** checkboxes.
2. Append to **Decision log** for non-trivial choices.
3. Add/resolve **Open questions**.
4. Bump **Last updated** at the top.
5. Keep watch-outs intact unless explicitly superseded (and log why).
6. Keep `SOURCES_AND_LANDSCAPE.md` in sync when allowlists or competitor notes change.