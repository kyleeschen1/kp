import type { KpLawCheckResult, KpLawFailure } from "../semantic/asset-laws.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";

export type KpChoreographyIntroductionCauseKind =
  | "semantic-introduction"
  | "lineage-introduction"
  | "representational-succession"
  | "structural-realization"
  | "pedagogical-annotation"
  | "disclosure";

export const kpChoreographyIntroductionCauseKinds:
  readonly KpChoreographyIntroductionCauseKind[] = [
    "semantic-introduction",
    "lineage-introduction",
    "representational-succession",
    "structural-realization",
    "pedagogical-annotation",
    "disclosure"
  ];

export type KpChoreographyEliminationCauseKind =
  | "cancellation"
  | "consumption"
  | "replacement"
  | "structural-retirement"
  | "annotation-retirement"
  | "disclosure-retirement";

export const kpChoreographyEliminationCauseKinds:
  readonly KpChoreographyEliminationCauseKind[] = [
    "cancellation",
    "consumption",
    "replacement",
    "structural-retirement",
    "annotation-retirement",
    "disclosure-retirement"
  ];

interface KpChoreographyLifecycleBase {
  readonly id: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly summary: string;
}

export type KpChoreographyLifecycleRecord =
  | (KpChoreographyLifecycleBase & {
      readonly kind: "continuant";
      readonly continuantId: string;
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "copy";
      readonly operationId: string;
      readonly lineageEdgeId: string;
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "successor";
      readonly representationalLineageId: string;
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "introduction";
      readonly cause: {
        readonly kind: KpChoreographyIntroductionCauseKind;
        readonly authorityId: string;
      };
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "elimination";
      readonly cause: {
        readonly kind: KpChoreographyEliminationCauseKind;
        readonly authorityId: string;
      };
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "artifact";
      readonly ownerEntityId: string;
      readonly structuralCauseId: string;
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "annotation";
      readonly annotationId: string;
    })
  | (KpChoreographyLifecycleBase & {
      readonly kind: "disclosure";
      readonly disclosureId: string;
    });

export interface KpChoreographyLifecycle {
  readonly id: string;
  readonly records: readonly KpChoreographyLifecycleRecord[];
}

export type KpChoreographyLifecycleGapReason =
  | "unclassified-source"
  | "unclassified-target"
  | "multiple-classification"
  | "missing-cause"
  | "invalid-reference"
  | "invalid-shape";

export interface KpChoreographyLifecycleGap {
  readonly kind: "choreography-lifecycle-gap";
  readonly reason: KpChoreographyLifecycleGapReason;
  readonly path: string;
  readonly entityId?: string | undefined;
  readonly message: string;
  readonly promotable: false;
  readonly repair:
    | "classify-entity"
    | "choose-single-lifecycle"
    | "supply-cause"
    | "repair-reference"
    | "repair-shape";
}

export interface ValidateKpChoreographyLifecycleInput {
  readonly lifecycle: KpChoreographyLifecycle;
  readonly vocabulary: KpChoreographyVocabulary;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export function validateKpChoreographyLifecycle(
  input: ValidateKpChoreographyLifecycleInput
): readonly KpChoreographyLifecycleGap[] {
  const gaps: KpChoreographyLifecycleGap[] = [];
  const continuantIds = new Set(input.vocabulary.continuants.map((item) => item.id));
  const lineageIds = new Set(
    input.vocabulary.representationalLineages.map((item) => item.id)
  );
  const sourceCounts = new Map<string, number>();
  const targetCounts = new Map<string, number>();
  const expectedSources = new Set(input.sourceEntityIds);
  const expectedTargets = new Set(input.targetEntityIds);
  const recordIds = new Set<string>();

  input.lifecycle.records.forEach((record, index) => {
    const path = `records[${index}]`;
    if (recordIds.has(record.id)) {
      gaps.push(gap("multiple-classification", `${path}.id`, `Duplicate lifecycle record ${record.id}.`));
    }
    recordIds.add(record.id);
    record.sourceEntityIds.forEach((id, entityIndex) => {
      increment(sourceCounts, id);
      if (!expectedSources.has(id)) {
        gaps.push(gap("invalid-reference", `${path}.sourceEntityIds[${entityIndex}]`, `Unknown visible source entity ${id}.`, id));
      }
    });
    record.targetEntityIds.forEach((id, entityIndex) => {
      increment(targetCounts, id);
      if (!expectedTargets.has(id)) {
        gaps.push(gap("invalid-reference", `${path}.targetEntityIds[${entityIndex}]`, `Unknown visible target entity ${id}.`, id));
      }
    });
    if (record.summary.trim().length === 0) {
      gaps.push(gap("missing-cause", `${path}.summary`, "Lifecycle records require a causal summary."));
    }
    validateRecordShape(record, path, continuantIds, lineageIds, gaps);
  });
  checkCoverage(input.sourceEntityIds, sourceCounts, "source", gaps);
  checkCoverage(input.targetEntityIds, targetCounts, "target", gaps);
  return gaps;
}

export function checkKpChoreographyLifecyclePromotion(
  input: ValidateKpChoreographyLifecycleInput
): KpLawCheckResult {
  const gaps = validateKpChoreographyLifecycle(input);
  const failures: KpLawFailure[] = gaps.map((item) => ({
    path: item.path,
    message: item.message
  }));
  return {
    lawId: "animation.choreography-lifecycle-promotion",
    passed: failures.length === 0,
    failures
  };
}

function validateRecordShape(
  record: KpChoreographyLifecycleRecord,
  path: string,
  continuantIds: ReadonlySet<string>,
  lineageIds: ReadonlySet<string>,
  gaps: KpChoreographyLifecycleGap[]
): void {
  switch (record.kind) {
    case "continuant":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "both", gaps);
      requireReference(record.continuantId, continuantIds, `${path}.continuantId`, gaps);
      return;
    case "copy":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "one-to-many", gaps);
      requireText(record.operationId, `${path}.operationId`, gaps);
      requireText(record.lineageEdgeId, `${path}.lineageEdgeId`, gaps);
      return;
    case "successor":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "both", gaps);
      requireReference(
        record.representationalLineageId,
        lineageIds,
        `${path}.representationalLineageId`,
        gaps
      );
      return;
    case "introduction":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "target-only", gaps);
      requireEnum(record.cause.kind, kpChoreographyIntroductionCauseKinds, `${path}.cause.kind`, gaps);
      requireText(record.cause.authorityId, `${path}.cause.authorityId`, gaps);
      return;
    case "elimination":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "source-only", gaps);
      requireEnum(record.cause.kind, kpChoreographyEliminationCauseKinds, `${path}.cause.kind`, gaps);
      requireText(record.cause.authorityId, `${path}.cause.authorityId`, gaps);
      return;
    case "artifact":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "any", gaps);
      requireText(record.ownerEntityId, `${path}.ownerEntityId`, gaps);
      requireText(record.structuralCauseId, `${path}.structuralCauseId`, gaps);
      return;
    case "annotation":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "any", gaps);
      requireText(record.annotationId, `${path}.annotationId`, gaps);
      return;
    case "disclosure":
      requireShape(record.sourceEntityIds, record.targetEntityIds, path, "any", gaps);
      requireText(record.disclosureId, `${path}.disclosureId`, gaps);
      return;
  }
}

function checkCoverage(
  expected: readonly string[],
  counts: ReadonlyMap<string, number>,
  side: "source" | "target",
  gaps: KpChoreographyLifecycleGap[]
): void {
  expected.forEach((entityId, index) => {
    const count = counts.get(entityId) ?? 0;
    if (count === 0) {
      gaps.push(gap(
        side === "source" ? "unclassified-source" : "unclassified-target",
        `${side}EntityIds[${index}]`,
        `Visible ${side} entity ${entityId} has no choreography lifecycle classification.`,
        entityId
      ));
    } else if (count > 1) {
      gaps.push(gap(
        "multiple-classification",
        `${side}EntityIds[${index}]`,
        `Visible ${side} entity ${entityId} has ${count} choreography lifecycle classifications.`,
        entityId
      ));
    }
  });
}

function requireShape(
  source: readonly string[],
  target: readonly string[],
  path: string,
  shape: "both" | "one-to-many" | "source-only" | "target-only" | "any",
  gaps: KpChoreographyLifecycleGap[]
): void {
  const valid =
    shape === "both" ? source.length > 0 && target.length > 0 :
    shape === "one-to-many" ? source.length === 1 && target.length > 1 :
    shape === "source-only" ? source.length > 0 && target.length === 0 :
    shape === "target-only" ? source.length === 0 && target.length > 0 :
    source.length + target.length > 0;
  if (!valid) {
    gaps.push(gap("invalid-shape", path, `Lifecycle ${path} does not satisfy ${shape} endpoint shape.`));
  }
}

function requireReference(
  id: string,
  ids: ReadonlySet<string>,
  path: string,
  gaps: KpChoreographyLifecycleGap[]
): void {
  if (!ids.has(id)) gaps.push(gap("invalid-reference", path, `Unknown lifecycle authority ${id}.`));
}

function requireText(
  value: string,
  path: string,
  gaps: KpChoreographyLifecycleGap[]
): void {
  if (value.trim().length === 0) gaps.push(gap("missing-cause", path, "Lifecycle cause authority must not be empty."));
}

function requireEnum<T extends string>(
  value: T,
  allowed: readonly T[],
  path: string,
  gaps: KpChoreographyLifecycleGap[]
): void {
  if (!allowed.includes(value)) {
    gaps.push(gap("missing-cause", path, `Unknown lifecycle cause ${value}.`));
  }
}

function gap(
  reason: KpChoreographyLifecycleGapReason,
  path: string,
  message: string,
  entityId?: string
): KpChoreographyLifecycleGap {
  const repair =
    reason === "unclassified-source" || reason === "unclassified-target" ? "classify-entity" :
    reason === "multiple-classification" ? "choose-single-lifecycle" :
    reason === "missing-cause" ? "supply-cause" :
    reason === "invalid-reference" ? "repair-reference" :
    "repair-shape";
  return {
    kind: "choreography-lifecycle-gap",
    reason,
    path,
    ...(entityId === undefined ? {} : { entityId }),
    message,
    promotable: false,
    repair
  };
}

function increment(counts: Map<string, number>, id: string): void {
  counts.set(id, (counts.get(id) ?? 0) + 1);
}
