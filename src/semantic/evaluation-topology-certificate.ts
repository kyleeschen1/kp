import {
  findKpAssetSelector,
  type KpAssetBundle,
  type KpAssetSelector
} from "./asset.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";

export const kpEvaluationTopologyCertificateSchemaVersion =
  "kp.evaluation-topology-certificate.v1" as const;

export const kpEvaluationTopologyKinds = [
  "contributors-create-result",
  "carrier-survives",
  "annihilation-leaves-survivor"
] as const;

export type KpEvaluationTopologyKind =
  (typeof kpEvaluationTopologyKinds)[number];

interface KpEvaluationTopologyCertificateBase {
  readonly schemaVersion:
    typeof kpEvaluationTopologyCertificateSchemaVersion;
  readonly transformationId: string;
  readonly operationId: string;
  readonly correspondenceRecordId: string;
  readonly cohortId?: string | undefined;
  readonly evidenceSource: "verified-selector-correspondence";
}

export type KpEvaluationTopologyCertificate =
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "contributors-create-result";
      readonly materialInputSelectorIds: readonly string[];
      readonly catalystSelectorIds: readonly string[];
      readonly resultSelectorIds: readonly string[];
    })
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "carrier-survives";
      readonly carrierSourceSelectorId: string;
      readonly carrierTargetSelectorId: string;
      readonly retiringArtifactSelectorIds: readonly string[];
    })
  | (KpEvaluationTopologyCertificateBase & {
      readonly topology: "annihilation-leaves-survivor";
      readonly annihilatedSelectorIds: readonly string[];
      readonly survivorSourceSelectorIds: readonly string[];
      readonly survivorTargetSelectorIds: readonly string[];
    });

declare const kpVerifiedEvaluationTopologyCertificateBrand: unique symbol;

export type KpVerifiedEvaluationTopologyCertificate = Readonly<
  KpEvaluationTopologyCertificate & {
    readonly [kpVerifiedEvaluationTopologyCertificateBrand]: true;
  }
>;

const verifiedCertificates = new WeakSet<object>();

export type KpContributorEvaluationTopologyDiagnosticCode =
  | "evaluation-topology.missing-correspondence-map"
  | "evaluation-topology.missing-evaluation-record"
  | "evaluation-topology.ambiguous-evaluation-record"
  | "evaluation-topology.missing-selector"
  | "evaluation-topology.incomplete-source-role"
  | "evaluation-topology.incomplete-target-role"
  | "evaluation-topology.insufficient-contributors"
  | "evaluation-topology.insufficient-cohorts"
  | "evaluation-topology.missing-cohort-id"
  | "evaluation-topology.ambiguous-cohort-id"
  | "evaluation-topology.overlapping-cohorts";

export interface KpContributorEvaluationTopologyDiagnostic {
  readonly code: KpContributorEvaluationTopologyDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export type KpContributorEvaluationTopologyCompilation =
  | {
      readonly status: "verified";
      readonly certificate: KpVerifiedEvaluationTopologyCertificate & {
        readonly topology: "contributors-create-result";
      };
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpContributorEvaluationTopologyDiagnostic[];
    };

export type KpVerifiedContributorEvaluationTopologyCohortCertificate =
  KpVerifiedEvaluationTopologyCertificate & {
    readonly topology: "contributors-create-result";
    readonly cohortId: string;
  };

export type KpContributorEvaluationTopologyCohortCompilation =
  | {
      readonly status: "verified";
      readonly certificates: readonly [
        KpVerifiedContributorEvaluationTopologyCohortCertificate,
        KpVerifiedContributorEvaluationTopologyCohortCertificate,
        ...KpVerifiedContributorEvaluationTopologyCohortCertificate[]
      ];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpContributorEvaluationTopologyDiagnostic[];
    };

export interface CompileKpContributorEvaluationTopologyCertificateInput {
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly operationId: string;
}

export function isKpVerifiedEvaluationTopologyCertificate(
  value: unknown
): value is KpVerifiedEvaluationTopologyCertificate {
  return typeof value === "object" && value !== null &&
    verifiedCertificates.has(value);
}

/** Compiler implementations in this module are the only certificate minters. */
function rememberVerifiedEvaluationTopologyCertificate(
  certificate: KpEvaluationTopologyCertificate
): KpVerifiedEvaluationTopologyCertificate {
  const verified = Object.freeze(certificate) as unknown as
    KpVerifiedEvaluationTopologyCertificate;
  verifiedCertificates.add(verified);
  return verified;
}

/**
 * Derives contributor topology only when correspondence and endpoint metadata
 * agree. This keeps animation-family selection downstream of semantic proof.
 */
export function compileKpContributorEvaluationTopologyCertificate(
  input: CompileKpContributorEvaluationTopologyCertificateInput
): KpContributorEvaluationTopologyCompilation {
  const { bundle, transformation, operationId } = input;
  const map = transformation.correspondenceMap;

  if (map === undefined) {
    return repairRequired({
      code: "evaluation-topology.missing-correspondence-map",
      path: "transformation.correspondenceMap",
      message:
        `Transformation ${transformation.id} needs a correspondence map before evaluation topology can be derived.`
    });
  }

  const candidateRecords = contributorEvaluationRecords(
    bundle,
    transformation,
    operationId
  );

  if (candidateRecords.length === 0) {
    return repairRequired({
      code: "evaluation-topology.missing-evaluation-record",
      path: "transformation.correspondenceMap.records",
      message:
        `Transformation ${transformation.id} has no fan-in correspondence for operation ${operationId}.`
    });
  }

  if (candidateRecords.length > 1) {
    return repairRequired({
      code: "evaluation-topology.ambiguous-evaluation-record",
      path: "transformation.correspondenceMap.records",
      message:
        `Transformation ${transformation.id} has ${candidateRecords.length} fan-in correspondences for operation ${operationId}; exactly one is required.`
    });
  }

  return compileContributorEvaluationRecord({
    bundle,
    transformation,
    operationId,
    record: candidateRecords[0]!
  });
}

/**
 * Multi-cohort evaluation remains a bounded list of disjoint correspondence
 * records. It does not construct a general evaluation graph or change the
 * singular compiler's exactly-one-record contract.
 */
export function compileKpContributorEvaluationTopologyCohortCertificates(
  input: CompileKpContributorEvaluationTopologyCertificateInput
): KpContributorEvaluationTopologyCohortCompilation {
  const { bundle, transformation, operationId } = input;
  if (transformation.correspondenceMap === undefined) {
    return cohortRepairRequired({
      code: "evaluation-topology.missing-correspondence-map",
      path: "transformation.correspondenceMap",
      message:
        `Transformation ${transformation.id} needs a correspondence map before evaluation cohorts can be derived.`
    });
  }
  const records = contributorEvaluationRecords(
    bundle,
    transformation,
    operationId
  );
  if (records.length < 2) {
    return cohortRepairRequired({
      code: "evaluation-topology.insufficient-cohorts",
      path: "transformation.correspondenceMap.records",
      message:
        `Transformation ${transformation.id} needs at least two disjoint fan-in cohorts for operation ${operationId}.`
    });
  }

  const diagnostics: KpContributorEvaluationTopologyDiagnostic[] = [];
  const certificates:
    KpVerifiedContributorEvaluationTopologyCohortCertificate[] = [];
  const selectorCohorts = new Map<string, string>();
  const cohortIds = new Set<string>();
  for (const record of records) {
    const selectorIds = [
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ];
    const recordCohortIds = new Set(selectorIds.flatMap((selectorId) => {
      const value = findKpAssetSelector(bundle, selectorId)
        ?.metadata?.["successorCohortId"];
      return typeof value === "string" && value.trim() !== "" ? [value] : [];
    }));
    if (recordCohortIds.size === 0) {
      diagnostics.push({
        code: "evaluation-topology.missing-cohort-id",
        path: `transformation.correspondenceMap.records.${record.id}`,
        message: `Evaluation record ${record.id} must declare one cohort ID on every contributor and result.`
      });
      continue;
    }
    if (recordCohortIds.size !== 1) {
      diagnostics.push({
        code: "evaluation-topology.ambiguous-cohort-id",
        path: `transformation.correspondenceMap.records.${record.id}`,
        message: `Evaluation record ${record.id} spans ${recordCohortIds.size} cohort IDs.`
      });
      continue;
    }
    const cohortId = [...recordCohortIds][0]!;
    const missingCohort = selectorIds.find((selectorId) =>
      findKpAssetSelector(bundle, selectorId)
        ?.metadata?.["successorCohortId"] !== cohortId
    );
    if (missingCohort !== undefined) {
      diagnostics.push({
        code: "evaluation-topology.missing-cohort-id",
        path: `selectors.${missingCohort}.metadata.successorCohortId`,
        message: `Selector ${missingCohort} must belong to cohort ${cohortId}.`
      });
      continue;
    }
    if (cohortIds.has(cohortId)) {
      diagnostics.push({
        code: "evaluation-topology.ambiguous-cohort-id",
        path: `transformation.correspondenceMap.records.${record.id}`,
        message: `Evaluation cohort ${cohortId} is claimed by more than one record.`
      });
      continue;
    }
    cohortIds.add(cohortId);
    for (const selectorId of selectorIds) {
      const prior = selectorCohorts.get(selectorId);
      if (prior !== undefined) diagnostics.push({
        code: "evaluation-topology.overlapping-cohorts",
        path: `selectors.${selectorId}`,
        message:
          `Selector ${selectorId} cannot belong to both ${prior} and ${cohortId}.`
      });
      selectorCohorts.set(selectorId, cohortId);
    }
    const compiled = compileContributorEvaluationRecord({
      bundle,
      transformation,
      operationId,
      record,
      cohortId
    });
    if (compiled.status === "repair-required") {
      diagnostics.push(...compiled.diagnostics);
    } else {
      certificates.push(compiled.certificate as
        KpVerifiedContributorEvaluationTopologyCohortCertificate);
    }
  }
  if (diagnostics.length > 0) {
    return { status: "repair-required", diagnostics };
  }
  if (certificates.length < 2) {
    return cohortRepairRequired({
      code: "evaluation-topology.insufficient-cohorts",
      path: "transformation.correspondenceMap.records",
      message: "Contributor evaluation cohort compilation produced fewer than two certificates."
    });
  }
  return {
    status: "verified",
    certificates: Object.freeze(certificates) as readonly [
      KpVerifiedContributorEvaluationTopologyCohortCertificate,
      KpVerifiedContributorEvaluationTopologyCohortCertificate,
      ...KpVerifiedContributorEvaluationTopologyCohortCertificate[]
    ]
  };
}

function compileContributorEvaluationRecord(input: {
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly operationId: string;
  readonly record: SelectorCorrespondenceRecord;
  readonly cohortId?: string | undefined;
}): KpContributorEvaluationTopologyCompilation {
  const { bundle, transformation, operationId, record } = input;
  const diagnostics: KpContributorEvaluationTopologyDiagnostic[] = [];
  const sourceSelectors = resolveSelectors(
    bundle,
    record.sourceSelectorIds,
    `transformation.correspondenceMap.records.${record.id}.sourceSelectorIds`,
    diagnostics
  );
  const targetSelectors = resolveSelectors(
    bundle,
    record.targetSelectorIds,
    `transformation.correspondenceMap.records.${record.id}.targetSelectorIds`,
    diagnostics
  );

  const materialInputSelectorIds: string[] = [];
  const catalystSelectorIds: string[] = [];
  for (const selector of sourceSelectors) {
    const contribution = selector.metadata?.["successorContribution"];
    if (
      selector.metadata?.["successorOperationId"] !== operationId ||
      (contribution !== "material-input" && contribution !== "catalyst")
    ) {
      diagnostics.push({
        code: "evaluation-topology.incomplete-source-role",
        path: `selectors.${selector.id}.metadata`,
        message:
          `Source selector ${selector.id} must name operation ${operationId} and a material-input or catalyst contribution.`
      });
      continue;
    }

    (contribution === "material-input"
      ? materialInputSelectorIds
      : catalystSelectorIds).push(selector.id);
  }

  const resultSelectorIds: string[] = [];
  for (const selector of targetSelectors) {
    if (
      selector.metadata?.["successorOperationId"] !== operationId ||
      selector.metadata?.["successorTarget"] !== true
    ) {
      diagnostics.push({
        code: "evaluation-topology.incomplete-target-role",
        path: `selectors.${selector.id}.metadata`,
        message:
          `Target selector ${selector.id} must be the declared result of operation ${operationId}.`
      });
      continue;
    }
    resultSelectorIds.push(selector.id);
  }

  if (
    materialInputSelectorIds.length < 2 ||
    catalystSelectorIds.length < 1 ||
    resultSelectorIds.length < 1
  ) {
    diagnostics.push({
      code: "evaluation-topology.insufficient-contributors",
      path: `transformation.correspondenceMap.records.${record.id}`,
      message:
        "Contributor evaluation needs at least two material inputs, one catalyst, and one result."
    });
  }

  if (diagnostics.length > 0) {
    return { status: "repair-required", diagnostics };
  }

  return {
    status: "verified",
    certificate: rememberVerifiedEvaluationTopologyCertificate({
      schemaVersion: kpEvaluationTopologyCertificateSchemaVersion,
      topology: "contributors-create-result",
      transformationId: transformation.id,
      operationId,
      correspondenceRecordId: record.id,
      ...(input.cohortId === undefined ? {} : { cohortId: input.cohortId }),
      evidenceSource: "verified-selector-correspondence",
      materialInputSelectorIds,
      catalystSelectorIds,
      resultSelectorIds
    }) as KpVerifiedEvaluationTopologyCertificate & {
      readonly topology: "contributors-create-result";
    }
  };
}

function contributorEvaluationRecords(
  bundle: KpAssetBundle,
  transformation: KpSemanticTransformation,
  operationId: string
): readonly SelectorCorrespondenceRecord[] {
  return (transformation.correspondenceMap?.records ?? []).filter((record) => {
    if (record.relation !== "fan-in") return false;
    const selectors = [
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ].map((selectorId) => findKpAssetSelector(bundle, selectorId));
    return selectors.some((selector) =>
      selector?.metadata?.["successorOperationId"] === operationId
    );
  });
}

function resolveSelectors(
  bundle: KpAssetBundle,
  selectorIds: readonly string[],
  path: string,
  diagnostics: KpContributorEvaluationTopologyDiagnostic[]
): KpAssetSelector[] {
  const selectors: KpAssetSelector[] = [];
  selectorIds.forEach((selectorId, index) => {
    const selector = findKpAssetSelector(bundle, selectorId);
    if (selector === undefined) {
      diagnostics.push({
        code: "evaluation-topology.missing-selector",
        path: `${path}[${index}]`,
        message: `Correspondence references missing selector ${selectorId}.`
      });
    } else {
      selectors.push(selector);
    }
  });
  return selectors;
}

function repairRequired(
  diagnostic: KpContributorEvaluationTopologyDiagnostic
): KpContributorEvaluationTopologyCompilation {
  return { status: "repair-required", diagnostics: [diagnostic] };
}

function cohortRepairRequired(
  diagnostic: KpContributorEvaluationTopologyDiagnostic
): KpContributorEvaluationTopologyCohortCompilation {
  return { status: "repair-required", diagnostics: [diagnostic] };
}
