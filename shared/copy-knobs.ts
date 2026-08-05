/**
 * Adjustable day-card copy knobs.
 * Human doc: documentation/COPY_CONTRACT.md
 * Validators: worker/lib/copy-contract.ts
 */

export const COPY_KNOBS = {
  titleSoftMaxChars: 80,
  titleHardMaxChars: 120,
  synopsisSentenceGuideMin: 1,
  synopsisSentenceGuideMax: 4,
  synopsisRunawayMaxChars: 1200,
  contextSentenceGuideMax: 2,
  contextRunawayMaxChars: 500,
  /**
   * When true, polished cards should include Context.
   * Set false to allow omit when the day fact is self-explanatory.
   */
  contextRequired: true,
  /** Exact title===synopsis still rejected; near-duplicates OK when true. */
  nearDuplicateTitleOk: true,
  preferUkGlobalInterest: true,
  /** Skip live wire date-search for dates newer than this many days (and future). */
  recentLiveWireSkipDays: 548,
} as const

export type CopyKnobs = typeof COPY_KNOBS
