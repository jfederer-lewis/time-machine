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
    mode: result.resolvedMode,
    narrative: result.narrative,
    events: result.events,
    brandMoments: result.brandMoments,
    providersUsed: result.providersUsed,
    generatedAt: result.generatedAt,
    verificationNote:
      'Human verification required before press distribution. Contested or estimate-precision items must be checked against primary sources.',
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brand.exportFilenamePrefix}-${result.queryDate}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copy = async () => {
    const lines = [
      result.narrative.headline,
      '',
      result.narrative.lede,
      '',
      ...result.events.map((e) => {
        const c = e.citations[0]
        return `• ${e.year} — ${e.title}\n  ${e.synopsis}\n  Source: ${c?.publisher} — ${c?.url}`
      }),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div className="export-panel">
      <button type="button" className="btn-ghost" onClick={copy}>
        Copy press brief
      </button>
      <button type="button" className="btn-ghost" onClick={download}>
        Export JSON pack
      </button>
    </div>
  )
}
