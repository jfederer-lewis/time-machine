/**
 * Browser speech-to-text for Chuck-E composer dictation.
 * Chromium Web Speech API — no API key. Hidden when unsupported.
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

export interface UseSpeechDictationOpts {
  /** Called with the composer text while listening (interim + final). */
  onTranscript: (text: string) => void
  /** Snapshot of the composer when listening starts (typed text to keep). */
  getBaseDraft: () => string
  lang?: string
}

export function useSpeechDictation({
  onTranscript,
  getBaseDraft,
  lang = 'en-GB',
}: UseSpeechDictationOpts) {
  const [supported] = useState(speechDictationSupported)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const baseDraftRef = useRef('')
  const onTranscriptRef = useRef(onTranscript)
  const getBaseDraftRef = useRef(getBaseDraft)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    getBaseDraftRef.current = getBaseDraft
  }, [getBaseDraft])

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {
      /* already stopped */
    }
  }, [])

  const abort = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
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

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    baseDraftRef.current = getBaseDraftRef.current()
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
      onTranscriptRef.current(joinDraft(baseDraftRef.current, spoken))
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
