# Chuck-E — press research chatbot

> Living document. Agents: read this before changing Chuck-E persona, disclosure, cliff notes, or routing.  
> Companion docs: `VISION.md`, `PIPELINE.md`, **`EDITORIAL_SCHEMA.md`** (ranking / landmarks / universe), `COPY_CONTRACT.md`, `SOURCES_AND_LANDSCAPE.md`, **`CHUCK_ECOSYSTEM_KB.md`** (Chuck franchise product / strategy KB).  
> **Last updated:** 2026-08-07 (no forced backdrop; light Converse bridge only when needed)  

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

Chuck-E helps media **pull data** and, when asked, **extract editorial cliff notes**. It must **not** write a finished press story. Convenience for desks stops short of branded editorial that could be pasted into an article as-is.

### Chat voice vs cliff notes vs Lookup

| Surface | Shape |
|---------|--------|
| **Chuck-E chat** | Conversational: 1–2 short paragraphs and optional plain bullets — like a sharp ChatGPT reply. No `###` headings, no “Beat Summary / Pointers to Cite”, no jargon padding. Cites live in glosses / Sources, not in the body. |
| **Cliff notes export** | Separate action — bullets + Harvard + AI banner. |
| **Lookup day cards** | Curated title / synopsis / Context / Source — different product surface. |

Soft length aim for chat: ~900 chars (`chatReplySoftMaxChars`). Theme spreads may run a little longer; never hard-truncate mid-sentence.

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

## Opening hints & entry points

Chuck-E is a **heritage play**: UI prompts are **doors in** — short, curious, not spoilers. Answers should still go deep: named History dates, models, people, and (for date turns) cultural zeitgeist + why the day mattered for Converse.

Primary public source for brand beats: [Converse History](https://www.converse.com/uk/en/landing-converse-history) (`heritageKb`). Desks can ask Chuck-E to dig past the first hit; thematic questions should pull **several** citable moments, not a single origin story.

### UI (three clickable hints)

Shown after disclosure until the first user turn (`CHUCK_E_KNOBS.promptHints`):

| Door | Prompt (knobs) | Answer should still cover |
|------|----------------|---------------------------|
| Theme / sport | How did basketball shape the Converse story? | Court lineage **plus** iconic sports beats (see below) — not Non-Skid alone |
| Date entry point | What’s the cultural significance of 4 September 2003 within Converse? | Door stays light (no “Nike acquired…” spoiler). **Best date = close / “Swooshed”** (not the 9 Jul announce). Reply: that day’s Chuck-tied beat + Gemini-researched colour on how/why it mattered, optional zeitgeist backdrop — never the sibling announce date unless asked |
| Music / scenes | Where do music, youth culture, and collaborations show up in Converse’s history? | Punk/grunge wear, fashion collabs, One Hund(RED) / (PRODUCT) RED, CDG PLAY — not fashion fluff alone |

### Broad dates + Converse universe

**Canonical:** `documentation/EDITORIAL_SCHEMA.md`.

Chuck-E date turns use the **same assemble pipeline** as Lookup (Wikipedia / day-indexes; Full adds Gemini + Perplexity).

| Situation | Behaviour |
|-----------|-----------|
| Ask / answer already Converse-tied (e.g. 4 Sep 2003 / Swooshed) | Stay on that beat. **Do not** append unrelated world “cultural backdrop.” |
| Broad date with no Converse claim (e.g. 1 April 1999) | Answer the world fact. If a **sourced** same-day History beat or calendar-day people anchor exists, optionally add **one light** Converse bridge — never invent, never force. |
| Soft affinity in ranking only | Basketball, skate, punk/grunge, canvas / youth culture — light lift in Lookup ranking; **soft-demote** competing footwear brands (Nike only when about Converse). |

**Do not force either way.** No Chuck angle is fine when nothing honest exists; no world-news sidecar when the answer is already on Converse.

**Landmark defining days (non-negotiable):** 9/11-class dates, Pearl Harbor, Hiroshima, etc. must be acknowledged clearly. Never soft-pedal them for brand tone. **Never** attach a Converse campaign, heritage nugget, or “universe” bridge beside them — that reads as tasteless next to casualties / world memory. Brand moments do not compete for the spotlight on those days.

**Tone:** light positive/neutral lean among *similarly significant* events only. Do not erase difficult history. Brand activation voice = calm, desk-ready, respectful — not sugar-coating.

Patterns + anchors: `shared/converse-universe.ts`. Never invent a shoe claim from a theme word alone.

Composer placeholder stays short: new Chuck / heritage / a date.

### Iconic sports / performance beats (go deeper)

When the chat mentions sports, basketball, Olympics, NCAA, etc., prefer a **spread** of History-backed moments — e.g.:

| Year / day | Beat (History) |
|------------|----------------|
| 1917 / 1919 | Non-Skid → All Star basketball shoe |
| 1922 | Chuck Taylor joins |
| 1924 | Edmonton Grads sponsorship |
| 1936 | First U.S. Olympic men’s basketball team / white All Star colorway |
| 1939-03-27 | First NCAA title game — both teams in All Stars |
| 1982-03-29 | Jordan / UNC title in Pro Leather |
| **1984** | Official Olympic footwear; U.S. men’s & women’s gold — Michael Jordan & Lynette Woodward in **Pro Stars** |
| 1986 | Weapon + Bird–Magic “Choose Your Weapon” |
| 2021 | Weapon CX return; Draymond Green / Tokyo Olympic gold |

Spellings and model names follow Converse History (e.g. **Lynette Woodward**, Pro Stars). Enrich replies from the History LP first; optional secondary press only when claim-relevant and allowlisted.

### Music / collabs / humanitarian / global influence (go deeper)

When the chat mentions music, scenes, collabs, humanitarian / (PRODUCT) RED, film/TV, or cultural reach, prefer a **spread**:

| Year / day | Beat | Primary cite lane |
|------------|------|-------------------|
| 1970s / 1977 | Punk adoption (Sex Pistols, Ramones) | [Dazed — subcultural icon](https://www.dazeddigital.com/fashion/article/25679/1/converse-chuck-taylor-s) (30 Jul 2015) |
| ~1991 | Grunge / Cobain-era All Star | Dazed (same feature) |
| 2000 | First fashion collab — John Richmond | Converse History |
| **2008** | One Hund(RED) artists × cause | Converse History (+ Nike Magazine colour) |
| **2008-02-26** | John Varvatos + (PRODUCT) RED | [British Vogue — ALL STARS](https://www.vogue.co.uk/article/all-stars) |
| **2008-05** | Converse × Kurt Cobain | [Footwear News via Yahoo — iconic collabs](https://www.yahoo.com/lifestyle/converse-most-iconic-collaborations-maison-223606495.html) (Amina Ayoud, 12 Dec 2023) |
| 2009 | CDG PLAY | Converse History (+ FN / Tatler colour) |
| **2014-05-23** | Maison Margiela painted Chucks / Jack Purcell | Footwear News via Yahoo (same FN feature) |
| **2014-09** | The Simpsons pack | Footwear News via Yahoo |
| **2021-03-24** | Film & TV screen moments | [L’Officiel USA](https://www.lofficielusa.com/film-tv/converse-movie-moments-marie-antoinette) (Orquídea Alburquerque) |
| **2021-09-06** | Iconic closet staples list | [Tatler Asia](https://www.tatlerasia.com/style/fashion/sneaker-series-most-iconic-converse-shoes) |
| **2022-09-05** | Narrative history overview | [Urban Industry](https://www.urbanindustry.co.uk/blogs/news/a-brief-history-of-the-converse-chuck-taylor-all-star) (Tier C; defer to History on contested dates) |
| **2023-05-16** | Rick Owens DRKSHDW TURBODRK | Footwear News via Yahoo |
| — | Chuck Modern / II modernisation colour | [Esquire Middle East](https://www.esquireme.com/style/19681-the-iconic-converse-all-star-gets-a-modern-make-over) |
| — | Broader court → skate → music → fashion arc | [Nike Magazine — Journey of an Icon](https://about.nike.com/en/magazine/converse-chuck-taylor-all-star-iconic-sneaker-true-history) |
| — | Overview + footnotes / backlinks | [Wikipedia — Chuck Taylor All-Stars](https://en.wikipedia.org/wiki/Chuck_Taylor_All-Stars) (bridge; upgrade to underlying cites) |

**Citation display (Chuck-E chat):** gloss-first for in-text provenance. Under each assistant reply with cites, a **collapsed Sources (N)** control expands to compact publication/article links — not full Harvard. Popovers stay **simple**: term + one short readable sentence + quiet publisher link (e.g. Converse History). No stacked year / subtitle chrome. Body text is selectable. Full Harvard stays on **cliff notes** / Lookup day cards via `formatHarvardCitation`.

**Gloss roles (do not conflate):**

| Role | Anchors on | Popover is | Example |
|------|------------|------------|---------|
| Citation / provenance | Beat **title** only (exact) | One clear sentence → quiet source link | **Swooshed** → short close-day fact + Converse History |
| Entity (Wikipedia) | People, venues, iconic events, obscure brands/houses | Short Wikipedia summary — quiet help, not noise | **Chuck Taylor** · **Maison Margiela** (not Nike / Converse) |
| Publisher establishment | Less-familiar outlet names when they appear in prose | Who they are + homepage | **Footwear News** → US footwear trade title |

Skip household brands (Nike, Converse, …), countries, bare product words, and years — prefer silence over underlines people already understand. Obscure fashion / streetwear houses named in the reply may gloss. Cap entity glosses per reply so the text stays calm.

**Dated answers:** open in prose with the beat title and what happened — not “On 4 September 2003…”, a list of years, or a titled research memo.

Never reuse a citation gloss on an entity surname/token in the synopsis (that made “Simpsons” open the collab roundup cite).

**Secondary bookshelf** (allowlisted): Dazed, Vogue, Footwear News / Yahoo, Tatler Asia, Esquire ME, L’Officiel USA, Nike Magazine (`about.nike.com` Tier C), Urban Industry (Tier C). Wikipedia remains gloss-bridge. History LP remains the default brand anchor; never let retail blogs overwrite official signature / join years (1934 / 1922).

**Dated asks stay on that day:** UK/US calendar phrasing (e.g. **4 September 2003** / September 4, 2003) routes to date intent. Do not spray unrelated collab beats from month-name token matches (September → Simpsons). Theme spreads (sports / music / collabs) apply to theme questions, not single-day significance asks.

### Extended prompt space (not in UI — rotate later or “read more”)

| Lane | Example prompts |
|------|-----------------|
| People | When did Chuck Taylor join Converse? · How did Chuck Taylor become part of the All Star story? |
| Silhouette / origin | What’s the Non-Skid story? · How did the Chuck 70 come about? |
| Model vs model | What’s the difference between the Chuck 70 and the classic Chuck Taylor All Star? · How should I position Chuck Signature vs Chuck 70 Premium? *(ecosystem pack when wired)* |
| Collabs / cause | What collaborations or humanitarian campaigns has Converse been part of? · Talk me through Margiela, Rick Owens or The Simpsons collabs |
| Screen culture | Where have Chucks shown up in film and TV? |
| Culture shift | How did Converse move from the court into everyday style? |
| Other History dates | What’s the cultural significance of 15 February 2013 within Converse? · What about 14 August 1936? |
| Desk workflow | Ask any of the above → **Extract cliff notes** |

### What “interesting” answers lean on

- **Anchor in Converse History** (`heritageKb`): years, silhouette names (Non-Skid, All Star, Chuck 70, One Star, Jack Purcell, Pro Leather, Pro Stars, Weapon), people, named campaigns/collabs already in the pack.
- **Theme depth:** sports / music / collabs / cause → several beats across decades, not one paragraph of generalities.
- **Date / zeitgeist + culture press** can pull Lookup discovery / cite upgrade — prefer claim-relevant cites from premium press, museums, and culture titles when grounded search surfaces them (Guardian, NYT, BBC, **Vogue / Teen Vogue / global Vogues**, **Dazed**, **i-D**, System, Highsnobiety, Hypebeast, BoF, WWD, Tate / Met / MoMA / V&A, music press, etc.). Gemini still **never** appears as the public citation host. Registry is canonical (`shared/source-registry.ts`); Reddit and similar UGC stay blocked.
- Prefer answers that feel like **briefing colour** (scenes, turning points, named objects) over generic brand adjectives or corporate strategy speak.

### Synopsis (one paragraph)

Chuck-E is the press-desk companion beside Time Machine Lookup: ask about Converse heritage themes (basketball and wider sport, music/scenes, silhouettes), named models and History dates, collabs and cause campaigns, or the cultural significance of a Chuck-tied day — then pull sourced cliff notes. Opening hints are short entry points; replies dig into History LP facts and allowlisted culture press (Vogue, Dazed, Nike Magazine) for scenes and global influence.

---

## Architecture

```
ChuckEWidget (floating launcher)
    → GET  /api/chuck-e/chat          → disclosure opener
    → POST /api/chuck-e/chat          → intent route → reply
    → POST /api/chuck-e/cliff-notes   → marked bullet brief
    → (optional) Web Speech mic       → fills draft; pause ends listen; complete queries auto-send
```

### Intent routing (`worker/lib/chuck-e.ts`)

| Intent | Behaviour |
|--------|-----------|
| `date` | Parse date → `assembleDateQuery` → Converse-framed + History beat → Gemini **grounded enrich** on that day only (no world backdrop). World-only days → optional light Converse bridge if sourced |
| `product` | Match `shared/products/new-chuck.ts` facts; if placeholder/empty, refuse to invent |
| `heritage` | Match full History KB (`brand.heritageKb` via `heritageMoments`) + Converse History cites + citation glosses. Soft general fallback uses curated `timeline` beats. |
| `general` | `chatWithChuckE()` with persona guardrails; when reply/query hits timeline beats, attach History cites + glosses |
| cliff notes action | Separate endpoint; extracts bullets from the conversation + cites |

Gemini is **never** the public citation host. Historical world claims go through the Time Machine pipeline. Shoe facts come from the product pack only. Heritage beats cite **Converse History** (`landing-converse-history`). Chat and cliff-notes footers list each source URL **once** (same History LP across several beats is not repeated).

**Never ship mid-sentence chat cuts.** Chuck-E `chatMaxOutputTokens` is **4096** (Flash “thoughts” eat smaller budgets). Soft length aim is ~900 chars — concise and sharp; never hard-truncate. Report-shaped scaffolding (`###` headings, Pointers to Cite, etc.) is stripped before ship. Replies that still look abruptly cut are salvaged to the last complete sentence/line or replaced with a short retry cue — never left dangling (e.g. “…from our”).

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
| `src/hooks/useSpeechDictation.ts` | Optional Web Speech mic → composer (Chromium; no API key) |

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
| 2026-08-07 | Chuck-E chat budget → 4096 tokens (soft length later tightened to ~900) | Enough headroom vs 1024 cuts; soft aim is prompt-only |
| 2026-08-07 | Gloss popovers z-index above Chuck-E panel; hyphenated gloss tokens | Hover cites were painting behind the chat; Non-Skid-style terms never matched |
| 2026-08-07 | Optional voice dictation via browser Web Speech (Chrome/Edge); fill composer, do not auto-send | Fast mic path with no new API key; desks can edit before Send; Safari needs cloud STT later if required |
| 2026-08-07 | Opening hints: basketball / 4 Sep 2003 entry point / music–scenes; sports theme pulls multiple History beats (incl. 1984 Olympics Pro Stars) | Doors stay spoiler-light; answers dig into History LP + zeitgeist; KB 1984 enriched from landing page |
| 2026-08-07 | Culture bookshelf: Dazed + British Vogue + Nike Magazine; register Vogue/Dazed Tier B; enrich RED / Varvatos / punk–grunge in heritage KB | Collabs, humanitarian, scenes questions need claim-relevant culture cites beyond History LP alone |
| 2026-08-07 | Footwear News (Yahoo), Tatler Asia, L’Officiel USA, Urban Industry, Esquire ME on bookshelf; glosses carry title + date + publisher Harvard lines | High-fashion + pop collabs (Margiela, Rick Owens, Simpsons); film/TV; Wikipedia stays bridge |
| 2026-08-07 | Broad date asks → Time Machine assemble + Converse-universe tie when sourced (birthday / heritage / affinity) | Press can explore on-this-day colour and still land a Chuck-relevant bridge without inventing claims |
| 2026-08-07 | No Converse tie on landmark defining days; don’t force Chuck; significance > positive lean | Tasteless to pair brand with 9/11-class casualties; hard history still ships |
| 2026-08-07 | Documented in `EDITORIAL_SCHEMA.md` (canonical) | Agents + knobs stay aligned on brand activation vs hard history |
| 2026-08-07 | Voice: pause ends listen; auto-send when transcript looks like a full query | Hands-free desk flow; incomplete fragments stay in composer for edit |
| 2026-08-07 | Chuck-E taller panel toggle; settings text size; gloss-first cites + clean snippets | Desk reading comfort; Harvard stays on cliff notes / Lookup, not chat clutter |
| 2026-08-07 | Chat sources = collapsed expandable under bot replies (not always-on strip) | Inventory on demand; glosses remain the in-text cite |
| 2026-08-07 | Parse UK day-month-year (4 September 2003); dated heritage stays on that day | Opening hint was falling through to heritage + September→Simpsons noise |
| 2026-08-07 | Gloss roles: citation=title exact; entity=what-it-is; publisher=establishment | Citation gloss on “Simpsons” in synopsis was the wrong kind of hover |
| 2026-08-07 | Exact-day brand attach excludes same-year siblings; Converse date asks get Gemini grounded enrich | 4 Sep close was pulling 9 Jul announce; desks want researched colour on the queried day |
| 2026-08-07 | Gloss popovers: term + short body + quiet source; always selectable | Drop year/subtitle stack and loud “Read more”; desks need digestible copyable notes |
| 2026-08-07 | Date replies lead with beat title; years never gloss; Wikipedia entity glosses via API | Don’t open with the queried date or underline 2003; wiki-style entity links + source on the fact title |
| 2026-08-07 | Wikipedia glosses = people / venues / iconic events only; keep underlines sparse | Help understanding without visual noise for desks who already know |
| 2026-08-07 | Chuck-E chat = concise prose (+ optional bullets), not report briefs; soft ~900 chars; strip ### / Pointers to Cite | Chat ≠ Lookup day cards / cliff-notes export; desks want sharp digests without jargon or cite blocks in the body |
| 2026-08-07 | No world backdrop on Converse-tied date answers; light Converse bridge only for world-only days | Backdrop was forced noise; re-anchor only when the day has no Converse hook |

---

## Open questions

- Exact launch name / engineering / feature copy from Converse (fills `new-chuck.ts`).
- Which contested claims need period-estimate labelling.
- Whether cliff-notes export should later require human-review gate before download (aligned with Lookup export workflow).
- Which stable ecosystem facts (Signature / 70 Premium / tiers) to wire into a code pack vs keep markdown-only for agents.
- Confirm About Us URL path if Converse relocates the public page.
