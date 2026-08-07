# Chuck-E — press research chatbot

> Living document. Agents: read this before changing Chuck-E persona, disclosure, cliff notes, or routing.  
> Companion docs: `VISION.md`, `PIPELINE.md`, `COPY_CONTRACT.md`, `SOURCES_AND_LANDSCAPE.md`, **`CHUCK_ECOSYSTEM_KB.md`** (Chuck franchise product / strategy KB).  
> **Last updated:** 2026-08-07

---

## One-line brief

Chuck-E is an AI press-desk assistant that helps journalists pull sourced Converse / Chuck facts and cultural timeline nuggets, then extract **editorial cliff notes** — not finished stories.

---

## Why it exists

The Time Machine date lookup answers “what else happened on this day.” Chuck-E sits beside that as a **queryable research companion** for a sneaker launch:

- Tell the story / engineering / features of the new Chuck (from a Converse-supplied pack — never invented).
- Surface heritage and novel nuggets (e.g. Non-Skid era, materials history) with cites.
- Route date-shaped questions through the same discover → cite → copy-contract pipeline as Lookup.
- Export **cliff notes** for desks — bullets + Harvard sources — not byline-ready copy.

### Editorial line (non-negotiable)

Chuck-E helps media **pull data and consolidate editorial cliff notes**. It must **not** write a finished press story. Convenience for desks stops short of branded editorial that could be pasted into an article as-is.

### Provenance line (non-negotiable)

Every factual claim Chuck-E ships must carry a **citation** (Harvard footer) and, where the reply text matches, a **dotted citation gloss** that opens the original source (typically [Converse History](https://www.converse.com/uk/en/landing-converse-history)). Gemini is never the public citation host.

---

## EU AI Act Article 50 (from 2 August 2026)

Any queryable “Chuck” is a chatbot and needs AI disclosure at first interaction; synthetic outputs that leave the app need marking.

| Obligation | How we meet it |
|------------|----------------|
| Disclosure at first interaction | Hardcoded first chat bubble (`CHUCK_E_KNOBS.disclosureText`) — **not** model-generated. Served on `GET /api/chuck-e/chat` and prepended by `ensureDisclosure`. Styled muted/grey in the UI so it reads as system notice, not an answer. |
| Synthetic-content marking | Cliff Notes always include `cliffNotesAiBanner` + footer; plain-text copy/download carries the same banner. |
| Avoid mistaking AI for finished journalism | Cliff notes are bullet-shaped; `chuck-e-contract.ts` rejects / coerces finished-story shapes. |

Legal/brand should review `shared/chuck-e-knobs.ts` disclosure and banner strings once — they are the source of truth.

---

## Architecture

```
ChuckEWidget (floating launcher)
    → GET  /api/chuck-e/chat          → disclosure opener
    → POST /api/chuck-e/chat          → intent route → reply
    → POST /api/chuck-e/cliff-notes   → marked bullet brief
```

### Intent routing (`worker/lib/chuck-e.ts`)

| Intent | Behaviour |
|--------|-----------|
| `date` | Parse date → `assembleDateQuery` (same pipeline as Lookup) → spotlight card prose + cites + glosses |
| `product` | Match `shared/products/new-chuck.ts` facts; if placeholder/empty, refuse to invent |
| `heritage` | Match full History KB (`brand.heritageKb` via `heritageMoments`) + Converse History cites + citation glosses. Soft general fallback uses curated `timeline` beats. |
| `general` | `chatWithChuckE()` with persona guardrails; when reply/query hits timeline beats, attach History cites + glosses |
| cliff notes action | Separate endpoint; extracts bullets from the conversation + cites |

Gemini is **never** the public citation host. Historical world claims go through the Time Machine pipeline. Shoe facts come from the product pack only. Heritage beats cite **Converse History** (`landing-converse-history`). Chat and cliff-notes footers list each source URL **once** (same History LP across several beats is not repeated).

**Never ship mid-sentence chat cuts.** Chuck-E `chatMaxOutputTokens` is **8192** (Flash “thoughts” eat smaller budgets). Soft length aim is ~2800 chars — cover the beats needed; never hard-truncate. Replies that still look abruptly cut are salvaged to the last complete sentence/line or replaced with a short retry cue — never left dangling (e.g. “…from our”).

Citation glosses are built in `worker/lib/chuck-e-glosses.ts` and rendered via `GlossableText` in `ChuckEMessage`.

---

## Product knowledge pack

`shared/products/new-chuck.ts` — pluggable launch material:

- `engineering`, `features`, `storyBeats`, `novelNuggets`
- `isPlaceholder: true` until Converse supplies content
- Contested claims: `precision: 'period-estimate'` + `needsHumanReview: true`

Until the pack is filled, Chuck-E says it does not have that detail yet.

---

## Chuck Ecosystem knowledge base

**Doc:** [`documentation/CHUCK_ECOSYSTEM_KB.md`](./CHUCK_ECOSYSTEM_KB.md)  
**UI / Harvard cite label:** SPSU27 Chuck Reset Internal Comms (never the PDF filename).  
**Source date:** 3 August 2026 · Client-provided internal material (Converse / Nike, Inc.).

Training KB for Chuck franchise architecture (First String → CTAS), marketplace tiers (Inspire / Validate / Extend), and desk-safe positioning (esp. Signature vs Chuck 70 Premium, At Your Service).

### Class split (must honour)

| Class | Chuck-E behaviour |
|-------|-------------------|
| Stable product / brand framing | OK for normal desk answers; cite SPSU27 Chuck Reset Internal Comms |
| Internal strategy / forward-looking | Internal-only or explicitly labelled as plan — not confirmed public fact |
| Retailer / commercial feedback | Attribute to named retailer; not independent public performance |
| Indicative prices / launch timings | Never as current public retail price or confirmed public launch |
| “What is Converse?” | Prefer official [Converse UK — About Us](https://www.converse.com/uk/en/about-us.html) first |

**Refuse to publicly announce from this KB alone:** future launches, partnerships/talent, retailer rollouts/door counts, internal pricing, events/activations, licensing plans, sales data. Use the refusal line in the KB.

Runtime: wire stable framing into product packs before treating it as auto-shippable Chuck-E product answers; until then the markdown is agent/training truth.

---

## Code map

| File | Role |
|------|------|
| `shared/chuck-e-knobs.ts` | Disclosure, banners, persona guardrails |
| `shared/products/new-chuck.ts` | Launch knowledge pack |
| `documentation/CHUCK_ECOSYSTEM_KB.md` | Chuck Ecosystem KB (SPSU27 Chuck Reset Internal Comms) |
| `worker/lib/chuck-e.ts` | Intent router + chat / cliff-notes handlers |
| `worker/lib/chuck-e-contract.ts` | Disclosure / no-finished-story / cliff-notes guards |
| `worker/lib/chuck-e-glosses.ts` | Citation gloss builders (History / pack / cites) |
| `worker/providers/gemini.ts` | `chatWithChuckE()` |
| `worker/index.ts` | `/api/chuck-e/chat`, `/api/chuck-e/cliff-notes` |
| `src/components/ChuckEWidget.tsx` | Floating launcher + panel |
| `src/components/ChuckEMessage.tsx` | Message bubbles + cites + glosses |
| `shared/brands/converse.ts` | Curated Timeline surface + `heritageKb` pointer |
| `shared/brands/converse-heritage-kb.ts` | Full Converse History landing text for Chuck-E / date attach |
| `shared/brands/converse-heritage-media.ts` | History LP image deep-links (KB visuals; Timeline stays text-forward) |
| `src/components/CliffNotesPanel.tsx` | Export UI with AI banner |
| `src/hooks/useChuckEChat.ts` | Request/response chat state |

---

## Decision log

| Date | Decision | Why |
|------|----------|-----|
| 2026-08-06 | Floating overlay widget (not a third nav tab) | Available on Lookup + Timeline for launch desk use |
| 2026-08-06 | Request/response (no streaming) | Matches `/api/query`; simpler Worker surface for v1 |
| 2026-08-06 | Hardcoded first-message disclosure; no persistent “AI” input tag | Art. 50 first-interaction disclosure; keep UI calm |
| 2026-08-06 | Cliff notes = bullets + Harvard + AI banner — never finished story | Editorial line + synthetic-content marking |
| 2026-08-06 | Product facts only from `new-chuck` pack; dates via `assembleDateQuery` | Same provenance rules as Time Machine |
| 2026-08-06 | Ship placeholder pack empty | Prefer “don’t have it yet” over invented launch specs |
| 2026-08-06 | Heritage facts always cite Converse History + dotted gloss | Traceability to client History LP; Gemini never the public cite |
| 2026-08-06 | Chuck-E reads `heritageKb` (full History); Timeline UI stays curated | Feed website timeline text without cloning the History page as our UI |
| 2026-08-06 | Timeline images deep-link History LP CDN assets with credit | Match official visuals; no rehost without press-kit license |
| 2026-08-06 | Ingest Chuck Ecosystem KB; UI cite = SPSU27 Chuck Reset Internal Comms | Client reset deck is useful for desk Q&A but mixes strategy with product framing |
| 2026-08-06 | Ecosystem KB: refuse launches / talent / prices / rollouts as public fact | Internal planning must not leak as press-ready confirmation |
| 2026-08-07 | Deduplicate chat / cliff-notes cites by URL | Same Converse History page must not repeat once per heritage beat |
| 2026-08-07 | Chuck-E chat `maxOutputTokens` ≥ ~3k + abrupt-cut salvage | Flash thoughts ate 1024 → mid-sentence cuts (“…from our”) must never ship |
| 2026-08-07 | Chuck-E chat budget → 8192 tokens / ~2800-char soft aim | Allow fuller multi-beat desk answers; still never hard-truncate |

---

## Open questions

- Exact launch name / engineering / feature copy from Converse (fills `new-chuck.ts`).
- Which contested claims need period-estimate labelling.
- Whether cliff-notes export should later require human-review gate before download (aligned with Lookup export workflow).
- Which stable ecosystem facts (Signature / 70 Premium / tiers) to wire into a code pack vs keep markdown-only for agents.
- Confirm About Us URL path if Converse relocates the public page.
