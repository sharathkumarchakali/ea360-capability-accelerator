import { explainInsight } from '../../lib/ai'
import { usePrototypeStore } from '../../state/prototypeStore'

export default function ExplainButton({
  metricKey,
  contextEntityIds = [],
  query,
  label = 'Explain',
  className = 'btn tiny secondary-button',
}) {
  const role = usePrototypeStore((s) => s.role)
  const view = usePrototypeStore((s) => s.view)
  const filters = usePrototypeStore((s) => s.filters)
  const getRepo = usePrototypeStore((s) => s.getRepo)
  const selectedEntity = usePrototypeStore((s) => s.selectedEntity)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)

  function run() {
    const repo = getRepo()
    const tenant = repo.getTenant()
    const ids = contextEntityIds.length
      ? contextEntityIds
      : selectedEntity?.id
        ? [selectedEntity.id]
        : []
    const response = explainInsight({
      tenantId: tenant.id,
      userRole: role,
      query: query || `Explain ${metricKey || 'this metric'}`,
      metricKey,
      contextEntityIds: ids,
      view,
      filters: { period: filters.period, businessUnit: filters.businessUnit },
    })
    recordAiResponse(response)
    setAskOpen(true)
  }

  return (
    <button type="button" className={className} onClick={run}>
      {label}
    </button>
  )
}
