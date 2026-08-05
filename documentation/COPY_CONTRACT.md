# Day-card copy contract

> Single source of truth for what the lookup result must look like.  
> Edit knobs in `shared/copy-knobs.ts`. Runtime validation: `worker/lib/copy-contract.ts`.  
> Pipeline / ship gates: `documentation/PIPELINE.md`.  
> Agents: keep Gemini prompts and validators aligned with the knobs.

**Last updated:** 2026-08-05

---

## Hard rules (non-negotiable)

| Rule | Notes |
|------|--------|
| Must read well | Every field is complete, sensible prose |
| Never cut mid-word or mid-sentence | No trailing `…` from truncation; no dangling “of / the / a” |
| Settled history | Past tense — “Chuck was there”, never breaking news |
| No invention | Day facts from sourced / grounded text; Context = established framing only |
| Same copy rules Lite + Full | Full adds discovery breadth + cite upgrade — **not** looser prose |
| Ship gate | `validateCopyContract` must pass; failing candidates are skipped (then curated fallback) |
| No aggregator chart labels | Never ship “UK #1: Song” / “#1 song on this date: Song” as the card |

Length aims below are **recommendations**, not quotas. Prefer leaving a slightly long complete sentence over chopping it.

---

## Card fields

### 1. `title`

| | |
|--|--|
| Job | One tight line / sentence-synopsis of the **outcome** |
| Aim | ~**90** characters (soft) |
| Must | Who/what + action; complete thought; sentence case |
| Must not | Bare name; date-only; ALL CAPS; `?`; ellipsis; exact synopsis copy; trivial rephrase of the same fact; chopped “Following…” lead-in |
| Near-duplicates | OK if wording differs *and* synopsis is fuller prose than the title |

### 2. `synopsis`

| | |
|--|--|
| Job | Day fact only |
| Optimal | ~**2–4** sentences |
| Soft ceiling | ~**5** sentences — prefer peeling further background into Context |
| Must not | Pad to hit a count; wire dumps; era essay (→ Context) |

### 3. `whyItMatters` → UI **Context**

| | |
|--|--|
| Job | Background for a general reader (era, actors, stakes) |
| Aim | About a **paragraph**, or as much as needed — no word/char quota |
| Required? | `contextRequired: true` in knobs (toggle if you want omit-when-obvious) |
| UI | Smaller, paler, more indented — must not compete with the day fact |
| Citation? | No |

### 4. Source

Harvard + allowlisted URL; don’t double the year in the cite string.

Rules:

- Cite must be **about the claim**. Tier A alone is not enough — reject generic research guides (e.g. National Archives copyright / help-with-your-research pages).
- Prefer papers of record when logged: **NYT / TimesMachine, BBC, Guardian, Reuters, FT, Telegraph, AP**.
- Music moments (when real cards, not labels): prefer Official Charts / Billboard week or article URLs.
- Gemini / Perplexity / aggregators are **never** the public Source host.
- Purpose of the Source: verify the **date**, block hallucination, let users read more.

---

## Adjustable knobs

```ts
// shared/copy-knobs.ts
export const COPY_KNOBS = {
  titleAimChars: 90,
  synopsisOptimalMin: 2,
  synopsisOptimalMax: 4,
  synopsisSoftMax: 5,
  contextRequired: true,
  nearDuplicateTitleOk: true,
  preferUkGlobalInterest: true,
  preferPremiumPress: true,
  recentLiveWireSkipDays: 548,
} as const
```

Interest ranking (`worker/lib/interest.ts`) lifts culturally resonant UK/global news and candidates that already carry **NYT / BBC / Guardian / Reuters / FT** (etc.) cites above aggregator-only discovery.

---

## Validation

- **Fail (hard):** empty fields; dumps; incomplete/cut titles; mid-sentence cuts; title-as-lead-in; title too close to synopsis; Context restates synopsis; missing Context when required
- **Warn (soft):** title longer than one-line aim; synopsis outside 2–4 / above soft 5

Runtime: `worker/lib/copy-contract.ts` · called after polish and again before ship in `worker/lib/assemble.ts`.
