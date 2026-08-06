# Agent instructions — Time Machine

Read these before changing product behaviour, retrieval, copy, or cites:

1. **`documentation/VISION.md`** — product brief, watch-outs, decision log  
2. **`documentation/PIPELINE.md`** — how lookup → day card works (discover → rank → polish → cite → ship)  
3. **`documentation/COPY_CONTRACT.md`** — title / synopsis / Context / Source format  
4. **`documentation/SOURCES_AND_LANDSCAPE.md`** — allowlist, blocklist, Harvard, competitor notes  
5. **`documentation/CHUCK_E.md`** — Chuck-E chatbot, cliff notes, EU AI Act Art. 50 disclosure  
6. **`documentation/CHUCK_ECOSYSTEM_KB.md`** — Chuck franchise ecosystem KB (SPSU27 Chuck Reset Internal Comms); honour public vs internal class split  

Knobs live in `shared/copy-knobs.ts` (day cards) and `shared/chuck-e-knobs.ts` (Chuck-E). Keep Gemini prompts and validators aligned with the docs.  
**Canonical hosts** live in `shared/source-registry.ts` — not only the markdown tables.

## Non-negotiables (summary)

- **Chuck was there** — settled past tense, not breaking news (prompt / product voice; not yet a copy-contract hard fail).
- Every shipped claim needs a **corroborating URL** outside Gemini. Prefer Tier A/B; Lite often ships a **Wikipedia bridge** cite (upgrade is Full-only).
- Gemini may **discover and phrase**; Gemini is **never** the public citation host.
- Do **not** surface aggregator “#1 song on this date” labels.
- Prefer culturally resonant news; prefer premium-press hosts when those cites are logged.
- Prefer Converse / Chuck-tied cultural news on Lookup when the claim already shows the tie; Nike only when about Converse.
- Rank by cultural significance first; light positive/neutral tone lean second — never soft-pedal landmark defining days (e.g. 9/11).
- Timeline UI = curated beats; full Converse History text = `heritageKb` for Chuck-E / date attach (not a History LP clone).
- Never ship a card that fails `validateCopyContract` — try next candidate or curated fallback.
- Cite must be **about the claim** on the upgrade path — Tier A alone is not enough.
- Discovery aggregators never appear on the public Source line.
- Ship gate = copy contract. `needsHumanReview` does **not** block ship (and is not shown in the UI yet).
- **Chuck-E** is cliff notes for press desks, not finished stories; first message must carry hardcoded AI disclosure; cliff-notes exports must carry the AI-origin banner.
- Chuck Ecosystem KB (`CHUCK_ECOSYSTEM_KB.md`): UI cite = **SPSU27 Chuck Reset Internal Comms**; never announce launches, talent, prices, rollouts or licensing from that deck alone; “What is Converse?” prefers official About Us.

When you change behaviour, update the relevant doc + decision log and bump **Last updated**.
