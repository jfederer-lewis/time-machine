# Day-card copy contract

> Single source of truth for what the lookup result must look like.
> Edit knobs in `shared/copy-knobs.ts`. Runtime validation: `worker/lib/copy-contract.ts`.
> Agents: keep Gemini prompts and validators aligned with the knobs.

**Last updated:** 2026-08-05

---

## Hard rules (non-negotiable)

| Rule | Notes |
|------|--------|
| Must read well | Every field is complete, sensible prose |
| Never cut mid-word or mid-sentence | No trailing `…` from truncation; no dangling “of / the / a” |
| Settled history | Past tense — “Chuck was there”, never breaking news |
| No invention | Day facts from sourced text; Context = established framing only |
| Same copy rules Lite + Full | Full adds cite upgrade only |

Length aims below are **recommendations**, not quotas. Prefer leaving a slightly long complete sentence over chopping it.

---

## Card fields

### 1. `title`

| | |
|--|--|
| Job | One tight line / sentence-synopsis of the **outcome** |
| Aim | ~**90** characters (soft) |
| Must | Who/what + action; complete thought; sentence case |
| Must not | Bare name; date-only; ALL CAPS; `?`; ellipsis; exact synopsis copy; chopped “Following…” lead-in |
| Near-duplicates | OK if wording differs and outcome is clear |

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
  recentLiveWireSkipDays: 548,
} as const
```

---

## Validation

- **Fail (hard):** empty fields, dumps, incomplete/cut titles, mid-sentence cuts, title-as-lead-in, Context restates synopsis, missing Context when required
- **Warn (soft):** title longer than one-line aim; synopsis outside 2–4 / above soft 5
