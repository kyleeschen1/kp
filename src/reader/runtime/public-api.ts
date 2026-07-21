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
  sampleKpReaderScrollProgress,
  type KpReaderContinuousScrollClock,
  type KpReaderScrollCheckpoint,
  type KpReaderScrollGeometry
} from "./continuous-scroll-clock.ts";
export {
  decodeKpReaderSessionUrl,
  encodeKpReaderSessionUrl
} from "./lesson-url-codec.ts";
export {
  createKpReaderSemanticFocusService,
  type KpReaderFocusListener,
  type KpReaderFocusSnapshot,
  type KpReaderFocusSource,
  type KpReaderSemanticFocusService
} from "./semantic-focus.ts";
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
  resolveKpReaderResponsiveProjection,
  type KpReaderResponsiveProjection
} from "./responsive-projection.ts";
