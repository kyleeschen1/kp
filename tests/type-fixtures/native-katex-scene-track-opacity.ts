import type {
  KpNativeKatexSceneTrackOpacityContract
} from "../../src/rendering/native-katex-scene-track-contract.ts";

const persistent: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "persist",
  startOpacity: 1,
  endOpacity: 1
};
const introduced: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "introduce",
  startOpacity: 0,
  endOpacity: 1,
  opacityStepAt: 0.9
};
const eliminated: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "eliminate",
  startOpacity: 1,
  endOpacity: 0,
  opacityStepAt: 0.1
};

// @ts-expect-error Persistent lineage cannot fade.
const fadingPersistent: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "persist",
  startOpacity: 1,
  endOpacity: 0
};
// @ts-expect-error Merge lineage cannot schedule an opacity handoff.
const steppedMerge: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "merge",
  startOpacity: 1,
  endOpacity: 1,
  opacityStepAt: 0.5
};
// @ts-expect-error Introductions have literal zero-to-one endpoint opacity.
const opaqueIntroduction: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "introduce",
  startOpacity: 1,
  endOpacity: 1
};
// @ts-expect-error Eliminations have literal one-to-zero endpoint opacity.
const opaqueElimination: KpNativeKatexSceneTrackOpacityContract = {
  lifecycle: "eliminate",
  startOpacity: 1,
  endOpacity: 1
};
const unsupported: KpNativeKatexSceneTrackOpacityContract = {
  // @ts-expect-error Unsupported reconciliation never becomes a scene track.
  lifecycle: "unsupported",
  startOpacity: 1,
  endOpacity: 1
};

void [
  persistent,
  introduced,
  eliminated,
  fadingPersistent,
  steppedMerge,
  opaqueIntroduction,
  opaqueElimination,
  unsupported
];
