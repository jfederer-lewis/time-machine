# Making it feel more Converse — idea scratchpad

> **Not a ship brief.** Exploratory ideas only — do not treat as product requirements or agent non-negotiables.  
> Promote anything that graduates into `VISION.md` / pipeline / knobs with a decision-log entry.  
> **Last updated:** 2026-08-06 (news-source + wear layer)

---

## Why this doc exists

The core mechanic is already brand-framed (“Chuck was there”), but Lookup can still read like a generic on-this-day tool with a Converse skin. This file collects ways to deepen **Converse presence** without cloning converse.com History or inventing heritage claims.

Already shipped (for orientation — see `VISION.md`):

- Curated Timeline vs full History `heritageKb` for Chuck-E
- Brand-affinity ranking (Converse / Chuck-tied news; Nike only when about Converse)
- Exact-day / month heritage beats can win the day card

---

## Idea seeds

### 1. “What Chuck was out then” — silhouette / colourway era chip

For any Lookup date, show a quiet secondary beat: **which Converse product line was current / culturally dominant in that era** (e.g. Non-Skid era, high-top All Star, low-top boom, Weapon, Chuck 70).

- Not “the shoe of the day” unless we have an exact launch day.
- Precision: year / period-estimate with a Converse History (or archive) cite.
- UI: small era chip under the day card — never louder than the cultural spotlight.
- Risk: vague eras feel marketing-y; keep sourced and past tense.

### 2. “What were they wearing?” — figure × date × Converse (+ news Source)

When the queried date **is** the cultural event (e.g. Obama inauguration day), the day card already ships the world fact with its **Harvard Source** (NYT / BBC / etc.). Optionally add a quiet secondary layer: **attested Converse worn around that moment** — campaign-trail Chucks, skate icons, athletes in Pro Leather / Weapon.

Example framing (illustrative only): user looks up inauguration day → spotlight = inauguration (linked Source) → side beat = *what Converse was he sporting around then?* with its own photo/press cite.

- Two cites, two jobs: **news Source** corroborates the day; **wear cite** corroborates the shoe — never collapse them into one vague claim.
- Wear layer only when attested; if we only have “Obama era Chucks” lore without a dated photo/press piece, stay silent or stick to the era-silhouette chip (§1).
- Could live as Chuck-E follow-up (“any Converse on this figure?”) before Lookup UI.
- Risk: celebrity-association claims are legally / reputationally sensitive; human review before export.

### 3. Floor the dial at Converse founding (1908)

Treat the tool as a **capsule of the Converse era** — selectable range starts at founding / first shoe, not antiquity.

- Sharpens “Chuck’s world”; may dull open time-machine play.
- Already an open question in `VISION.md`.

### 4. Featured Chuck doorways on Lookup

Re-enable curated date chips (brand pack already has `featuredDates`) so desks jump to known Converse + culture overlaps (1917, 1922, 1934, Jordan final, Nike close, Chuck 70…).

### 5. Dual spotlight: world day + brand doorway

When both a cultural hit and a same-date heritage KB beat exist, show **world card primary + Converse side-note** (or toggle), instead of only one winning.

- Reinforces “we were there” without forcing brand over 9/11-class landmarks.

### 6. Colourway / canvas as atmosphere (not product PDP)

Subtle visual cue tied to era — e.g. paper field / accent that nods to classic black/white All Star, Olympic pinstripe, or era-appropriate canvas — without turning Lookup into a shop.

- Keep Swiss / press-desk calm; one accent still Converse red unless client wants era palettes.

### 7. Local market “Chuck was there too”

Same calendar day, localised cultural hit **plus** local Converse / youth-culture presence when attested (scene, retailer moment, athlete) — localisation pitch from the brief.

### 8. Chuck-E “era companion” prompts

After a day card, suggest desk-shaped follow-ups:

- *What Converse silhouette was current in [year]?*
- *Any attested Converse on this figure?*
- *Cliff notes linking this day to the All Star story*

Answers only from `heritageKb` / product pack / sourced pipeline — never invented wear claims.

### 9. Press pack “presence strip”

Export / cliff notes include a one-line **brand presence** field when available: era silhouette + cite, or “no attested Converse tie for this figure/date.”

### 10. Seed more culture × Chuck exact days

Curated packs where the world event and the shoe story already intertwine (1936 Olympics gold + All Star colourway; 1939 NCAA; 1982 Jordan Pro Leather; CDG PLAY debut month; etc.) so affinity ranking has real candidates to lift.

---

## Watch-outs (for any idea that graduates)

1. No invented wear / association claims — photo or press cite or silence.
2. Gemini never the public citation for shoe or celebrity-wear facts.
3. Don’t soft-pedal landmark defining days to force a Chuck angle.
4. Don’t clone the Converse History LP as the product UI (curated Timeline + KB split stays).
5. Celebrity / athlete association → prefer human review before anything leaves the app.

---

## Parking lot / half-formed

- “Soundtrack of the Chuck era” — only with proper Official Charts / Billboard **article** cites, never aggregator #1 labels.
- AR / try-on of era Chuck — almost certainly out of scope for a press desk tool.
- User uploads a date + photo “was this a Chuck?” — fun, high moderation cost.

---

## How to add ideas

Append a numbered seed (or parking-lot line), keep it one paragraph + risks, bump **Last updated**. When an idea is chosen for build, move the decision into `VISION.md` and implement against pipeline / copy-contract rules.
