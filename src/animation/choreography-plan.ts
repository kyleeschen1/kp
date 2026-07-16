import {
  checkKpChoreographyVocabularyContract,
  type KpChoreographyVocabulary
} from "./choreography-vocabulary.ts";

export const kpChoreographyEnvelopePhaseIds = [
  "orient",
  "reflow",
  "act",
  "settle",
  "release"
] as const;

export type KpChoreographyEnvelopePhaseId =
  (typeof kpChoreographyEnvelopePhaseIds)[number];

export type KpChoreographyActivityKind =
  | "focus"
  | "reserve-space"
  | "move-continuant"
  | "execute-operation"
  | "recognition-hold"
  | "release-attention";

export type KpChoreographyCheckpointKind =
  | "phase-entry"
  | "focus-ready"
  | "space-reserved"
  | "phase-complete"
  | "recognition"
  | "neutral";

export interface KpChoreographyActivity {
  readonly id: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly kind: KpChoreographyActivityKind;
  readonly entityIds: readonly string[];
  readonly summary: string;
  readonly motionClassificationIds: readonly string[];
  readonly dependsOnActivityIds: readonly string[];
  readonly prerequisiteCheckpointIds: readonly string[];
  readonly governedOverlap?: {
    readonly withActivityId: string;
    readonly reason: string;
  } | undefined;
}

export interface KpChoreographyCheckpoint {
  readonly id: string;
  readonly phaseId: KpChoreographyEnvelopePhaseId;
  readonly kind: KpChoreographyCheckpointKind;
  readonly requirement: string;
  readonly stable: boolean;
}

interface KpChoreographyPhaseBase {
  readonly id: KpChoreographyEnvelopePhaseId;
  readonly dependsOnPhaseIds: readonly KpChoreographyEnvelopePhaseId[];
  readonly prerequisiteCheckpointIds: readonly string[];
  readonly completionCheckpointId: string;
}

export type KpChoreographyPhase =
  | (KpChoreographyPhaseBase & {
      readonly mode: "active";
      readonly activityIds: readonly string[];
    })
  | (KpChoreographyPhaseBase & {
      readonly mode: "no-op";
      readonly activityIds: readonly [];
      readonly noOpReason: string;
    });

export interface KpChoreographyPlan {
  readonly id: string;
  readonly kind: "kp-choreography-plan";
  readonly timelineRefId: string;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly phases: readonly KpChoreographyPhase[];
  readonly activities: readonly KpChoreographyActivity[];
  readonly checkpoints: readonly KpChoreographyCheckpoint[];
}

export interface KpChoreographyPlanIssue {
  readonly path: string;
  readonly message: string;
}

export function activeKpChoreographyPhase(input: {
  readonly id: KpChoreographyEnvelopePhaseId;
  readonly activityIds: readonly string[];
  readonly dependsOnPhaseIds?: readonly KpChoreographyEnvelopePhaseId[];
  readonly prerequisiteCheckpointIds?: readonly string[];
  readonly completionCheckpointId: string;
}): KpChoreographyPhase {
  return {
    id: input.id,
    mode: "active",
    activityIds: [...input.activityIds],
    dependsOnPhaseIds: [...(input.dependsOnPhaseIds ?? [])],
    prerequisiteCheckpointIds: [
      ...(input.prerequisiteCheckpointIds ?? [])
    ],
    completionCheckpointId: input.completionCheckpointId
  };
}

export function noOpKpChoreographyPhase(input: {
  readonly id: KpChoreographyEnvelopePhaseId;
  readonly reason: string;
  readonly dependsOnPhaseIds?: readonly KpChoreographyEnvelopePhaseId[];
  readonly prerequisiteCheckpointIds?: readonly string[];
  readonly completionCheckpointId: string;
}): KpChoreographyPhase {
  return {
    id: input.id,
    mode: "no-op",
    activityIds: [],
    noOpReason: input.reason,
    dependsOnPhaseIds: [...(input.dependsOnPhaseIds ?? [])],
    prerequisiteCheckpointIds: [
      ...(input.prerequisiteCheckpointIds ?? [])
    ],
    completionCheckpointId: input.completionCheckpointId
  };
}

export function createKpChoreographyPlan(
  input: Omit<KpChoreographyPlan, "kind">
): KpChoreographyPlan {
  const plan: KpChoreographyPlan = {
    id: input.id,
    kind: "kp-choreography-plan",
    timelineRefId: input.timelineRefId,
    vocabulary: structuredClone(input.vocabulary),
    phases: structuredClone(input.phases),
    activities: structuredClone(input.activities),
    checkpoints: structuredClone(input.checkpoints)
  };
  const issues = validateKpChoreographyPlan(plan);
  if (issues.length > 0) {
    throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  }
  return plan;
}

export function validateKpChoreographyPlan(
  plan: KpChoreographyPlan
): readonly KpChoreographyPlanIssue[] {
  const issues: KpChoreographyPlanIssue[] = [];
  requireText(plan.id, "id", issues);
  requireText(plan.timelineRefId, "timelineRefId", issues);
  const vocabularyResult = checkKpChoreographyVocabularyContract(
    plan.vocabulary
  );
  vocabularyResult.failures.forEach((failure) => {
    issues.push({
      path: `vocabulary.${failure.path}`,
      message: failure.message
    });
  });

  const activityIds = collectUniqueIds(plan.activities, "activities", issues);
  const checkpointIds = collectUniqueIds(
    plan.checkpoints,
    "checkpoints",
    issues
  );
  const motionClassificationIds = new Set(
    plan.vocabulary.motionClassifications.map(
      (classification) => classification.id
    )
  );
  const phaseIds = new Set(plan.phases.map((phase) => phase.id));
  validateEnvelopeShape(plan.phases, issues);

  plan.phases.forEach((phase, index) => {
    const path = `phases[${index}]`;
    if (phase.mode === "active") {
      requireIds(phase.activityIds, `${path}.activityIds`, issues);
    } else {
      requireText(phase.noOpReason, `${path}.noOpReason`, issues);
      if (phase.activityIds.length > 0) {
        issues.push({
          path: `${path}.activityIds`,
          message: `No-op phase ${phase.id} cannot own activities.`
        });
      }
    }
    phase.activityIds.forEach((id, activityIndex) =>
      requireReference(
        id,
        activityIds,
        `${path}.activityIds[${activityIndex}]`,
        "activity",
        issues
      )
    );
    phase.activityIds.forEach((id, activityIndex) => {
      const activity = plan.activities.find((candidate) => candidate.id === id);
      if (activity !== undefined && activity.phaseId !== phase.id) {
        issues.push({
          path: `${path}.activityIds[${activityIndex}]`,
          message: `Activity ${id} belongs to phase ${activity.phaseId}, not ${phase.id}.`
        });
      }
    });
    phase.dependsOnPhaseIds.forEach((id, dependencyIndex) =>
      requireReference(
        id,
        phaseIds,
        `${path}.dependsOnPhaseIds[${dependencyIndex}]`,
        "phase",
        issues
      )
    );
    phase.prerequisiteCheckpointIds.forEach((id, checkpointIndex) =>
      requireReference(
        id,
        checkpointIds,
        `${path}.prerequisiteCheckpointIds[${checkpointIndex}]`,
        "checkpoint",
        issues
      )
    );
    requireReference(
      phase.completionCheckpointId,
      checkpointIds,
      `${path}.completionCheckpointId`,
      "checkpoint",
      issues
    );
    const completion = plan.checkpoints.find(
      (checkpoint) => checkpoint.id === phase.completionCheckpointId
    );
    if (completion !== undefined && completion.phaseId !== phase.id) {
      issues.push({
        path: `${path}.completionCheckpointId`,
        message: `Phase ${phase.id} completion checkpoint must belong to that phase.`
      });
    }
  });

  plan.activities.forEach((activity, index) => {
    const path = `activities[${index}]`;
    requireText(activity.id, `${path}.id`, issues);
    requireText(activity.summary, `${path}.summary`, issues);
    requireIds(activity.entityIds, `${path}.entityIds`, issues);
    requireReference(
      activity.phaseId,
      phaseIds,
      `${path}.phaseId`,
      "phase",
      issues
    );
    activity.motionClassificationIds.forEach((id, classificationIndex) =>
      requireReference(
        id,
        motionClassificationIds,
        `${path}.motionClassificationIds[${classificationIndex}]`,
        "motion classification",
        issues
      )
    );
    activity.dependsOnActivityIds.forEach((id, dependencyIndex) => {
      requireReference(
        id,
        activityIds,
        `${path}.dependsOnActivityIds[${dependencyIndex}]`,
        "activity",
        issues
      );
      if (id === activity.id) {
        issues.push({
          path: `${path}.dependsOnActivityIds[${dependencyIndex}]`,
          message: `Activity ${activity.id} cannot depend on itself.`
        });
      }
    });
    activity.prerequisiteCheckpointIds.forEach((id, checkpointIndex) =>
      requireReference(
        id,
        checkpointIds,
        `${path}.prerequisiteCheckpointIds[${checkpointIndex}]`,
        "checkpoint",
        issues
      )
    );
    if (activity.governedOverlap !== undefined) {
      requireReference(
        activity.governedOverlap.withActivityId,
        activityIds,
        `${path}.governedOverlap.withActivityId`,
        "activity",
        issues
      );
      requireText(
        activity.governedOverlap.reason,
        `${path}.governedOverlap.reason`,
        issues
      );
    }
  });

  plan.checkpoints.forEach((checkpoint, index) => {
    const path = `checkpoints[${index}]`;
    requireText(checkpoint.id, `${path}.id`, issues);
    requireText(checkpoint.requirement, `${path}.requirement`, issues);
    requireReference(
      checkpoint.phaseId,
      phaseIds,
      `${path}.phaseId`,
      "phase",
      issues
    );
  });
  rejectConcreteMotionInstructions(plan, issues);
  return issues;
}

function validateEnvelopeShape(
  phases: readonly KpChoreographyPhase[],
  issues: KpChoreographyPlanIssue[]
): void {
  const actual = phases.map((phase) => phase.id);
  if (
    actual.length !== kpChoreographyEnvelopePhaseIds.length ||
    actual.some((id, index) => id !== kpChoreographyEnvelopePhaseIds[index])
  ) {
    issues.push({
      path: "phases",
      message:
        "Choreography phases must be exactly orient, reflow, act, settle, release in that order."
    });
  }
}

// Semantic plans share the animation clock and deliberately reject renderer
// geometry so style realization remains regenerable.
function rejectConcreteMotionInstructions(
  value: unknown,
  issues: KpChoreographyPlanIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectConcreteMotionInstructions(item, issues, `${path}[${index}]`)
    );
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (
      /^(durationMs|delayMs|startMs|endMs|x|y|z|coordinates?|controlPoints?|keyframes?|trajectory|css|svg|dom)$/i.test(
        key
      )
    ) {
      issues.push({
        path: `${path}.${key}`,
        message: `Concrete choreography instruction ${key} is not allowed.`
      });
    }
    rejectConcreteMotionInstructions(child, issues, `${path}.${key}`);
  });
}

function collectUniqueIds<T extends { readonly id: string }>(
  values: readonly T[],
  path: string,
  issues: KpChoreographyPlanIssue[]
): ReadonlySet<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    if (ids.has(value.id)) {
      issues.push({
        path: `${path}[${index}].id`,
        message: `Duplicate ${path} id ${value.id}.`
      });
    }
    ids.add(value.id);
  });
  return ids;
}

function requireReference(
  id: string,
  ids: ReadonlySet<string>,
  path: string,
  kind: string,
  issues: KpChoreographyPlanIssue[]
): void {
  if (!ids.has(id)) {
    issues.push({ path, message: `Unknown ${kind} ${id}.` });
  }
}

function requireIds(
  ids: readonly string[],
  path: string,
  issues: KpChoreographyPlanIssue[]
): void {
  if (ids.length === 0) {
    issues.push({ path, message: "Expected at least one id." });
  }
  ids.forEach((id, index) => requireText(id, `${path}[${index}]`, issues));
}

function requireText(
  value: string,
  path: string,
  issues: KpChoreographyPlanIssue[]
): void {
  if (value.trim().length === 0) {
    issues.push({ path, message: "Expected non-empty text." });
  }
}
