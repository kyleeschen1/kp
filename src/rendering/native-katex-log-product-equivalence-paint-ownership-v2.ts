import {
  isKpCompiledLogProductEquivalencePaintOwnershipV2,
  type KpCompiledLogProductEquivalencePaintOwnershipV2
} from "../domain-ir/log-product-equivalence-paint-ownership-v2.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from
  "./native-katex-base-scene-plan.ts";
import { invalidateKpNativeKatexMotionPath } from
  "./native-katex-paint-geometry.ts";
import type { KpNativeKatexRenderedSceneObservation } from
  "./native-katex-rendered-scene.ts";

export function applyKpNativeKatexLogProductEquivalencePaintOwnershipV2(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpCompiledLogProductEquivalencePaintOwnershipV2;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (!isKpCompiledLogProductEquivalencePaintOwnershipV2(input.plan)) {
    throw new Error(
      "Log equivalence renderer requires compiled paint ownership."
    );
  }
  const sourceByAtomId = new Map(input.source.atoms.map((atom) =>
    [atom.id, atom] as const));
  const targetByAtomId = new Map(input.target.atoms.map((atom) =>
    [atom.id, atom] as const));
  const sourceClones = new Set(
    input.plan.liveTransition.sourceCloneEntityIds
  );
  const suppressedSources = new Set(
    input.plan.liveTransition.suppressedSourceEntityIds
  );
  const targetEntities = new Set(input.plan.liveTransition.targetEntityIds);
  const seenSourceClones = new Set<string>();
  const seenTargets = new Set<string>();
  const paintedSourceClones = new Set(input.source.atoms
    .map(({ semanticEntityId }) => semanticEntityId)
    .filter((id) => sourceClones.has(id)));
  const paintedTargets = new Set(input.target.atoms
    .map(({ semanticEntityId }) => semanticEntityId));
  const foreignTarget = [...paintedTargets].find((id) =>
    !targetEntities.has(id));
  if (foreignTarget !== undefined) {
    throw new Error(
      `Target paint atom ${foreignTarget} has no equivalence occurrence.`
    );
  }
  const projected = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceByAtomId.get(track.sourceAtomId)?.semanticEntityId;
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetByAtomId.get(track.targetAtomId)?.semanticEntityId;
    if (sourceEntityId !== undefined && suppressedSources.has(sourceEntityId)) {
      if (track.lifecycle !== "eliminate") {
        throw new Error(
          `Retained source entity ${sourceEntityId} cannot own live transition paint.`
        );
      }
      const stationary = invalidateKpNativeKatexMotionPath(track);
      return Object.freeze({
        ...stationary,
        startRect: Object.freeze({ ...track.startRect }),
        endRect: Object.freeze({ ...track.startRect }),
        startPaintRect: Object.freeze({ ...track.startPaintRect }),
        endPaintRect: Object.freeze({ ...track.startPaintRect }),
        // The lifecycle discriminant remains an elimination for compositor
        // accounting; sampling it at its zero-opacity endpoint keeps the
        // retained native wrapper from ever entering the live paint layer.
        sampleOpacityProgress: () => 1,
        opacityScheduleAuthority: "semantic-choreography" as const
      });
    }
    if (sourceEntityId !== undefined) {
      if (!sourceClones.has(sourceEntityId)) {
        throw new Error(
          `Source entity ${sourceEntityId} has no equivalence paint occurrence.`
        );
      }
      seenSourceClones.add(sourceEntityId);
    }
    if (targetEntityId !== undefined) {
      if (!targetEntities.has(targetEntityId)) {
        throw new Error(
          `Target entity ${targetEntityId} has no equivalence paint occurrence.`
        );
      }
      seenTargets.add(targetEntityId);
    }
    return track;
  });
  // Semantic containers remain useful lineage nodes even when KaTeX emits no
  // independent ink for them; renderer certification covers native atoms.
  requireObserved(paintedSourceClones, seenSourceClones, "source clone");
  requireObserved(paintedTargets, seenTargets, "target");
  return Object.freeze(projected);
}

function requireObserved(
  expected: ReadonlySet<string>,
  observed: ReadonlySet<string>,
  label: string
): void {
  const missing = [...expected].find((id) => !observed.has(id));
  if (missing !== undefined) {
    throw new Error(`Log equivalence ${label} ${missing} has no paint atom.`);
  }
}
