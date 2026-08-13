import type { KpPythonRefactorOperationSet } from
  "../semantic/python-refactor-operations.ts";
import { kpPythonRefactorSelectorId } from
  "../semantic/python-refactor-operations.ts";
import type { KpPythonRefactorScoreV1 } from
  "../semantic/python-refactor-score.ts";
import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "../semantic/python-refactor-semantic-model.ts";

export interface KpPythonHelperIntroductionTrackDraft {
  readonly id: "motion.python.introduce-helper-shell";
  readonly kind: "structural-introduction";
  readonly stageId: "stage.introduce-helper";
  readonly transformationId: "transform.python.extract-shared-rule";
  readonly correspondenceRecordId: "introduce-helper";
  readonly targetEntityId: "function.qualifies.after";
  readonly deferredEntityId: "rule.qualifies.after";
}

export interface KpPythonRuleFusionTrackDraft {
  readonly id: "motion.python.merge-threshold-rules";
  readonly kind: "rule-fusion";
  readonly stageId: "stage.move-shared-rule";
  readonly transformationId: "transform.python.extract-shared-rule";
  readonly correspondenceRecordId: "merge-duplicate-rules";
  readonly sourceEntityIds: readonly [
    "rule.shipping-cost.before",
    "rule.shipping-message.before"
  ];
  readonly targetEntityId: "rule.qualifies.after";
  readonly sourcePresence: "retain-native-source";
}

export interface KpPythonBindingPropagationTrackDraft {
  readonly id:
    | "motion.python.propagate-helper-to-cost"
    | "motion.python.propagate-helper-to-message";
  readonly kind: "binding-propagation";
  readonly stageId: "stage.replace-cost-call" | "stage.replace-message-call";
  readonly transformationId:
    | "transform.python.replace-cost-call"
    | "transform.python.replace-message-call";
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

export type KpPythonRefactorMotionTrackDraft =
  | KpPythonHelperIntroductionTrackDraft
  | KpPythonRuleFusionTrackDraft
  | KpPythonBindingPropagationTrackDraft;

export interface KpPythonRefactorMotionPlanDraft {
  readonly schemaVersion: "kp.python-refactor-motion-plan.v1";
  readonly id: "motion-plan.python.free-shipping-threshold";
  readonly animationId: "animation.programming.python-free-shipping-refactor";
  readonly tracks: readonly [
    KpPythonHelperIntroductionTrackDraft,
    KpPythonRuleFusionTrackDraft,
    KpPythonBindingPropagationTrackDraft,
    KpPythonBindingPropagationTrackDraft
  ];
  readonly endpointSettlement: "native-source-projections";
  readonly playbackAuthority: "shared-animation-clock";
}

const verifiedPlans = new WeakSet<object>();

export type KpVerifiedPythonRefactorMotionPlan =
  KpPythonRefactorMotionPlanDraft & {
    readonly __verifiedPythonRefactorMotionPlan: never;
  };

export interface KpPythonRefactorMotionPlanIssue {
  readonly path: string;
  readonly message: string;
}

export type KpPythonRefactorMotionPlanValidationResult =
  | { readonly status: "verified"; readonly plan: KpVerifiedPythonRefactorMotionPlan }
  | { readonly status: "invalid"; readonly issues: readonly KpPythonRefactorMotionPlanIssue[] };

export function createKpPythonRefactorMotionPlan(input: {
  readonly semantics: KpPythonRefactorSemanticArtifactV1;
  readonly operations: KpPythonRefactorOperationSet;
  readonly score: KpPythonRefactorScoreV1;
}): KpVerifiedPythonRefactorMotionPlan {
  const result = validateAndMintKpPythonRefactorMotionPlan({
    draft: defaultDraft(),
    ...input
  });
  if (result.status === "invalid") {
    throw new Error(result.issues[0]?.message ?? "Invalid Python motion plan.");
  }
  return result.plan;
}

export function validateAndMintKpPythonRefactorMotionPlan(input: {
  readonly draft: KpPythonRefactorMotionPlanDraft;
  readonly semantics: KpPythonRefactorSemanticArtifactV1;
  readonly operations: KpPythonRefactorOperationSet;
  readonly score: KpPythonRefactorScoreV1;
}): KpPythonRefactorMotionPlanValidationResult {
  const issues: KpPythonRefactorMotionPlanIssue[] = [];
  const entities = new Map(input.semantics.revisions.flatMap(({ entities }) =>
    entities.map((entity) => [entity.id, entity] as const)
  ));
  const transformations = new Map(input.operations.transformations.map(
    (transformation) => [transformation.id, transformation] as const
  ));
  const stages = new Map(input.score.stages.map((stage) => [stage.id, stage] as const));

  requireUnique(input.draft.tracks.map(({ id }) => id), issues);
  input.draft.tracks.forEach((track, index) => {
    const path = `tracks[${index}]`;
    const stage = stages.get(track.stageId);
    const transformation = transformations.get(track.transformationId);
    const record = transformation?.correspondenceMap?.records.find(
      ({ id }) => id === track.correspondenceRecordId
    );
    if (stage === undefined || !stage.transformationIds.includes(track.transformationId)) {
      issue(issues, `${path}.stageId`, `Score stage does not own ${track.transformationId}.`);
    }
    if (transformation === undefined) {
      issue(issues, `${path}.transformationId`, `Missing transformation ${track.transformationId}.`);
      return;
    }
    if (record === undefined) {
      issue(issues, `${path}.correspondenceRecordId`, `Missing correspondence ${track.correspondenceRecordId}.`);
      return;
    }
    if (track.kind === "rule-fusion") {
      const sources = track.sourceEntityIds.map(kpPythonRefactorSelectorId);
      const target = kpPythonRefactorSelectorId(track.targetEntityId);
      if (record.relation !== "fan-in" ||
          !sameIds(record.sourceSelectorIds, sources) ||
          !sameIds(record.targetSelectorIds, [target])) {
        issue(issues, path, `Fusion ${track.id} lacks the declared many-to-one correspondence.`);
      }
      track.sourceEntityIds.forEach((id) =>
        requireEntity(entities, id, "expression", path, issues)
      );
      requireEntity(entities, track.targetEntityId, "expression", path, issues);
      return;
    }
    if (track.kind === "structural-introduction") {
      const targetSelector = kpPythonRefactorSelectorId(track.targetEntityId);
      if (record.relation !== "introduction" ||
          record.sourceSelectorIds.length !== 0 ||
          !sameIds(record.targetSelectorIds, [targetSelector])) {
        issue(issues, path, `Introduction ${track.id} lacks helper correspondence.`);
      }
      const helper = requireEntity(entities, track.targetEntityId, "function", path, issues);
      const deferred = requireEntity(entities, track.deferredEntityId, "expression", path, issues);
      if (helper && deferred && deferred.declarationId !== helper.id) {
        issue(issues, `${path}.deferredEntityId`, `Deferred rule does not belong to helper.`);
      }
      return;
    }
    const declaration = requireEntity(
      entities, track.declarationEntityId, "function", path, issues
    );
    requireEntity(entities, track.replacedEntityId, "expression", path, issues);
    const target = requireEntity(entities, track.targetEntityId, "call-site", path, issues);
    if (target && declaration && target.declarationId !== declaration.id) {
      issue(issues, `${path}.declarationEntityId`, `Call does not bind to helper.`);
    }
    if (record.relation !== "role-change" ||
        !sameIds(record.sourceSelectorIds, [kpPythonRefactorSelectorId(track.replacedEntityId)]) ||
        !sameIds(record.targetSelectorIds, [kpPythonRefactorSelectorId(track.targetEntityId)])) {
      issue(issues, path, `Propagation ${track.id} lacks rule-to-call correspondence.`);
    }
  });

  const checkpoints = input.draft.tracks.map((track) =>
    stages.get(track.stageId)?.checkpointMs ?? Number.NaN
  );
  if (checkpoints.some((value, index) =>
    !Number.isFinite(value) || (index > 0 && value <= checkpoints[index - 1]!))) {
    issue(issues, "tracks", "Motion tracks must follow increasing authored checkpoints.");
  }
  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues.map((entry) => Object.freeze(entry)))
    });
  }
  const plan = freezeDraft(input.draft) as KpVerifiedPythonRefactorMotionPlan;
  verifiedPlans.add(plan);
  return Object.freeze({ status: "verified", plan });
}

export function assertKpVerifiedPythonRefactorMotionPlan(
  plan: KpVerifiedPythonRefactorMotionPlan
): void {
  if (!verifiedPlans.has(plan)) {
    throw new Error("Python refactor playback requires a validator-minted motion plan.");
  }
}

function defaultDraft(): KpPythonRefactorMotionPlanDraft {
  return {
    schemaVersion: "kp.python-refactor-motion-plan.v1",
    id: "motion-plan.python.free-shipping-threshold",
    animationId: "animation.programming.python-free-shipping-refactor",
    tracks: [
      {
        id: "motion.python.introduce-helper-shell",
        kind: "structural-introduction",
        stageId: "stage.introduce-helper",
        transformationId: "transform.python.extract-shared-rule",
        correspondenceRecordId: "introduce-helper",
        targetEntityId: "function.qualifies.after",
        deferredEntityId: "rule.qualifies.after"
      },
      {
        id: "motion.python.merge-threshold-rules",
        kind: "rule-fusion",
        stageId: "stage.move-shared-rule",
        transformationId: "transform.python.extract-shared-rule",
        correspondenceRecordId: "merge-duplicate-rules",
        sourceEntityIds: ["rule.shipping-cost.before", "rule.shipping-message.before"],
        targetEntityId: "rule.qualifies.after",
        sourcePresence: "retain-native-source"
      },
      {
        id: "motion.python.propagate-helper-to-cost",
        kind: "binding-propagation",
        stageId: "stage.replace-cost-call",
        transformationId: "transform.python.replace-cost-call",
        correspondenceRecordId: "cost-rule-becomes-call",
        declarationEntityId: "function.qualifies.after",
        replacedEntityId: "rule.shipping-cost.before",
        targetEntityId: "call.shipping-cost.after"
      },
      {
        id: "motion.python.propagate-helper-to-message",
        kind: "binding-propagation",
        stageId: "stage.replace-message-call",
        transformationId: "transform.python.replace-message-call",
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
  entities: ReadonlyMap<string, KpPythonSemanticEntity>,
  id: string,
  kind: KpPythonSemanticEntity["kind"],
  path: string,
  issues: KpPythonRefactorMotionPlanIssue[]
): KpPythonSemanticEntity | undefined {
  const entity = entities.get(id);
  if (entity === undefined || entity.kind !== kind) {
    issue(issues, path, `Motion entity ${id} must resolve to AST-derived ${kind}.`);
    return undefined;
  }
  return entity;
}

function requireUnique(ids: readonly string[], issues: KpPythonRefactorMotionPlanIssue[]): void {
  if (new Set(ids).size !== ids.length || ids.some((id) => id.trim() === "")) {
    issue(issues, "tracks", "Motion track ids must be unique and non-empty.");
  }
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function issue(
  issues: KpPythonRefactorMotionPlanIssue[],
  path: string,
  message: string
): void {
  issues.push({ path, message });
}

function freezeDraft(draft: KpPythonRefactorMotionPlanDraft): KpPythonRefactorMotionPlanDraft {
  return Object.freeze({
    ...draft,
    tracks: Object.freeze(draft.tracks.map((track) => Object.freeze({
      ...track,
      ...(track.kind === "rule-fusion"
        ? { sourceEntityIds: Object.freeze([...track.sourceEntityIds]) }
        : {})
    }))) as unknown as KpPythonRefactorMotionPlanDraft["tracks"]
  });
}
