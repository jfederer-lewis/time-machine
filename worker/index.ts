import { assembleDateQuery, listProviders, type Env } from './lib/assemble'
import {
  handleChuckEChat,
  handleChuckECliffNotes,
  openingPayload,
  type ChuckEChatRequest,
  type ChuckECliffNotesRequest,
  type ChuckEStreamEvent,
} from './lib/chuck-e'
import { getBrand, listBrands } from '../shared/brands'
import { calendarDateUtc, isFutureQueryDate } from '../shared/date-bounds'
import { parseQueryDate } from '../shared/source-registry'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

/** Chuck-E chat as SSE: status → delta* → done (or error). */
function streamChuckEChat(body: ChuckEChatRequest, env: Env): Response {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChuckEStreamEvent) => {
        if (closed) return
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        const result = await handleChuckEChat(body, env, {
          status: (status) => send({ type: 'status', status }),
          delta: (text) => send({ type: 'delta', text }),
        })
        send({
          type: 'done',
          sessionId: result.sessionId,
          intent: result.intent,
          message: result.message,
        })
      } catch (err) {
        console.error('[chuck-e] stream failed', err)
        send({
          type: 'error',
          error: err instanceof Error ? err.message : 'Chuck-E failed',
        })
      } finally {
        closed = true
        controller.close()
      }
    },
  })

  return sseResponse(stream)
}

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        service: 'time-machine',
        brand: env.BRAND_ID || 'converse',
        useFallback: env.USE_FALLBACK === 'true',
        hasGemini: Boolean(env.GEMINI_API_KEY),
        hasPerplexity: Boolean(env.PERPLEXITY_API_KEY),
      })
    }

    if (url.pathname === '/api/brand') {
      const id = url.searchParams.get('id') || env.BRAND_ID || 'converse'
      return json(getBrand(id))
    }

    if (url.pathname === '/api/brands') {
      return json(listBrands().map((b) => ({ id: b.id, name: b.name, tagline: b.tagline })))
    }

    if (url.pathname === '/api/providers') {
      return json(listProviders(env))
    }

    if (url.pathname === '/api/query') {
      const date = parseQueryDate(url.searchParams.get('date'))
      if (!date) {
        return json({ error: 'Provide ?date=YYYY, YYYY-MM, or YYYY-MM-DD' }, 400)
      }
      if (isFutureQueryDate(date, calendarDateUtc())) {
        return json({ error: 'That day hasn’t happened yet.' }, 400)
      }
      const brandId = url.searchParams.get('brand') || env.BRAND_ID || 'converse'
      const fallbackParam = url.searchParams.get('fallback')
      const anyYear = url.searchParams.get('anyYear') === 'true'

      // Explicit query param wins; otherwise env USE_FALLBACK (default live when false)
      let forceFallback = env.USE_FALLBACK === 'true'
      if (fallbackParam === '0' || fallbackParam === 'false') forceFallback = false
      if (fallbackParam === '1' || fallbackParam === 'true') forceFallback = true

      const result = await assembleDateQuery(date, env, {
        brandId,
        forceFallback,
        anyYear,
      })
      return json(result)
    }

    // Chuck-E — GET opens a session with Art. 50 disclosure; POST continues the chat
    if (url.pathname === '/api/chuck-e/chat') {
      if (request.method === 'GET') {
        return json(openingPayload(url.searchParams.get('sessionId') || undefined))
      }
      if (request.method !== 'POST') {
        return json({ error: 'Use GET to open or POST to chat' }, 405)
      }
      const body = await readJsonBody<ChuckEChatRequest>(request)
      if (!body) return json({ error: 'Invalid JSON body' }, 400)
      if (body.stream) return streamChuckEChat(body, env)
      const result = await handleChuckEChat(body, env)
      return json(result)
    }

    if (url.pathname === '/api/chuck-e/cliff-notes') {
      if (request.method !== 'POST') {
        return json({ error: 'POST required' }, 405)
      }
      const body = await readJsonBody<ChuckECliffNotesRequest>(request)
      if (!body) return json({ error: 'Invalid JSON body' }, 400)
      return json(handleChuckECliffNotes(body))
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
