# Agent instructions — Time Machine

Read these before changing product behaviour, retrieval, copy, or cites:

1. **`documentation/VISION.md`** — product brief, watch-outs, decision log  
2. **`documentation/PIPELINE.md`** — how lookup → day card works (discover → rank → polish → cite → ship)  
3. **`documentation/COPY_CONTRACT.md`** — title / synopsis / Context / Source format  
4. **`documentation/SOURCES_AND_LANDSCAPE.md`** — allowlist, blocklist, Harvard, competitor notes  

Knobs live in `shared/copy-knobs.ts`. Keep Gemini prompts and validators aligned with the docs.

## Non-negotiables (summary)

- **Chuck was there** — settled past tense, not breaking news.
- Every shipped claim needs a **credible allowlisted cite** that corroborates the **date** (users verify + read more; blocks hallucination).
- Gemini may **discover and phrase**; Gemini is **never** the public citation.
- Do **not** surface aggregator “#1 song on this date” labels.
- Prefer culturally resonant news; prefer NYT / BBC / Guardian (etc.) when those cites are logged.
- Never ship a card that fails `validateCopyContract` — try next candidate or curated fallback.
- Cite must be **about the claim** — Tier A alone is not enough.
- Discovery aggregators never appear on the public Source line.

When you change behaviour, update the relevant doc + decision log and bump **Last updated**.
