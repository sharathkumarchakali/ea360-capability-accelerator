import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'

export default function SyntheticBanner() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const disclaimer =
    getTenantConfig(tenantCode).syntheticDisclaimer ||
    'Synthetic demonstration data — illustrative only. No institutional data was supplied or validated for this prototype.'

  return (
    <div className="synthetic-banner" role="status">
      {disclaimer}
    </div>
  )
}
