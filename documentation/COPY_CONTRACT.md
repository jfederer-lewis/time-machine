# Day-card copy contract

> Single source of truth for what the lookup result must look like.
> Edit the **Adjustable knobs** in `shared/copy-knobs.ts` (mirrored below).
> Runtime validation: `worker/lib/copy-contract.ts`.
> Agents: keep Gemini prompts and validators aligned with the knobs.

**Last updated:** 2026-08-05

---

## Product voice (non-negotiable)

| Rule | Notes |
|------|--------|
| Settled history | Reader experiences “Chuck was there” — **past tense**, never breaking news |
| No invention | Day facts only from sourced text; Context may use widely established framing, never contested day-specific invention or fake quotes |
| Same copy rules for Lite + Full | Unless a knob says otherwise. Full adds cite upgrade / verification; Lite stays Wikipedia discovery + Gemini phrasing |
| Prefer poignant global / UK-relevant news | Deprioritise dull admin geography (e.g. remote territorial reorganisations) |
| Recent / future dates | Prefer historical “on this day” (Wikipedia) over live wire scrapes |

---

## Card fields

Each result has three copy fields with **different jobs**. Do not dump everything into synopsis.

### 1. `title` (headline)

| Guideline | Current setting |
|-----------|-----------------|
| Job | State the **outcome** of the day (who/what + action) |
| Style | Sentence case; calm BBC/Guardian hed |
| Length | Soft aim under **80** characters; hard reject above **120** |
| Must | Complete thought; readable prose |
| Must not | Bare place/person name alone (“Nunavut”) |
| Must not | Date-only (“1 April 1999”) |
| Must not | ALL CAPS / magazine teaser / ellipsis / trailing “?” |
| Must not | Exact copy of synopsis (or first sentence with period stripped) |
| Must not | Chopped lead-in from synopsis (“Following the non-cooperation…”) |
| Near-duplicates of body | **Allowed** if wording differs and title states the outcome |
| Good | “Sheikh Hasina resigns and flees Bangladesh” |
| Bad | “Following the non-cooperation movement against the government of Bangladesh” |
| Bad | “ONE YEAR AFTER CHERNOBYL, A TENSE TALE OF …” |
| Bad | “Is Gianni Infantino's future in FIFA at risk?” |

### 2. `synopsis` (main day fact)

| Guideline | Current setting |
|-----------|-----------------|
| Job | **Only** what happened that day |
| Length | Guideline **1–4 complete sentences** — as much as the source supports |
| Pad / force length | **Never** pad to hit a count; never hard-cut mid-thought for a character quota |
| Runaway guard | Soft cap ~**1200** chars / **4** sentences (safety only) |
| Must not | Era essay / stakes / “why it matters” (that belongs in Context) |
| Must not | Wire roundups / multi-headline dumps |
| Must not | Invent details not in the source |
| Voice | Past tense |

### 3. `whyItMatters` → UI label **Context**

| Guideline | Current setting |
|-----------|-----------------|
| Job | Background for a general reader: era, actors, how long it had been going, why the day had weight |
| Length | Guideline **1–2 short sentences** (soft) |
| Required? | **Open question — see knobs.** Prompt currently asks for it always; product may prefer omit when self-explanatory |
| Presentation | Indented, smaller, muted — must not compete with the day fact |
| Must not | Restate the synopsis; invent contested day-specifics or quotations |
| Citation? | **No** — Context is framing, not the public cite |

### 4. Source line

| Guideline | Current setting |
|-----------|-----------------|
| Job | Harvard-style citation + open URL |
| Hosts | Allowlisted Tier A/B (or careful C); never aggregators as public cite |
| Dates in Harvard | Do not repeat year-only twice (`(1999) …, 1999`) |

---

## UI chrome

| Element | Current setting |
|---------|-----------------|
| Mode chip | Show **only** for Lite (`Lite · Wikipedia`). Hide for Full |
| Year under date | Omit when event year matches query; show `Also on this day · YYYY` on mismatch |
| Glosses | Optional dotted terms on synopsis — discovery aid, not proof |

---

## Adjustable knobs (edit these)

Change values in `shared/copy-knobs.ts` (source of truth), then refresh this table if you change meaning.

```ts
// shared/copy-knobs.ts
export const COPY_KNOBS = {
  titleSoftMaxChars: 80,
  titleHardMaxChars: 120,
  synopsisSentenceGuideMin: 1,
  synopsisSentenceGuideMax: 4,
  synopsisRunawayMaxChars: 1200,
  contextSentenceGuideMax: 2,
  contextRunawayMaxChars: 500,
  contextRequired: true, // ← set false to allow omit when self-explanatory
  nearDuplicateTitleOk: true,
  preferUkGlobalInterest: true,
  recentLiveWireSkipDays: 548, // ~18 months
} as const
```

---

## Validation pipeline

```
source text
  → polish (Gemini JSON: title / synopsis / whyItMatters)
  → normalize (sentence case, strip chrome)
  → validateCopyContract()  ← worker/lib/copy-contract.ts
  → accept | repair title from synopsis | reject polish (fallback)
  → UI: title + synopsis + Context + Source
```

If validation fails after repair, fall back to cleaned Wikipedia prose rather than shipping a broken card.
