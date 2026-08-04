import type { ProviderStatus } from '../../shared/provenance'

export function ProviderRail({ providers }: { providers: ProviderStatus[] }) {
  return (
    <section className="provider-rail" aria-label="Data providers">
      <header className="section-head section-head--compact">
        <p className="eyebrow">Sources pipeline</p>
        <h2>What feeds the machine</h2>
      </header>
      <ul className="provider-list">
        {providers.map((p) => (
          <li key={p.id}>
            <div className="provider-row">
              <span className={`status status--${p.status}`}>{p.status}</span>
              <div>
                <p className="provider-label">{p.label}</p>
                <p className="provider-role">{p.role}</p>
                <p className="provider-notes">{p.notes}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
