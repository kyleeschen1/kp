import type {
  KpCounterOrbitCancellationChoreography,
  KpSynchronizedBalancedIntroductionChoreography
} from "../animation/equation-operation-choreography.ts";
import type {
  KpRegisteredEquationOperationChoreography
} from "../animation/balanced-introduction-presentation-plan.ts";
import type {
  KpOperationPresentationBundle
} from "../animation/operation-presentation-roles.ts";
export type {
  KpRegisteredEquationOperationChoreography as KpEquationOperationChoreography
} from "../animation/balanced-introduction-presentation-plan.ts";
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
  readonly choreography?:
    KpRegisteredEquationOperationChoreography | undefined;
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
  choreography: Extract<
    KpRegisteredEquationOperationChoreography,
    { readonly kind: "counter-orbit-cancellation" }
  >
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (choreography.operationPresentationPlan !== undefined) {
    return applyRoleCompleteCounterOrbit(input, choreography);
  }
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

function applyRoleCompleteCounterOrbit(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: Parameters<typeof applyCounterOrbit>[1]
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const plan = choreography.operationPresentationPlan!;
  if (
    plan.transformationId !== choreography.transformationId ||
    plan.planKind !== "inverse-cancellation"
  ) {
    throw new Error(
      `Counter-orbit choreography ${choreography.id} requires its verified ` +
      "inverse-cancellation plan."
    );
  }
  const endpoint = choreography.direction === "forward"
    ? input.source
    : input.target;
  const expectedLifecycle = choreography.direction === "forward"
    ? "eliminate"
    : "introduce";
  const atomsById = new Map(endpoint.atoms.map((atom) => [atom.id, atom]));
  const bundleById = new Map(plan.roles.bundles.map((bundle) => [
    bundle.id,
    bundle
  ]));
  const inverseBundles = plan.inverseBundleIds.map((bundleId) => {
    const bundle = bundleById.get(bundleId);
    if (bundle?.role !== "source-material") {
      throw new Error(
        `Cancellation plan ${plan.id} has invalid inverse bundle ${bundleId}.`
      );
    }
    return bundle;
  });
  const selectedByBundleId = new Map(plan.roles.bundles.map((bundle) => [
    bundle.id,
    selectBundleTracks({
      tracks: input.tracks,
      atomsById,
      bundle,
      direction: choreography.direction,
      expectedLifecycle
    })
  ]));
  const inverseTrackGroups = inverseBundles.map((bundle) => {
    const selected = selectedByBundleId.get(bundle.id)!;
    assertEntityCoverage(
      bundle.semanticEntityIds,
      new Set(selected.map(({ entityId }) => entityId)),
      `${choreography.id}.${bundle.id}`
    );
    return selected;
  });
  const inverseBounds = inverseTrackGroups.map((selected) =>
    union(selected.map(({ track }) =>
      endpointPaintRect(track, choreography.direction)
    ))
  );
  const contact = center(union(inverseBounds));
  const inverseTrackRole = new Map(
    inverseTrackGroups.flatMap((selected, bundleIndex) =>
      selected.map(({ track }) => [
        track.id,
        { bundleIndex, bundleBounds: inverseBounds[bundleIndex]! }
      ] as const)
    )
  );
  const collapseTrackRole = new Map(
    plan.roles.bundles
      .filter(({ role }) => role === "catalyst" || role === "artifact")
      .flatMap((bundle) =>
        selectedByBundleId.get(bundle.id)!.map(({ track }) => [
          track.id,
          bundle.role
        ] as const)
      )
  );
  for (const bundle of plan.roles.bundles) {
    const selected = selectedByBundleId.get(bundle.id)!;
    if (bundle.role === "continuant") {
      assertContinuantPaintCoverage(input, bundle, choreography.id);
      continue;
    }
    assertEntityCoverage(
      bundle.semanticEntityIds,
      new Set(selected.map(({ entityId }) => entityId)),
      `${choreography.id}.${bundle.id}`
    );
  }

  return Object.freeze(input.tracks.map((track) => {
    const inverse = inverseTrackRole.get(track.id);
    if (inverse !== undefined) {
      const originalPaint = endpointPaintRect(track, choreography.direction);
      const originalLayout = endpointLayoutRect(
        track,
        choreography.direction
      );
      const bundleCenter = center(inverse.bundleBounds);
      const delta = {
        x: contact.x - bundleCenter.x,
        y: contact.y - bundleCenter.y
      };
      const shiftedLayout = translateRect(originalLayout, delta);
      const shiftedPaint = translateRect(originalPaint, delta);
      const start = choreography.direction === "forward"
        ? center(originalPaint)
        : center(shiftedPaint);
      const end = choreography.direction === "forward"
        ? center(shiftedPaint)
        : center(originalPaint);
      const path = planKpEquationMotionPathBetweenPoints({
        id: `operation-path.${choreography.id}.${track.id}`,
        relationRecordId: choreography.relationRecordId,
        start,
        end,
        variants: [
          inverse.bundleIndex === 0 ? "arc-above" : "arc-below"
        ],
        clearance: 14
      }).selected;
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
        timingGroupId: plan.contactGroupId,
        intentionalContactGroupId: plan.contactGroupId,
        sampleProgress: (progress: number) =>
          sampleCounterOrbitProgress(choreography, progress, "meet"),
        sampleOpacityProgress: (progress: number) =>
          sampleCounterOrbitProgress(choreography, progress, "collapse")
      });
    }
    const collapseRole = collapseTrackRole.get(track.id);
    if (collapseRole === undefined) return track;
    const originalLayout = endpointLayoutRect(track, choreography.direction);
    const originalPaint = endpointPaintRect(track, choreography.direction);
    // Catalysts and artifacts retire on the shared collapse clock but never
    // influence orbit direction or borrow an inverse bundle's curved path.
    return Object.freeze({
      ...track,
      ...(choreography.direction === "forward"
        ? {
            endRect: Object.freeze({ ...originalLayout }),
            endPaintRect: Object.freeze({ ...originalPaint })
          }
        : {
            startRect: Object.freeze({ ...originalLayout }),
            startPaintRect: Object.freeze({ ...originalPaint })
          }),
      timingGroupId: `${plan.contactGroupId}.${collapseRole}`,
      sampleProgress: (progress: number) =>
        sampleCounterOrbitProgress(choreography, progress, "collapse"),
      sampleOpacityProgress: (progress: number) =>
        sampleCounterOrbitProgress(choreography, progress, "collapse")
    });
  }));
}

function selectBundleTracks(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly atomsById: ReadonlyMap<
    string,
    KpNativeKatexRenderedSceneObservation["atoms"][number]
  >;
  readonly bundle: KpOperationPresentationBundle;
  readonly direction: "forward" | "rewind";
  readonly expectedLifecycle: "eliminate" | "introduce";
}) {
  return input.tracks.flatMap((track) => {
    if (track.lifecycle !== input.expectedLifecycle) return [];
    const atomId = input.direction === "forward"
      ? track.sourceAtomId
      : track.targetAtomId;
    const entityId = atomId === undefined
      ? undefined
      : input.atomsById.get(atomId)?.semanticEntityId;
    return entityId !== undefined &&
        input.bundle.semanticEntityIds.includes(entityId)
      ? [{ track, entityId }]
      : [];
  });
}

function assertContinuantPaintCoverage(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  bundle: KpOperationPresentationBundle,
  choreographyId: string
): void {
  const paintIds = new Set([
    ...input.source.atoms.map(({ semanticEntityId }) => semanticEntityId),
    ...input.target.atoms.map(({ semanticEntityId }) => semanticEntityId)
  ]);
  assertEntityCoverage(
    bundle.semanticEntityIds,
    paintIds,
    `${choreographyId}.${bundle.id}`
  );
}

function endpointPaintRect(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  direction: "forward" | "rewind"
): Rect {
  return direction === "forward"
    ? track.startPaintRect ?? track.startRect
    : track.endPaintRect ?? track.endRect;
}

function endpointLayoutRect(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  direction: "forward" | "rewind"
): Rect {
  return direction === "forward" ? track.startRect : track.endRect;
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

function translateRect(
  rect: Rect,
  delta: { readonly x: number; readonly y: number }
): Rect {
  return {
    ...rect,
    left: rect.left + delta.x,
    top: rect.top + delta.y
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
