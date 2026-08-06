# Day-card copy contract

> Single source of truth for what the lookup result must look like.  
> Edit knobs in `shared/copy-knobs.ts`. Runtime validation: `worker/lib/copy-contract.ts`.  
> Pipeline / ship gates: `documentation/PIPELINE.md`.  
> Agents: keep Gemini prompts and validators aligned with the knobs.

**Last updated:** 2026-08-06

---

## Hard rules (non-negotiable)

| Rule | Enforced by |
|------|-------------|
| Must read well (complete prose) | `validateCopyContract` — empty / dumps / abrupt cuts / broken titles |
| Never cut mid-word or mid-sentence | `looksAbruptlyCut`: trailing `…` or `..+`, dangling “of / the / a”, mid-word `X-`. **A normal period is OK.** |
| Same copy rules Lite + Full | Shared validator; Full adds cite upgrade only |
| Ship gate | `validateCopyContract` must pass; failing candidates skipped (then curated fallback) |
| Context when required | `contextRequired: true` → hard fail `context.required` |

| Rule | Prompt / pipeline only (not a copy-contract code) |
|------|-----------------------------------------------------|
| Settled history / past tense | Gemini polish + product voice — **not** validated |
| No invention | Grounding + cite process — **not** validated |
| No aggregator chart labels | Dropped at day-index ingest / thin-stub filters |

Length aims below are **recommendations**, not quotas. Prefer leaving a slightly long complete sentence over chopping it.

---

## Card fields

### 1. `title`

| | |
|--|--|
| Job | One tight line / sentence-synopsis of the **outcome** |
| Aim | ~**90** characters (soft) |
| Must | Who/what + action; complete thought; sentence case (polish aims for this) |
| Must not | Bare name; date-only; ALL CAPS shout; `?`; ellipsis; exact synopsis copy; trivial rephrase of the same fact; chopped “Following…” lead-in |
| Differently worded | OK when synopsis is fuller prose — hard fail only for echo / trivial twin (`title.echoes_body`, `title.too_close`) |

### 2. `synopsis`

| | |
|--|--|
| Job | Day fact only |
| Optimal | ~**2–4** sentences |
| Soft ceiling | ~**5** sentences — prefer peeling further background into Context (`splitFactAndContext` may peel above soft max before validate) |
| Must not | Pad to hit a count; wire dumps; era essay (→ Context) |

### 3. `whyItMatters` → UI **Context / Provenance**

| | |
|--|--|
| Job | Background for a general reader (era, actors, stakes) |
| Aim | About a **paragraph**, or as much as needed — no word/char quota |
| Required? | `contextRequired: true` in knobs |
| UI | Label is currently **“Context / Provenance”**; smaller/paler than the day fact |
| Citation? | No |

### 4. Source

Harvard string (`formatHarvardCitation`) + allowlisted URL. **Accessed date is kept on the citation object but not shown in the Harvard line today.**

Rules:

- Cite must be **about the claim** (enforced on **cite upgrade**, not on every discovery path). Tier A alone is not enough — reject generic research guides.
- Prefer papers of record when logged: **NYT / TimesMachine, BBC, Guardian, Reuters, FT, Telegraph, AP** (+ hosts in `interest.ts` `PREMIUM_PRESS`).
- Music moments (when real cards, not labels): prefer Official Charts / Billboard week or article URLs.
- Gemini / Perplexity / aggregators are **never** the public Source **host**.
- Lite (and failed full upgrade) may still show **Wikipedia bridge** or `needs-human-review` cites on the Source line — quality labels are not rendered in the UI yet.

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
  preferUkGlobalInterest: true,
  preferPremiumPress: true,
  preferPositiveWhenTied: true,
  preferBrandAffinity: true,
  recentLiveWireSkipDays: 548,
} as const
```

Interest ranking (`worker/lib/interest.ts`) uses a weighted formula: **significance first** (culture / UK-global / landmark / Converse-affinity), then a **light positive/neutral tone lean**, plus credibility and quality. Landmark defining days (9/11-class) skip the tone term. Tone is a nudge, not a veto over clearly more significant hard news. Brand affinity lifts Converse / Chuck / All Star story beats, and Nike only when the claim is about Converse — standalone iconic Nike sports days do not get the boost.

### Operational polish notes (not knobs)

- Gemini polish uses `responseMimeType: application/json` and `maxOutputTokens: 3072`. Flash models spend a large share on hidden “thoughts”; budgets ~520 truncate JSON and blank the day.
- Schema hint: `polishedCopyJsonSchemaHint()` from knobs (`whyItMatters` required when `contextRequired`).
- On polish failure, assemble tries deterministic `fallbackDistinctCopy` (may reuse Wikipedia extract gloss as Context) before skipping the candidate.

---

## Validation

### Hard fail (`ok: false`) — issue codes

| Code | Meaning |
|------|---------|
| `title.empty` / `synopsis.empty` | Required fields |
| `title.date_only` / `title.bare_name` | Useless hed |
| `title.incomplete` | `?`, ellipsis, dangling, shouty caps, abrupt cut |
| `title.echoes_body` | Exact title===synopsis (normalized) |
| `title.too_close` | Trivial rephrase / chart-noise twin / high containment |
| `title.cut_from_body` | Chopped “Following…” lead-in |
| `synopsis.headline_dump` / `context.headline_dump` | Wire dump |
| `synopsis.abrupt_cut` / `context.abrupt_cut` | Truncation markers (not a normal `.`) |
| `context.required` | Missing when knob on |
| `context.restates_synopsis` | Context === day fact |

### Soft warn (still ships)

| Code | Meaning |
|------|---------|
| `title.soft_long` | Longer than ~90 |
| `synopsis.short` / `synopsis.above_optimal` / `synopsis.long` | Outside 2–4 / soft 5 |

Runtime: `worker/lib/copy-contract.ts` · after polish and again before ship in `worker/lib/assemble.ts`.
