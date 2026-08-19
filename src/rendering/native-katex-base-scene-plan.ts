import type {
  KpEquationCollisionTrack,
  KpEquationProtectedTransitCertificate
} from "./equation-motion-path-planner.ts";
import type {
  KpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-dom.ts";
import type {
  KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import {
  type KpNativeKatexPaintAtomObservation,
  type KpNativeKatexRenderedSceneObservation,
  unionKpStageRelativeRects as unionRects
} from "./native-katex-rendered-scene.ts";
import type {
  KpNativeKatexRendererDispositionContract,
  KpNativeKatexSceneTrackContract
} from "./native-katex-scene-track-contract.ts";
import type {
  KpNativeKatexPaintMeasuredTrack
} from "./native-katex-paint-geometry.ts";
import {
  applyKpNativeKatexSymbolMotionContract
} from "./native-katex-symbol-motion.ts";
import {
  applyKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import {
  applyKpNativeKatexOperationChoreography
} from "./native-katex-operation-choreography.ts";

export type {
  KpCompiledSymbolMotionContract
} from "../animation/symbol-motion-contract.ts";
export type {
  KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
export type {
  KpEquationOperationChoreography,
  KpNativeKatexFactoringSceneBinding
} from "./native-katex-operation-choreography.ts";
export {
  compileKpNativeKatexSuccessorSynthesisScenePlans,
  partitionKpNativeKatexSuccessorOwnedTracks
} from "./native-katex-successor-synthesis.ts";
export type {
  KpNativeKatexSuccessorSynthesisIntent
} from "./native-katex-successor-synthesis.ts";
export {
  compileKpCollisionSafeReorderTracks,
  compileKpCollisionSafeTransitTracks
} from "./equation-motion-path-planner.ts";
export type {
  KpEquationMotionStageOccupancy,
  KpEquationProtectedTransitCertificate
} from "./equation-motion-path-planner.ts";
export {
  compileKpQualityBoundedFanInTracks
} from "./native-katex-fan-in-motion.ts";

/** Pure planning has no runtime authority. */

export type KpNativeKatexAtomLifecycle =
  | "persist"
  | "merge"
  | "split"
  | "introduce"
  | "eliminate"
  | "unsupported";

export interface KpNativeKatexAtomDisposition {
  readonly id: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceAtomIds: readonly string[];
  readonly targetAtomIds: readonly string[];
  readonly semanticEntityIds: readonly string[];
  readonly reason?: string | undefined;
}

export interface KpNativeKatexSceneReconciliation {
  readonly kind: "native-katex-scene-reconciliation";
  readonly lifecycle: "renderer-session";
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}

export interface KpNativeKatexSceneComponent {
  readonly id: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceGroupIds: readonly string[];
  readonly targetGroupIds: readonly string[];
  readonly sourceBounds?: KpStageRelativeRect | undefined;
  readonly targetBounds?: KpStageRelativeRect | undefined;
  readonly atoms: readonly {
    readonly atomId: string;
    readonly endpoint: "source" | "target";
    readonly localRect: KpStageRelativeRect;
  }[];
}

export interface KpNativeKatexHierarchicalScenePlan {
  readonly kind: "native-katex-hierarchical-scene-plan";
  readonly lifecycle: "renderer-session";
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly components: readonly KpNativeKatexSceneComponent[];
}

export type KpNativeKatexSceneTrack = KpNativeKatexSceneTrackContract<
  KpEquationCollisionTrack,
  KpNativeKatexPaintAtomObservation["paintKind"]
>;

export type KpNativeKatexPaintMeasuredSceneTrack =
  KpNativeKatexPaintMeasuredTrack<KpNativeKatexSceneTrack>;

/**
 * Moving material must occupy its exact native target pose before the native
 * endpoint takes paint ownership. Keeping this policy here prevents callers
 * from trading away endpoint continuity to gain a few percent of motion time.
 */
export const KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION = 0.04;

export interface KpNativeKatexHandoffCorrelation {
  readonly kind: "native-katex-handoff-correlation";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly materialOwnerId: string;
  readonly trackId: string;
  readonly componentId: string;
  readonly atomLifecycle: KpNativeKatexAtomLifecycle;
  readonly visualAtomId: string;
  readonly sourceAtomId?: string | undefined;
  readonly targetAtomId?: string | undefined;
  readonly semanticEntityId: string;
  readonly disposition: "target-bound" | "departing-without-native-target";
}

/** Measured plans live for one mounted session and never enter durable state. */
export interface KpNativeKatexRendererReadyScenePlan {
  readonly kind: "native-katex-renderer-ready-scene-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly hierarchy: KpNativeKatexHierarchicalScenePlan;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly disposition: KpNativeKatexRendererDispositionContract;
  readonly handoffCorrelations: readonly KpNativeKatexHandoffCorrelation[];
  readonly structuralSuccession?:
    KpEquationStructuralSuccessionIntent | undefined;
  readonly structuralMotion?: "full" | "checkpoint" | undefined;
  readonly copyFanOut: boolean;
  readonly endpointDwellFraction: number;
  readonly supplementalMaterialOwners?:
    ((progress: number) => readonly KpEquationMaterialLayerOwnerFrame[]) |
    undefined;
  readonly toJSON: () => never;
}

const liveRendererReadyPlans = new WeakSet<KpNativeKatexRendererReadyScenePlan>();

type KpNativeKatexRendererReadyScenePlanInput = Omit<
  KpNativeKatexRendererReadyScenePlan,
  "kind" | "lifecycle" | "copyFanOut" | "endpointDwellFraction" |
  "handoffCorrelations" | "toJSON"
> & {
  readonly handoffCorrelations?: readonly KpNativeKatexHandoffCorrelation[];
  readonly copyFanOut?: boolean | undefined;
  readonly endpointDwellFraction?: number | undefined;
};

export function createKpNativeKatexRendererReadyScenePlan(
  input: KpNativeKatexRendererReadyScenePlanInput
): KpNativeKatexRendererReadyScenePlan {
  const { source, target } = input.reconciliation;
  if (
    source.lifecycle !== "renderer-session" ||
    target.lifecycle !== "renderer-session"
  ) {
    throw new Error(
      "Renderer-ready plans require ephemeral renderer-session observations."
    );
  }
  if (source.stage !== target.stage) {
    throw new Error("Renderer-ready endpoints must share one measured stage.");
  }
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Renderer-ready plans require unique measured track IDs.");
  }
  const endpointDwellFraction = input.endpointDwellFraction ??
    KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION;
  if (
    !Number.isFinite(endpointDwellFraction) ||
    endpointDwellFraction < KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION ||
    endpointDwellFraction > 0.25
  ) {
    throw new Error(
      `Renderer-ready endpoint settlement must be between ` +
      `${KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION} and 0.25.`
    );
  }
  const plan = Object.freeze({
    kind: "native-katex-renderer-ready-scene-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    reconciliation: input.reconciliation,
    hierarchy: input.hierarchy,
    tracks: Object.freeze([...input.tracks]),
    protectedTransit: input.protectedTransit,
    disposition: input.disposition,
    handoffCorrelations: Object.freeze([
      ...(input.handoffCorrelations ?? [])
    ]),
    structuralSuccession: input.structuralSuccession,
    structuralMotion: input.structuralMotion,
    copyFanOut: input.copyFanOut ?? false,
    endpointDwellFraction,
    supplementalMaterialOwners: input.supplementalMaterialOwners,
    toJSON(): never {
      throw new Error(
        "Renderer-ready native KaTeX plans cannot enter durable state."
      );
    }
  });
  liveRendererReadyPlans.add(plan);
  return plan;
}

export function isKpNativeKatexRendererReadyScenePlan(
  value: unknown
): value is KpNativeKatexRendererReadyScenePlan {
  return typeof value === "object" && value !== null &&
    liveRendererReadyPlans.has(value as KpNativeKatexRendererReadyScenePlan);
}

export const compileKpNativeKatexSemanticMotionTracks =
  applyKpNativeKatexSymbolMotionContract;
export const compileKpNativeKatexProjectedTracks =
  applyKpNativeKatexTrackProjection;
export const compileKpNativeKatexOperationTracks =
  applyKpNativeKatexOperationChoreography;

export interface KpNativeKatexSemanticPaintRelation {
  readonly id: string;
  readonly relation: "persist" | "merge" | "split";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export function projectKpNativeKatexSemanticPaintRelations(input: {
  readonly groups: readonly {
    readonly id: string;
    readonly kind:
      | "one-to-one"
      | "many-to-one"
      | "one-to-many"
      | "introduction"
      | "removal";
    readonly sourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
  }[];
}): readonly KpNativeKatexSemanticPaintRelation[] {
  assertUniqueRelationIds(input.groups.map(({ id }) => id));
  return Object.freeze(input.groups.flatMap((group) => {
    if (group.kind === "introduction" || group.kind === "removal") return [];
    const relation = group.kind === "many-to-one"
      ? "merge" as const
      : group.kind === "one-to-many"
        ? "split" as const
        : "persist" as const;
    return [Object.freeze({
      id: `paint.${group.id}`,
      relation,
      sourceEntityIds: Object.freeze([...group.sourceEntityIds]),
      targetEntityIds: Object.freeze([...group.targetEntityIds])
    })];
  }));
}

export function reverseKpNativeKatexSemanticPaintRelations(
  relations: readonly KpNativeKatexSemanticPaintRelation[]
): readonly KpNativeKatexSemanticPaintRelation[] {
  assertUniqueRelationIds(relations.map(({ id }) => id));
  return Object.freeze(relations.map((relation) => Object.freeze({
    id: `reverse.${relation.id}`,
    relation: relation.relation === "merge"
      ? "split" as const
      : relation.relation === "split"
        ? "merge" as const
        : "persist" as const,
    sourceEntityIds: Object.freeze([...relation.targetEntityIds]),
    targetEntityIds: Object.freeze([...relation.sourceEntityIds])
  })));
}

export function reconcileKpNativeKatexScenes(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly relations?: readonly KpNativeKatexSemanticPaintRelation[] | undefined;
}): KpNativeKatexSceneReconciliation {
  const sourceRemaining = new Map(input.source.atoms.map((atom) => [atom.id, atom]));
  const targetRemaining = new Map(input.target.atoms.map((atom) => [atom.id, atom]));
  const dispositions: KpNativeKatexAtomDisposition[] = [];
  const sharedEntityIds = [...new Set(input.source.atoms.map(
    ({ semanticEntityId }) => semanticEntityId
  ))].filter((entityId) =>
    input.target.atoms.some((atom) => atom.semanticEntityId === entityId)
  );
  for (const entityId of sharedEntityIds.sort()) {
    pairCompatibleAtoms({
      idPrefix: `persist.${entityId}`,
      lifecycle: "persist",
      semanticEntityIds: [entityId],
      sources: matchingEntityAtoms(sourceRemaining, [entityId]),
      targets: matchingEntityAtoms(targetRemaining, [entityId]),
      dispositions,
      sourceRemaining,
      targetRemaining
    });
  }
  for (const relation of [...(input.relations ?? [])].sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    pairCompatibleAtoms({
      idPrefix: relation.id,
      lifecycle: relation.relation,
      semanticEntityIds: [
        ...relation.sourceEntityIds,
        ...relation.targetEntityIds
      ],
      sources: matchingEntityAtoms(sourceRemaining, relation.sourceEntityIds),
      targets: matchingEntityAtoms(targetRemaining, relation.targetEntityIds),
      dispositions,
      sourceRemaining,
      targetRemaining
    });
  }
  for (const atom of [...sourceRemaining.values()].sort(byAtomId)) {
    dispositions.push({
      id: `eliminate.${atom.id}`,
      lifecycle: "eliminate",
      sourceAtomIds: [atom.id],
      targetAtomIds: [],
      semanticEntityIds: [atom.semanticEntityId]
    });
  }
  for (const atom of [...targetRemaining.values()].sort(byAtomId)) {
    dispositions.push({
      id: `introduce.${atom.id}`,
      lifecycle: "introduce",
      sourceAtomIds: [],
      targetAtomIds: [atom.id],
      semanticEntityIds: [atom.semanticEntityId]
    });
  }
  return createKpNativeKatexSceneReconciliation({
    source: input.source,
    target: input.target,
    dispositions
  });
}

export function createKpNativeKatexSceneReconciliation(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}): KpNativeKatexSceneReconciliation {
  if (input.source.endpoint !== "source" || input.target.endpoint !== "target") {
    throw new Error("Scene reconciliation requires source and target endpoints.");
  }
  const sourceIds = new Set(input.source.atoms.map(({ id }) => id));
  const targetIds = new Set(input.target.atoms.map(({ id }) => id));
  const usedSourceIds: string[] = [];
  const usedTargetIds: string[] = [];
  const dispositionIds = new Set<string>();
  for (const disposition of input.dispositions) {
    if (dispositionIds.has(disposition.id)) {
      throw new Error(`Scene disposition ${disposition.id} is duplicated.`);
    }
    dispositionIds.add(disposition.id);
    assertLifecycleArity(disposition);
    for (const id of disposition.sourceAtomIds) {
      if (!sourceIds.has(id)) {
        throw new Error(
          `Scene disposition ${disposition.id} has unknown source atom ${id}.`
        );
      }
      usedSourceIds.push(id);
    }
    for (const id of disposition.targetAtomIds) {
      if (!targetIds.has(id)) {
        throw new Error(
          `Scene disposition ${disposition.id} has unknown target atom ${id}.`
        );
      }
      usedTargetIds.push(id);
    }
  }
  assertTotalCoverage(sourceIds, usedSourceIds, "source");
  assertTotalCoverage(targetIds, usedTargetIds, "target");
  return Object.freeze({
    kind: "native-katex-scene-reconciliation",
    lifecycle: "renderer-session",
    source: input.source,
    target: input.target,
    dispositions: Object.freeze(input.dispositions.map((disposition) =>
      Object.freeze({
        ...disposition,
        sourceAtomIds: Object.freeze([...disposition.sourceAtomIds]),
        targetAtomIds: Object.freeze([...disposition.targetAtomIds]),
        semanticEntityIds: Object.freeze([...disposition.semanticEntityIds])
      })
    ))
  });
}

export function compileKpNativeKatexHierarchicalScenePlan(
  reconciliation: KpNativeKatexSceneReconciliation
): KpNativeKatexHierarchicalScenePlan {
  const sourceById = new Map(reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const components = reconciliation.dispositions.map((disposition) => {
    const sourceAtoms = disposition.sourceAtomIds.map((id) => sourceById.get(id)!);
    const targetAtoms = disposition.targetAtomIds.map((id) => targetById.get(id)!);
    const sourceBounds = sourceAtoms.length === 0
      ? undefined
      : unionRects(sourceAtoms.map(({ rect }) => rect));
    const targetBounds = targetAtoms.length === 0
      ? undefined
      : unionRects(targetAtoms.map(({ rect }) => rect));
    return Object.freeze({
      id: `component.${disposition.id}`,
      lifecycle: disposition.lifecycle,
      sourceGroupIds: Object.freeze([
        ...new Set(sourceAtoms.map(({ presentationGroupId }) =>
          presentationGroupId
        ))
      ]),
      targetGroupIds: Object.freeze([
        ...new Set(targetAtoms.map(({ presentationGroupId }) =>
          presentationGroupId
        ))
      ]),
      ...(sourceBounds === undefined ? {} : {
        sourceBounds: Object.freeze(sourceBounds)
      }),
      ...(targetBounds === undefined ? {} : {
        targetBounds: Object.freeze(targetBounds)
      }),
      atoms: Object.freeze([
        ...sourceAtoms.map((atom) => Object.freeze({
          atomId: atom.id,
          endpoint: "source" as const,
          localRect: Object.freeze(localRect(atom.rect, sourceBounds!))
        })),
        ...targetAtoms.map((atom) => Object.freeze({
          atomId: atom.id,
          endpoint: "target" as const,
          localRect: Object.freeze(localRect(atom.rect, targetBounds!))
        }))
      ])
    });
  });
  return Object.freeze({
    kind: "native-katex-hierarchical-scene-plan",
    lifecycle: "renderer-session",
    reconciliation,
    components: Object.freeze(components)
  });
}

export function compileKpNativeKatexSceneTracks(
  plan: KpNativeKatexHierarchicalScenePlan
): readonly KpNativeKatexSceneTrack[] {
  const sourceById = new Map(plan.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(plan.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const presentationMergeGroups = compilePresentationMergeGroups(plan.components);
  return Object.freeze(plan.reconciliation.dispositions.flatMap((disposition) => {
    const sources = disposition.sourceAtomIds.map((id) => sourceById.get(id)!);
    const targets = disposition.targetAtomIds.map((id) => targetById.get(id)!);
    const componentId = `component.${disposition.id}`;
    const intentionalContactGroupId =
      presentationMergeGroups.contactByComponentId.get(componentId);
    const routingCohortId =
      presentationMergeGroups.routingByComponentId.get(componentId);
    if (disposition.lifecycle === "persist") {
      return [track(
        disposition, 0, sources[0]!, targets[0]!, sources[0]!.id,
        intentionalContactGroupId, routingCohortId,
        routingCohortId === undefined
          ? undefined
          : sources[0]!.presentationGroupId
      )];
    }
    if (disposition.lifecycle === "merge") {
      return sources.map((source, index) => track(
        disposition, index, source, targets[0]!, source.id,
        intentionalContactGroupId, routingCohortId,
        routingCohortId === undefined ? undefined : source.presentationGroupId
      ));
    }
    if (disposition.lifecycle === "split") {
      return targets.map((target, index) => track(
        disposition, index, sources[0]!, target, target.id,
        intentionalContactGroupId, routingCohortId,
        routingCohortId === undefined ? undefined : target.presentationGroupId
      ));
    }
    if (disposition.lifecycle === "eliminate") {
      return sources.map((source, index) => {
        const sceneTrack = track(disposition, index, source, source);
        return Object.freeze({
          ...sceneTrack,
          endRect: Object.freeze({ ...source.rect, top: source.rect.top - 8 })
        });
      });
    }
    if (disposition.lifecycle === "introduce") {
      return targets.map((target, index) => {
        const sceneTrack = track(disposition, index, target, target, target.id);
        return Object.freeze({
          ...sceneTrack,
          startRect: Object.freeze({ ...target.rect, top: target.rect.top + 8 })
        });
      });
    }
    return [];
  }));
}

function compilePresentationMergeGroups(
  components: KpNativeKatexHierarchicalScenePlan["components"]
): {
  readonly contactByComponentId: ReadonlyMap<string, string>;
  readonly routingByComponentId: ReadonlyMap<string, string>;
} {
  const eligible = components.filter((component) =>
    component.lifecycle === "merge" &&
    component.sourceGroupIds.length > 1 &&
    component.targetGroupIds.length === 1
  );
  const signature = (component: typeof eligible[number]) => JSON.stringify({
    source: [...component.sourceGroupIds].sort(),
    target: [...component.targetGroupIds].sort()
  });
  const counts = new Map<string, number>();
  eligible.forEach((component) => {
    const key = signature(component);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const routingByComponentId = new Map(eligible.flatMap((component) => {
    const key = signature(component);
    return counts.get(key) === 1
      ? []
      : [[component.id, `route.presentation-merge.${key}`] as const];
  }));
  return Object.freeze({
    contactByComponentId: new Map(eligible.map((component) => [
      component.id,
      `contact.presentation-merge.${component.id}`
    ])),
    routingByComponentId
  });
}

function assertLifecycleArity(disposition: KpNativeKatexAtomDisposition): void {
  const sources = disposition.sourceAtomIds.length;
  const targets = disposition.targetAtomIds.length;
  const valid = {
    persist: sources === 1 && targets === 1,
    merge: sources >= 2 && targets === 1,
    split: sources === 1 && targets >= 2,
    introduce: sources === 0 && targets >= 1,
    eliminate: sources >= 1 && targets === 0,
    unsupported: (sources >= 1 || targets >= 1) &&
      disposition.reason !== undefined && disposition.reason.trim() !== ""
  }[disposition.lifecycle];
  if (!valid) {
    throw new Error(
      `Scene disposition ${disposition.id} has invalid ${disposition.lifecycle} arity.`
    );
  }
}

function assertUniqueRelationIds(ids: readonly string[]): void {
  if (ids.some((id) => id.trim() === "") || new Set(ids).size !== ids.length) {
    throw new Error("Semantic paint relation IDs must be unique and non-empty.");
  }
}

function pairCompatibleAtoms(input: {
  readonly idPrefix: string;
  readonly lifecycle: "persist" | "merge" | "split";
  readonly semanticEntityIds: readonly string[];
  readonly sources: readonly KpNativeKatexPaintAtomObservation[];
  readonly targets: readonly KpNativeKatexPaintAtomObservation[];
  readonly dispositions: KpNativeKatexAtomDisposition[];
  readonly sourceRemaining: Map<string, KpNativeKatexPaintAtomObservation>;
  readonly targetRemaining: Map<string, KpNativeKatexPaintAtomObservation>;
}): void {
  const keys = [...new Set(input.sources.map(compatibilityKey))]
    .filter((key) => input.targets.some((atom) => compatibilityKey(atom) === key))
    .sort();
  for (const [keyIndex, key] of keys.entries()) {
    const sources = input.sources.filter((atom) => compatibilityKey(atom) === key)
      .sort(byAtomId);
    const targets = input.targets.filter((atom) => compatibilityKey(atom) === key)
      .sort(byAtomId);
    const isContinuant = sources.length === 1 && targets.length === 1;
    if (input.lifecycle === "persist" || isContinuant) {
      const count = Math.min(sources.length, targets.length);
      for (let index = 0; index < count; index += 1) {
        addDisposition(
          input,
          `${input.idPrefix}.${keyIndex}.${index}`,
          [sources[index]!],
          [targets[index]!]
        );
      }
    } else if (
      input.lifecycle === "merge" && sources.length >= 2 && targets.length === 1
    ) {
      addDisposition(input, `${input.idPrefix}.${keyIndex}`, sources, targets);
    } else if (
      input.lifecycle === "split" && sources.length === 1 && targets.length >= 2
    ) {
      addDisposition(input, `${input.idPrefix}.${keyIndex}`, sources, targets);
    }
  }
}

function addDisposition(
  input: Parameters<typeof pairCompatibleAtoms>[0],
  id: string,
  sources: readonly KpNativeKatexPaintAtomObservation[],
  targets: readonly KpNativeKatexPaintAtomObservation[]
): void {
  input.dispositions.push({
    id,
    lifecycle: sources.length === 1 && targets.length === 1
      ? "persist"
      : input.lifecycle,
    sourceAtomIds: sources.map(({ id: atomId }) => atomId),
    targetAtomIds: targets.map(({ id: atomId }) => atomId),
    semanticEntityIds: [...input.semanticEntityIds]
  });
  sources.forEach(({ id: atomId }) => input.sourceRemaining.delete(atomId));
  targets.forEach(({ id: atomId }) => input.targetRemaining.delete(atomId));
}

function matchingEntityAtoms(
  atoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>,
  entityIds: readonly string[]
): KpNativeKatexPaintAtomObservation[] {
  return [...atoms.values()].filter(({ semanticEntityId }) =>
    entityIds.includes(semanticEntityId)
  );
}

function compatibilityKey(atom: KpNativeKatexPaintAtomObservation): string {
  return `${atom.paintKind}:${atom.visualKey}`;
}

function byAtomId(
  left: KpNativeKatexPaintAtomObservation,
  right: KpNativeKatexPaintAtomObservation
): number {
  return left.id.localeCompare(right.id);
}

function assertTotalCoverage(
  expected: ReadonlySet<string>,
  used: readonly string[],
  endpoint: "source" | "target"
): void {
  const duplicate = used.find((id, index) => used.indexOf(id) !== index);
  if (duplicate !== undefined) {
    throw new Error(`Scene ${endpoint} atom ${duplicate} has multiple dispositions.`);
  }
  const missing = [...expected].find((id) => !used.includes(id));
  if (missing !== undefined) {
    throw new Error(`Scene ${endpoint} atom ${missing} has no disposition.`);
  }
}

function localRect(
  rect: KpStageRelativeRect,
  bounds: KpStageRelativeRect
): KpStageRelativeRect {
  return {
    left: rect.left - bounds.left,
    top: rect.top - bounds.top,
    width: rect.width,
    height: rect.height
  };
}

function track(
  disposition: KpNativeKatexAtomDisposition,
  index: number,
  source: KpNativeKatexPaintAtomObservation,
  target: KpNativeKatexPaintAtomObservation,
  visualAtomId = source.id,
  intentionalContactGroupId?: string,
  routingCohortId?: string,
  routingMemberId?: string
): KpNativeKatexSceneTrack {
  const base = {
    id: `track.${disposition.id}.${index}`,
    componentId: `component.${disposition.id}`,
    sourceAtomId: source.id,
    targetAtomId: target.id,
    visualAtomId,
    paintKind: source.paintKind,
    sizingMode: source.paintKind === "rule" ? "rule-length" as const : "rect" as const,
    startRect: source.rect,
    endRect: target.rect,
    ...(intentionalContactGroupId === undefined
      ? {}
      : { intentionalContactGroupId }),
    ...(routingCohortId === undefined ? {} : { routingCohortId }),
    ...(routingMemberId === undefined ? {} : { routingMemberId })
  };
  const lifecycle = disposition.lifecycle;
  if (lifecycle === "unsupported") {
    throw new Error(
      `Unsupported scene disposition ${disposition.id} cannot compile a track.`
    );
  }
  const [startOpacity, endOpacity] = lifecycle === "introduce"
    ? [0, 1] as const
    : lifecycle === "eliminate"
      ? [1, 0] as const
      : [1, 1] as const;
  return Object.freeze({
    ...base,
    lifecycle,
    startOpacity,
    endOpacity
  }) as KpNativeKatexSceneTrack;
}
