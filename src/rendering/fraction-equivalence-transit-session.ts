import {
  compileKpFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan,
  type KpFractionEquivalencePresentationPlan
} from "../animation/fraction-equivalence-presentation-plan.ts";
import {
  kpCanonicalFractionEquivalence,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  resolveKpCanonicalNativeKatexEndpointInput,
  type KpCanonicalNativeKatexEndpointInput,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export interface KpFractionEquivalenceTransitSession {
  readonly kind: "kp-fraction-equivalence-transit-session";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: () => void;
}

/**
 * Presentation authority declares whether the two visible source bars fuse or
 * one bar persists. The shared compositor then owns the measured geometry and
 * motion, so this adapter never recreates fraction joining with ad hoc fades.
 */
export function compileKpFractionEquivalencePaintRelations(
  presentation: KpFractionEquivalencePresentationPlan
): readonly KpNativeKatexSemanticPaintRelation[] {
  const factorTransfer = presentation.factorTransfer;
  const divisionTransfer = presentation.structureContinuity.divisionTransfer;
  const factorRelations = factorTransfer.sourceOccurrenceEntityIds.map(
    (sourceEntityId, index) => ({
      id: `${factorTransfer.correspondenceId}.${index}`,
      kind: "one-to-one" as const,
      sourceEntityIds: [sourceEntityId],
      targetEntityIds: [factorTransfer.targetEntityIds[index]!]
    })
  );
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [{
      id: divisionTransfer.correspondenceId,
      kind: divisionTransfer.relation,
      sourceEntityIds: divisionTransfer.sourceDivisionEntityIds,
      targetEntityIds: divisionTransfer.targetDivisionEntityIds
    }, ...presentation.operandTransfers.map((transfer) => ({
      id: transfer.correspondenceId,
      kind: "one-to-one" as const,
      sourceEntityIds: [transfer.sourceEntityId],
      targetEntityIds: [transfer.targetEntityId]
    })), ...factorRelations]
  });
}

export function createKpFractionEquivalenceJoinTrackProjection(input: {
  readonly presentation: KpFractionEquivalencePresentationPlan;
  readonly relations: readonly KpNativeKatexSemanticPaintRelation[];
}): KpNativeKatexTrackProjection {
  const joinEntityIds = new Set(input.relations.flatMap((relation) => [
    ...relation.sourceEntityIds,
    ...relation.targetEntityIds
  ]));
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${input.presentation.joinCohort.id}`,
    project({ tracks, source, target }) {
      const sourceEntities = new Map(source.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const targetEntities = new Map(target.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const divisionTargetIds = new Set(
        input.presentation.structureContinuity.divisionTransfer
          .targetDivisionEntityIds
      );
      const divisionMergeTracks = tracks.filter((track) =>
        track.lifecycle === "merge" &&
        track.paintKind === "rule" &&
        track.targetAtomId !== undefined &&
        divisionTargetIds.has(targetEntities.get(track.targetAtomId) ?? "")
      ).sort((left, right) =>
        left.startPaintRect.left - right.startPaintRect.left
      );
      const barPartitionByTrackId = new Map(
        divisionMergeTracks.map((track, index) => [
          track.id,
          {
            endRect: horizontalPartition(
              track.endRect,
              index,
              divisionMergeTracks.length
            ),
            endPaintRect: horizontalPartition(
              track.endPaintRect,
              index,
              divisionMergeTracks.length
            )
          }
        ])
      );
      return Object.freeze(tracks.map((track) => {
        const sourceEntityId = track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId);
        const targetEntityId = track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId);
        const joinsFraction =
          (sourceEntityId !== undefined && joinEntityIds.has(sourceEntityId)) ||
          (targetEntityId !== undefined && joinEntityIds.has(targetEntityId));
        if (!joinsFraction) return track;
        const barPartition = barPartitionByTrackId.get(track.id);
        return Object.freeze({
          ...track,
          ...(barPartition ?? {}),
          timingGroupId: input.presentation.joinCohort.id,
          sampleProgress: sampleSimultaneousJoinProgress
        });
      }));
    }
  });
}

export function createKpFractionEquivalenceTransitSession(input: {
  readonly source: KpCanonicalNativeKatexEndpointInput;
  readonly target: KpCanonicalNativeKatexEndpointInput;
  readonly semantic?: KpVerifiedFractionEquivalence | undefined;
  readonly presentation?: KpFractionEquivalencePresentationPlan | undefined;
  readonly contextRelations?:
    readonly KpNativeKatexSemanticPaintRelation[] | undefined;
}): KpFractionEquivalenceTransitSession {
  const source = resolveKpCanonicalNativeKatexEndpointInput(input.source);
  const target = resolveKpCanonicalNativeKatexEndpointInput(input.target);
  if (
    source.endpoint !== "source" ||
    target.endpoint !== "target" ||
    source.stage !== target.stage
  ) {
    throw new Error(
      "Fraction-equivalence transit requires one shared measured stage."
    );
  }
  const semantic = input.semantic ?? kpCanonicalFractionEquivalence;
  const presentation = input.presentation ??
    (semantic === kpCanonicalFractionEquivalence
      ? kpCanonicalFractionEquivalencePresentationPlan
      : compileKpFractionEquivalencePresentationPlan(semantic));
  if (presentation.semanticContractId !== semantic.id) {
    throw new Error(
      "Fraction-equivalence transit requires matching semantic and presentation authority."
    );
  }
  // A larger expression may surround the canonical fraction operation. Its
  // explicitly verified context joins the reconciliation set without changing
  // the fraction motif or teaching the compositor any expression semantics.
  const relations = Object.freeze([
    ...compileKpFractionEquivalencePaintRelations(presentation),
    ...(input.contextRelations ?? [])
  ]);
  const trackProjection = createKpFractionEquivalenceJoinTrackProjection({
    presentation,
    relations
  });
  const plan = compileKpCanonicalNativeKatexScenePlan({
    source,
    target,
    relations,
    // Generic fan-in clears context before merging. Fraction multiplication is
    // one composite join, so terms and bars instead share the cohort clock.
    fanInRouting: false,
    copyFanOutRouting: false,
    trackProjection,
    endpointDwellFraction: 0
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(plan);
  let retired = false;
  return Object.freeze({
    kind: "kp-fraction-equivalence-transit-session" as const,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error(
          "Cannot apply a retired fraction-equivalence transit session."
        );
      }
      return canonical.session.apply(bounded(progress));
    },
    retire() {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason: "surface-disposed",
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Fraction-equivalence transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function sampleSimultaneousJoinProgress(progress: number): number {
  const value = bounded(progress);
  return value * value * (3 - 2 * value);
}

function horizontalPartition(
  rect: Readonly<{
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  }>,
  index: number,
  count: number
) {
  if (!Number.isInteger(count) || count < 1 || index < 0 || index >= count) {
    throw new Error("Fraction-bar fusion requires a valid target partition.");
  }
  const left = rect.left + rect.width * index / count;
  const right = rect.left + rect.width * (index + 1) / count;
  return Object.freeze({
    left,
    top: rect.top,
    width: right - left,
    height: rect.height
  });
}
