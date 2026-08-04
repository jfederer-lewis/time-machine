import { assembleDateQuery, listProviders, type Env } from './lib/assemble'
import { getBrand, listBrands } from '../shared/brands'
import { parseQueryDate } from '../shared/source-registry'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
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
      const brandId = url.searchParams.get('brand') || env.BRAND_ID || 'converse'
      const fallbackParam = url.searchParams.get('fallback')

      // Explicit query param wins; otherwise env USE_FALLBACK (default live when false)
      let forceFallback = env.USE_FALLBACK === 'true'
      if (fallbackParam === '0' || fallbackParam === 'false') forceFallback = false
      if (fallbackParam === '1' || fallbackParam === 'true') forceFallback = true

      const result = await assembleDateQuery(date, env, {
        brandId,
        forceFallback,
      })
      return json(result)
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
