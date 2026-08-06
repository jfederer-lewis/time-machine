/**
 * Adjustable day-card copy knobs.
 * Human doc: documentation/COPY_CONTRACT.md
 * Validators: worker/lib/copy-contract.ts
 *
 * Length figures are aims / recommendations unless noted as HARD.
 */

export const COPY_KNOBS = {
  /** Title: aim for one tight line / sentence-synopsis. */
  titleAimChars: 90,
  /**
   * Synopsis: optimal ~2–4 sentences; soft ceiling before we prefer peeling
   * overflow into Context. Not a hard reject.
   */
  synopsisOptimalMin: 2,
  synopsisOptimalMax: 4,
  synopsisSoftMax: 5,
  /**
   * Context: aim for about a paragraph, or as much as needed.
   * No word/character quota — readability wins.
   */
  contextRequired: true,
  preferUkGlobalInterest: true,
  /**
   * When NYT / BBC / Guardian (etc.) cites are already logged on a candidate,
   * interest ranking lifts them above aggregator day-indexes.
   */
  preferPremiumPress: true,
  /**
   * Apply a light positive / neutral tone lean inside the interest formula.
   * Significance still dominates; landmark defining days skip the tone term.
   */
  preferPositiveWhenTied: true,
  /** Skip live wire date-search for dates newer than this many days (and future). */
  recentLiveWireSkipDays: 548,
} as const

export type CopyKnobs = typeof COPY_KNOBS
