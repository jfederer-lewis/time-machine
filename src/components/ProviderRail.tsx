import type { ProviderStatus } from '../../shared/provenance'

const statusLabel: Record<ProviderStatus['status'], string> = {
  live: 'Live',
  'needs-key': 'Key needed',
  stub: 'Coming soon',
  fallback: 'Fallback',
}

export function ProviderRail({ providers }: { providers: ProviderStatus[] }) {
  return (
    <section className="provider-rail" aria-label="Sources">
      <header className="section-head">
        <h2>Sources</h2>
        <p className="section-lede">
          Every claim on the site is tied to an allowlisted archive or publication.
        </p>
      </header>
      <ul className="provider-list">
        {providers.map((p) => (
          <li key={p.id}>
            <div className="provider-row">
              <span className={`status status--${p.status}`}>{statusLabel[p.status]}</span>
              <div>
                <p className="provider-label">{p.label}</p>
                <p className="provider-role">{p.role}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
