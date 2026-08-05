# Time Machine — Good News, Chuck

A Cloudflare Workers + React prototype for a **global digital press platform**: any date becomes a doorway into sourced cultural history. Built for Converse’s Chuck longevity story, structured so another heritage brand can plug in via a brand pack.

## Core claim

Not “good news” — **Chuck was there.** A century of continuous cultural presence, localised per market by the same date mechanic.

## Agent / product docs

| Doc | Role |
|-----|------|
| [`AGENTS.md`](./AGENTS.md) | Non-negotiables for agents |
| [`documentation/VISION.md`](./documentation/VISION.md) | Product brief + decision log |
| [`documentation/PIPELINE.md`](./documentation/PIPELINE.md) | Discover → rank → polish → cite → ship |
| [`documentation/COPY_CONTRACT.md`](./documentation/COPY_CONTRACT.md) | Day-card format |
| [`documentation/SOURCES_AND_LANDSCAPE.md`](./documentation/SOURCES_AND_LANDSCAPE.md) | Citation law + landscape |

## Run locally

```bash
npm install
cp .dev.vars.example .dev.vars   # optional keys
npm run dev
```

Open the Vite URL (Cloudflare plugin serves `/api/*` from the Worker).

- **Fallback mode (default):** curated, source-linked seed cards — safe for demos without keys.
- **Live lookup:** toggle live mode in the UI, or call `/api/query?date=YYYY-MM-DD&fallback=0`.
- **Lite** = Wikipedia (+ polish). **Full** = archives + Gemini grounded retrieval + cite upgrade. Same copy rules.

```bash
npm run build
npm run deploy    # requires `wrangler login`
```

## What’s built

| Surface | Purpose |
|--------|---------|
| **Doorway** | Date query → research cards + press export |
| **Timeline** | Converse heritage moments (extended idea) |
| **Pipeline** | Provider status / what to wire next |

### Citation contract (from Bloom)

Every cultural claim is a **research card**:

1. Title + synopsis (day fact, past tense) + Context (`whyItMatters`)
2. Reference block (quotes only inside `"…"`)
3. Citation line + `open hostname →` (allowlisted, claim-relevant)
4. Optional dotted **glosses** (Wikipedia / curated — never AI-as-proof)

Quality labels: `trusted-source-quote` · `trusted-source-snippet` · `trusted-discovery-only` · `curated-fallback` · `period-estimate` · `needs-human-review`.

Contested heritage dates (e.g. when Chuck’s signature hit the patch) are flagged for human review — inventing history on a heritage brand is the failure mode this system is designed to avoid.

**Sources exist** to verify the date and give users somewhere to read more — Gemini may discover/phrase, but is never the public citation.

## Plug-and-play brands

Brand packs live in `shared/brands/`. Set `BRAND_ID` in `wrangler.jsonc` / `.dev.vars`, or pass `?brand=converse`.

To pitch another brand: copy `shared/brands/converse.ts`, swap palette / timeline / claim frame, register in `shared/brands/index.ts`.

## API map (research notes)

| Provider | Why it matters | Key? | Status in prototype |
|----------|----------------|------|---------------------|
| **Wikipedia On This Day** | Exact calendar-day events across centuries | No | **Live** via Worker proxy |
| **Wikipedia REST Summary** | Glosses for named entities | No | Pattern ready (inline glosses) |
| **Gemini** | Grounded discovery + phrasing; never the citation itself | Yes | Live when `GEMINI_API_KEY` set (cite-gated) |
| **Perplexity Search** | Allowlisted contemporary press (Bloom pattern) | Yes | Live when keyed — rolling lookback ≠ deep history |
| **NYT Archive** | US press metadata by month, 1851– | Yes | Stub — filter to day client-side |
| **Guardian Open Platform** | UK/intl ~1999–, `from-date`/`to-date` | Yes | Stub |
| **GDELT** | Structured global events ~1979– | Optional | Stub |
| **Chronicling America (LoC)** | US historic papers ~1777–1963 | No | Stub — ideal for Chuck decades |

**Important (from Bloom):** Perplexity’s default date filter is “last N days from now,” not “what happened on 12 June 1968.” Deep history needs archive APIs + Wikipedia On This Day under the same citation UX.

## When you have keys

1. Put secrets in `.dev.vars` (local) / `wrangler secret put …` (prod).
2. Set `USE_FALLBACK=false`.
3. Flesh out stubs in `worker/providers/archives.ts`.
4. Gemini may discover or phrase — every shipped claim still needs an allowlisted cite that backs the date.

## Project layout

```
AGENTS.md
documentation/    vision, pipeline, copy contract, sources
shared/           brand + provenance + knobs (client + worker)
worker/           Cloudflare API (/api/query, /api/brand, /api/providers)
src/              React UI (Swiss / Scandi / JP-minimal)
```

## Design notes

Typography: **Schibsted Grotesk** (Nordic press DNA) + **Newsreader** (editorial body). Newsprint paper field, single Converse red accent, no card chrome in the hero, citations as quiet research lines rather than bibliography dumps.
