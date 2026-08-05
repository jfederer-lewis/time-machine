# Landscape, naming & source policy

> Companion to `VISION.md` and `PIPELINE.md`. Agents must follow the citation rules here.  
> **Canonical host lists:** `shared/source-registry.ts` (`CITATION_ALLOWLIST` / `CITATION_BLOCKLIST`).  
> Tables below summarise intent; if a host is missing from the registry, it is **not** allowlisted yet.  
> **Last updated:** 2026-08-05  
> **Visual note:** Existing “on this day” products are functional references only — **do not copy their UI.**

---

## Why sources matter

Allowlisted cites are required so that:

1. Every shipped claim is **corroborated for that date** (blocks LLM hallucination).
2. Users can **open the original** and read more.
3. Press export stays honest — **Gemini / Perplexity / aggregators are never the public citation host**.

Gemini **may discover** events via grounded search. Candidates only enter the Gemini discovery pool when an allowlisted Tier A/B URL backs the date. Day-index / Wikipedia discovery may still ship with a Wikipedia bridge cite (especially in Lite). See `PIPELINE.md`.

---

## Competitive / adjacent products (research)

| Site | URL pattern (naming) | Strengths | Gaps | Our use |
|------|----------------------|-----------|------|---------|
| **History.com This Day** | `/this-day-in-history/august-4` (month + day, **no year**) | Strong editorial day-of-year framing | Not searchable by full date/year | Discovery only — **entire host blocked** as citation |
| **BBC On This Day** | `/onthisday/hi/dates/stories/february/20/` (month/day) | Desk-quality storytelling | ~1950–2005 only; incomplete calendar | Discovery / tone — cite **BBC article** pages |
| **On This Day** | `/date/1999/april/1` (**year / month-name / day**) | Full date in URL; breadth | Aggregator; thin “#1 song” labels | Best **naming**; discovery only — **never cite**; drop chart labels |
| **You Didn’t Notice** | birthday → personal timeline | UX for “your date in world history” | Not a citable archive | Mechanic only — **blocked** |
| **NYT On This Day (Learning Blog)** | archived learning.blogs…/on-this-day/ | NYT-adjacent | Day-of-year | Prefer **NYT Archive / TimesMachine** |
| **NYT TimesMachine** | `timesmachine.nytimes.com` | Front pages of issues | Not a structured event API | Credible when linking a specific issue/article |
| **Birthday Recap** | birthday headlines | Why NYT API depth matters | Hobby tool | **Blocked** as citation |

### Preferred date naming for *our* product

Use ISO in APIs: `YYYY-MM-DD`.  
Display: `1 April 1999` (en-GB) via `toDisplayDate`.  
Path helper: `toOnThisDayPath` → `{year}/{month-name}/{day}`.

Year is required for press packs — do not ship month-day-only as the primary key.

### Cultural breadth

Prefer culturally resonant headlines. Facets in schema: world / culture / sport / science / music / design / fashion / brand / other.

Music = releases, tours, cultural moments — **not** aggregator “#1 on this date” labels (dropped at day-index ingest).

**Ranking bias:** when premium-press hosts are already logged on a candidate, lift them (`preferPremiumPress` → `interest.ts` `PREMIUM_PRESS`: NYT, TimesMachine, Guardian, Telegraph, Reuters, AP, BBC, FT, WaPo, Le Monde, Asahi, Hindu, plus discovery via nyt-archive / guardian / bbc-onthisday / chronicling-america).

---

## Pipeline (mandatory)

```
1. DISCOVER  →  Wiki + day-indexes (both modes); Gemini + Perplexity (full);
                NYT / Guardian / LoC / GDELT = stubs today
                    │
                    ▼
2. FILTER / RANK  →  drop chart labels & dumps; prefer culture + premium press
                    │
                    ▼
3. POLISH + VALIDATE  →  copy contract (title / synopsis / Context)
                    │
                    ▼
4. VERIFY / CITE  →  full mode: claim-relevant upgrade when needed
                    │
                    ▼
5. HUMAN     →  **not built yet** — editor review before press export is a next item
```

- Discovery hosts may appear in **internal metadata** (`discoveredVia`) for debugging.  
- Discovery hosts must **never** appear in the public citation line.  
- Public Source line = `citations[0]` after `sanitizeEventCitations`. Wikipedia bridge, Tier C, and `needs-human-review` **can still render** (UI does not hide them today).  
- If upgrade finds nothing better → keep bridge cite + `needsHumanReview` — prefer silence over a **fake** aggregator cite.  
- Cite relevance + research-guide reject run on the **upgrade** path (`upgrade-claim.ts`).

Full runtime map: `documentation/PIPELINE.md`.

---

## Never cite (blocklist)

Registered in `CITATION_BLOCKLIST` (discovery-only):

- youdidntnotice.com  
- bdayrecap.com  
- onthisday.com  
- history.com  

Also never: AI chat answers as bibliographic host, unsourced social, SEO farms; Gemini / Perplexity as the Source **host** (they may retrieve).

Wikipedia: allowlisted as **bridge** (`gloss-bridge`). Provisional public cite OK when best available summary — prefer upgrading in Full. Label quality honestly (`needs-human-review` often set).

---

## Credible cite allowlist (tiered)

**Source of truth:** `CITATION_ALLOWLIST` in `shared/source-registry.ts`.  
Hosts marked *aspirational* below are **not** registered yet — do not assume they pass `isCitationAllowed`.

### Tier A — institutional / official (registered)

| Source | Host(s) | Notes |
|--------|---------|-------|
| UK National Archives | nationalarchives.gov.uk | Prefer records about the claim — not generic help/copyright guides |
| US National Archives | archives.gov | |
| Library of Congress | loc.gov, chroniclingamerica.loc.gov | |
| UN / UNESCO | un.org, unesco.org | Prefer specific document URLs |
| EU | europa.eu | EUR-Lex not separately registered |
| BnF / Gallica | bnf.fr, gallica.bnf.fr | |
| Bundesarchiv | bundesarchiv.de | DNB not registered |
| National Diet Library | ndl.go.jp | |
| NLA / Trove | nla.gov.au, trove.nla.gov.au | |
| Official Charts / Billboard | officialcharts.com, billboard.com | Music — full cards only |
| Museums | si.edu, vam.ac.uk, moma.org | |

*Aspirational (not in registry):* EUR-Lex host, LAC-BAC / canada.ca, Deutsche Nationalbibliothek, RIAA, additional museum hosts.

### Tier B — papers / wires (registered)

| Source | Host(s) |
|--------|---------|
| NYT / TimesMachine | nytimes.com, timesmachine.nytimes.com |
| Guardian | theguardian.com |
| Telegraph | telegraph.co.uk |
| Reuters / AP / AFP | reuters.com, apnews.com, afp.com |
| BBC articles | bbc.co.uk, bbc.com |
| FT / WaPo / Le Monde | ft.com, washingtonpost.com, lemonde.fr |
| Asahi / Nikkei | asahi.com, nikkei.com |
| SCMP | scmp.com |
| The Hindu / Indian Express | thehindu.com, indianexpress.com |
| SMH | smh.com.au |

*Aspirational:* theage.com.au (not registered).

### Tier C / bridge (registered)

- britannica.com  
- converse.com / about.nike.com — **brand claims only**  
- wikipedia.org / en.wikipedia.org — bridge  

*Aspirational:* peer-reviewed DOI / university collections (no hosts registered).

### What `verify.ts` does

| Case | Behaviour |
|------|-----------|
| Blocklisted host | Drop cite |
| Allowlisted host | Keep; attach tier |
| Unknown host | Keep + `needs-human-review` (except `curated-fallback` quality) |
| Empty cites | Force `needsHumanReview` |

### Cite upgrade (full)

- Skip when lead is **Tier A/B** and publisher ≠ Wikipedia.  
- **Tier C** may ship without an upgrade attempt.  
- Relevance: `claimCiteRelevance` + `isGenericResearchGuide` patterns.

---

## Harvard-style citation (runtime)

`formatHarvardCitation` shape (**no Accessed date in the string**):

```
Author or Publisher (Year) 'Title', Publisher[, published display]. Available at: URL
```

Examples:

```
National Archives (1917) 'Declaration of war…', The National Archives. Available at: https://…

Associated Press (1969) 'Apollo 11…', AP News, 21 July 1969. Available at: https://…
```

`accessedAt` is stored for provenance but omitted from display (lookups are live).  
UI shows the full Harvard string + URL link — not a compact `open hostname →` CTA (that pattern exists on glosses only). Export packs are **not built** yet.

---

## Lessons for our API stack

1. **NYT Archive** is the deepest easily accessible US newspaper API — still a **stub** in this prototype.  
2. **Guardian** next-best open paper API — still a **stub**.  
3. **Perplexity** is live for date-search + cite upgrade when keyed; rolling lookback ≠ deep history.  
4. One western paper ≠ global product — need LoC / National Archives / wires / regional papers.

---

## Code hooks

| File | Role |
|------|------|
| `shared/source-registry.ts` | Allowlist / blocklist / tiers / Harvard formatter |
| `shared/provenance.ts` | `discoveredVia`, citation fields, facets |
| `worker/lib/verify.ts` | Drop blocklisted; flag unknown hosts |
| `worker/lib/upgrade-claim.ts` | Cite upgrade + claim relevance |
| `worker/lib/interest.ts` | Premium-press ranking boost |
| `documentation/PIPELINE.md` | Full assemble path |
| `documentation/VISION.md` | Product brief — keep in sync |

---

## Decision log (sources)

| Date | Decision |
|------|----------|
| 2026-08-04 | Two-pass discover → verify → Harvard cite |
| 2026-08-04 | Block hobby aggregators as citations forever |
| 2026-08-04 | Prefer On This Day-style full-date naming; ISO in API |
| 2026-08-04 | NYT + Guardian + archives/LOC as first verification targets (still stubs) |
| 2026-08-05 | Cultural facets yes; aggregator #1-song labels out of the pool |
| 2026-08-05 | Cite must be claim-relevant; prefer premium press when logged |
| 2026-08-05 | Gemini may retrieve when grounded + Tier A/B cite verifies the date |
| 2026-08-05 | Sources exist to verify date + let users read more — not to ban LLM discovery |
| 2026-08-05 | Registry is canonical; doc tables mark aspirational hosts explicitly |
| 2026-08-05 | Harvard display omits Accessed; Wikipedia bridge may render as Source in Lite |
