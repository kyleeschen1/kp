import {
  kpCanonicalFunctionWrapMotionProfile
} from "../animation/function-wrap-motion-profile.ts";
import type {
  KpFunctionWrapReceptionPlan
} from "../animation/function-wrap-reception.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export const kpNativeKatexFunctionWrapReceptionStyle = Object.freeze({
  initialScale:
    kpCanonicalFunctionWrapMotionProfile.enclosureReception.initialScale,
  outwardOffsetInNativeHeights: 0.42
});

/**
 * Native KaTeX owns the physical expression of enclosure reception. The plan
 * supplies semantic leading/trailing roles, so this adapter never guesses
 * from glyph text, selector suffixes, or DOM order.
 */
export function applyKpNativeKatexFunctionWrapReception(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpFunctionWrapReceptionPlan;
  readonly entryWindow: { readonly start: number; readonly end: number };
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const endpoint = input.plan.direction === "forward"
    ? input.target
    : input.source;
  const expectedLifecycle = input.plan.direction === "forward"
    ? "introduce" as const
    : "eliminate" as const;
  const entityByAtomId = new Map(endpoint.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const roleByEntityId = new Map(input.plan.branches.flatMap((branch) =>
    branch.enclosureEntityRoles.map((role) => [
      role.entityId,
      role.side
    ] as const)
  ));
  const matched = new Set<string>();
  const sample = (progress: number) => smoothWindow(
    progress,
    input.entryWindow.start,
    input.entryWindow.end
  );
  const tracks = input.tracks.map((track) => {
    const atomId = input.plan.direction === "forward"
      ? track.targetAtomId
      : track.sourceAtomId;
    const entityId = atomId === undefined
      ? undefined
      : entityByAtomId.get(atomId);
    const side = entityId === undefined
      ? undefined
      : roleByEntityId.get(entityId);
    if (side === undefined || track.lifecycle !== expectedLifecycle) {
      return track;
    }
    matched.add(entityId!);
    const nativeRect = input.plan.direction === "forward"
      ? track.endPaintRect ?? track.endRect
      : track.startPaintRect ?? track.startRect;
    const receptiveRect = outsideReceptionRect(nativeRect, side);
    return Object.freeze({
      ...track,
      ...(input.plan.direction === "forward"
        ? {
            startPaintRect: receptiveRect,
            endPaintRect: Object.freeze({ ...nativeRect })
          }
        : {
            startPaintRect: Object.freeze({ ...nativeRect }),
            endPaintRect: receptiveRect
          }),
      timingGroupId: input.plan.id,
      opacityScheduleAuthority: "semantic-choreography" as const,
      sampleProgress: sample,
      sampleOpacityProgress: sample
    });
  });
  const missing = [...roleByEntityId.keys()].filter((id) => !matched.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Function-wrap reception ${input.plan.id} lacks native enclosure paint: ${missing.join(", ")}.`
    );
  }
  return Object.freeze(tracks);
}

function outsideReceptionRect(
  nativeRect: KpNativeKatexPaintMeasuredSceneTrack["startRect"],
  side: "leading" | "trailing"
): KpNativeKatexPaintMeasuredSceneTrack["startRect"] {
  const scale = kpNativeKatexFunctionWrapReceptionStyle.initialScale;
  const width = nativeRect.width * scale;
  const height = nativeRect.height * scale;
  const outward =
    nativeRect.height *
    kpNativeKatexFunctionWrapReceptionStyle.outwardOffsetInNativeHeights *
    (side === "leading" ? -1 : 1);
  const centerX = nativeRect.left + nativeRect.width / 2 + outward;
  const centerY = nativeRect.top + nativeRect.height / 2;
  return Object.freeze({
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height
  });
}

function smoothWindow(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}
