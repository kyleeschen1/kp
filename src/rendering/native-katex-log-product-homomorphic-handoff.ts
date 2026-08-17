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
  const sourceOperatorByVisualKey = uniqueAtomsByVisualKey(
    sourceOperatorAtoms,
    "source logarithm operator"
  );
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
        input.plan.operatorHandoff.sourceReleaseWindow,
        sourceAtom.rect
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
      return deriveOperatorSuccessor(track, origin, targetAtom, input.plan);
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
        input.plan.enclosureHandoff.sourceReleaseWindow,
        sourceAtom.rect
      );
    }
    if (
      track.lifecycle === "introduce" &&
      targetAtom !== undefined &&
      relationTargetIds.has(targetAtom.semanticEntityId)
    ) {
      return revealAtNativePosition(
        track,
        targetAtom,
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
  sourceAtom: KpNativeKatexPaintAtomObservation,
  targetAtom: KpNativeKatexPaintAtomObservation,
  plan: KpBinaryLogProductHomomorphicHandoff
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = omitMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...sourceAtom.rect }),
    endRect: Object.freeze({ ...targetAtom.rect }),
    startPaintRect: Object.freeze({ ...sourceAtom.rect }),
    endPaintRect: Object.freeze({ ...targetAtom.rect }),
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
  releaseWindow: { readonly start: number; readonly end: number },
  nativeRect: KpNativeKatexPaintAtomObservation["rect"]
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = omitMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...nativeRect }),
    endRect: Object.freeze({ ...nativeRect }),
    startPaintRect: Object.freeze({ ...nativeRect }),
    endPaintRect: Object.freeze({ ...nativeRect }),
    sampleProgress: sampleWindow(releaseWindow),
    sampleOpacityProgress: sampleWindow(releaseWindow),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function revealAtNativePosition(
  track: IntroducedTrack,
  targetAtom: KpNativeKatexPaintAtomObservation,
  receptionWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = omitMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...targetAtom.rect }),
    endRect: Object.freeze({ ...targetAtom.rect }),
    startPaintRect: Object.freeze({ ...targetAtom.rect }),
    endPaintRect: Object.freeze({ ...targetAtom.rect }),
    sampleProgress: sampleWindow(receptionWindow),
    sampleOpacityProgress: sampleWindow(receptionWindow),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function omitMotionPath<Track extends KpNativeKatexPaintMeasuredSceneTrack>(
  track: Track
): Omit<
  Track,
  "motionPath" | "motionPathSampling"
> {
  const {
    motionPath: _motionPath,
    motionPathSampling: _motionPathSampling,
    ...withoutPath
  } = track;
  return withoutPath;
}

function uniqueAtomsByVisualKey(
  atoms: readonly KpNativeKatexPaintAtomObservation[],
  label: string
): ReadonlyMap<string, KpNativeKatexPaintAtomObservation> {
  const byVisualKey = new Map<string, KpNativeKatexPaintAtomObservation>();
  for (const atom of atoms) {
    if (byVisualKey.has(atom.visualKey)) {
      throw new Error(`${label} contains ambiguous ${atom.visualKey} paint.`);
    }
    byVisualKey.set(atom.visualKey, atom);
  }
  if (byVisualKey.size === 0) {
    throw new Error(`${label} requires visible paint.`);
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
