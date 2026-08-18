import {
  isKpCompiledSymbolMotionContract,
  type KpCompiledSymbolMotionContract
} from "../animation/symbol-motion-contract.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

/**
 * Projects compiler-owned semantic motion units into renderer metadata. The
 * renderer may measure glyphs and repair collisions, but it may not split a
 * declared compound or fade a declared continuant to simplify its routing.
 */
export function applyKpNativeKatexSymbolMotionContract(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly contract?: KpCompiledSymbolMotionContract | undefined;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (input.contract === undefined) return input.tracks;
  if (!isKpCompiledSymbolMotionContract(input.contract)) {
    throw new Error(
      "Native KaTeX symbol motion requires nominal compiler authority."
    );
  }
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const ruleByPair = new Map(input.contract.continuants.flatMap((rule) =>
    rule.sourceEntityIds.flatMap((sourceEntityId) =>
      rule.targetEntityIds.map((targetEntityId) => [
        pairKey(sourceEntityId, targetEntityId),
        rule
      ] as const)
    )
  ));
  const continuantTracks = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    const rule = sourceEntityId === undefined || targetEntityId === undefined
      ? undefined
      : ruleByPair.get(pairKey(sourceEntityId, targetEntityId));
    if (rule === undefined) return track;
    if (
      track.lifecycle !== "persist" ||
      track.startOpacity !== 1 ||
      track.endOpacity !== 1
    ) {
      throw new Error(
        `Symbol continuant ${rule.id} cannot compile through ${track.lifecycle} opacity.`
      );
    }
    return Object.freeze({
      ...track,
      semanticContinuantId: rule.id,
      semanticMotionUnitId: rule.id,
      semanticMetricTransition: rule.metricTransition,
      opacityScheduleAuthority: "semantic-choreography" as const
    });
  });
  const structuralTracks = continuantTracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    const shell = input.contract!.structuralShells.find((candidate) =>
      candidate.lifecycle === "retire"
        ? sourceEntityId !== undefined &&
          candidate.entityIds.includes(sourceEntityId)
        : targetEntityId !== undefined &&
          candidate.entityIds.includes(targetEntityId)
    );
    if (shell === undefined) return track;
    const expectedLifecycle = shell.lifecycle === "retire"
      ? "eliminate"
      : "introduce";
    if (track.lifecycle !== expectedLifecycle) {
      throw new Error(
        `Structural shell ${shell.id} compiled through ${track.lifecycle}.`
      );
    }
    // These names are causal contracts: a retiring shell must not disappear
    // while its continuant is still departing, and a target shell must wait
    // until the continuant has reached its native destination.
    const window = shell.lifecycle === "retire"
      ? { start: 0.32, end: 0.42 }
      : { start: 0.9, end: 0.99 };
    const sample = (progress: number) => smoothWindow(
      progress,
      window.start,
      window.end
    );
    return Object.freeze({
      ...track,
      semanticMotionUnitId: shell.id,
      timingGroupId: shell.id,
      routingCohortId: shell.id,
      routingMemberId: shell.id,
      opacityScheduleAuthority: "semantic-choreography" as const,
      sampleProgress: sample,
      sampleOpacityProgress: sample
    });
  });
  const tracksByContinuant = new Map<string, number[]>();
  structuralTracks.forEach((track, index) => {
    if (track.semanticContinuantId === undefined) return;
    tracksByContinuant.set(track.semanticContinuantId, [
      ...(tracksByContinuant.get(track.semanticContinuantId) ?? []),
      index
    ]);
  });
  const compoundByTrackIndex = new Map<number, string>();
  for (const compound of input.contract.rigidCompounds) {
    const trackIndexes = compound.memberContinuantIds.flatMap(
      (continuantId) => tracksByContinuant.get(continuantId) ?? []
    );
    if (new Set(trackIndexes).size < 2) {
      throw new Error(
        `Rigid symbol compound ${compound.id} requires at least two measured paint tracks.`
      );
    }
    for (const trackIndex of trackIndexes) {
      if (compoundByTrackIndex.has(trackIndex)) {
        throw new Error(
          `Native symbol track ${structuralTracks[trackIndex]!.id} belongs to multiple compounds.`
        );
      }
      compoundByTrackIndex.set(trackIndex, compound.id);
    }
  }
  return Object.freeze(structuralTracks.map((track, index) => {
    const compoundId = compoundByTrackIndex.get(index);
    if (compoundId === undefined) return track;
    return Object.freeze({
      ...track,
      semanticMotionUnitId: compoundId,
      timingGroupId: compoundId,
      routingCohortId: compoundId,
      routingMemberId: compoundId
    });
  }));
}

function pairKey(sourceEntityId: string, targetEntityId: string): string {
  return `${sourceEntityId}\u0000${targetEntityId}`;
}

function smoothWindow(progress: number, start: number, end: number): number {
  const bounded = Math.max(0, Math.min(1, (progress - start) / (end - start)));
  return bounded * bounded * (3 - 2 * bounded);
}
