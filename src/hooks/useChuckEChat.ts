import { useCallback, useState } from 'react'
import type {
  ChuckEChatMessage,
  ChuckEChatResponse,
  ChuckECliffNotes,
  ChuckEStreamEvent,
  ChuckEStreamStatus,
} from './chuck-e-types'

interface UseChuckEChatOpts {
  brandId: string
}

function parseSseChunk(buffer: string): { events: ChuckEStreamEvent[]; rest: string } {
  const events: ChuckEStreamEvent[] = []
  const parts = buffer.split('\n\n')
  const rest = parts.pop() ?? ''
  for (const part of parts) {
    for (const line of part.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload) continue
      try {
        events.push(JSON.parse(payload) as ChuckEStreamEvent)
      } catch {
        /* skip malformed */
      }
    }
  }
  return { events, rest }
}

export function useChuckEChat({ brandId }: UseChuckEChatOpts) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChuckEChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [streamStatus, setStreamStatus] = useState<ChuckEStreamStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cliffNotes, setCliffNotes] = useState<ChuckECliffNotes | null>(null)
  const [cliffLoading, setCliffLoading] = useState(false)

  const openSession = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/chuck-e/chat')
      if (!res.ok) throw new Error(`Could not open Chuck-E (${res.status})`)
      const data = (await res.json()) as ChuckEChatResponse
      setSessionId(data.sessionId)
      setMessages([data.message])
      setCliffNotes(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open Chuck-E')
    }
  }, [])

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || loading) return

      const userMessage: ChuckEChatMessage = { role: 'user', content }
      const placeholder: ChuckEChatMessage = {
        role: 'assistant',
        content: '',
        streaming: true,
      }
      const nextMessages = [...messages, userMessage]
      setMessages([...nextMessages, placeholder])
      setLoading(true)
      setStreamStatus('researching')
      setError(null)

      try {
        const res = await fetch('/api/chuck-e/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            brandId,
            messages: nextMessages,
            stream: true,
          }),
        })
        if (!res.ok) throw new Error(`Chuck-E failed (${res.status})`)
        if (!res.body) throw new Error('Chuck-E returned an empty stream')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let gotDone = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parsed = parseSseChunk(buffer)
          buffer = parsed.rest

          for (const event of parsed.events) {
            if (event.type === 'status') {
              setStreamStatus(event.status)
            } else if (event.type === 'delta') {
              setStreamStatus(null)
              setMessages((prev) => {
                const copy = [...prev]
                const last = copy[copy.length - 1]
                if (!last || last.role !== 'assistant') return prev
                copy[copy.length - 1] = {
                  ...last,
                  content: `${last.content}${event.text}`,
                  streaming: true,
                }
                return copy
              })
            } else if (event.type === 'done') {
              gotDone = true
              setSessionId(event.sessionId)
              setMessages([...nextMessages, { ...event.message, streaming: false }])
            } else if (event.type === 'error') {
              throw new Error(event.error || 'Chuck-E failed')
            }
          }
        }

        if (!gotDone) {
          throw new Error('Chuck-E stream ended early')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Chuck-E failed')
        // Drop empty streaming placeholder on failure
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant' && last.streaming && !last.content.trim()) {
            return prev.slice(0, -1)
          }
          if (last?.streaming) {
            return [...prev.slice(0, -1), { ...last, streaming: false }]
          }
          return prev
        })
      } finally {
        setLoading(false)
        setStreamStatus(null)
      }
    },
    [messages, loading, sessionId, brandId],
  )

  const extractCliffNotes = useCallback(async () => {
    setCliffLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/chuck-e/cliff-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          messages,
        }),
      })
      if (!res.ok) throw new Error(`Cliff notes failed (${res.status})`)
      const data = (await res.json()) as ChuckECliffNotes
      setCliffNotes(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cliff notes failed')
      return null
    } finally {
      setCliffLoading(false)
    }
  }, [brandId, messages])

  const reset = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setCliffNotes(null)
    setError(null)
    setStreamStatus(null)
    // messages.length === 0 + open triggers openSession via effect
  }, [])

  return {
    sessionId,
    messages,
    loading,
    streamStatus,
    error,
    cliffNotes,
    cliffLoading,
    openSession,
    send,
    extractCliffNotes,
    reset,
    clearCliffNotes: () => setCliffNotes(null),
  }
}
