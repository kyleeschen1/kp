// Distribution was the first approved caller of copy/fan-out motion. Preserve
// its public vocabulary while the reusable sampler lives below the rendering
// boundary so other semantic families do not import algebra-specific code.
export {
  kpCanonicalNativeKatexCopyFanOutMotionProfile as
    kpLessonCanonicalDistributionMotionProfile,
  sampleKpCanonicalNativeKatexCopyFanOutMotion as
    sampleKpLessonCanonicalDistributionMotion
} from "./copy-fan-out-motion-profile.ts";
export type {
  KpCanonicalNativeKatexCopyFanOutMotionFrame as
    KpLessonCanonicalDistributionMotionFrame
} from "./copy-fan-out-motion-profile.ts";
