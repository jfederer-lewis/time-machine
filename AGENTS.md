# Agent instructions — Time Machine

Read these before changing product behaviour, retrieval, copy, or cites:

1. **`documentation/VISION.md`** — product brief, watch-outs, decision log  
2. **`documentation/PIPELINE.md`** — how lookup → day card works (discover → rank → polish → cite → ship)  
3. **`documentation/COPY_CONTRACT.md`** — title / synopsis / Context / Source format  
4. **`documentation/SOURCES_AND_LANDSCAPE.md`** — allowlist, blocklist, Harvard, competitor notes  

Knobs live in `shared/copy-knobs.ts`. Keep Gemini prompts and validators aligned with the docs.  
**Canonical hosts** live in `shared/source-registry.ts` — not only the markdown tables.

## Non-negotiables (summary)

- **Chuck was there** — settled past tense, not breaking news (prompt / product voice; not yet a copy-contract hard fail).
- Every shipped claim needs a **corroborating URL** outside Gemini. Prefer Tier A/B; Lite often ships a **Wikipedia bridge** cite (upgrade is Full-only).
- Gemini may **discover and phrase**; Gemini is **never** the public citation host.
- Do **not** surface aggregator “#1 song on this date” labels.
- Prefer culturally resonant news; prefer premium-press hosts when those cites are logged.
- Never ship a card that fails `validateCopyContract` — try next candidate or curated fallback.
- Cite must be **about the claim** on the upgrade path — Tier A alone is not enough.
- Discovery aggregators never appear on the public Source line.
- Ship gate = copy contract. `needsHumanReview` does **not** block ship (and is not shown in the UI yet).

When you change behaviour, update the relevant doc + decision log and bump **Last updated**.
