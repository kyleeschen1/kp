import type {
  KpCounterOrbitCancellationChoreography,
  KpEquationOperationChoreography,
  KpSynchronizedBalancedIntroductionChoreography
} from "../animation/equation-operation-choreography.ts";
export type {
  KpEquationOperationChoreography
} from "../animation/equation-operation-choreography.ts";
import {
  sampleKpEquationLinearRearrangementFrame
} from "./equation-linear-rearrangement.ts";
import {
  planKpEquationMotionPathBetweenPoints
} from "./equation-motion-path-planner.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";

export function applyKpNativeKatexOperationChoreography(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly choreography?: KpEquationOperationChoreography | undefined;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (input.choreography === undefined) return input.tracks;
  return input.choreography.kind === "counter-orbit-cancellation"
    ? applyCounterOrbit(input, input.choreography)
    : applySynchronizedIntroduction(input, input.choreography);
}

function applySynchronizedIntroduction(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpSynchronizedBalancedIntroductionChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const endpoint = choreography.direction === "forward"
    ? input.target
    : input.source;
  const atomsById = new Map(endpoint.atoms.map((atom) => [atom.id, atom]));
  const expectedLifecycle = choreography.direction === "forward"
    ? "introduce"
    : "eliminate";
  const branchesByEntityId = new Map(
    choreography.branchSchedule.operation.branches.flatMap((branch) =>
      branch.entityIds.map((entityId) => [entityId, branch.id] as const)
    )
  );
  const matchedEntityIds = new Set<string>();
  const tracks = input.tracks.map((track) => {
    if (track.lifecycle !== expectedLifecycle) return track;
    const atomId = choreography.direction === "forward"
      ? track.targetAtomId
      : track.sourceAtomId;
    const entityId = atomId === undefined
      ? undefined
      : atomsById.get(atomId)?.semanticEntityId;
    if (entityId === undefined || !branchesByEntityId.has(entityId)) {
      return track;
    }
    const branchId = branchesByEntityId.get(entityId)!;
    matchedEntityIds.add(entityId);
    const sample = (progress: number) =>
      sampleBalancedBranchProgress(choreography, branchId, progress);
    return Object.freeze({
      ...track,
      timingGroupId: choreography.id,
      sampleProgress: sample,
      sampleOpacityProgress: sample
    });
  });
  assertEntityCoverage(
    choreography.semanticEntityIds,
    matchedEntityIds,
    choreography.id
  );
  return Object.freeze(tracks);
}

function sampleBalancedBranchProgress(
  choreography: KpSynchronizedBalancedIntroductionChoreography,
  branchId: string,
  progress: number
): number {
  const local = windowProgress(progress, 0.38, 0.7);
  const sampled = choreography.direction === "forward"
    ? choreography.branchSchedule.sample(local)
    : choreography.branchSchedule.sampleInverse(local);
  const result = sampled[branchId];
  if (result === undefined) {
    throw new Error(
      `Balanced choreography ${choreography.id} does not schedule ${branchId}.`
    );
  }
  return result;
}

function applyCounterOrbit(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpCounterOrbitCancellationChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const endpoint = choreography.direction === "forward"
    ? input.source
    : input.target;
  const atomsById = new Map(endpoint.atoms.map((atom) => [atom.id, atom]));
  const expectedLifecycle = choreography.direction === "forward"
    ? "eliminate"
    : "introduce";
  const selected = input.tracks.flatMap((track) => {
    if (track.lifecycle !== expectedLifecycle) return [];
    const atomId = choreography.direction === "forward"
      ? track.sourceAtomId
      : track.targetAtomId;
    const atom = atomId === undefined ? undefined : atomsById.get(atomId);
    return atom !== undefined &&
        choreography.semanticEntityIds.includes(atom.semanticEntityId)
      ? [{ track, entityId: atom.semanticEntityId }]
      : [];
  });
  const matchedEntityIds = new Set(selected.map(({ entityId }) => entityId));
  assertEntityCoverage(
    choreography.semanticEntityIds,
    matchedEntityIds,
    choreography.id
  );
  if (selected.length < 2) {
    throw new Error(
      `Counter-orbit choreography ${choreography.id} requires two paint tracks.`
    );
  }

  const selectedIds = new Set(selected.map(({ track }) => track.id));
  const contact = center(union(selected.map(({ track }) =>
    choreography.direction === "forward"
      ? track.startPaintRect ?? track.startRect
      : track.endPaintRect ?? track.endRect
  )));
  const entityBounds = new Map(choreography.semanticEntityIds.map((entityId) => [
    entityId,
    union(selected
      .filter((candidate) => candidate.entityId === entityId)
      .map(({ track }) =>
        choreography.direction === "forward"
          ? track.startPaintRect ?? track.startRect
          : track.endPaintRect ?? track.endRect
      ))
  ]));
  const entityByTrackId = new Map(
    selected.map(({ track, entityId }) => [track.id, entityId])
  );

  return Object.freeze(input.tracks.map((track) => {
    if (!selectedIds.has(track.id)) return track;
    const entityId = entityByTrackId.get(track.id)!;
    const orbitAbove = center(entityBounds.get(entityId)!).x <= contact.x;
    const originalPaint = choreography.direction === "forward"
      ? track.startPaintRect ?? track.startRect
      : track.endPaintRect ?? track.endRect;
    const originalLayout = choreography.direction === "forward"
      ? track.startRect
      : track.endRect;
    const shiftedLayout = translateToCenter(originalLayout, originalPaint, contact);
    const shiftedPaint = translateRectToCenter(originalPaint, contact);
    const start = choreography.direction === "forward"
      ? center(originalPaint)
      : contact;
    const end = choreography.direction === "forward"
      ? contact
      : center(originalPaint);
    const path = planKpEquationMotionPathBetweenPoints({
      id: `operation-path.${choreography.id}.${track.id}`,
      relationRecordId: choreography.relationRecordId,
      start,
      end,
      variants: [orbitAbove ? "arc-above" : "arc-below"],
      clearance: 14
    }).selected;
    const sampleProgress = (progress: number) =>
      sampleCounterOrbitProgress(choreography, progress, "meet");
    const sampleOpacityProgress = (progress: number) =>
      sampleCounterOrbitProgress(choreography, progress, "collapse");
    return Object.freeze({
      ...track,
      ...(choreography.direction === "forward"
        ? {
            endRect: Object.freeze(shiftedLayout),
            endPaintRect: Object.freeze(shiftedPaint)
          }
        : {
            startRect: Object.freeze(shiftedLayout),
            startPaintRect: Object.freeze(shiftedPaint)
          }),
      motionPath: path,
      motionPathSampling: "planned-curve" as const,
      timingGroupId: choreography.id,
      intentionalContactGroupId: choreography.id,
      sampleProgress,
      sampleOpacityProgress
    });
  }));
}

function sampleCounterOrbitProgress(
  choreography: KpCounterOrbitCancellationChoreography,
  progress: number,
  field: "meet" | "collapse"
): number {
  if (choreography.direction === "forward") {
    const frame = sampleKpEquationLinearRearrangementFrame(
      choreography.linearRearrangementKind,
      progress,
      choreography.cancellationRecipe,
      undefined,
      choreography.zeroWitnessRecipe
    );
    return field === "meet"
      ? frame.meetProgress
      : frame.collapseProgress;
  }
  const frame = sampleKpEquationLinearRearrangementFrame(
    choreography.linearRearrangementKind,
    1 - progress,
    choreography.cancellationRecipe,
    undefined,
    choreography.zeroWitnessRecipe
  );
  return 1 - (field === "meet"
    ? frame.meetProgress
    : frame.collapseProgress);
}

function assertEntityCoverage(
  expected: readonly string[],
  actual: ReadonlySet<string>,
  choreographyId: string
): void {
  const missing = expected.filter((entityId) => !actual.has(entityId));
  if (missing.length > 0) {
    throw new Error(
      `Operation choreography ${choreographyId} has no measured paint for ` +
      `${missing.join(", ")}.`
    );
  }
}

type Rect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

function translateToCenter(
  layout: Rect,
  paint: Rect,
  target: { readonly x: number; readonly y: number }
): Rect {
  const paintCenter = center(paint);
  return {
    ...layout,
    left: layout.left + target.x - paintCenter.x,
    top: layout.top + target.y - paintCenter.y
  };
}

function translateRectToCenter(
  rect: Rect,
  target: { readonly x: number; readonly y: number }
): Rect {
  return {
    ...rect,
    left: target.x - rect.width / 2,
    top: target.y - rect.height / 2
  };
}

function union(rects: readonly Rect[]): Rect {
  if (rects.length === 0) {
    throw new Error("Operation choreography cannot union an empty paint set.");
  }
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: Rect): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function windowProgress(progress: number, start: number, end: number): number {
  const bounded = Math.max(0, Math.min(1, progress));
  return Math.max(0, Math.min(1, (bounded - start) / (end - start)));
}
