export {
  createKpReaderCompositorPurePlanCache,
  type KpReaderCompositorPurePlanCache
} from "./compositor-pure-plan-cache.ts";
export {
  createKpReaderCompositorGeometryCacheIdentity,
  type KpReaderCompositorGeometryCacheIdentity,
  type KpReaderCompositorGeometryCacheIdentityInput
} from "./equation-compositor-geometry-cache-identity.ts";
export {
  inspectKpReaderRuntimeMetrics,
  recordKpReaderCanonicalSessionApply,
  recordKpReaderCanonicalSessionBuild,
  recordKpReaderCanonicalSessionReuse,
  recordKpReaderPurePlanCacheHit,
  recordKpReaderPurePlanCompilation,
  recordKpReaderScrollAnchorRead,
  recordKpReaderScrollGeometryRead,
  resetKpReaderRuntimeMetrics,
  type KpReaderRuntimeMetricsSnapshot
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
  type KpReaderClockListener,
  type KpReaderClockSample,
  type KpReaderClockSource,
  type KpReaderAnimationFrame,
  type KpReaderPlaybackClock
} from "./playback-clock.ts";
export {
  createKpReaderClockAuthorityState,
  reduceKpReaderClockAuthority,
  type KpReaderClockAuthorityDecision,
  type KpReaderClockAuthorityEvent,
  type KpReaderClockAuthorityEventKind,
  type KpReaderClockAuthorityState
} from "./clock-authority.ts";
export {
  createKpReaderContinuousScrollClock,
  sampleKpReaderScrollPosition,
  sampleKpReaderScrollProgress,
  type KpReaderContinuousScrollClock,
  type KpReaderLinearScrollGeometry,
  type KpReaderPiecewiseScrollGeometry,
  type KpReaderPiecewiseScrollStop,
  type KpReaderScrollCheckpoint,
  type KpReaderScrollGeometry
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
  composeKpReaderUrlStateCodecs,
  defineKpReaderUrlStateCodec,
  type KpReaderUrlStateCodec
} from "./url-state-codec.ts";
export {
  decodeKpDistributionAreaUrl,
  encodeKpDistributionAreaUrl,
  type KpDistributionAreaCheckpoint,
  type KpDistributionAreaDirection,
  type KpDistributionAreaUrlState
} from "./distribution-area-url-codec.ts";
export {
  createKpReaderRuntimeRouteDescriptor,
  type KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";
export {
  planKpFoldableDistributionLayout,
  type KpFoldableDistributionLayoutIntent,
  type KpFoldableDistributionLayoutRow,
  type KpFoldableDistributionPhaseLayout,
  type KpFoldableDistributionViewport
} from "./foldable-distribution-layout.ts";
export {
  planKpFractionCompositionLayout,
  type KpFractionCompositionLayoutIntent,
  type KpFractionCompositionLayoutRow,
  type KpFractionCompositionPhaseLayout,
  type KpFractionCompositionViewport
} from "./fraction-composition-layout.ts";
export {
  applyKpCertifiedEquationStageLayout,
  assertKpAppliedEquationStageLayout,
  assertKpEquationStageMeasurementIdentity,
  certifyKpSingleRowEquationStageLayout,
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  resetKpAppliedEquationStageLayout,
  type KpAppliedEquationStageLayout,
  type KpCertifiedEquationStageLayout,
  type KpCertifiedEquationStageRow,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStageLayoutIntent,
  type KpEquationStageLayoutPolicy,
  type KpEquationStageMeasurementIdentity,
  type KpEquationStageMeasuredEnvelope,
  type KpEquationStageNativeMemberBinding,
  type KpEquationStageNativeRowBinding,
  type KpEquationStagePhaseIntent,
  type KpEquationStageRect,
  type KpEquationStageRowIntent,
  type KpMeasuredEquationStageInput
} from "./equation-stage-layout.ts";
export {
  certifyKpEquationStageTransitCorridor,
  type KpCorridorCertifiedEquationStageLayout,
  type KpEquationStageMaterialTransitIntent,
  type KpEquationStageMaterialTransitPlan,
  type KpEquationStagePoint,
  type KpEquationStageTransitCorridor
} from "./equation-stage-transit-corridor.ts";
export {
  decodeKpFoldableDistributionUrl,
  encodeKpFoldableDistributionUrl,
  type KpFoldableDistributionCheckpoint,
  type KpFoldableDistributionDirection,
  type KpFoldableDistributionUrlState
} from "./foldable-distribution-url-codec.ts";
export {
  decodeKpReaderEvaluationFoldUrl,
  encodeKpReaderEvaluationFoldUrl,
  type KpReaderEvaluationFoldMode,
  type KpReaderEvaluationFoldUrlContract,
  type KpReaderEvaluationFoldUrlState
} from "./evaluation-fold-url-codec.ts";
export {
  decodeKpFractionCompositionUrl,
  encodeKpFractionCompositionUrl,
  type KpFractionCompositionCheckpoint,
  type KpFractionCompositionUrlState
} from "./fraction-composition-url-codec.ts";
export {
  createKpReaderSemanticFocusService,
  type KpReaderFocusListener,
  type KpReaderFocusSnapshot,
  type KpReaderFocusSource,
  type KpReaderSemanticFocusService
} from "./semantic-focus.ts";
export {
  bindKpReaderSemanticLinks,
  readKpReaderSemanticFocusRefs,
  type KpReaderSemanticLinkBindings,
  type KpReaderSemanticLinkFocusSource
} from "./semantic-focus-bindings.ts";
export {
  createKpReaderLocationSettlement,
  type KpReaderLocationSettlement
} from "./location-settlement.ts";
export {
  createKpReaderFrameScheduler,
  defineKpReaderFrameScheduler,
  type KpReaderFrameClock,
  type KpReaderFrameScheduler,
  type KpReaderFrameSchedulerOptions,
  type KpReaderFrameSchedulerState,
  type KpReaderLayoutInvalidationReason
} from "./frame-scheduler.ts";
export {
  createKpReaderControlModel,
  projectKpReaderMotion,
  type KpReaderAccessibleCheckpoint,
  type KpReaderControlModel,
  type KpReaderMotionProjection
} from "./accessible-controls.ts";
export {
  parseKpReaderMotionPreference,
  resolveKpReaderMotionPolicy,
  type KpReaderMotionPolicy,
  type KpReaderMotionPreference,
  type KpReaderResolvedMotionMode
} from "./motion-policy.ts";
export {
  projectKpReaderAttention,
  type KpReaderAttentionMotionGate,
  type KpReaderAttentionPrimaryTarget,
  type KpReaderAttentionProjection
} from "./attention-projector.ts";
export {
  KP_READER_WIDE_MIN_WIDTH,
  resolveKpReaderViewportAnchorFraction,
  resolveKpReaderResponsiveProjection,
  type KpReaderResponsiveProjection
} from "./responsive-projection.ts";
export {
  defineKpReaderEquationPresentationAxes,
  defineKpReaderEquationPresentationCapability,
  kpReaderDefaultEquationPresentationProfileId,
  kpReaderEquationDerivationModes,
  kpReaderEquationIdentityModes,
  kpReaderEquationPresentationCapability,
  kpReaderEquationPresentationProfileIds,
  kpReaderEquationPresentationProfiles,
  resolveKpReaderEquationPresentationProfile,
  type KpReaderEquationDerivationMode,
  type KpReaderEquationIdentityMode,
  type KpReaderEquationPresentationAxes,
  type KpReaderEquationPresentationCapability,
  type KpReaderEquationPresentationProfile,
  type KpReaderEquationPresentationProfileId
} from "../document/public-api.ts";
export {
  selectKpReaderEquationPresentation,
  type KpReaderEquationPresentationSelection,
  type KpReaderEquationPresentationSelectionSource
} from "./equation-presentation-selection.ts";
