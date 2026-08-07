/**
 * Browser speech-to-text for Chuck-E composer dictation.
 * Chromium Web Speech API — no API key. Hidden when unsupported.
 *
 * One utterance per listen: when speech pauses, recognition ends.
 * Callers may auto-send if `looksLikeCompleteQuery` passes.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((ev: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((ev: BrowserSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      length: number
      [index: number]: { transcript: string }
    }
  }
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function speechDictationSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null
}

function joinDraft(base: string, spoken: string): string {
  const b = base.trimEnd()
  const s = spoken.trim()
  if (!s) return base
  if (!b) return s
  return `${b} ${s}`
}

const QUESTION_STARTERS =
  /^(who|what|when|where|why|how|which|whose|whom|is|are|was|were|do|does|did|can|could|would|will|should|tell|explain|describe|give|show|list|compare|summarise|summarize|ask)\b/i

const TRAILING_FILLER = /\b(um|uh|erm|er|ah|like|and|or|the|a|an|to|of|for|with)$/i

/**
 * Heuristic: enough substance to treat as a finished desk query.
 * Incomplete fragments stay in the composer for edit / Send.
 */
export function looksLikeCompleteQuery(text: string): boolean {
  const t = text.trim()
  if (t.length < 12) return false

  const words = t.split(/\s+/).filter(Boolean)
  if (words.length < 3) return false

  if (/[?!.…]["')\]]*$/u.test(t)) return true
  if (QUESTION_STARTERS.test(t) && words.length >= 3) return true
  if (words.length >= 4 && !TRAILING_FILLER.test(t)) return true

  return false
}

export interface UseSpeechDictationOpts {
  /** Called with the composer text while listening (interim + final). */
  onTranscript: (text: string) => void
  /** Snapshot of the composer when listening starts (typed text to keep). */
  getBaseDraft: () => string
  /**
   * Fired when a listen session ends normally (speech pause or mic stop).
   * Not fired on abort (panel close / send / loading).
   */
  onUtteranceEnd?: (text: string) => void
  lang?: string
}

export function useSpeechDictation({
  onTranscript,
  getBaseDraft,
  onUtteranceEnd,
  lang = 'en-GB',
}: UseSpeechDictationOpts) {
  const [supported] = useState(speechDictationSupported)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const baseDraftRef = useRef('')
  const lastEmittedRef = useRef('')
  const abortingRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const getBaseDraftRef = useRef(getBaseDraft)
  const onUtteranceEndRef = useRef(onUtteranceEnd)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    getBaseDraftRef.current = getBaseDraft
  }, [getBaseDraft])

  useEffect(() => {
    onUtteranceEndRef.current = onUtteranceEnd
  }, [onUtteranceEnd])

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    abortingRef.current = false
    try {
      rec.stop()
    } catch {
      /* already stopped */
    }
  }, [])

  const abort = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    abortingRef.current = true
    try {
      rec.abort()
    } catch {
      /* already aborted */
    }
    recognitionRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) {
      setError('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }

    setError(null)
    abort()
    abortingRef.current = false

    const rec = new Ctor()
    // Single utterance: Chrome ends after a short pause when the user stops talking.
    rec.continuous = false
    rec.interimResults = true
    rec.lang = lang
    baseDraftRef.current = getBaseDraftRef.current()
    lastEmittedRef.current = baseDraftRef.current
    recognitionRef.current = rec

    rec.onresult = (ev) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = 0; i < ev.results.length; i++) {
        const result = ev.results[i]
        const piece = result[0]?.transcript ?? ''
        if (result.isFinal) finalChunk += piece
        else interimChunk += piece
      }
      const spoken = `${finalChunk}${interimChunk}`
      const next = joinDraft(baseDraftRef.current, spoken)
      lastEmittedRef.current = next
      onTranscriptRef.current(next)
    }

    rec.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') {
        setListening(false)
        return
      }
      if (ev.error === 'not-allowed') {
        setError('Microphone permission denied. Allow mic access to dictate.')
      } else {
        setError('Could not hear that — try again, or type instead.')
      }
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      if (recognitionRef.current === rec) {
        recognitionRef.current = null
      }
      if (abortingRef.current) return
      const text = lastEmittedRef.current.trim()
      if (text) onUtteranceEndRef.current?.(text)
    }

    try {
      rec.start()
      setListening(true)
    } catch {
      setError('Could not start voice input. Try again.')
      setListening(false)
      recognitionRef.current = null
    }
  }, [abort, lang])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => () => abort(), [abort])

  return {
    supported,
    listening,
    error,
    clearError: () => setError(null),
    toggle,
    stop,
    abort,
  }
}
