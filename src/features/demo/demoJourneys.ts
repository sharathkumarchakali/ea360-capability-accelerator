/**
 * Compatibility entry point for the guided-demo journeys.
 * Definitions now live in journeyDefinitions.ts (typed J1–J8 contracts); bindings in journeyBindings.ts.
 * Legacy ids (`gra-executive`, `gra-architecture`, `gra-transformation`) still resolve via getDemoJourneyById.
 */
export {
  DEMO_ENTRY_OPTIONS,
  DEMO_PLAYLISTS,
  DEMO_TARGET_SELECTORS,
  SUPPORTED_FILTER_KEYS,
  buildPlaylistJourney,
  evaluatePredicate,
  getDemoJourneyById,
  getDemoJourneys,
  legacyJourneyTargets,
  resolveStepForRun,
  validateJourneyContract,
} from './journeyDefinitions'
export type {
  DemoEntryOption,
  DemoJourney,
  DemoJourneyKind,
  DemoPlaylist,
  DemoStep,
  DemoStepAction,
  DemoStepV2,
  EntityBinding,
} from './journeyDefinitions'
export { default } from './journeyDefinitions'
