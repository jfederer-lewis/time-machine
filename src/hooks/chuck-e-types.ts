import type { Citation, Gloss } from '../../shared/provenance'

export type ChuckEIntent = 'date' | 'product' | 'heritage' | 'general' | 'cliff_notes'

export type ChuckEStreamStatus = 'researching' | 'writing'

export interface ChuckEChatMessage {
  role: 'user' | 'assistant'
  content: string
  isDisclosure?: boolean
  citations?: Citation[]
  /** Dotted source glosses — hover for original cite / Converse History. */
  glosses?: Gloss[]
  intent?: ChuckEIntent
  /** True while tokens are still arriving over SSE. */
  streaming?: boolean
}

export interface ChuckEChatResponse {
  sessionId: string
  message: ChuckEChatMessage
  intent: ChuckEIntent
}

export type ChuckEStreamEvent =
  | { type: 'status'; status: ChuckEStreamStatus }
  | { type: 'delta'; text: string }
  | { type: 'done'; sessionId: string; intent: ChuckEIntent; message: ChuckEChatMessage }
  | { type: 'error'; error: string }

export interface ChuckECliffNotesBullet {
  text: string
  /** 1-based footnote indices into `citations` (same message–scoped pairing). */
  noteIds: number[]
}

export interface ChuckECliffNotes {
  title: string
  bullets: ChuckECliffNotesBullet[]
  /** Ordered footnote list — index 0 is note [1]. */
  citations: Citation[]
  aiBanner: string
  footer: string
  plainText: string
}
