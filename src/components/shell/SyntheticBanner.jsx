import { Info } from 'lucide-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'

/** Compact synthetic-data badge with tooltip (replaces full-width banner). */
export default function SyntheticBadge() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const disclaimer =
    getTenantConfig(tenantCode).syntheticDisclaimer ||
    'Synthetic demonstration data — illustrative only. No institutional data was supplied or validated for this prototype.'

  return (
    <span
      className="synthetic-badge"
      title={`Demonstration only — not supplied or validated by the named institution. ${disclaimer}`}
      role="status"
    >
      <Info size={12} strokeWidth={2} aria-hidden="true" />
      <span>Synthetic</span>
    </span>
  )
}
