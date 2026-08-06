import { newChuckPack, type ProductPack } from './new-chuck'

const PACKS: Record<string, ProductPack> = {
  [newChuckPack.id]: newChuckPack,
}

export function getProductPack(id = 'new-chuck'): ProductPack {
  return PACKS[id] ?? newChuckPack
}

export { newChuckPack }
export type { ProductPack, ProductFact, ProductCitation, ProductFactPrecision } from './new-chuck'
export { allProductFacts } from './new-chuck'
