import type { BrandConfig } from '../brand'
import { converseBrand } from './converse'

const registry: Record<string, BrandConfig> = {
  converse: converseBrand,
}

export function getBrand(id: string = 'converse'): BrandConfig {
  return registry[id] ?? converseBrand
}

export function listBrands(): BrandConfig[] {
  return Object.values(registry)
}

export { converseBrand }
