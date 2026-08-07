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

- **Live lookup (default in wrangler):** `USE_FALLBACK=false`. Force curated seeds with `USE_FALLBACK=true` or `?fallback=1`.
- **Research stack:** Wiki + On This Day + History.com + Gemini grounded discovery + Perplexity + cite upgrade (when keyed). NYT / Guardian / LoC remain stubs.
- Settings: Specific year / Any year (`?anyYear=true`); Chuck-E text size.

```bash
npm run build
npm run deploy    # requires `wrangler login`
```

## What’s built

| Surface | Purpose |
|--------|---------|
| **Lookup** | Date dial → one spotlight day card (title / synopsis / Context / Source + glosses) |
| **Timeline** | Converse heritage moments |

Not built yet: press export, Pipeline UI, featured-date chips, multi-card pack, human-review workflow.

### Citation contract

Every cultural claim aims to be a **research card**:

1. Title + synopsis (day fact, past tense) + Context (`whyItMatters`)
2. Citation line (Harvard string + URL; allowlisted / claim-relevant when upgraded)
3. Optional dotted **glosses** (Wikipedia / curated — never AI-as-proof)

Quality labels exist on the schema (`trusted-source-quote` · … · `needs-human-review`) but are **not rendered** on the Lookup card today. Wikipedia bridge may still ship when cite upgrade finds no better host.

**Sources exist** to verify the date and give users somewhere to read more — Gemini may discover/phrase, but is never the public citation host.

## Plug-and-play brands

Brand packs live in `shared/brands/`. Set `BRAND_ID` in `wrangler.jsonc` / `.dev.vars`, or pass `?brand=converse`.

To pitch another brand: copy `shared/brands/converse.ts`, swap palette / timeline / claim frame, register in `shared/brands/index.ts`.

## API map (research notes)

| Provider | Why it matters | Key? | Status in prototype |
|----------|----------------|------|---------------------|
| **Wikipedia On This Day** | Exact calendar-day events across centuries | No | **Live** |
| **On This Day / History.com** | Editorial day indexes | No | **Live** discovery only (never cite) |
| **Wikipedia REST Summary** | Glosses for named entities | No | Live via gloss service |
| **Gemini** | Grounded discovery + phrasing; never the citation itself | Yes | Live when `GEMINI_API_KEY` set (cite-gated) |
| **Perplexity Search** | Allowlisted press + cite upgrades | Yes | Live when keyed — rolling lookback ≠ deep history |
| **NYT Archive** | US press metadata by month, 1851– | Yes | Stub |
| **Guardian Open Platform** | UK/intl ~1999–, `from-date`/`to-date` | Yes | Stub |
| **GDELT** | Structured global events ~1979– | Optional | Stub |
| **Chronicling America (LoC)** | US historic papers ~1777–1963 | No | Stub |

**Important:** Perplexity’s default date filter is “last N days from now,” not “what happened on 12 June 1968.” Deep history needs archive APIs + Wikipedia On This Day under the same citation UX.

## When you have keys

1. Put secrets in `.dev.vars` (local) / `wrangler secret put …` (prod).
2. Keep `USE_FALLBACK=false` for live lookup.
3. Flesh out stubs in `worker/providers/archives.ts`.
4. Gemini may discover or phrase — every shipped claim still needs a corroborating URL outside Gemini.

## Project layout

```
AGENTS.md
documentation/    vision, pipeline, copy contract, sources
shared/           brand + provenance + knobs (client + worker)
worker/           Cloudflare API (/api/query, /api/brand, /api/providers)
src/              React UI
```

## Design notes

Swiss / Scandi / JP-minimal — quiet type, restrained colour, press-desk calm.
