import type { KpTypeScriptRefactorOperationSet } from
  "../semantic/typescript-refactor-operations.ts";
import { kpTypeScriptRefactorSelectorId } from
  "../semantic/typescript-refactor-operations.ts";
import type { KpTypeScriptRefactorScoreV1 } from
  "../semantic/typescript-refactor-score.ts";
import type {
  KpTypeScriptRefactorSemanticArtifactV1,
  KpTypeScriptSemanticEntity
} from "../semantic/typescript-refactor-semantic-model.ts";

export interface KpTypeScriptRuleFusionTrackDraft {
  readonly id: "motion.typescript.merge-threshold-rules";
  readonly kind: "rule-fusion";
  readonly stageId: "stage.move-shared-rule";
  readonly transformationId: "transform.typescript.extract-shared-rule";
  readonly correspondenceRecordId: "merge-duplicate-rules";
  readonly sourceEntityIds: readonly [
    "rule.shipping-cost.before",
    "rule.shipping-message.before"
  ];
  readonly targetEntityId: "rule.qualifies.after";
  readonly sourcePresence: "retain-native-source";
}

export interface KpTypeScriptHelperIntroductionTrackDraft {
  readonly id: "motion.typescript.introduce-helper-shell";
  readonly kind: "structural-introduction";
  readonly stageId: "stage.introduce-helper";
  readonly transformationId: "transform.typescript.extract-shared-rule";
  readonly correspondenceRecordId: "introduce-helper";
  readonly targetEntityId: "function.qualifies.after";
  readonly deferredEntityId: "rule.qualifies.after";
}

export interface KpTypeScriptBindingPropagationTrackDraft {
  readonly id:
    | "motion.typescript.propagate-helper-to-cost"
    | "motion.typescript.propagate-helper-to-message";
  readonly kind: "binding-propagation";
  readonly stageId:
    | "stage.replace-cost-call"
    | "stage.replace-message-call";
  readonly transformationId:
    | "transform.typescript.replace-cost-call"
    | "transform.typescript.replace-message-call";
  readonly correspondenceRecordId:
    | "cost-rule-becomes-call"
    | "message-rule-becomes-call";
  readonly declarationEntityId: "function.qualifies.after";
  readonly replacedEntityId:
    | "rule.shipping-cost.before"
    | "rule.shipping-message.before";
  readonly targetEntityId:
    | "call.shipping-cost.after"
    | "call.shipping-message.after";
}

export type KpTypeScriptRefactorMotionTrackDraft =
  | KpTypeScriptHelperIntroductionTrackDraft
  | KpTypeScriptRuleFusionTrackDraft
  | KpTypeScriptBindingPropagationTrackDraft;

export interface KpTypeScriptRefactorMotionPlanDraft {
  readonly schemaVersion: "kp.typescript-refactor-motion-plan.v1";
  readonly id: "motion-plan.typescript.free-shipping-threshold";
  readonly animationId:
    "animation.programming.typescript-free-shipping-refactor";
  readonly tracks: readonly [
    KpTypeScriptHelperIntroductionTrackDraft,
    KpTypeScriptRuleFusionTrackDraft,
    KpTypeScriptBindingPropagationTrackDraft,
    KpTypeScriptBindingPropagationTrackDraft
  ];
  readonly endpointSettlement: "native-source-projections";
  readonly playbackAuthority: "shared-animation-clock";
}

const verifiedPlans = new WeakSet<object>();

/**
 * Structural typing cannot mint executable motion authority. A plan must pass
 * the semantic validator below and remain the same sealed object at playback.
 */
export type KpVerifiedTypeScriptRefactorMotionPlan =
  KpTypeScriptRefactorMotionPlanDraft & {
    readonly __verifiedTypeScriptRefactorMotionPlan: never;
  };

export interface KpTypeScriptRefactorMotionPlanIssue {
  readonly path: string;
  readonly message: string;
}

export type KpTypeScriptRefactorMotionPlanValidationResult =
  | {
      readonly status: "verified";
      readonly plan: KpVerifiedTypeScriptRefactorMotionPlan;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpTypeScriptRefactorMotionPlanIssue[];
    };

export function createKpTypeScriptRefactorMotionPlan(input: {
  readonly semantics: KpTypeScriptRefactorSemanticArtifactV1;
  readonly operations: KpTypeScriptRefactorOperationSet;
  readonly score: KpTypeScriptRefactorScoreV1;
}): KpVerifiedTypeScriptRefactorMotionPlan {
  const result = validateAndMintKpTypeScriptRefactorMotionPlan({
    draft: defaultDraft(),
    ...input
  });
  if (result.status === "invalid") {
    throw new Error(result.issues[0]?.message ?? "Invalid TypeScript motion plan.");
  }
  return result.plan;
}

/**
 * Reader projections may execute this built-in plan without importing the
 * authoring graph that proved it. This accepts no external draft: the same
 * canonical literal is still validated by the asset constructor at build and
 * test time, while the public browser receives only executable playback data.
 */
export function createKpBuiltInTypeScriptRefactorMotionPlan():
  KpVerifiedTypeScriptRefactorMotionPlan {
  const plan = freezeDraft(defaultDraft()) as KpVerifiedTypeScriptRefactorMotionPlan;
  verifiedPlans.add(plan);
  return plan;
}

export function validateAndMintKpTypeScriptRefactorMotionPlan(input: {
  readonly draft: KpTypeScriptRefactorMotionPlanDraft;
  readonly semantics: KpTypeScriptRefactorSemanticArtifactV1;
  readonly operations: KpTypeScriptRefactorOperationSet;
  readonly score: KpTypeScriptRefactorScoreV1;
}): KpTypeScriptRefactorMotionPlanValidationResult {
  const issues: KpTypeScriptRefactorMotionPlanIssue[] = [];
  const entities = new Map(input.semantics.revisions.flatMap(({ entities }) =>
    entities.map((entity) => [entity.id, entity] as const)
  ));
  const transformations = new Map(input.operations.transformations.map(
    (transformation) => [transformation.id, transformation] as const
  ));
  const stages = new Map(input.score.stages.map((stage) => [stage.id, stage] as const));

  requireUnique(input.draft.tracks.map(({ id }) => id), "tracks", issues);
  input.draft.tracks.forEach((track, index) => {
    const path = `tracks[${index}]`;
    const stage = stages.get(track.stageId);
    const transformation = transformations.get(track.transformationId);
    const record = transformation?.correspondenceMap?.records.find(
      ({ id }) => id === track.correspondenceRecordId
    );
    if (stage === undefined) {
      issue(issues, `${path}.stageId`, `Motion track ${track.id} references a missing score stage.`);
    } else if (!stage.transformationIds.includes(track.transformationId)) {
      issue(issues, `${path}.stageId`, `Score stage ${stage.id} does not own ${track.transformationId}.`);
    }
    if (transformation === undefined) {
      issue(issues, `${path}.transformationId`, `Motion track ${track.id} references a missing transformation.`);
      return;
    }
    if (record === undefined) {
      issue(issues, `${path}.correspondenceRecordId`, `Motion track ${track.id} references a missing correspondence record.`);
      return;
    }

    if (track.kind === "rule-fusion") {
      const expectedSources = track.sourceEntityIds.map(kpTypeScriptRefactorSelectorId);
      const expectedTarget = kpTypeScriptRefactorSelectorId(track.targetEntityId);
      if (
        record.relation !== "fan-in" ||
        !sameIds(record.sourceSelectorIds, expectedSources) ||
        !sameIds(record.targetSelectorIds, [expectedTarget])
      ) {
        issue(issues, path, `Fusion track ${track.id} must be backed by the declared many-to-one threshold correspondence.`);
      }
      track.sourceEntityIds.forEach((entityId) =>
        requireEntity(entities, entityId, "expression", path, issues)
      );
      requireEntity(entities, track.targetEntityId, "expression", path, issues);
      return;
    }

    if (track.kind === "structural-introduction") {
      const expectedTarget = kpTypeScriptRefactorSelectorId(track.targetEntityId);
      if (
        record.relation !== "introduction" ||
        record.sourceSelectorIds.length !== 0 ||
        !sameIds(record.targetSelectorIds, [expectedTarget])
      ) {
        issue(issues, path, `Introduction track ${track.id} must be backed by the declared helper introduction correspondence.`);
      }
      const helper = requireEntity(entities, track.targetEntityId, "function", path, issues);
      const deferred = requireEntity(entities, track.deferredEntityId, "expression", path, issues);
      if (helper !== undefined && deferred !== undefined &&
        deferred.declarationId !== helper.id) {
        issue(issues, `${path}.deferredEntityId`, `Deferred rule ${deferred.id} does not belong to helper ${helper.id}.`);
      }
      return;
    }

    const declaration = requireEntity(
      entities,
      track.declarationEntityId,
      "function",
      path,
      issues
    );
    requireEntity(entities, track.replacedEntityId, "expression", path, issues);
    const target = requireEntity(
      entities,
      track.targetEntityId,
      "call-site",
      path,
      issues
    );
    if (target !== undefined && declaration !== undefined &&
      target.declarationId !== declaration.id) {
      issue(issues, `${path}.declarationEntityId`, `Call ${target.id} does not bind to declaration ${declaration.id}.`);
    }
    if (
      record.relation !== "role-change" ||
      !sameIds(record.sourceSelectorIds, [kpTypeScriptRefactorSelectorId(track.replacedEntityId)]) ||
      !sameIds(record.targetSelectorIds, [kpTypeScriptRefactorSelectorId(track.targetEntityId)])
    ) {
      issue(issues, path, `Propagation track ${track.id} must be backed by its declared rule-to-call correspondence.`);
    }
  });

  const orderedCheckpoints = input.draft.tracks.map((track) =>
    stages.get(track.stageId)?.checkpointMs ?? Number.NaN
  );
  if (orderedCheckpoints.some((value, index) =>
    !Number.isFinite(value) || (index > 0 && value <= orderedCheckpoints[index - 1]!))) {
    issue(issues, "tracks", "Motion tracks must follow strictly increasing authored checkpoints.");
  }

  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues.map((entry) => Object.freeze(entry)))
    });
  }
  const plan = freezeDraft(input.draft) as KpVerifiedTypeScriptRefactorMotionPlan;
  verifiedPlans.add(plan);
  return Object.freeze({ status: "verified", plan });
}

export function assertKpVerifiedTypeScriptRefactorMotionPlan(
  plan: KpVerifiedTypeScriptRefactorMotionPlan
): void {
  if (!verifiedPlans.has(plan)) {
    throw new Error("TypeScript refactor playback requires a validator-minted motion plan.");
  }
}

function defaultDraft(): KpTypeScriptRefactorMotionPlanDraft {
  return {
    schemaVersion: "kp.typescript-refactor-motion-plan.v1",
    id: "motion-plan.typescript.free-shipping-threshold",
    animationId: "animation.programming.typescript-free-shipping-refactor",
    tracks: [
      {
        id: "motion.typescript.introduce-helper-shell",
        kind: "structural-introduction",
        stageId: "stage.introduce-helper",
        transformationId: "transform.typescript.extract-shared-rule",
        correspondenceRecordId: "introduce-helper",
        targetEntityId: "function.qualifies.after",
        deferredEntityId: "rule.qualifies.after"
      },
      {
        id: "motion.typescript.merge-threshold-rules",
        kind: "rule-fusion",
        stageId: "stage.move-shared-rule",
        transformationId: "transform.typescript.extract-shared-rule",
        correspondenceRecordId: "merge-duplicate-rules",
        sourceEntityIds: [
          "rule.shipping-cost.before",
          "rule.shipping-message.before"
        ],
        targetEntityId: "rule.qualifies.after",
        sourcePresence: "retain-native-source"
      },
      {
        id: "motion.typescript.propagate-helper-to-cost",
        kind: "binding-propagation",
        stageId: "stage.replace-cost-call",
        transformationId: "transform.typescript.replace-cost-call",
        correspondenceRecordId: "cost-rule-becomes-call",
        declarationEntityId: "function.qualifies.after",
        replacedEntityId: "rule.shipping-cost.before",
        targetEntityId: "call.shipping-cost.after"
      },
      {
        id: "motion.typescript.propagate-helper-to-message",
        kind: "binding-propagation",
        stageId: "stage.replace-message-call",
        transformationId: "transform.typescript.replace-message-call",
        correspondenceRecordId: "message-rule-becomes-call",
        declarationEntityId: "function.qualifies.after",
        replacedEntityId: "rule.shipping-message.before",
        targetEntityId: "call.shipping-message.after"
      }
    ],
    endpointSettlement: "native-source-projections",
    playbackAuthority: "shared-animation-clock"
  };
}

function requireEntity(
  entities: ReadonlyMap<string, KpTypeScriptSemanticEntity>,
  id: string,
  kind: KpTypeScriptSemanticEntity["kind"],
  path: string,
  issues: KpTypeScriptRefactorMotionPlanIssue[]
): KpTypeScriptSemanticEntity | undefined {
  const entity = entities.get(id);
  if (entity === undefined || entity.kind !== kind) {
    issue(issues, path, `Motion entity ${id} must resolve to compiler-derived kind ${kind}.`);
    return undefined;
  }
  return entity;
}

function requireUnique(
  ids: readonly string[],
  path: string,
  issues: KpTypeScriptRefactorMotionPlanIssue[]
): void {
  if (new Set(ids).size !== ids.length || ids.some((id) => id.trim() === "")) {
    issue(issues, path, "Motion track ids must be unique and non-empty.");
  }
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function issue(
  issues: KpTypeScriptRefactorMotionPlanIssue[],
  path: string,
  message: string
): void {
  issues.push({ path, message });
}

function freezeDraft(
  draft: KpTypeScriptRefactorMotionPlanDraft
): KpTypeScriptRefactorMotionPlanDraft {
  return Object.freeze({
    ...draft,
    tracks: Object.freeze(draft.tracks.map((track) => Object.freeze({
      ...track,
      ...(track.kind === "rule-fusion"
        ? { sourceEntityIds: Object.freeze([...track.sourceEntityIds]) }
        : {})
    }))) as unknown as KpTypeScriptRefactorMotionPlanDraft["tracks"]
  });
}
