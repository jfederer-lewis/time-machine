# Landscape, naming & source policy

> Companion to `VISION.md`. Agents must follow the citation rules here.  
> **Last updated:** 2026-08-04  
> **Visual note:** Existing “on this day” products are functional references only — **do not copy their UI.**

---

## Competitive / adjacent products (research)

| Site | URL pattern (naming) | Strengths | Gaps | Our use |
|------|----------------------|-----------|------|---------|
| **History.com This Day** | `/this-day-in-history/august-4` (month + day, **no year**) | Strong editorial day-of-year framing | Not searchable by full date/year | Discovery inspiration only — never cite as authority |
| **BBC On This Day** | `/onthisday/hi/dates/stories/february/20/` (month/day) | Desk-quality storytelling | ~1950–2005 only; incomplete calendar; year **or** date, not always both | Discovery / tone reference for mid-late 20th c. UK — cite BBC article pages if used as primary, not the index shell alone when thin |
| **On This Day** | `/date/1999/april/1` (**year / month-name / day**) | Full date in URL; breadth (events + culture e.g. #1 song) | Aggregator; not Harvard-grade by itself | **Best naming convention to learn from**; discovery + cultural facet ideas — **never the citation** |
| **You Didn’t Notice** | birthday → personal timeline | UX for “your date in world history”; large event corpus | Personal product; not a citable archive | Study **mechanic** only — **blocked as citation** |
| **NYT On This Day (Learning Blog)** | archived learning.blogs…/on-this-day/ | NYT-adjacent | Day-of-year; no year in the classic tool | Prefer **NYT Archive / Article Search / TimesMachine issue** for real cites |
| **NYT TimesMachine** | `timesmachine.nytimes.com/browser` | Front pages of issues | Often front-page display, not a structured event API | Credible **when linking a specific issue/article**; good visual archive, weak as structured retrieval |
| **Birthday Recap** | birthday headlines | Documents **why NYT API** (depth to ~1950s) vs Guardian (~1990s) | US-centric; hobby tool | **API strategy lesson** — **blocked as citation** |

### Preferred date naming for *our* product

Use ISO in APIs: `YYYY-MM-DD`.  
In human URLs / export titles, prefer On This Day’s clarity:

`{year}/{month-name}/{day}` → e.g. `1999/april/1`  
Display: `1 April 1999` (en-GB) or localised per market.

Do **not** ship month-day-only URLs as the primary key — year is required for press packs.

### Cultural breadth (from On This Day)

A press doorway should not be politics-only. Facets to support over time:

- world / national events  
- culture & arts  
- sport  
- science / tech  
- music & charts (#1 singles, album releases)  
- design / fashion (relevant to Converse)  
- brand moments (separate stack)

Each facet still needs a **credible citation** (e.g. Official Charts Company, Billboard archives, museum collection pages) — not the aggregator that listed the song.

---

## Two-pass pipeline (mandatory)

```
1. DISCOVER  →  calendar / “on this day” indexes, Wikipedia On This Day,
                GDELT clusters, hobby aggregators, internal seeds
                    │
                    ▼
2. VERIFY    →  find a citable primary or paper-of-record URL
                (archives, LOC, gov, museums, Reuters/AP/AFP, NYT, Guardian…)
                    │
                    ▼
3. CITE      →  Harvard-style bibliographic line + open original →
                    │
                    ▼
4. HUMAN     →  editor review before press export (esp. contested / estimate)
```

- Discovery hosts may appear in **internal metadata** (`discoveredVia`) for debugging.  
- Discovery hosts must **never** appear in the public citation line, export pack, or Harvard string.  
- If verification fails → keep the card as `needs-human-review` or `trusted-discovery-only` **without** promoting the aggregator to “source.” Prefer silence over a fake cite.

---

## Never cite (blocklist)

These may be used for **discovery / UX research only**:

- youdidntnotice.com  
- bdayrecap.com  
- onthisday.com  
- history.com/this-day-in-history *(index pages — prefer primary docs)*  
- Similar birthday / “what happened on my birthday” hobby sites  
- AI chat answers, unsourced social posts, SEO content farms  

Wikipedia: allowed as **bridge** (gloss + On This Day discovery) and as a **provisional** cite only when the article itself is the best available public summary — prefer upgrading to the footnote’s underlying primary (archive, paper, official body). Label quality honestly.

---

## Credible cite allowlist (tiered)

### Tier A — institutional / official (prefer)

| Source | Region | Notes |
|--------|--------|-------|
| nationalarchives.gov.uk | UK | Official records |
| archives.gov | US | NARA |
| loc.gov / Chronicling America | US | Library of Congress; historic papers |
| Europa / EUR-Lex / official EU institutions | EU | Official |
| un.org / unesco.org | Global | Treat carefully; prefer specific document URLs |
| National Diet Library (ndl.go.jp) | Japan | |
| Bibliothèque nationale de France (bnf.fr / Gallica) | France | |
| Deutsche Nationalbibliothek / Bundesarchiv | Germany | |
| National Library of Australia (nla.gov.au / Trove) | AU | |
| LAC-BAC (canada.ca library/archives) | CA | |
| Official Charts, RIAA, Billboard (primary chart pages) | UK/US | Music facets |
| Museum collection pages (V&A, MoMA, Smithsonian, etc.) | Global | Design/culture |

### Tier B — papers / wires of record

| Source | Region | Notes |
|--------|--------|-------|
| nytimes.com / NYT Archive API / TimesMachine **issue** | US | bdayrecap: strongest public newspaper API depth |
| theguardian.com / Open Platform | UK/intl | Strong from ~1999 via API |
| telegraph.co.uk | UK | |
| reuters.com | Global wire | |
| apnews.com / AP Media API | Global wire | Often licensed |
| afp.com / AFP API | Global wire | FR/multilingual |
| bbc.co.uk/news (article URLs) | UK/intl | Prefer article over On This Day index |
| ft.com | UK/global | |
| washingtonpost.com | US | |
| lemonde.fr | FR | |
| asahi.com / nikkei.com | JP | |
| scmp.com | HK/Asia | |
| thehindu.com / indianexpress.com | IN | |
| smh.com.au / theage.com.au | AU | |

### Tier C — acceptable with care

- Peer-reviewed journals / DOI links  
- University digital collections  
- Brand official history pages (Converse, Nike About) for **brand** claims only — still prefer independent corroboration for cultural claims  
- Encyclopaedia Britannica (better than random web; still secondary)

### Market localisation

Global launch ⇒ prefer a **local Tier A/B** source when the desk is local (e.g. Le Monde for FR, Asahi for JP, The Hindu for IN). Western bias in default APIs is known; mitigate with locale parameter + regional allowlist scoring (same idea as Bloom’s Source Wiki).

---

## Harvard-style citation (press export)

Target shape (author-date; adapt when no personal author):

```
Author Surname, Initial. (Year) 'Article or page title', Publisher or Site Name, Day Month Year [if known]. Available at: URL (Accessed: Day Month Year).
```

Examples:

```
National Archives (1917) 'Declaration of war…', The National Archives. Available at: https://… (Accessed: 4 August 2026).

Associated Press (1969) 'Apollo 11…', AP News, 21 July 1969. Available at: https://… (Accessed: 4 August 2026).
```

UI may show a compact line + `open hostname →`; **export packs must include the full Harvard string**.

---

## Lessons for our API stack

From **bdayrecap.com** (method, not branding):

1. **NYT Archive / Article Search** is the deepest easily accessible US newspaper API (~1950s+ for their use-case; Archive metadata claims back further).  
2. **Guardian** is the next-best open newspaper API but shallower historically (~1990s).  
3. One western paper ≠ global product — we need LoC / National Archives / wires / regional papers.

From **On This Day** naming + facets: full date in the path; include charts/culture, not only geopolitics.

From **BBC / History.com**: month-day indexes are great for serendipity, bad as a sole press key without year.

---

## Code hooks

| File | Role |
|------|------|
| `shared/source-registry.ts` | Allowlist / blocklist / tiers / Harvard formatter |
| `shared/provenance.ts` | `discoveredVia`, citation fields, facets |
| `worker/lib/verify.ts` | Guard: blocklisted hosts cannot become citations |
| `documentation/VISION.md` | Product brief — keep in sync |

---

## Decision log (sources)

| Date | Decision |
|------|----------|
| 2026-08-04 | Two-pass discover → verify → Harvard cite |
| 2026-08-04 | Block hobby aggregators as citations forever |
| 2026-08-04 | Prefer On This Day-style full-date naming; ISO in API |
| 2026-08-04 | Cultural facets (incl. charts) in scope, each with Tier A/B cite |
| 2026-08-04 | NYT + Guardian + archives/LOC as first verification targets |
