// This entry point is the initial learner-route closure. Variant-specific
// layout and URL capabilities remain behind the comprehensive public API.
export {
  recordKpReaderScrollAnchorRead,
  recordKpReaderScrollGeometryRead
} from "./reader-runtime-metrics.ts";
export {
  createKpReaderViewportAnchorCache,
  type KpReaderViewportAnchorCache
} from "./viewport-anchor-cache.ts";
export {
  createKpReaderSessionSnapshot,
  type KpReaderLocation,
  type KpReaderSessionSnapshot
} from "./session.ts";
export {
  createKpReaderClockSample,
  sampleKpReaderAnimationFrame,
  type KpReaderAnimationFrame,
  type KpReaderClockSample
} from "./playback-clock.ts";
export {
  defineKpReaderPlaybackRangeWindow,
  projectKpReaderRangeGlobalProgress,
  projectKpReaderRangeLocalProgress,
  sampleKpReaderPlaybackRange,
  type KpReaderPlaybackRangeSample,
  type KpReaderPlaybackRangeWindow
} from "./playback-range-window.ts";
export {
  createKpReaderTimelinePlaybackClock,
  type KpReaderTimelinePlaybackClock,
  type KpReaderTimelinePlaybackScheduler,
  type KpReaderTimelinePlaybackStatus
} from "./timeline-playback-clock.ts";
export {
  createKpReaderContinuousScrollClock,
  sampleKpReaderScrollPosition,
  type KpReaderContinuousScrollClock,
  type KpReaderPiecewiseScrollGeometry
} from "./continuous-scroll-clock.ts";
export {
  createKpReaderActiveLocationService,
  type KpReaderActiveLocationService
} from "./active-location.ts";
export {
  decodeKpReaderSessionUrl,
  encodeKpReaderSessionUrl
} from "./lesson-url-codec.ts";
export {
  createKpReaderRuntimeRouteDescriptor,
  type KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";
export {
  applyKpCertifiedEquationStageLayout,
  assertKpAppliedEquationStageLayout,
  assertKpEquationStageMeasurementIdentity,
  createKpEquationStageMeasurementIdentity,
  resetKpAppliedEquationStageLayout,
  type KpAppliedEquationStageLayout,
  type KpEquationStageMeasurementIdentity
} from "./equation-stage-layout.ts";
export {
  alignKpEquationStageSequence,
  translateKpEquationStageLayoutRows,
  type KpCorridorCertifiedEquationStageLayout
} from "./equation-stage-transit-corridor.ts";
export {
  createKpReaderSemanticFocusService,
  type KpReaderFocusSnapshot
} from "./semantic-focus.ts";
export { bindKpReaderSemanticLinks } from "./semantic-focus-bindings.ts";
export { createKpReaderLocationSettlement } from "./location-settlement.ts";
export {
  defineKpReaderFrameScheduler,
  type KpReaderFrameSchedulerOptions,
  type KpReaderFrameSchedulerState,
  type KpReaderLayoutInvalidationReason
} from "./frame-scheduler.ts";
export { projectKpReaderMotion } from "./accessible-controls.ts";
export {
  parseKpReaderMotionPreference,
  resolveKpReaderMotionPolicy,
  type KpReaderMotionPreference
} from "./motion-policy.ts";
export {
  projectKpReaderAttention,
  type KpReaderAttentionProjection
} from "./attention-projector.ts";
export {
  resolveKpReaderViewportAnchorFraction,
  resolveKpReaderResponsiveProjection
} from "./responsive-projection.ts";
export {
  defineKpReaderEquationPresentationCapability,
  resolveKpReaderEquationPresentationProfile,
  type KpReaderEquationPresentationProfile
} from "../document/public-api.ts";
export { selectKpReaderEquationPresentation } from "./equation-presentation-selection.ts";
