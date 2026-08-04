import { assembleDateQuery, listProviders, type Env } from './lib/assemble'
import { getBrand, listBrands } from '../shared/brands'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function parseDate(value: string | null): string | null {
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return value
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
      return json({ ok: true, service: 'time-machine', brand: env.BRAND_ID || 'converse' })
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
      const date = parseDate(url.searchParams.get('date'))
      if (!date) {
        return json({ error: 'Provide ?date=YYYY-MM-DD' }, 400)
      }
      const brandId = url.searchParams.get('brand') || env.BRAND_ID || 'converse'
      const forceFallback =
        url.searchParams.get('fallback') === '1' ||
        url.searchParams.get('fallback') === 'true' ||
        env.USE_FALLBACK === 'true'

      // Live Wikipedia path: ?fallback=0 overrides env default
      const live = url.searchParams.get('fallback') === '0'
      const result = await assembleDateQuery(date, env, {
        brandId,
        forceFallback: live ? false : forceFallback,
      })
      return json(result)
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
