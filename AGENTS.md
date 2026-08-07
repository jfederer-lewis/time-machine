# Agent instructions — Time Machine

Read these before changing product behaviour, retrieval, copy, or cites:

1. **`documentation/VISION.md`** — product brief, watch-outs, decision log  
2. **`documentation/PIPELINE.md`** — retrieval → rank → polish → cite → ship  
3. **`documentation/EDITORIAL_SCHEMA.md`** — significance / tone / Converse universe / landmark rules (canonical)  
4. **`documentation/COPY_CONTRACT.md`** — day-card title / synopsis / Context / Source  
5. **`documentation/SOURCES_AND_LANDSCAPE.md`** — citation allow/block + Harvard + landscape  
6. **`documentation/CHUCK_E.md`** — Chuck-E chatbot, cliff notes, Art. 50 disclosure  
7. **`documentation/CHUCK_ECOSYSTEM_KB.md`** — Chuck franchise ecosystem KB (SPSU27 Chuck Reset Internal Comms); honour public vs internal class split  

Knobs live in `shared/copy-knobs.ts` (day cards), `shared/chuck-e-knobs.ts` (Chuck-E), and `shared/converse-universe.ts` (affinity / anchors). Keep Gemini prompts and validators aligned with the docs.  
**Canonical hosts** live in `shared/source-registry.ts` — not only the markdown tables.

## Non-negotiables (summary)

- **Chuck was there** — settled past tense, not breaking news (prompt / product voice; not yet a copy-contract hard fail).
- Every shipped claim needs a **corroborating URL** outside Gemini. Prefer Tier A/B; Lite often ships a **Wikipedia bridge** cite (upgrade is Full-only).
- Gemini may **discover and phrase**; Gemini is **never** the public citation host.
- Do **not** surface aggregator “#1 song on this date” labels.
- Prefer culturally resonant news; prefer premium-press hosts when those cites are logged.
- **Rank significance first**; light positive/neutral tone lean second — never soft-pedal **landmark defining days** (e.g. 9/11). Hard / tragic history still ships when it is the significant story of the date.
- Prefer Converse / Chuck-tied cultural news when the claim already shows the tie; soft Converse-universe themes may lift lightly — **never force** Chuck over clearer significance. Nike only when about Converse; soft-demote competing footwear brands.
- **Never** attach a Converse campaign / heritage / “universe” bridge beside landmark defining days — tasteless next to casualties / world memory.
- Timeline UI = curated beats; full Converse History text = `heritageKb` for Chuck-E / date attach (not a History LP clone).
- Never ship a card that fails `validateCopyContract` — try next candidate or curated fallback.
- Cite must be **about the claim** on the upgrade path — Tier A alone is not enough.
- Discovery aggregators never appear on the public Source line.
- Ship gate = copy contract. `needsHumanReview` does **not** block ship (and is not shown in the UI yet).
- **Chuck-E** is cliff notes for press desks, not finished stories; first message must carry hardcoded AI disclosure; cliff-notes exports must carry the AI-origin banner.
- Chuck Ecosystem KB (`CHUCK_ECOSYSTEM_KB.md`): UI cite = **SPSU27 Chuck Reset Internal Comms**; never announce launches, talent, prices, rollouts or licensing from that deck alone; “What is Converse?” prefers official About Us.

When you change behaviour, update the relevant doc + decision log and bump **Last updated**.
