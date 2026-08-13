import { createKpBuiltInTypeScriptRefactorMotionPlan } from
  "../animation/typescript-refactor-motion-plan.ts";
import { createKpTypeScriptRefactorScore } from
  "../semantic/typescript-refactor-score.ts";
import { readKpTypeScriptRefactorSemanticArtifact } from
  "../semantic/typescript-refactor-semantic-artifact.ts";

/**
 * The public reader needs canonical playback inputs, not the asset authoring
 * graph that proved them. Keeping this projection explicit prevents generic
 * transformation and lineage builders from entering reader startup.
 */
export function createKpTypeScriptFreeShippingRuntimeProjection() {
  return Object.freeze({
    id: "animation.programming.typescript-free-shipping-refactor" as const,
    semantics: readKpTypeScriptRefactorSemanticArtifact(),
    score: createKpTypeScriptRefactorScore(),
    motionPlan: createKpBuiltInTypeScriptRefactorMotionPlan(),
    accessibility: Object.freeze({
      title: "Extracting one free-shipping rule"
    })
  });
}
