import { useCallback, useState } from 'react'
import type {
  ChuckEChatMessage,
  ChuckEChatResponse,
  ChuckECliffNotes,
} from './chuck-e-types'

interface UseChuckEChatOpts {
  brandId: string
}

export function useChuckEChat({ brandId }: UseChuckEChatOpts) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChuckEChatMessage[]>([])
  const [loading, setLoading] = useState(false)
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
      const nextMessages = [...messages, userMessage]
      setMessages(nextMessages)
      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/chuck-e/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            brandId,
            messages: nextMessages,
          }),
        })
        if (!res.ok) throw new Error(`Chuck-E failed (${res.status})`)
        const data = (await res.json()) as ChuckEChatResponse
        setSessionId(data.sessionId)
        setMessages([...nextMessages, data.message])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Chuck-E failed')
      } finally {
        setLoading(false)
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
    // messages.length === 0 + open triggers openSession via effect
  }, [])

  return {
    sessionId,
    messages,
    loading,
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
