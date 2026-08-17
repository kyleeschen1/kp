import {
  isKpLogProductHomomorphicHandoff,
  type KpLogProductHomomorphicHandoff
} from "../animation/log-product-homomorphic-handoff.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import {
  kpNativeKatexLogProductHomomorphicProfile
} from "./native-katex-log-product-homomorphic-profile.ts";

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
  readonly plan: KpLogProductHomomorphicHandoff;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (!isKpLogProductHomomorphicHandoff(input.plan)) {
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
      return releaseOperatorAtNativePosition(
        track,
        input.plan.operatorHandoff.sourceContractionWindow,
        input.plan.operatorHandoff.sourceReleaseWindow
      );
    }
    if (
      track.lifecycle === "introduce" &&
      targetAtom !== undefined &&
      targetOperatorIds.has(targetAtom.semanticEntityId)
    ) {
      adaptedTargetOperatorAtomIds.add(targetAtom.id);
      return revealSyntaxAtNativePosition(
        track,
        input.plan.operatorHandoff.targetPresenceWindow,
        input.plan.operatorHandoff.targetExpansionWindow
      );
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
      return releaseAtNativePosition(
        track,
        input.plan.enclosureHandoff.sourceReleaseWindow
      );
    }
    if (
      track.lifecycle === "introduce" &&
      targetAtom !== undefined &&
      relationTargetIds.has(targetAtom.semanticEntityId)
    ) {
      return revealSyntaxAtNativePosition(
        track,
        input.plan.relationHandoff.receptionWindow,
        input.plan.relationHandoff.expansionWindow
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

function releaseAtNativePosition(
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

function releaseOperatorAtNativePosition(
  track: EliminatedTrack,
  contractionWindow: { readonly start: number; readonly end: number },
  releaseWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  return Object.freeze({
    ...releaseAtNativePosition(track, releaseWindow),
    sampleMaterialScale: scaleWindow({
      window: contractionWindow,
      from: 1,
      to: kpNativeKatexLogProductHomomorphicProfile.operatorPointScale
    })
  });
}

function revealAtNativePosition(
  track: IntroducedTrack,
  presenceWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: Object.freeze({ ...track.endRect }),
    endRect: Object.freeze({ ...track.endRect }),
    startPaintRect: Object.freeze({ ...track.endPaintRect }),
    endPaintRect: Object.freeze({ ...track.endPaintRect }),
    sampleProgress: sampleWindow(presenceWindow),
    sampleOpacityProgress: sampleWindow(presenceWindow),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function revealSyntaxAtNativePosition(
  track: IntroducedTrack,
  presenceWindow: { readonly start: number; readonly end: number },
  expansionWindow: { readonly start: number; readonly end: number }
): KpNativeKatexPaintMeasuredSceneTrack {
  return Object.freeze({
    ...revealAtNativePosition(track, presenceWindow),
    sampleMaterialScale: scaleWindow({
      window: expansionWindow,
      from: kpNativeKatexLogProductHomomorphicProfile.operatorPointScale,
      to: 1
    })
  });
}

function scaleWindow(input: {
  readonly window: { readonly start: number; readonly end: number };
  readonly from: number;
  readonly to: number;
}): (progress: number) => number {
  const sample = sampleWindow(input.window);
  return (progress) => input.from + (input.to - input.from) * sample(progress);
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
