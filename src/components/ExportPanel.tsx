import type { DateQueryResult } from '../../shared/provenance'
import type { BrandConfig } from '../../shared/brand'

export function ExportPanel({
  result,
  brand,
}: {
  result: DateQueryResult | null
  brand: BrandConfig
}) {
  if (!result) return null

  const payload = {
    brand: brand.name,
    product: brand.productLine,
    claimFrame: brand.claimFrame,
    queryDate: result.queryDate,
    datePath: result.datePath,
    displayDate: result.displayDate,
    mode: result.resolvedMode,
    narrative: result.narrative,
    events: result.events.map((e) => ({
      ...e,
      citations: e.citations.map((c) => ({
        harvard: c.harvard,
        url: c.url,
        publisher: c.publisher,
        tier: c.tier,
        sourceQuality: c.sourceQuality,
        reference: c.reference,
      })),
    })),
    brandMoments: result.brandMoments,
    providersUsed: result.providersUsed,
    generatedAt: result.generatedAt,
    verificationNote: 'Human verification required before press distribution.',
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.exportFilenamePrefix}-${result.datePath.replace(/\//g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    const lines = [
      result.narrative.headline,
      result.displayDate,
      '',
      result.narrative.lede,
      '',
      ...result.events.map((e) => {
        const c = e.citations[0]
        return `• ${e.year} — ${e.title}\n  ${e.synopsis}\n  ${c?.harvard || `Source: ${c?.publisher} — ${c?.url}`}`
      }),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div className="export-panel">
      <button type="button" className="btn-text" onClick={copy}>
        Copy
      </button>
      <button type="button" className="btn-text" onClick={download}>
        Export
      </button>
    </div>
  )
}
