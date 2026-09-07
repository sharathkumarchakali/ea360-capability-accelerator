import { usePrototypeStore } from '../../state/prototypeStore'

export default function EvidenceReferences({ evidenceIds = [] }) {
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const getRepo = usePrototypeStore((s) => s.getRepo)

  if (!evidenceIds.length) {
    return <p className="sub">No evidence references.</p>
  }

  const repo = getRepo()

  return (
    <div className="chip-row ai-evidence-refs">
      {evidenceIds.map((id) => {
        const ev = repo.getEvidence?.(id)
        const label = ev?.title || ev?.name || id
        return (
          <button
            key={id}
            type="button"
            className="link-chip"
            onClick={() => selectEntity({ id, type: 'evidence' })}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
