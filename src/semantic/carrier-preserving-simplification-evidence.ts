import {
  findKpAssetSelector,
  type KpAssetBundle,
  type KpAssetSelector
} from "./asset.ts";
import {
  validateKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  validateCorrespondenceMap,
  type SelectorCorrespondenceRecord
} from "./correspondence.ts";

export interface KpCarrierPreservingSimplificationEvidenceCandidate {
  readonly schemaVersion: "kp.carrier-preserving-simplification-evidence.v1";
  readonly id: string;
  readonly transformationId: string;
  readonly endpoints: {
    readonly sourceObjectId: string;
    readonly targetObjectId: string;
  };
  readonly carrier: {
    readonly correspondenceRecordId: string;
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  };
  readonly identityLawWitness: {
    readonly lawId: string;
    readonly sourceSelectorId: string;
    readonly removalRecordId: string;
  };
  readonly removedSyntaxCohort: {
    readonly selectorIds: readonly [string, ...string[]];
    readonly correspondenceRecordIds: readonly [string, ...string[]];
  };
  readonly stationaryContext: readonly {
    readonly correspondenceRecordId: string;
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  }[];
}

declare const kpVerifiedCarrierEvidenceBrand: unique symbol;
const verifiedCarrierEvidence = new WeakSet<object>();

export interface KpVerifiedCarrierPreservingSimplificationEvidence
  extends KpCarrierPreservingSimplificationEvidenceCandidate {
  readonly [kpVerifiedCarrierEvidenceBrand]: true;
}

export interface KpCarrierEvidenceValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type KpCarrierEvidenceVerification =
  | {
      readonly status: "verified";
      readonly evidence: KpVerifiedCarrierPreservingSimplificationEvidence;
    }
  | {
      readonly status: "invalid-evidence";
      readonly issues: readonly KpCarrierEvidenceValidationIssue[];
    };

export function isKpVerifiedCarrierPreservingSimplificationEvidence(
  value: unknown
): value is KpVerifiedCarrierPreservingSimplificationEvidence {
  return typeof value === "object" &&
    value !== null &&
    verifiedCarrierEvidence.has(value);
}

/**
 * Verification consumes semantic IDs and laws only. The normalized branded
 * result intentionally drops unknown input fields so renderer geometry,
 * timing, DOM nodes, and opacity schedules cannot cross this authority seam.
 */
export function verifyKpCarrierPreservingSimplificationEvidence(input: {
  readonly candidate: KpCarrierPreservingSimplificationEvidenceCandidate;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}): KpCarrierEvidenceVerification {
  const { candidate, bundle, transformation } = input;
  const issues: KpCarrierEvidenceValidationIssue[] = [];
  const map = transformation.correspondenceMap;
  const source = bundle.objects.find(
    ({ id }) => id === candidate.endpoints.sourceObjectId
  );
  const target = bundle.objects.find(
    ({ id }) => id === candidate.endpoints.targetObjectId
  );

  if (candidate.id.trim().length === 0) {
    issues.push({ path: "id", message: "Carrier evidence id must not be empty." });
  }
  if (candidate.transformationId !== transformation.id) {
    issues.push({
      path: "transformationId",
      message: "Carrier evidence must name the verified transformation."
    });
  }
  if (
    transformation.sourceObjectIds.length !== 1 ||
    transformation.sourceObjectIds[0] !== candidate.endpoints.sourceObjectId ||
    transformation.targetObjectIds.length !== 1 ||
    transformation.targetObjectIds[0] !== candidate.endpoints.targetObjectId
  ) {
    issues.push({
      path: "endpoints",
      message: "Carrier evidence endpoints must exactly match the transformation."
    });
  }
  if (source === undefined || target === undefined) {
    issues.push({
      path: "endpoints",
      message: "Carrier evidence endpoints must exist in the semantic bundle."
    });
  }
  if (map === undefined) {
    issues.push({
      path: "transformation.correspondenceMap",
      message: "Carrier evidence requires explicit correspondence authority."
    });
  }

  issues.push(...validateKpSemanticTransformation(transformation, bundle));
  if (map !== undefined && source !== undefined && target !== undefined) {
    issues.push(...validateCorrespondenceMap(map, {
      sourceSelectorIds: source.selectors.map(({ id }) => id),
      targetSelectorIds: target.selectors.map(({ id }) => id)
    }));
    validateCarrier(candidate, bundle, map.records, issues);
    validateIdentityLaw(candidate, transformation, map.records, issues);
    validateRemovedCohort(candidate, map.records, issues);
    validateStationaryContext(candidate, map.records, issues);
    validateCompleteEvidence(candidate, source.selectors, target.selectors,
      map.records, issues);
  }

  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid-evidence" as const,
      issues: Object.freeze(issues.map((issue) => Object.freeze(issue)))
    });
  }
  return Object.freeze({
    status: "verified" as const,
    evidence: normalizeEvidence(candidate)
  });
}

function validateCarrier(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate,
  bundle: KpAssetBundle,
  records: readonly SelectorCorrespondenceRecord[],
  issues: KpCarrierEvidenceValidationIssue[]
): void {
  const record = findRecord(records, candidate.carrier.correspondenceRecordId);
  const sourceSelector = findKpAssetSelector(
    bundle,
    candidate.carrier.sourceSelectorId
  );
  const targetSelector = findKpAssetSelector(
    bundle,
    candidate.carrier.targetSelectorId
  );
  if (
    record?.relation !== "identity" ||
    !same(record.sourceSelectorIds, [candidate.carrier.sourceSelectorId]) ||
    !same(record.targetSelectorIds, [candidate.carrier.targetSelectorId])
  ) {
    issues.push({
      path: "carrier",
      message: "The carrier must be one explicit one-to-one identity record."
    });
  }
  if (
    sourceSelector?.objectId !== candidate.endpoints.sourceObjectId ||
    targetSelector?.objectId !== candidate.endpoints.targetObjectId
  ) {
    issues.push({
      path: "carrier",
      message: "Carrier selectors must belong to the exact source and target endpoints."
    });
  }
}

function validateIdentityLaw(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate,
  transformation: KpSemanticTransformation,
  records: readonly SelectorCorrespondenceRecord[],
  issues: KpCarrierEvidenceValidationIssue[]
): void {
  const witness = candidate.identityLawWitness;
  const lawIsStrict = transformation.lawRefs?.some(
    ({ id, level }) => id === witness.lawId && level === "strict"
  ) ?? false;
  const removal = findRecord(records, witness.removalRecordId);
  if (!lawIsStrict) {
    issues.push({
      path: "identityLawWitness.lawId",
      message: "Identity-law evidence must reference a strict transformation law."
    });
  }
  if (
    removal?.relation !== "removal" ||
    !removal.sourceSelectorIds.includes(witness.sourceSelectorId) ||
    removal.targetSelectorIds.length !== 0
  ) {
    issues.push({
      path: "identityLawWitness.removalRecordId",
      message: "The identity witness must have an explicit removal lifecycle."
    });
  }
  if (!candidate.removedSyntaxCohort.selectorIds.includes(witness.sourceSelectorId)) {
    issues.push({
      path: "identityLawWitness.sourceSelectorId",
      message: "The identity witness must belong to the removed syntax cohort."
    });
  }
}

function validateRemovedCohort(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate,
  records: readonly SelectorCorrespondenceRecord[],
  issues: KpCarrierEvidenceValidationIssue[]
): void {
  const cohort = candidate.removedSyntaxCohort;
  const removalRecords = cohort.correspondenceRecordIds.map((id) =>
    findRecord(records, id)
  );
  const removedSelectors = removalRecords.flatMap((record) =>
    record?.relation === "removal" && record.targetSelectorIds.length === 0
      ? record.sourceSelectorIds
      : []
  );
  if (
    new Set(cohort.selectorIds).size !== cohort.selectorIds.length ||
    new Set(cohort.correspondenceRecordIds).size !==
      cohort.correspondenceRecordIds.length ||
    removalRecords.some((record) =>
      record?.relation !== "removal" || record.targetSelectorIds.length !== 0) ||
    !sameSet(removedSelectors, cohort.selectorIds)
  ) {
    issues.push({
      path: "removedSyntaxCohort",
      message: "Removed syntax must be a unique, complete source-only removal cohort."
    });
  }
  if (cohort.selectorIds.includes(candidate.carrier.sourceSelectorId)) {
    issues.push({
      path: "removedSyntaxCohort.selectorIds",
      message: "The persistent carrier cannot belong to the removed syntax cohort."
    });
  }
}

function validateStationaryContext(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate,
  records: readonly SelectorCorrespondenceRecord[],
  issues: KpCarrierEvidenceValidationIssue[]
): void {
  for (const [index, context] of candidate.stationaryContext.entries()) {
    const record = findRecord(records, context.correspondenceRecordId);
    if (
      record?.relation !== "identity" ||
      !same(record.sourceSelectorIds, [context.sourceSelectorId]) ||
      !same(record.targetSelectorIds, [context.targetSelectorId])
    ) {
      issues.push({
        path: `stationaryContext[${index}]`,
        message: "Stationary context must use an explicit one-to-one identity record."
      });
    }
  }
}

function validateCompleteEvidence(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate,
  sourceSelectors: readonly KpAssetSelector[],
  targetSelectors: readonly KpAssetSelector[],
  records: readonly SelectorCorrespondenceRecord[],
  issues: KpCarrierEvidenceValidationIssue[]
): void {
  const sourceEvidence = [
    candidate.carrier.sourceSelectorId,
    ...candidate.removedSyntaxCohort.selectorIds,
    ...candidate.stationaryContext.map(({ sourceSelectorId }) => sourceSelectorId)
  ];
  const targetEvidence = [
    candidate.carrier.targetSelectorId,
    ...candidate.stationaryContext.map(({ targetSelectorId }) => targetSelectorId)
  ];
  const recordEvidence = [
    candidate.carrier.correspondenceRecordId,
    ...candidate.removedSyntaxCohort.correspondenceRecordIds,
    ...candidate.stationaryContext.map(
      ({ correspondenceRecordId }) => correspondenceRecordId)
  ];
  const semanticRecordIds = records
    .filter(({ relation }) => relation !== "artifact" && relation !== "focus")
    .map(({ id }) => id);
  if (
    hasDuplicates(sourceEvidence) ||
    hasDuplicates(targetEvidence) ||
    hasDuplicates(recordEvidence) ||
    !sameSet(sourceEvidence, sourceSelectors.map(({ id }) => id)) ||
    !sameSet(targetEvidence, targetSelectors.map(({ id }) => id)) ||
    !sameSet(recordEvidence, semanticRecordIds)
  ) {
    issues.push({
      path: "lifecycle",
      message:
        "Carrier, removal, and stationary evidence must partition every semantic endpoint and correspondence exactly once."
    });
  }
}

function normalizeEvidence(
  candidate: KpCarrierPreservingSimplificationEvidenceCandidate
): KpVerifiedCarrierPreservingSimplificationEvidence {
  const evidence = Object.freeze({
    schemaVersion: candidate.schemaVersion,
    id: candidate.id,
    transformationId: candidate.transformationId,
    endpoints: Object.freeze({ ...candidate.endpoints }),
    carrier: Object.freeze({ ...candidate.carrier }),
    identityLawWitness: Object.freeze({ ...candidate.identityLawWitness }),
    removedSyntaxCohort: Object.freeze({
      selectorIds: Object.freeze([...candidate.removedSyntaxCohort.selectorIds]),
      correspondenceRecordIds: Object.freeze([
        ...candidate.removedSyntaxCohort.correspondenceRecordIds
      ])
    }),
    stationaryContext: Object.freeze(candidate.stationaryContext.map(
      (context) => Object.freeze({ ...context })
    ))
  }) as KpVerifiedCarrierPreservingSimplificationEvidence;
  verifiedCarrierEvidence.add(evidence);
  return evidence;
}

function findRecord(
  records: readonly SelectorCorrespondenceRecord[],
  id: string
): SelectorCorrespondenceRecord | undefined {
  return records.find((record) => record.id === id);
}

function same(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}
