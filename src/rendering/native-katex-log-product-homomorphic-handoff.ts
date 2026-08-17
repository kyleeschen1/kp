import {
  isKpBinaryLogProductHomomorphicHandoff,
  type KpBinaryLogProductHomomorphicHandoff
} from "../animation/log-product-homomorphic-handoff.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  invalidateKpNativeKatexMotionPath,
  projectKpNativeKatexHorizontalPaintTransit
} from "./native-katex-paint-geometry.ts";

type IntroducedTrack = Extract<
  KpNativeKatexPaintMeasuredSceneTrack,
  { readonly lifecycle: "introduce" }
>;
type EliminatedTrack = Extract<
  KpNativeKatexPaintMeasuredSceneTrack,
  { readonly lifecycle: "eliminate" }
>;

export function applyKpNativeKatexLogProductHomomorphicHandoff(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpBinaryLogProductHomomorphicHandoff;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (!isKpBinaryLogProductHomomorphicHandoff(input.plan)) {
    throw new Error(
      "Native KaTeX log-product handoff requires compiled presentation authority."
    );
  }
  const sourceByAtomId = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom
  ] as const));
  const targetByAtomId = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom
  ] as const));
  const sourceOperatorAtoms = input.source.atoms.filter(
    ({ semanticEntityId }) =>
      semanticEntityId === input.plan.operatorHandoff.sourceEntityId
  );
  const sourceOperatorByVisualKey = uniqueOperatorTracksByVisualKey({
    atoms: sourceOperatorAtoms,
    tracks: input.tracks
  });
  const targetOperatorIds = new Set(
    input.plan.operatorHandoff.targetEntityIds
  );
  const sourceEnclosureIds = new Set(
    input.plan.enclosureHandoff.sourceEntityIds
  );
  const payloadSourceIds = new Set(
    input.plan.payloadHandoff.correspondences.map(
      ({ sourceEntityId }) => sourceEntityId
    )
  );
  const relationTargetIds = new Set(
    input.plan.relationHandoff.targetEntityIds
  );
  const adaptedTargetOperatorAtomIds = new Set<string>();
  const adapted = input.tracks.map((track) => {
    const sourceAtom = track.sourceAtomId === undefined
      ? undefined
      : sourceByAtomId.get(track.sourceAtomId);
    const targetAtom = track.targetAtomId === undefined
      ? undefined
      : targetByAtomId.get(track.targetAtomId);

    if (
      track.lifecycle === "eliminate" &&
      sourceAtom?.semanticEntityId === input.plan.operatorHandoff.sourceEntityId
    ) {
      return freezeElimination(
        track,
        input.plan.operatorHandoff.sourceReleaseWindow
      );
    }
    if (
      track.lifecycle === "introduce" &&
      targetAtom !== undefined &&
      targetOperatorIds.has(targetAtom.semanticEntityId)
    ) {
      const origin = sourceOperatorByVisualKey.get(targetAtom.visualKey);
      if (origin === undefined) {
        throw new Error(
          `Derived logarithm paint ${targetAtom.id} lacks a source carrier atom.`
        );
      }
      adaptedTargetOperatorAtomIds.add(targetAtom.id);
      return deriveOperatorSuccessor(track, origin, input.plan);
    }
    if (
      track.lifecycle === "persist" &&
      sourceAtom !== undefined &&
      payloadSourceIds.has(sourceAtom.semanticEntityId)
    ) {
      return Object.freeze({
        ...track,
        sampleProgress: sampleWindow(input.plan.payloadHandoff.transitWindow),
        motionAxisConstraint: "horizontal" as const
      });
    }
    if (
      track.lifecycle === "eliminate" &&
      sourceAtom !== undefined &&
      sourceEnclosureIds.has(sourceAtom.semanticEntityId)
    ) {
      return freezeElimination(
        track,
        input.plan.enclosureHandoff.sourceReleaseWindow
      );
    }
    if (
      track.lifecycle === "introduce" &&
      targetAtom !== undefined &&
      relationTargetIds.has(targetAtom.semanticEntityId)
    ) {
      return revealAtNativePosition(
        track,
        input.plan.relationHandoff.receptionWindow
      );
    }
    return track;
  });
  const expectedTargetOperatorAtomIds = input.target.atoms
    .filter(({ semanticEntityId }) => targetOperatorIds.has(semanticEntityId))
    .map(({ id }) => id);
  if (
    adaptedTargetOperatorAtomIds.size !== expectedTargetOperatorAtomIds.length ||
    expectedTargetOperatorAtomIds.some(
      (id) => !adaptedTargetOperatorAtomIds.has(id)
    )
  ) {
    throw new Error(
      "Every derived logarithm paint atom must receive one source-carrier trajectory."
    );
  }
  return Object.freeze(adapted);
}

function deriveOperatorSuccessor(
  track: IntroducedTrack,
  sourceTrack: EliminatedTrack,
  plan: KpBinaryLogProductHomomorphicHandoff
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  const geometry = projectKpNativeKatexHorizontalPaintTransit({
    originPaintRect: sourceTrack.startPaintRect,
    targetRect: track.endRect,
    targetPaintRect: track.endPaintRect
  });
  return Object.freeze({
    ...withoutPath,
    ...geometry,
    sampleProgress: sampleWindow(plan.operatorHandoff.transitWindow),
    sampleOpacityProgress: sampleWindow(
      plan.operatorHandoff.targetPresenceWindow
    ),
    motionAxisConstraint: "horizontal" as const,
    timingGroupId: plan.operatorHandoff.correspondenceRecordId,
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function freezeElimination(
  track: EliminatedTrack,
  releaseWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...track.startRect }),
    endRect: Object.freeze({ ...track.startRect }),
    startPaintRect: Object.freeze({ ...track.startPaintRect }),
    endPaintRect: Object.freeze({ ...track.startPaintRect }),
    sampleProgress: sampleWindow(releaseWindow),
    sampleOpacityProgress: sampleWindow(releaseWindow),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function revealAtNativePosition(
  track: IntroducedTrack,
  receptionWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...track.endRect }),
    endRect: Object.freeze({ ...track.endRect }),
    startPaintRect: Object.freeze({ ...track.endPaintRect }),
    endPaintRect: Object.freeze({ ...track.endPaintRect }),
    sampleProgress: sampleWindow(receptionWindow),
    sampleOpacityProgress: sampleWindow(receptionWindow),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function uniqueOperatorTracksByVisualKey(input: {
  readonly atoms: readonly KpNativeKatexPaintAtomObservation[];
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
}): ReadonlyMap<string, EliminatedTrack> {
  const byVisualKey = new Map<string, EliminatedTrack>();
  for (const atom of input.atoms) {
    if (byVisualKey.has(atom.visualKey)) {
      throw new Error(
        `source logarithm operator contains ambiguous ${atom.visualKey} paint.`
      );
    }
    const matches = input.tracks.filter((track): track is EliminatedTrack =>
      track.lifecycle === "eliminate" && track.sourceAtomId === atom.id
    );
    if (matches.length !== 1) {
      throw new Error(
        `Source logarithm paint ${atom.id} requires one measured elimination track.`
      );
    }
    byVisualKey.set(atom.visualKey, matches[0]!);
  }
  if (byVisualKey.size === 0) {
    throw new Error("source logarithm operator requires visible paint.");
  }
  return byVisualKey;
}

function sampleWindow(
  window: { readonly start: number; readonly end: number }
): (progress: number) => number {
  return (progress) => {
    if (progress <= window.start) return 0;
    if (progress >= window.end) return 1;
    const local = (progress - window.start) / (window.end - window.start);
    return local * local * (3 - 2 * local);
  };
}
