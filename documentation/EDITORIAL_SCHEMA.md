# Editorial schema — ranking, tone, Converse universe, landmarks

> Canonical rules for what wins a day card / Chuck-E date reply.  
> Runtime: `worker/lib/interest.ts`, `shared/converse-universe.ts`, `worker/lib/assemble.ts`, `worker/lib/chuck-e.ts`, Gemini pick prompts.  
> **Last updated:** 2026-08-07 (Chuck-E: no world backdrop on Converse-tied answers)  
> Knobs: `shared/copy-knobs.ts`, `shared/chuck-e-knobs.ts`.  
> Companion: `PIPELINE.md`, `COPY_CONTRACT.md`, `CHUCK_E.md`, `SOURCES_AND_LANDSCAPE.md`.  
> **Last updated:** 2026-08-07

---

## Purpose

This product is a **brand activation** for Converse press desks (“Chuck was there”) **and** a honest cultural time machine. Those goals must not conflict:

| Goal | Means |
|------|--------|
| Feel Converse-adjacent | Soft affinity + optional sourced universe ties |
| Stay interesting | Significance first; culture / fashion / sport / music colour |
| Stay honest | Hard history ships; Gemini never the public cite |
| Stay respectful | Landmark defining days are never soft-pedalled or brand-bridged |

---

## Ranking formula (schema)

`scoreInterestBreakdown(event)` ≈ **significance** + **tone** + **credibility** + **quality**

| Layer | Priority | Behaviour |
|-------|----------|-----------|
| **1. Significance** | Primary | Culture / UK-global / poignant stakes / category / **landmark defining** boost. Direct Converse / Chuck / All Star text lifts strongly. Soft “universe” themes (basketball, skate, punk/grunge, canvas youth culture, self-expression…) lift **lightly**. Competing footwear brands soft-demote (Nike only when the claim is about Converse). |
| **2. Tone** | Secondary lean only (~±3) | Among **similarly significant** candidates, prefer constructive / positive or neutral culture over routine tragedy. **Not** a veto. Do **not** erase difficult history to keep the experience “nice.” |
| **3. Credibility** | Supporting | Premium-press / museum / culture-press hosts already on the cite lift the card. |
| **4. Quality** | Supporting | Penalties for dumps, thin stubs, admin trivia. |

Knob `preferPositiveWhenTied` enables the tone term. Knob `preferBrandAffinity` enables brand + universe + competitor terms.

**Code weights:** `W` in `interest.ts`; universe weights in `CONVERSE_UNIVERSE_KNOBS`.

---

## Landmark defining days (non-negotiable)

**Definition:** events that define that calendar date in world memory — e.g. 11 September 2001, Pearl Harbor, Hiroshima, Armistice, moon landing (see `LANDMARK_DEFINING` / `isLandmarkDefiningEvent` in `interest.ts`).

| Rule | Runtime |
|------|---------|
| Always acknowledge; never soft-pedal for brand tone | Landmark skips the tone term; large significance boost |
| Landmark wins the spotlight over brand / campaign / universe anchors | Assemble: if any landmark is in the world pool, brand moments **do not compete** for spotlight |
| **No Converse bridge** beside landmarks | Chuck-E: do not append heritage, campaign, birthday, or “In the Converse universe…” next to a landmark — that reads as tasteless next to casualties / world memory |
| Hypothetical same-day brand activation (e.g. a Times Square campaign on 9/11) must **not** lead or share the spotlight | Significance + landmark gates above |

Brand activation tone on these days = **calm, clear, respectful**. Silence on Chuck is correct.

---

## Converse universe ties (optional — never forced)

Patterns + people anchors: `shared/converse-universe.ts`.

| Tie | When OK | When not |
|-----|---------|----------|
| Direct brand text already in the candidate | Prefer over weak adjacent stub | Never invent a Converse claim |
| Soft universe theme in candidate text | Light ranking lift | Never invent shoe facts from “basketball” alone |
| Calendar-day people anchor (e.g. Chuck Taylor born 24 June 1901) | Optional bridge after non-landmark world news; explain who he became for Converse with cites | Not on landmark days |
| Exact History / KB day (e.g. Nike close 4 Sep 2003) | May lead the reply when the ask is Converse-framed | Not if a landmark defines the day; do **not** append unrelated world “backdrop” beside it |
| Competing brand day (Adidas, Vans, standalone Nike sports) | Soft demote | Do not use as the Chuck hook |

**Chuck-E date replies:** use the same assemble pipeline as Lookup.

- **Already Converse-tied** (framed ask + History beat, or brand spotlight): answer that beat only — no forced world-news sidecar.
- **World-only day** (e.g. 1 April 1999 with no Converse claim): answer the world fact; optionally add **one light** sourced Converse bridge (same-day History / calendar-day people anchor) when it exists — never invent, never force.

---

## Tone vs brand activation

```
Significance  ──►  picks the day
Tone lean     ──►  breaks near-ties toward constructive / neutral culture
Brand / universe ──►  soft colour when honest — never overrides landmark or clearer significance
```

- Positive lean ≠ “only good news.”
- Negative / tragic history still ships when it is the significant story of the date.
- Voice: past tense, desk-ready, calm — not hype, not sugar-coating, not erasure.

---

## Chuck-E date path (schema)

```
parse date → assembleDateQuery (anyYear for calendar fan-out)
  → world spotlight vs brand moment
  → if landmark: world only; no Converse append
  → else if Converse-tied (framed ask / brand spotlight): brand answer only — no world backdrop
  → else if world lead + sourced same-day/calendar tie: optional light Converse bridge
  → cites / glosses
```

---

## Allowlist note

Culture / fashion / museum hosts for claim-relevant cites: `shared/source-registry.ts` + `SOURCES_AND_LANDSCAPE.md`. Reddit / forums blocked. Gemini / Perplexity never the public citation host.

---

## Decision log

| Date | Decision | Why |
|------|----------|-----|
| 2026-08-07 | Codify editorial schema (significance > tone; landmark no Chuck bridge; soft universe) | Agents need one place; brand activation must not undermine hard history |
| 2026-08-07 | Soft universe affinity + people anchors | Chuck-adjacent on-this-day without inventing claims |
| 2026-08-07 | No world backdrop on Converse-tied Chuck-E answers; light bridge only when world-only | Backdrop was noise on Swooshed-class asks; April-1-style dates may lightly re-anchor |
| 2026-08-06 | Prefer positive when tied; never soft-pedal landmarks | Good News, Chuck lean without ignoring 9/11-class dates |
