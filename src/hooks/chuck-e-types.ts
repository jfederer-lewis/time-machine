import type { Citation } from '../../shared/provenance'

export type ChuckEIntent = 'date' | 'product' | 'heritage' | 'general' | 'cliff_notes'

export interface ChuckEChatMessage {
  role: 'user' | 'assistant'
  content: string
  isDisclosure?: boolean
  citations?: Citation[]
  intent?: ChuckEIntent
}

export interface ChuckEChatResponse {
  sessionId: string
  message: ChuckEChatMessage
  intent: ChuckEIntent
}

export interface ChuckECliffNotes {
  title: string
  bullets: string[]
  citations: Citation[]
  aiBanner: string
  footer: string
  plainText: string
}
