import type {
  KpCanonicalFunctionWrapChoreography,
  KpCausalStructuralIntroductionChoreography,
  KpCounterOrbitCancellationChoreography,
  KpHomomorphicFusionChoreography,
  KpSemanticRoleTransferChoreography,
  KpSynchronizedBalancedIntroductionChoreography
} from "../animation/equation-operation-choreography.ts";
import type {
  KpRegisteredEquationOperationChoreography
} from "../animation/balanced-introduction-presentation-plan.ts";
import type {
  KpOperationPresentationBundle
} from "../animation/operation-presentation-roles.ts";
import {
  operationPresentationPlanAuthorityId
} from "../animation/operation-presentation-plan-types.ts";
export type {
  KpRegisteredEquationOperationChoreography as KpEquationOperationChoreography
} from "../animation/balanced-introduction-presentation-plan.ts";
export type {
  KpNativeKatexFactoringSceneBinding
} from "./native-katex-factoring-choreography.ts";
import {
  sampleKpEquationLinearRearrangementFrame
} from "./equation-linear-rearrangement.ts";
import {
  kpCounterOrbitCancellationTiming
} from "../animation/counter-orbit-cancellation-timing.ts";
import {
  inspectKpEquationProtectedTransitTracks,
  planKpEquationMotionPathBetweenPoints,
  type KpProtectedTransitAudit
} from "./equation-motion-path-planner.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "./native-katex-scene-track-sampling.ts";
import {
  applyKpNativeKatexFunctionWrapReception
} from "./native-katex-function-wrap-reception.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";

const kpCanonicalNativeKatexFunctionWrapTreatment = Object.freeze({
  syntaxPointScale: 0.04,
  horizontalSqueeze: Object.freeze({
    outwardOffsetInNativeHeights: 0.11
  })
});

export function applyKpNativeKatexOperationChoreography(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly choreography?:
    KpRegisteredEquationOperationChoreography | undefined;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (input.choreography === undefined) return input.tracks;
  switch (input.choreography.kind) {
    case "counter-orbit-cancellation":
      return applyCounterOrbit(input, input.choreography);
    case "synchronized-balanced-introduction":
      return applySynchronizedIntroduction(input, input.choreography);
    case "causal-structural-introduction":
      return applyCausalStructuralIntroduction(input, input.choreography);
    case "semantic-role-transfer":
      return applySemanticRoleTransfer(input, input.choreography);
    case "canonical-function-wrap":
      return applyCanonicalFunctionWrap(input, input.choreography);
    case "homomorphic-fusion":
      return applyHomomorphicFusion(input, input.choreography);
  }
}

function applySemanticRoleTransfer(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpSemanticRoleTransferChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  // The choreography validates the whole semantic rewrite, while the existing
  // symbol-motion contract remains the sole timing authority for retiring and
  // entering structure. This adapter only promotes the role-changing object.
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const forward = choreography.direction === "forward";
  const transferSourceId = forward
    ? choreography.roleTransfer.sourceEntityIds[0]!
    : choreography.roleTransfer.targetEntityIds[0]!;
  const transferTargetId = forward
    ? choreography.roleTransfer.targetEntityIds[0]!
    : choreography.roleTransfer.sourceEntityIds[0]!;
  const contextPairs = new Set(choreography.contextContinuants.flatMap(
    (continuant) => continuant.sourceEntityIds.flatMap((sourceEntityId) =>
      continuant.targetEntityIds.map((targetEntityId) =>
        semanticPairKey(
          forward ? sourceEntityId : targetEntityId,
          forward ? targetEntityId : sourceEntityId
        )
      )
    )
  ));
  let matchedTransfer = false;
  let matchedContext = false;
  const tracks = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    if (
      track.lifecycle === "persist" &&
      sourceEntityId === transferSourceId &&
      targetEntityId === transferTargetId
    ) {
      matchedTransfer = true;
      return Object.freeze({
        ...track,
        timingGroupId: `${choreography.id}.role-transfer`,
        opacityScheduleAuthority: "semantic-choreography" as const
      });
    }
    if (
      track.lifecycle === "persist" &&
      sourceEntityId !== undefined &&
      targetEntityId !== undefined &&
      contextPairs.has(semanticPairKey(sourceEntityId, targetEntityId))
    ) {
      matchedContext = true;
      // Existing rigid-compound authority owns the residual logarithm and
      // unchanged right-hand side. Re-grouping that paint here invalidates
      // their already-certified collision schedule.
      return track;
    }
    return track;
  });
  if (!matchedTransfer) {
    throw new Error(
      `Operation choreography ${choreography.id} has no measured role-transfer continuant.`
    );
  }
  if (!matchedContext) {
    throw new Error(
      `Operation choreography ${choreography.id} has no measured persistent context.`
    );
  }
  return Object.freeze(tracks);
}

function applyHomomorphicFusion(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpHomomorphicFusionChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const forward = choreography.direction === "forward";
  const operatorExitIds = new Set(forward
    ? choreography.operatorGlyphFusion.sourceEntityIds
    : choreography.operatorGlyphFusion.targetEntityIds);
  const operatorEntryIds = new Set(forward
    ? choreography.operatorGlyphFusion.targetEntityIds
    : choreography.operatorGlyphFusion.sourceEntityIds);
  const transferByPair = new Map(choreography.argumentTransfers.map((transfer) => {
    const sourceId = forward
      ? transfer.sourceEntityIds[0]!
      : transfer.targetEntityIds[0]!;
    const targetId = forward
      ? transfer.targetEntityIds[0]!
      : transfer.sourceEntityIds[0]!;
    return [`${sourceId}\u0000${targetId}`, transfer] as const;
  }));
  const sourceRetirementIds = new Set(
    choreography.sourceEnclosureRetirement.sourceEntityIds
  );
  const connectorIds = new Set(
    choreography.connectorDerivation.sourceEntityIds
  );
  const targetEntryByEntityId = new Map(
    choreography.targetStructureEntries.flatMap((entry) =>
      entry.targetEntityIds.map((entityId) => [entityId, entry] as const)
    )
  );
  const matchedOperatorExits = new Set<string>();
  const matchedOperatorEntries = new Set<string>();
  const matchedTransfers = new Set<string>();
  const matchedRetirement = new Set<string>();
  const matchedTargetEntries = new Set<string>();
  let matchedConnectorPaint = false;

  const tracks = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    const operatorExitEntityId = forward ? sourceEntityId : targetEntityId;
    if (
      operatorExitEntityId !== undefined &&
      operatorExitIds.has(operatorExitEntityId) &&
      track.lifecycle === (forward ? "eliminate" : "introduce")
    ) {
      matchedOperatorExits.add(operatorExitEntityId);
      const sample = (progress: number) => directionalWindowProgress(
        choreography,
        progress,
        choreography.operatorVisualHandoff.sourceReleaseWindow
      );
      const nativeRect = forward ? track.startRect : track.endRect;
      const nativePaintRect = forward
        ? track.startPaintRect
        : track.endPaintRect;
      return Object.freeze({
        ...track,
        startRect: Object.freeze({ ...nativeRect }),
        endRect: Object.freeze({ ...nativeRect }),
        ...(nativePaintRect === undefined
          ? {}
          : {
              startPaintRect: Object.freeze({ ...nativePaintRect }),
              endPaintRect: Object.freeze({ ...nativePaintRect })
            }),
        timingGroupId: `${choreography.id}.operator-source-release`,
        semanticMotionUnitId: `${choreography.id}.operator-source-release`,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }
    const operatorEntryEntityId = forward ? targetEntityId : sourceEntityId;
    if (
      operatorEntryEntityId !== undefined &&
      operatorEntryIds.has(operatorEntryEntityId) &&
      track.lifecycle === (forward ? "introduce" : "eliminate")
    ) {
      matchedOperatorEntries.add(operatorEntryEntityId);
      const sample = (progress: number) => directionalWindowProgress(
        choreography,
        progress,
        choreography.operatorVisualHandoff.targetPresenceWindow
      );
      const nativeRect = forward ? track.endRect : track.startRect;
      const nativePaintRect = forward
        ? track.endPaintRect
        : track.startPaintRect;
      return Object.freeze({
        ...track,
        startRect: Object.freeze({ ...nativeRect }),
        endRect: Object.freeze({ ...nativeRect }),
        ...(nativePaintRect === undefined
          ? {}
          : {
              startPaintRect: Object.freeze({ ...nativePaintRect }),
              endPaintRect: Object.freeze({ ...nativePaintRect })
            }),
        timingGroupId: `${choreography.id}.operator-target-reception`,
        semanticMotionUnitId: `${choreography.id}.operator-target-reception`,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }
    if (sourceEntityId !== undefined && targetEntityId !== undefined) {
      const transfer = transferByPair.get(
        `${sourceEntityId}\u0000${targetEntityId}`
      );
      if (transfer !== undefined && track.lifecycle === "persist") {
        matchedTransfers.add(transfer.id);
        const startRect = track.startPaintRect ?? track.startRect;
        const endRect = track.endPaintRect ?? track.endRect;
        const localInkHeight = Math.max(startRect.height, endRect.height, 1);
        const path = planKpEquationMotionPathBetweenPoints({
          id: `operation-path.${choreography.id}.${transfer.id}.${track.id}`,
          relationRecordId: transfer.relationRecordId,
          start: center(startRect),
          end: center(endRect),
          variants: [transfer.route],
          clearance: localInkHeight * 0.9
        }).selected;
        return Object.freeze({
          ...track,
          motionPath: path,
          motionPathSampling: "planned-curve" as const,
          timingGroupId: `${choreography.id}.argument-transfer`,
          semanticMotionUnitId: `${choreography.id}.argument.${transfer.id}`,
          sampleProgress: (progress: number) => directionalWindowProgress(
            choreography,
            progress,
            choreography.argumentTransferWindow
          )
        });
      }
    }

    const retirementEntityId = forward ? sourceEntityId : targetEntityId;
    const retirementLifecycle = forward ? "eliminate" : "introduce";
    if (
      retirementEntityId !== undefined &&
      track.lifecycle === retirementLifecycle &&
      (
        sourceRetirementIds.has(retirementEntityId) ||
        connectorIds.has(retirementEntityId)
      )
    ) {
      if (sourceRetirementIds.has(retirementEntityId)) {
        matchedRetirement.add(retirementEntityId);
      }
      if (connectorIds.has(retirementEntityId)) matchedConnectorPaint = true;
      const exitWindow = connectorIds.has(retirementEntityId)
        ? choreography.connectorDerivation.exitWindow
        : choreography.sourceEnclosureRetirement.exitWindow;
      const sample = (progress: number) => directionalWindowProgress(
        choreography,
        progress,
        exitWindow
      );
      const fixedRect = forward ? track.startRect : track.endRect;
      const fixedPaintRect = forward
        ? track.startPaintRect
        : track.endPaintRect;
      return Object.freeze({
        ...track,
        startRect: Object.freeze({ ...fixedRect }),
        endRect: Object.freeze({ ...fixedRect }),
        ...(fixedPaintRect === undefined
          ? {}
          : {
              startPaintRect: Object.freeze({ ...fixedPaintRect }),
              endPaintRect: Object.freeze({ ...fixedPaintRect })
            }),
        timingGroupId: connectorIds.has(retirementEntityId)
          ? `${choreography.id}.connector-retirement`
          : `${choreography.id}.source-retirement`,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }

    const entryEntityId = forward ? targetEntityId : sourceEntityId;
    const entryLifecycle = forward ? "introduce" : "eliminate";
    const entry = entryEntityId === undefined
      ? undefined
      : targetEntryByEntityId.get(entryEntityId);
    if (entry !== undefined && track.lifecycle === entryLifecycle) {
      matchedTargetEntries.add(entryEntityId!);
      const sample = (progress: number) => directionalWindowProgress(
        choreography,
        progress,
        entry.entryWindow
      );
      const nativeRect = forward ? track.endRect : track.startRect;
      const nativePaintRect = forward
        ? track.endPaintRect
        : track.startPaintRect;
      const isEnteringRule = forward && track.paintKind === "rule";
      const startRect = isEnteringRule
        ? collapseToCenteredHairline(nativeRect)
        : nativeRect;
      const endRect = forward ? nativeRect : (
        track.paintKind === "rule"
          ? collapseToCenteredHairline(nativeRect)
          : nativeRect
      );
      return Object.freeze({
        ...track,
        startRect: Object.freeze({ ...startRect }),
        endRect: Object.freeze({ ...endRect }),
        ...(nativePaintRect === undefined
          ? {}
          : {
              startPaintRect: Object.freeze({
                ...(isEnteringRule
                  ? collapseToCenteredHairline(nativePaintRect)
                  : nativePaintRect)
              }),
              endPaintRect: Object.freeze({
                ...(!forward && track.paintKind === "rule"
                  ? collapseToCenteredHairline(nativePaintRect)
                  : nativePaintRect)
              })
            }),
        timingGroupId: `${choreography.id}.target-structure`,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample
      });
    }
    return track;
  });

  assertEntityCoverage(
    [...operatorExitIds],
    matchedOperatorExits,
    `${choreography.id}.operator-source-release`
  );
  assertEntityCoverage(
    [...operatorEntryIds],
    matchedOperatorEntries,
    `${choreography.id}.operator-target-reception`
  );
  assertEntityCoverage(
    choreography.argumentTransfers.map(({ id }) => id),
    matchedTransfers,
    `${choreography.id}.argument-transfer`
  );
  assertEntityCoverage(
    choreography.sourceEnclosureRetirement.sourceEntityIds,
    matchedRetirement,
    `${choreography.id}.source-retirement`
  );
  assertEntityCoverage(
    [...targetEntryByEntityId.keys()],
    matchedTargetEntries,
    `${choreography.id}.target-structure`
  );
  if (!matchedConnectorPaint) {
    throw new Error(
      `Operation choreography ${choreography.id} has no connector paint to retire.`
    );
  }
  return Object.freeze(tracks);
}

function directionalWindowProgress(
  choreography: KpHomomorphicFusionChoreography,
  progress: number,
  window: { readonly start: number; readonly end: number }
): number {
  return choreography.direction === "forward"
    ? smoothWindow(progress, window.start, window.end)
    : 1 - smoothWindow(1 - progress, window.start, window.end);
}

function applyCanonicalFunctionWrap(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpCanonicalFunctionWrapChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const sourceEntities = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntities = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const argumentBranchByPair = new Map(choreography.branches.flatMap(
    (branch) => branch.sourceArgumentEntityIds.flatMap((sourceEntityId) =>
      branch.targetArgumentEntityIds.map((targetEntityId) => [
        `${sourceEntityId}\u0000${targetEntityId}`,
        branch.id
      ] as const)
    )
  ));
  const wrapperBranchByEntity = new Map(choreography.branches.flatMap(
    (branch) => branch.wrapperEntityIds.map((entityId) => [
      entityId,
      branch.id
    ] as const)
  ));
  const syntaxEntityIds = new Set(choreography.reception.branches.flatMap(
    ({ syntaxEntityIds }) => syntaxEntityIds
  ));
  const argumentPaintByBranch = new Set<string>();
  const wrapperPaintByBranch = new Set<string>();
  const tracks = input.tracks.map((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntities.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntities.get(track.targetAtomId);
    const argumentBranch =
      sourceEntityId === undefined || targetEntityId === undefined
        ? undefined
        : argumentBranchByPair.get(
            `${sourceEntityId}\u0000${targetEntityId}`
          );
    if (argumentBranch !== undefined && track.lifecycle === "persist") {
      argumentPaintByBranch.add(argumentBranch);
      return Object.freeze({
        ...track,
        timingGroupId: `${choreography.id}.${argumentBranch}.argument`,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: (progress: number) => smoothWindow(
          progress,
          choreography.argumentReflowWindow.start,
          choreography.argumentReflowWindow.end
        )
      });
    }
    const wrapperEntityId = choreography.direction === "forward"
      ? targetEntityId
      : sourceEntityId;
    const wrapperBranch = wrapperEntityId === undefined
      ? undefined
      : wrapperBranchByEntity.get(wrapperEntityId);
    const expectedLifecycle = choreography.direction === "forward"
      ? "introduce"
      : "eliminate";
    if (wrapperBranch === undefined || track.lifecycle !== expectedLifecycle) {
      return track;
    }
    wrapperPaintByBranch.add(wrapperBranch);
    const wrapperReceptionContactGroupId =
      `${choreography.id}.${wrapperBranch}.wrapper-reception`;
    const sample = (progress: number) => smoothWindow(
      progress,
      choreography.wrapperEntryWindow.start,
      choreography.wrapperEntryWindow.end
    );
    if (wrapperEntityId !== undefined && syntaxEntityIds.has(wrapperEntityId)) {
      const nativeRect = choreography.direction === "forward"
        ? track.endRect
        : track.startRect;
      const nativePaintRect = choreography.direction === "forward"
        ? track.endPaintRect
        : track.startPaintRect;
      const pointScale =
        kpCanonicalNativeKatexFunctionWrapTreatment.syntaxPointScale;
      return Object.freeze({
        ...invalidateKpNativeKatexMotionPath(track),
        startRect: Object.freeze({ ...nativeRect }),
        endRect: Object.freeze({ ...nativeRect }),
        ...(nativePaintRect === undefined
          ? {}
          : {
              startPaintRect: Object.freeze({ ...nativePaintRect }),
              endPaintRect: Object.freeze({ ...nativePaintRect })
            }),
        timingGroupId: choreography.id,
        // A function name and its adjacent enclosure are one typed reception
        // unit. Their temporary contact during a horizontal squeeze is the
        // motif itself, not unrelated paint crowding.
        intentionalContactGroupId: wrapperReceptionContactGroupId,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: sample,
        sampleOpacityProgress: sample,
        sampleMaterialScale: (progress: number) => {
          const local = sample(progress);
          return choreography.direction === "forward"
            ? pointScale + (1 - pointScale) * local
            : 1 - (1 - pointScale) * local;
        }
      });
    }
    return Object.freeze({
      ...track,
      timingGroupId: choreography.id,
      intentionalContactGroupId: wrapperReceptionContactGroupId,
      opacityScheduleAuthority: "semantic-choreography" as const,
      sampleProgress: sample,
      sampleOpacityProgress: sample
    });
  });
  for (const branch of choreography.branches) {
    if (
      !argumentPaintByBranch.has(branch.id) ||
      !wrapperPaintByBranch.has(branch.id)
    ) {
      throw new Error(
        `Canonical function-wrap ${choreography.id} lacks argument or wrapper paint for ${branch.id}.`
      );
    }
  }
  return applyKpNativeKatexFunctionWrapReception({
    tracks,
    source: input.source,
    target: input.target,
    plan: choreography.reception,
    entryWindow: choreography.wrapperEntryWindow,
    motion: "horizontal-squeeze",
    horizontalSqueezeTreatment:
      kpCanonicalNativeKatexFunctionWrapTreatment.horizontalSqueeze
  });
}

function applyCausalStructuralIntroduction(
  input: Parameters<typeof applyKpNativeKatexOperationChoreography>[0],
  choreography: KpCausalStructuralIntroductionChoreography
): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  const endpoint = choreography.direction === "forward"
    ? input.target
    : input.source;
  const atomsById = new Map(endpoint.atoms.map((atom) => [atom.id, atom]));
  const expectedLifecycle = choreography.direction === "forward"
    ? "introduce"
    : "eliminate";
  const matched = new Set<string>();
  const sample = (progress: number) => smoothWindow(
    progress,
    choreography.entryWindow.start,
    choreography.entryWindow.end
  );
  const tracks = input.tracks.map((track) => {
    if (track.lifecycle !== expectedLifecycle) return track;
    const atomId = choreography.direction === "forward"
      ? track.targetAtomId
      : track.sourceAtomId;
    const atom = atomId === undefined ? undefined : atomsById.get(atomId);
    if (
      atom === undefined ||
      !choreography.semanticEntityIds.includes(atom.semanticEntityId)
    ) return track;
    matched.add(atom.semanticEntityId);
    const collapseRule = atom.paintKind === "rule" &&
      choreography.direction === "forward";
    return Object.freeze({
      ...track,
      timingGroupId: choreography.id,
      opacityScheduleAuthority: "semantic-choreography" as const,
      sampleProgress: sample,
      sampleOpacityProgress: sample,
      ...(collapseRule
        ? {
            startRect: collapseToCenteredHairline(track.endRect),
            ...(track.endPaintRect === undefined
              ? {}
              : {
                  startPaintRect:
                    collapseToCenteredHairline(track.endPaintRect)
                })
          }
        : {})
    });
  });
  assertEntityCoverage(
    choreography.semanticEntityIds,
    matched,
    choreography.id
  );
  return Object.freeze(tracks);
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
      // The verified together schedule owns entry opacity. Without this
      // authority marker, generic collision repair delays both branches to a
      // late step and erases the balanced operation's visible causality.
      opacityScheduleAuthority: "semantic-choreography" as const,
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
  const local = windowProgress(
    progress,
    choreography.entryWindow?.start ?? 0.38,
    choreography.entryWindow?.end ?? 0.7
  );
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
  const operationCohortId = operationPresentationPlanAuthorityId(plan);
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
  const sourceEntityByAtomId = new Map(input.source.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const targetEntityByAtomId = new Map(input.target.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const planEntityIds = new Set(plan.roles.bundles.flatMap(
    ({ semanticEntityIds }) => semanticEntityIds
  ));
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
  const operationTrackIds = new Set(input.tracks.flatMap((track) => {
    const sourceEntityId = track.sourceAtomId === undefined
      ? undefined
      : sourceEntityByAtomId.get(track.sourceAtomId);
    const targetEntityId = track.targetAtomId === undefined
      ? undefined
      : targetEntityByAtomId.get(track.targetAtomId);
    return (
      (sourceEntityId !== undefined && planEntityIds.has(sourceEntityId)) ||
      (targetEntityId !== undefined && planEntityIds.has(targetEntityId))
    )
      ? [track.id]
      : [];
  }));
  const retiringTrackIds = new Set(plan.roles.bundles
    .filter(({ role }) => role !== "continuant")
    .flatMap((bundle) =>
      selectedByBundleId.get(bundle.id)!.map(({ track }) => track.id)
    ));
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
  const continuantRects = input.tracks
    .filter(({ id }) =>
      operationTrackIds.has(id) && !retiringTrackIds.has(id)
    )
    .map((track) => endpointPaintRect(track, choreography.direction));
  const contact = selectNearestClearCancellationContact({
    inverseBounds,
    continuantRects
  });
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

  const buildTracks = (
    route: KpCancellationOrbitRoute
  ): readonly KpNativeKatexPaintMeasuredSceneTrack[] =>
    Object.freeze(input.tracks.map((track) => {
      const inverse = inverseTrackRole.get(track.id);
      if (inverse !== undefined) {
        const originalPaint = endpointPaintRect(
          track,
          choreography.direction
        );
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
          variants: [route.variants[inverse.bundleIndex]!],
          obstacles: continuantRects,
          moverRadius:
            Math.max(originalPaint.width, originalPaint.height) / 2,
          clearance: route.clearance
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
          verifiedOperationCohortId: operationCohortId,
          opacityScheduleAuthority: "semantic-choreography" as const,
          sampleProgress: (progress: number) =>
            sampleCounterOrbitProgress(choreography, progress, "meet"),
          sampleOpacityProgress: (progress: number) =>
            sampleCounterOrbitProgress(choreography, progress, "collapse")
        });
      }
      const collapseRole = collapseTrackRole.get(track.id);
      if (collapseRole === undefined) {
        if (!operationTrackIds.has(track.id)) return track;
        if (track.lifecycle !== "persist") {
          throw new Error(
            `Cancellation continuant ${track.id} lacks persistent lineage.`
          );
        }
        // Continuants wait until the retiring cohort has collapsed. This
        // semantic phase boundary prevents survivor reflow from crossing the
        // very material being cancelled, independent of viewport geometry.
        return Object.freeze({
          ...track,
          timingGroupId: `${plan.id}.continuants`,
          verifiedOperationCohortId: operationCohortId,
          sampleProgress: (progress: number) =>
            sampleCounterOrbitProgress(choreography, progress, "reflow")
        });
      }
      const originalLayout = endpointLayoutRect(
        track,
        choreography.direction
      );
      const originalPaint = endpointPaintRect(
        track,
        choreography.direction
      );
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
        intentionalContactGroupId: plan.contactGroupId,
        verifiedOperationCohortId: operationCohortId,
        opacityScheduleAuthority: "semantic-choreography" as const,
        sampleProgress: (progress: number) =>
          sampleCounterOrbitProgress(choreography, progress, "collapse"),
        sampleOpacityProgress: (progress: number) =>
          sampleCounterOrbitProgress(choreography, progress, "collapse")
      });
    }));
  const route = selectCancellationOrbitRoute({
    operationTrackIds,
    buildTracks
  });
  return buildTracks(route);
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
  field: "meet" | "collapse" | "reflow"
): number {
  if (field === "collapse") {
    // Counter-orbit material must finish reaching the shared contact before
    // any inverse, catalyst, or artifact loses opacity. Keeping this timing at
    // the motif boundary prevents individual callers from reintroducing the
    // premature-fade regression.
    const collapse = smoothWindow(
      choreography.direction === "forward" ? progress : 1 - progress,
      kpCounterOrbitCancellationTiming.contactAt,
      kpCounterOrbitCancellationTiming.retirementEnd
    );
    return choreography.direction === "forward" ? collapse : 1 - collapse;
  }
  const frame = sampleKpEquationLinearRearrangementFrame(
    choreography.linearRearrangementKind,
    choreography.direction === "forward" ? progress : 1 - progress,
    choreography.cancellationRecipe,
    undefined,
    choreography.zeroWitnessRecipe
  );
  const sampled = field === "meet"
    ? frame.meetProgress
    : frame.persistentReflowProgress;
  return choreography.direction === "forward" ? sampled : 1 - sampled;
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

function collapseToCenteredHairline(rect: Rect): Rect {
  // A literal zero-width DOM box has no measurable native clone. One device-
  // independent pixel preserves renderer measurement while remaining a
  // visually collapsed seed from which the structural rule can grow.
  const width = Math.min(1, rect.width);
  return {
    ...rect,
    left: rect.left + (rect.width - width) / 2,
    width
  };
}

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

function selectNearestClearCancellationContact(input: {
  readonly inverseBounds: readonly Rect[];
  readonly continuantRects: readonly Rect[];
}): { readonly x: number; readonly y: number } {
  const base = center(union(input.inverseBounds));
  const offsets = Array.from({ length: 25 }, (_value, index) =>
    (index - 12) * 4
  );
  const candidates = offsets.flatMap((x) =>
    offsets.map((y) => ({
      point: { x: base.x + x, y: base.y + y },
      distance: Math.hypot(x, y)
    }))
  ).sort((left, right) => left.distance - right.distance);
  const ranked = candidates.map(({ point, distance }) => {
    const settled = input.inverseBounds.map((bounds) =>
      translateRectToCenter(bounds, point)
    );
    const intersections = settled.flatMap((inverse) =>
      input.continuantRects.flatMap((continuant) => {
        const width = Math.min(
          inverse.left + inverse.width,
          continuant.left + continuant.width
        ) - Math.max(inverse.left, continuant.left);
        const height = Math.min(
          inverse.top + inverse.height,
          continuant.top + continuant.height
        ) - Math.max(inverse.top, continuant.top);
        return width > 0.75 && height > 0.75
          ? [{ width, height }]
          : [];
      })
    );
    return {
      point,
      score:
        intersections.length * 1_000_000 +
        intersections.reduce(
          (sum, { width, height }) => sum + width * height,
          0
        ) * 1_000 +
        distance
    };
  }).sort((left, right) => left.score - right.score);
  return ranked[0]!.point;
}

type KpCancellationOrbitVariant =
  "arc-above" | "arc-below" | "around-left" | "around-right";

interface KpCancellationOrbitRoute {
  readonly variants: readonly [
    KpCancellationOrbitVariant,
    KpCancellationOrbitVariant
  ];
  readonly clearance: number;
}

function selectCancellationOrbitRoute(input: {
  readonly operationTrackIds: ReadonlySet<string>;
  readonly buildTracks: (
    route: KpCancellationOrbitRoute
  ) => readonly KpNativeKatexPaintMeasuredSceneTrack[];
}): KpCancellationOrbitRoute {
  const pairs: readonly KpCancellationOrbitRoute["variants"][] = [
    ["arc-above", "arc-below"],
    ["arc-below", "arc-above"],
    ["around-left", "around-right"],
    ["around-right", "around-left"]
  ];
  let best:
    | {
        readonly route: KpCancellationOrbitRoute;
        readonly audit: KpProtectedTransitAudit;
      }
    | undefined;
  for (const clearance of [14, 16, 18, 20, 24, 28, 32] as const) {
    const candidates = pairs.map((variants) => {
      const route = { variants, clearance } satisfies KpCancellationOrbitRoute;
      const operationTracks = input.buildTracks(route).filter(({ id }) =>
        input.operationTrackIds.has(id)
      );
      const audit = inspectKpEquationProtectedTransitTracks({
        tracks: operationTracks,
        sampleFrames: (tracks, progress) =>
          sampleKpNativeKatexSceneTrackFrames(tracks, progress, false),
        sampleCount: 100
      });
      return { route, audit };
    }).sort((left, right) =>
      compareCancellationRouteAudits(left.audit, right.audit)
    );
    const clear = candidates.find(
      ({ audit }) => audit.intersections.length === 0
    );
    if (clear !== undefined) return clear.route;
    if (
      best === undefined ||
      compareCancellationRouteAudits(candidates[0]!.audit, best.audit) < 0
    ) {
      best = candidates[0]!;
    }
  }
  throw new Error(
    "Verified cancellation has no bounded measured-paint orbit: " +
    `${best?.audit.intersections.map((intersection) =>
      `${intersection.leftTrackId}->${intersection.rightTrackId}@` +
      `${intersection.progress.toFixed(3)}`
    ).join(", ") ?? "no candidate geometry"}.`
  );
}

function compareCancellationRouteAudits(
  left: KpProtectedTransitAudit,
  right: KpProtectedTransitAudit
): number {
  return left.intersections.length - right.intersections.length ||
    left.totalIntersectionArea - right.totalIntersectionArea ||
    left.maximumIntersectionArea - right.maximumIntersectionArea;
}

function windowProgress(progress: number, start: number, end: number): number {
  const bounded = Math.max(0, Math.min(1, progress));
  return Math.max(0, Math.min(1, (bounded - start) / (end - start)));
}

function smoothWindow(progress: number, start: number, end: number): number {
  const local = windowProgress(progress, start, end);
  return local * local * (3 - 2 * local);
}

function semanticPairKey(sourceEntityId: string, targetEntityId: string): string {
  return `${sourceEntityId}\u0000${targetEntityId}`;
}
