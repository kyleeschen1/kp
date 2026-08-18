import type {
  KpHomomorphicFusionChoreography
} from "../animation/equation-operation-choreography.ts";
import {
  applyKpNativeKatexFunctionWrapReception
} from "./native-katex-function-wrap-reception.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export const kpNativeKatexLogQuotientHomomorphicProfile = Object.freeze({
  id: "profile.native-katex.log-quotient.homomorphic-fusion.v1" as const,
  operatorPointScale: 0.04,
  horizontalSqueeze: Object.freeze({
    // The leading enclosure begins after the operator, so quotient reception
    // needs restrained travel to preserve their measured native clearance.
    outwardOffsetInNativeHeights: 0.08
  })
});

/**
 * Semantic fusion does not make either source glyph the visual survivor.
 * This renderer profile supplies the reviewed matched dissolve and delegates
 * enclosure geometry to the canonical function-wrap adapter.
 */
export function applyKpNativeKatexLogQuotientHomomorphicFusion(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpHomomorphicFusionChoreography;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ] as const));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ] as const));
  const sourceOperatorIds = new Set(
    input.plan.operatorGlyphFusion.sourceEntityIds
  );
  const targetOperatorIds = new Set(
    input.plan.operatorGlyphFusion.targetEntityIds
  );
  const matchedSources = new Set<string>();
  const matchedTargets = new Set<string>();
  const scaled = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    if (
      track.lifecycle === "eliminate" &&
      sourceEntityId !== undefined &&
      sourceOperatorIds.has(sourceEntityId)
    ) {
      matchedSources.add(sourceEntityId);
      return Object.freeze({
        ...track,
        sampleMaterialScale: scaleWindow({
          window: input.plan.operatorVisualHandoff.sourceContractionWindow,
          from: 1,
          to: kpNativeKatexLogQuotientHomomorphicProfile.operatorPointScale
        })
      });
    }
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    if (
      track.lifecycle === "introduce" &&
      targetEntityId !== undefined &&
      targetOperatorIds.has(targetEntityId)
    ) {
      matchedTargets.add(targetEntityId);
      return Object.freeze({
        ...track,
        sampleMaterialScale: scaleWindow({
          window: input.plan.operatorVisualHandoff.targetExpansionWindow,
          from: kpNativeKatexLogQuotientHomomorphicProfile.operatorPointScale,
          to: 1
        })
      });
    }
    return track;
  });
  assertExactCoverage(sourceOperatorIds, matchedSources, "source operator");
  assertExactCoverage(targetOperatorIds, matchedTargets, "target operator");
  return applyKpNativeKatexFunctionWrapReception({
    tracks: scaled,
    source: input.source,
    target: input.target,
    plan: input.plan.targetFunctionReception,
    entryWindow: input.plan.targetFunctionReceptionWindow,
    motion: "horizontal-squeeze",
    horizontalSqueezeTreatment:
      kpNativeKatexLogQuotientHomomorphicProfile.horizontalSqueeze
  });
}

function assertExactCoverage(
  expected: ReadonlySet<string>,
  actual: ReadonlySet<string>,
  label: string
): void {
  if (
    expected.size !== actual.size ||
    [...expected].some((entityId) => !actual.has(entityId))
  ) {
    throw new Error(`Log-quotient ${label} paint is incomplete.`);
  }
}

function scaleWindow(input: {
  readonly window: { readonly start: number; readonly end: number };
  readonly from: number;
  readonly to: number;
}): (progress: number) => number {
  return (progress) => {
    const sample = smoothWindow(
      progress,
      input.window.start,
      input.window.end
    );
    return input.from + (input.to - input.from) * sample;
  };
}

function smoothWindow(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}
