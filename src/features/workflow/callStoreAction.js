import { usePrototypeStore } from '../../state/prototypeStore'

/**
 * Invoke a prototype store workflow action by expected name.
 * If the parent has not wired the mutation yet, records intent via addMutation.
 */
export function callStoreAction(action, payload) {
  const state = usePrototypeStore.getState()
  const fn = state[action]
  if (typeof fn === 'function') {
    return fn(payload)
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
