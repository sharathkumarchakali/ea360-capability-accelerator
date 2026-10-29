import { usePrototypeStore } from '../../state/prototypeStore'

const DECISION_ACTIONS = new Set([
  'approveDecision',
  'approveDecisionWithConditions',
  'rejectDecision',
  'deferDecision',
])

/** Map UI payloads (often `{ decisionId }`) to store contract (`{ id }`). */
function normalizeActionPayload(action, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload
  if (!DECISION_ACTIONS.has(action)) return payload
  const id = payload.id || payload.decisionId
  if (!id) return payload
  return { ...payload, id: String(id) }
}

/**
 * Invoke a prototype store workflow action by expected name.
 * If the parent has not wired the mutation yet, records intent via addMutation.
 */
export function callStoreAction(action, payload) {
  const state = usePrototypeStore.getState()
  const fn = state[action]
  const normalized = normalizeActionPayload(action, payload)
  if (typeof fn === 'function') {
    return fn(normalized)
  }
  const detail =
    payload == null
      ? ''
      : typeof payload === 'string'
        ? payload
        : JSON.stringify(payload)
  state.addMutation(`${action}${detail ? `: ${detail}` : ''}`)
  return { ok: false, pending: true, action }
}

export function useStoreAction(action) {
  return (payload) => callStoreAction(action, payload)
}
