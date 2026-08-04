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
      // Internal discovery channels stay in JSON for editors; never treat as the cite
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
    verificationNote:
      'Human verification required before press distribution. Harvard strings below are the citable form. Never cite onthisday.com, youdidntnotice.com, bdayrecap.com, or similar aggregators.',
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
      `Path: ${result.datePath}`,
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
      <button type="button" className="btn-ghost" onClick={copy}>
        Copy press brief
      </button>
      <button type="button" className="btn-ghost" onClick={download}>
        Export JSON pack
      </button>
    </div>
  )
}
