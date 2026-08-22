import type {
  KpSemanticMotionChoreographySample
} from "../domain-ir/semantic-motion-choreography-compiler.ts";
import {
  kpLogProductHomomorphicCausalPhaseBindings
} from "./log-product-homomorphic-causal-phase-bindings.ts";
import {
  kpCanonicalLogProductMaterialRoleBindings
} from "./log-product-material-depth-bindings.ts";
import {
  sampleKpLogProductMaterialDepthPose,
  type KpLogProductMaterialDepthMode,
  type KpLogProductMaterialDepthPose
} from "./log-product-material-depth-pose.ts";
import type {
  KpLogProductMaterialRoleId
} from "./log-product-material-depth-roles.ts";

export function sampleKpLogProductMaterialDepthChoreography(input: {
  readonly mode: KpLogProductMaterialDepthMode;
  readonly choreography: KpSemanticMotionChoreographySample;
}): Readonly<Record<KpLogProductMaterialRoleId, KpLogProductMaterialDepthPose>> {
  const phaseProgress = new Map(
    kpLogProductHomomorphicCausalPhaseBindings.map((binding) => [
      binding.phaseId,
      aggregatePhaseProgress(binding.eventIds, input.choreography)
    ] as const)
  );
  return Object.freeze(Object.fromEntries(
    kpCanonicalLogProductMaterialRoleBindings.map((binding) => [
      binding.roleId,
      sampleRolePose(binding.phaseInstructions, phaseProgress, input.mode)
    ])
  )) as Readonly<
    Record<KpLogProductMaterialRoleId, KpLogProductMaterialDepthPose>
  >;
}

function aggregatePhaseProgress(
  eventIds: readonly string[],
  choreography: KpSemanticMotionChoreographySample
): number {
  const samples = eventIds.map((eventId) => {
    const sample = choreography.tracks.find((track) =>
      track.eventId === eventId
    );
    if (sample === undefined) {
      throw new Error(`Material choreography is missing ${eventId}.`);
    }
    return sample.progress;
  });
  return samples.reduce((sum, progress) => sum + progress, 0) /
    samples.length;
}

function sampleRolePose(
  instructions: KpLogProductMaterialRoleBindingInstructions,
  phaseProgress: ReadonlyMap<string, number>,
  mode: KpLogProductMaterialDepthMode
): KpLogProductMaterialDepthPose {
  let pose = sampleKpLogProductMaterialDepthPose({
    mode,
    verb: "rest",
    progress: 0
  });
  for (const instruction of instructions) {
    const progress = phaseProgress.get(instruction.phaseId) ?? 0;
    if (progress <= 0) return pose;
    pose = sampleKpLogProductMaterialDepthPose({
      mode,
      verb: instruction.verb,
      progress
    });
    if (progress < 1) return pose;
  }
  return pose;
}

type KpLogProductMaterialRoleBindingInstructions =
  typeof kpCanonicalLogProductMaterialRoleBindings[number]["phaseInstructions"];

