/**
 * New Chuck launch knowledge pack — plug-and-play product facts for Chuck-E.
 *
 * TODO: replace placeholder fields with Converse-supplied launch material
 * (engineering specs, feature copy, story beats, novel nuggets).
 * Until then Chuck-E must say it does not have that detail yet rather than guess.
 *
 * Contested / period-estimate claims should set `precision: 'period-estimate'`
 * and `needsHumanReview: true` (same pattern as any still-contested heritage date).
 */

export type ProductFactPrecision = 'exact' | 'period-estimate' | 'unverified'

export interface ProductCitation {
  title: string
  url: string
  publisher: string
  publishedAt?: string
}

export interface ProductFact {
  id: string
  /** Short label journalists can scan (e.g. "Vulcanized rubber sole"). */
  label: string
  /** One or two sentences of desk-ready fact. */
  body: string
  precision: ProductFactPrecision
  needsHumanReview?: boolean
  citation?: ProductCitation
  /** Optional tags for intent matching (engineering, materials, story, etc.). */
  tags?: string[]
}

export interface ProductPack {
  id: string
  /** Internal / working name until Converse supplies the launch title. */
  name: string
  tagline: string
  /** One-line description of the launch for Chuck-E system context. */
  summary: string
  /** Engineering / construction facts. */
  engineering: ProductFact[]
  /** Key product features to highlight in Q&A. */
  features: ProductFact[]
  /** Narrative story beats for the launch (still cliff-notes shaped, not full copy). */
  storyBeats: ProductFact[]
  /** Heritage / novel nuggets (materials history, silhouette quirks, etc.). */
  novelNuggets: ProductFact[]
  /** True while Converse has not yet supplied real launch content. */
  isPlaceholder: boolean
}

/**
 * Placeholder pack — empty factual arrays on purpose.
 * Chuck-E must refuse to invent engineering/features until this is filled.
 */
export const newChuckPack: ProductPack = {
  id: 'new-chuck',
  name: 'New Chuck (launch TBD)',
  tagline: 'Launch pack pending Converse brief',
  summary:
    'Placeholder knowledge pack for the upcoming Chuck sneaker launch. Engineering, features, and story beats will be supplied by Converse — do not invent them.',
  // TODO: replace with Converse-supplied launch material
  engineering: [],
  // TODO: replace with Converse-supplied launch material
  features: [],
  // TODO: replace with Converse-supplied launch material
  storyBeats: [],
  // TODO: replace with Converse-supplied launch material
  novelNuggets: [],
  isPlaceholder: true,
}

export default newChuckPack

/** Flat list of every fact in the pack (for keyword search). */
export function allProductFacts(pack: ProductPack = newChuckPack): ProductFact[] {
  return [...pack.engineering, ...pack.features, ...pack.storyBeats, ...pack.novelNuggets]
}
