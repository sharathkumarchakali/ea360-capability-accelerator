import { Info } from 'lucide-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'

export default function SyntheticBanner() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const disclaimer =
    getTenantConfig(tenantCode).syntheticDisclaimer ||
    'Synthetic demonstration data — illustrative only. No institutional data was supplied or validated for this prototype.'

  return (
    <div className="synthetic-banner" role="status">
      <Info size={14} strokeWidth={2} className="synthetic-banner-icon" aria-hidden="true" />
      <span className="synthetic-banner-label">Synthetic data</span>
      <span className="synthetic-banner-sep" aria-hidden="true">
        ·
      </span>
      <span className="synthetic-banner-copy">
        Demonstration only — not supplied or validated by the named institution. {disclaimer}
      </span>
    </div>
  )
}
