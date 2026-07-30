import type {
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program-validator.ts";
import {
  isKpVerifiedPerceptualContinuityContract,
  kpPerceptualContinuityEndpointMetrics,
  type KpPerceptualContinuityContractDraft,
  type KpPerceptualContinuityEndpointMetric,
  type KpVerifiedPerceptualContinuityContract
} from "./perceptual-continuity-contract.ts";

export const kpOperationEvaluationContinuityTopologyIds = Object.freeze([
  "target-style-reverse-flip",
  "bounded-semantic-contact-co-presence",
  "visible-motif-owned-carrier"
] as const);

export type KpOperationEvaluationContinuityTopologyId =
  typeof kpOperationEvaluationContinuityTopologyIds[number];

export type KpOperationEvaluationContinuityCandidateStatus =
  | "eligible"
  | "ineligible";

/**
 * This is an architecture selection, not caller-authored presentation state.
 * The comparison below must continue to reproduce it from measured paint
 * before a renderer compiler may rely on it.
 */
export const kpOperationEvaluationContinuityTopologyDecision = Object.freeze({
  schemaVersion:
    "kp.operation-evaluation-continuity-topology-decision.v1",
  selectedTopology:
    "bounded-semantic-contact-co-presence",
  referenceId:
    "kp.operation-evaluation.reference.continuous-recognition-v1",
  selectionRule:
    "preserve-program-roles-then-minimize-added-paint-owners",
  reverseFlipScope:
    "one-to-one-compatible-paint-only",
  visibleCarrierDisposition:
    "eligible-fallback-when-certified-co-presence-cannot-pass"
} as const);

export type KpOperationEvaluationContinuityDiagnosticCode =
  | "recording.input.invalid"
  | "recording.program.unverified"
  | "recording.program.kind"
  | "recording.program.mismatch"
  | "recording.contract.unverified"
  | "recording.contract.mismatch"
  | "recording.profile.duplicate"
  | "recording.profile.invalid"
  | "candidate.lineage-cardinality"
  | "candidate.program-role-coverage"
  | "candidate.phase-fidelity"
  | "candidate.visible-ink-floor"
  | "candidate.geometry-delta"
  | "candidate.raster-delta"
  | "candidate.owner-coverage"
  | "candidate.owner-conflict"
  | "candidate.owner-transfer"
  | "candidate.semantic-contact"
  | "candidate.endpoint-mismatch"
  | "candidate.style-incompatible"
  | "candidate.structural-paint-incompatible"
  | "candidate.native-mutation"
  | "candidate.carrier-unavailable"
  | "comparison.no-generic-candidate";

export interface KpOperationEvaluationContinuityDiagnostic {
  readonly code: KpOperationEvaluationContinuityDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpOperationEvaluationReferencePaintProfile {
  readonly id: string;
  readonly browser: "chromium" | "firefox" | "webkit";
  readonly viewport: "wide" | "phone";
  readonly deviceScaleFactor: 1 | 2;
  readonly sampleCount: number;
  readonly minimumVisibleInkRatio: number;
  readonly maximumNormalizedGeometryDelta: number;
  readonly maximumNormalizedRasterDelta: number;
  readonly phaseFidelityRatio: number;
  readonly programRoleCoverageRatio: number;
  readonly certifiedContactCoverageRatio: number;
  readonly ownerCoverageRatio: number;
  readonly ambiguousOwnerCount: number;
  readonly atomicTransferMismatchCount: number;
  readonly endpointMetricMismatches:
    readonly KpPerceptualContinuityEndpointMetric[];
  readonly nativeMutationCount: number;
}

export interface KpOperationEvaluationReferencePaintRecording {
  readonly schemaVersion:
    "kp.operation-evaluation-reference-paint-recording.v1";
  readonly id: string;
  readonly programId: string;
  readonly programVersion: string;
  readonly structure: {
    readonly materialInputPaintCount: number;
    readonly catalystPaintCount: number;
    readonly resultPaintCount: number;
    readonly sourceTargetSilhouetteDelta: number;
    readonly sourceTargetStyleCompatible: boolean;
    readonly structuralPaintCompatible: boolean;
    readonly existingMaterialCarrierAvailable: boolean;
  };
  readonly profiles:
    readonly KpOperationEvaluationReferencePaintProfile[];
  readonly semanticAuthority: {
    readonly phaseAndRoleTruth: "executable-program";
    readonly paintMeasurements: "diagnostic-evidence-only";
  };
}

export interface KpOperationEvaluationContinuityCandidateAssessment {
  readonly id: KpOperationEvaluationContinuityTopologyId;
  readonly status: KpOperationEvaluationContinuityCandidateStatus;
  readonly preservesReferenceChoreography: boolean;
  readonly exactNativeEndpoints: boolean;
  readonly minimumVisibleInkRatio: number;
  readonly maximumNormalizedGeometryDelta: number;
  readonly maximumNormalizedRasterDelta: number;
  readonly programRoleCoverageRatio: number;
  readonly certifiedContactCoverageRatio: number;
  readonly endpointMismatchCount: number;
  readonly nativeMutationCount: number;
  readonly addedPaintOwnerCount: number;
  readonly estimatedPaintAtomsPerFrame: number;
  readonly diagnostics:
    readonly KpOperationEvaluationContinuityDiagnostic[];
}

export interface KpOperationEvaluationContinuityTopologyComparison {
  readonly kind:
    "operation-evaluation-continuity-topology-comparison";
  readonly recordingId: string;
  readonly programId: string;
  readonly programVersion: string;
  readonly contractId: string;
  readonly selectedTopology:
    KpOperationEvaluationContinuityTopologyId | null;
  readonly candidates:
    readonly KpOperationEvaluationContinuityCandidateAssessment[];
  readonly diagnostics:
    readonly KpOperationEvaluationContinuityDiagnostic[];
}

/**
 * The operation-evaluation thresholds are kept beside the comparison so later
 * renderers consume one quality boundary. They constrain observed paint but do
 * not grant any caller authority over topology, geometry, or timing.
 */
export function createKpOperationEvaluationContinuityContractDraft(
  program: KpVerifiedExecutableSuccessorMotifProgram
): KpPerceptualContinuityContractDraft {
  return Object.freeze({
    schemaVersion: "kp.perceptual-continuity-contract.v1",
    id: "kp.perceptual-continuity.operation-evaluation.v1",
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    visibility: Object.freeze({
      kind: "continuous-visible-ink",
      minimumVisibleInkRatio: 0.18
    }),
    adjacentFrameBudgets: Object.freeze({
      maximumNormalizedGeometryDelta: 0.08,
      maximumNormalizedRasterDelta: 0.1
    }),
    ownerCoverage: Object.freeze({
      requiredCoverageRatio: 1,
      maximumAmbiguousOwnerCount: 0,
      maximumAtomicTransferMismatchCount: 0
    }),
    endpointEquivalence: Object.freeze({
      settlement: "exact-native-source-and-target",
      requiredMetrics: kpPerceptualContinuityEndpointMetrics
    }),
    invariance: Object.freeze({
      directions: Object.freeze(["forward", "rewind"] as const),
      samplingModes: Object.freeze([
        "direct-seek",
        "natural-playback",
        "replay"
      ] as const),
      browsers: Object.freeze([
        "chromium",
        "firefox",
        "webkit"
      ] as const),
      viewports: Object.freeze(["wide", "phone"] as const),
      deviceScaleFactors: Object.freeze([1, 2] as const)
    }),
    evidenceBudget: Object.freeze({
      maximumTraceCount: 72,
      maximumSamplesPerTrace: 257,
      maximumTotalSamples: 18_504
    }),
    semanticAuthority: Object.freeze({
      identity: "program-roles-and-lineage",
      measurements: "current-frame-observation-only",
      rasterHistory: "never-semantic-authority"
    })
  });
}

/**
 * Compares a closed topology set against measured paint. Candidate projection
 * may derive failures from lineage cardinality, but measurements never invent
 * roles, phases, or semantic ownership.
 */
export function compareKpOperationEvaluationContinuityTopologies(input: {
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly recording: KpOperationEvaluationReferencePaintRecording;
}): KpOperationEvaluationContinuityTopologyComparison {
  const inputDiagnostics = validateComparisonInput(input);
  if (inputDiagnostics.length > 0) {
    return comparisonReport({
      input,
      selectedTopology: null,
      candidates: [],
      diagnostics: inputDiagnostics
    });
  }

  const aggregates = aggregateProfiles(input.recording.profiles);
  const candidates = kpOperationEvaluationContinuityTopologyIds.map((id) =>
    assessCandidate({
      id,
      program: input.program,
      contract: input.contract,
      recording: input.recording,
      aggregates
    })
  );
  const eligible = candidates.filter(({ status }) => status === "eligible")
    .sort(compareCandidatePriority);
  const selectedTopology = eligible[0]?.id ?? null;
  const diagnostics = selectedTopology === null
    ? [diagnostic(
        "comparison.no-generic-candidate",
        "candidates",
        "No generic continuity topology satisfies the selected reference."
      )]
    : [];
  return comparisonReport({
    input,
    selectedTopology,
    candidates,
    diagnostics
  });
}

function validateComparisonInput(input: {
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly recording: KpOperationEvaluationReferencePaintRecording;
}): readonly KpOperationEvaluationContinuityDiagnostic[] {
  const diagnostics: KpOperationEvaluationContinuityDiagnostic[] = [];
  if (!isKpVerifiedExecutableSuccessorMotifProgram(input.program)) {
    diagnostics.push(diagnostic(
      "recording.program.unverified",
      "program",
      "Topology comparison requires the exact minted executable program."
    ));
  } else if (input.program.kind !== "operation-evaluation") {
    // A matching string ID cannot turn evidence from another motif family into
    // operation-evaluation evidence; the executable kind owns that boundary.
    diagnostics.push(diagnostic(
      "recording.program.kind",
      "program.kind",
      "Operation-evaluation topology comparison rejects other motif families."
    ));
  }
  if (!isKpVerifiedPerceptualContinuityContract(input.contract)) {
    diagnostics.push(diagnostic(
      "recording.contract.unverified",
      "contract",
      "Topology comparison requires a minted perceptual contract."
    ));
  }
  const recording = input.recording;
  if (
    typeof recording !== "object" ||
    recording === null ||
    recording.schemaVersion !==
      "kp.operation-evaluation-reference-paint-recording.v1" ||
    recording.id.trim() === "" ||
    recording.semanticAuthority.phaseAndRoleTruth !== "executable-program" ||
    recording.semanticAuthority.paintMeasurements !==
      "diagnostic-evidence-only"
  ) {
    diagnostics.push(diagnostic(
      "recording.input.invalid",
      "recording",
      "Reference paint recording has an invalid schema or authority boundary."
    ));
    return diagnostics;
  }
  if (
    recording.programId !== input.program.id ||
    recording.programVersion !== input.program.programVersion
  ) {
    diagnostics.push(diagnostic(
      "recording.program.mismatch",
      "recording.programId",
      "Reference paint recording does not match the exact program."
    ));
  }
  if (
    input.contract.programId !== input.program.id ||
    input.contract.programVersion !== input.program.programVersion ||
    input.contract.programKind !== input.program.kind
  ) {
    diagnostics.push(diagnostic(
      "recording.contract.mismatch",
      "contract.programId",
      "Perceptual contract does not match the exact program."
    ));
  }
  validateStructure(recording, diagnostics);
  const profileIds = new Set<string>();
  for (const [index, profile] of recording.profiles.entries()) {
    if (profileIds.has(profile.id)) {
      diagnostics.push(diagnostic(
        "recording.profile.duplicate",
        `recording.profiles[${index}].id`,
        `Reference paint profile ${profile.id} is duplicated.`
      ));
    }
    profileIds.add(profile.id);
    if (!validProfile(profile, input.contract)) {
      diagnostics.push(diagnostic(
        "recording.profile.invalid",
        `recording.profiles[${index}]`,
        `Reference paint profile ${profile.id || index} is invalid.`
      ));
    }
  }
  if (recording.profiles.length === 0) {
    diagnostics.push(diagnostic(
      "recording.profile.invalid",
      "recording.profiles",
      "Topology comparison requires recorded paint profiles."
    ));
  }
  return diagnostics;
}

function validateStructure(
  recording: KpOperationEvaluationReferencePaintRecording,
  diagnostics: KpOperationEvaluationContinuityDiagnostic[]
): void {
  const structure = recording.structure;
  if (
    !positiveInteger(structure.materialInputPaintCount) ||
    !nonNegativeInteger(structure.catalystPaintCount) ||
    !positiveInteger(structure.resultPaintCount) ||
    !unit(structure.sourceTargetSilhouetteDelta) ||
    typeof structure.sourceTargetStyleCompatible !== "boolean" ||
    typeof structure.structuralPaintCompatible !== "boolean" ||
    typeof structure.existingMaterialCarrierAvailable !== "boolean"
  ) {
    diagnostics.push(diagnostic(
      "recording.input.invalid",
      "recording.structure",
      "Reference paint structure requires finite cardinality and compatibility evidence."
    ));
  }
}

function validProfile(
  profile: KpOperationEvaluationReferencePaintProfile,
  contract: KpVerifiedPerceptualContinuityContract
): boolean {
  return profile.id.trim() !== "" &&
    contract.invariance.browsers.includes(profile.browser) &&
    contract.invariance.viewports.includes(profile.viewport) &&
    contract.invariance.deviceScaleFactors.includes(
      profile.deviceScaleFactor
    ) &&
    positiveInteger(profile.sampleCount) &&
    profile.sampleCount <= contract.evidenceBudget.maximumSamplesPerTrace &&
    unit(profile.minimumVisibleInkRatio) &&
    unit(profile.maximumNormalizedGeometryDelta) &&
    unit(profile.maximumNormalizedRasterDelta) &&
    unit(profile.phaseFidelityRatio) &&
    unit(profile.programRoleCoverageRatio) &&
    unit(profile.certifiedContactCoverageRatio) &&
    unit(profile.ownerCoverageRatio) &&
    nonNegativeInteger(profile.ambiguousOwnerCount) &&
    nonNegativeInteger(profile.atomicTransferMismatchCount) &&
    nonNegativeInteger(profile.nativeMutationCount) &&
    Array.isArray(profile.endpointMetricMismatches) &&
    profile.endpointMetricMismatches.every((metric) =>
      kpPerceptualContinuityEndpointMetrics.includes(metric)
    );
}

interface ProfileAggregates {
  readonly minimumVisibleInkRatio: number;
  readonly maximumNormalizedGeometryDelta: number;
  readonly maximumNormalizedRasterDelta: number;
  readonly minimumPhaseFidelityRatio: number;
  readonly minimumProgramRoleCoverageRatio: number;
  readonly minimumCertifiedContactCoverageRatio: number;
  readonly minimumOwnerCoverageRatio: number;
  readonly ambiguousOwnerCount: number;
  readonly atomicTransferMismatchCount: number;
  readonly endpointMismatchCount: number;
  readonly nativeMutationCount: number;
}

function aggregateProfiles(
  profiles: readonly KpOperationEvaluationReferencePaintProfile[]
): ProfileAggregates {
  return Object.freeze({
    minimumVisibleInkRatio: minimum(
      profiles.map(({ minimumVisibleInkRatio }) => minimumVisibleInkRatio)
    ),
    maximumNormalizedGeometryDelta: maximum(
      profiles.map(
        ({ maximumNormalizedGeometryDelta }) =>
          maximumNormalizedGeometryDelta
      )
    ),
    maximumNormalizedRasterDelta: maximum(
      profiles.map(
        ({ maximumNormalizedRasterDelta }) => maximumNormalizedRasterDelta
      )
    ),
    minimumPhaseFidelityRatio: minimum(
      profiles.map(({ phaseFidelityRatio }) => phaseFidelityRatio)
    ),
    minimumProgramRoleCoverageRatio: minimum(
      profiles.map(
        ({ programRoleCoverageRatio }) => programRoleCoverageRatio
      )
    ),
    minimumCertifiedContactCoverageRatio: minimum(
      profiles.map(
        ({ certifiedContactCoverageRatio }) =>
          certifiedContactCoverageRatio
      )
    ),
    minimumOwnerCoverageRatio: minimum(
      profiles.map(({ ownerCoverageRatio }) => ownerCoverageRatio)
    ),
    ambiguousOwnerCount: maximum(
      profiles.map(({ ambiguousOwnerCount }) => ambiguousOwnerCount)
    ),
    atomicTransferMismatchCount: maximum(
      profiles.map(
        ({ atomicTransferMismatchCount }) =>
          atomicTransferMismatchCount
      )
    ),
    endpointMismatchCount: profiles.reduce(
      (count, profile) =>
        count + profile.endpointMetricMismatches.length,
      0
    ),
    nativeMutationCount: profiles.reduce(
      (count, profile) => count + profile.nativeMutationCount,
      0
    )
  });
}

function assessCandidate(input: {
  readonly id: KpOperationEvaluationContinuityTopologyId;
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly recording: KpOperationEvaluationReferencePaintRecording;
  readonly aggregates: ProfileAggregates;
}): KpOperationEvaluationContinuityCandidateAssessment {
  const structure = input.recording.structure;
  const sourcePaintCount =
    structure.materialInputPaintCount + structure.catalystPaintCount;
  const basePaintCount = sourcePaintCount + structure.resultPaintCount;
  const targetOnlyCoverage = sourcePaintCount === 0
    ? 0
    : structure.resultPaintCount / sourcePaintCount;
  const projected = input.id === "target-style-reverse-flip"
    ? {
        preservesReferenceChoreography:
          structure.materialInputPaintCount === structure.resultPaintCount &&
          structure.catalystPaintCount === 0,
        maximumNormalizedRasterDelta: Math.max(
          input.aggregates.maximumNormalizedRasterDelta,
          structure.sourceTargetSilhouetteDelta
        ),
        programRoleCoverageRatio: Math.min(1, targetOnlyCoverage),
        certifiedContactCoverageRatio: 1,
        addedPaintOwnerCount: 0,
        estimatedPaintAtomsPerFrame: structure.resultPaintCount
      }
    : input.id === "bounded-semantic-contact-co-presence"
      ? {
          preservesReferenceChoreography: true,
          maximumNormalizedRasterDelta:
            input.aggregates.maximumNormalizedRasterDelta,
          programRoleCoverageRatio:
            input.aggregates.minimumProgramRoleCoverageRatio,
          certifiedContactCoverageRatio:
            input.aggregates.minimumCertifiedContactCoverageRatio,
          addedPaintOwnerCount: 0,
          estimatedPaintAtomsPerFrame: basePaintCount
        }
      : {
          preservesReferenceChoreography: true,
          maximumNormalizedRasterDelta:
            input.aggregates.maximumNormalizedRasterDelta,
          programRoleCoverageRatio:
            input.aggregates.minimumProgramRoleCoverageRatio,
          certifiedContactCoverageRatio: 1,
          addedPaintOwnerCount: 1,
          estimatedPaintAtomsPerFrame: basePaintCount + 1
        };
  const diagnostics: KpOperationEvaluationContinuityDiagnostic[] = [];
  if (
    input.id === "target-style-reverse-flip" &&
    !projected.preservesReferenceChoreography
  ) {
    diagnostics.push(diagnostic(
      "candidate.lineage-cardinality",
      `candidates.${input.id}.lineage`,
      "Exclusive reverse FLIP requires one-to-one paint lineage; it cannot represent many contributors and a catalyst as one target."
    ));
  }
  if (
    projected.programRoleCoverageRatio <
      input.contract.ownerCoverage.requiredCoverageRatio
  ) {
    diagnostics.push(diagnostic(
      "candidate.program-role-coverage",
      `candidates.${input.id}.programRoleCoverageRatio`,
      "Candidate paint does not visibly represent every required program role."
    ));
  }
  if (input.aggregates.minimumPhaseFidelityRatio !== 1) {
    diagnostics.push(diagnostic(
      "candidate.phase-fidelity",
      `candidates.${input.id}.phaseFidelityRatio`,
      "Candidate evidence diverges from executable program phases."
    ));
  }
  if (
    input.aggregates.minimumVisibleInkRatio <
      input.contract.visibility.minimumVisibleInkRatio
  ) {
    diagnostics.push(diagnostic(
      "candidate.visible-ink-floor",
      `candidates.${input.id}.minimumVisibleInkRatio`,
      "Candidate falls below the operation-evaluation visible-ink floor."
    ));
  }
  if (
    input.aggregates.maximumNormalizedGeometryDelta >
      input.contract.adjacentFrameBudgets.maximumNormalizedGeometryDelta
  ) {
    diagnostics.push(diagnostic(
      "candidate.geometry-delta",
      `candidates.${input.id}.maximumNormalizedGeometryDelta`,
      "Candidate exceeds the bounded adjacent geometry delta."
    ));
  }
  if (
    projected.maximumNormalizedRasterDelta >
      input.contract.adjacentFrameBudgets.maximumNormalizedRasterDelta
  ) {
    diagnostics.push(diagnostic(
      "candidate.raster-delta",
      `candidates.${input.id}.maximumNormalizedRasterDelta`,
      "Candidate exceeds the bounded adjacent raster delta."
    ));
  }
  if (input.aggregates.minimumOwnerCoverageRatio !== 1) {
    diagnostics.push(diagnostic(
      "candidate.owner-coverage",
      `candidates.${input.id}.ownerCoverageRatio`,
      "Candidate paint lacks total logical owner coverage."
    ));
  }
  if (input.aggregates.ambiguousOwnerCount !== 0) {
    diagnostics.push(diagnostic(
      "candidate.owner-conflict",
      `candidates.${input.id}.ambiguousOwnerCount`,
      "Candidate paint has ambiguous logical owners."
    ));
  }
  if (input.aggregates.atomicTransferMismatchCount !== 0) {
    diagnostics.push(diagnostic(
      "candidate.owner-transfer",
      `candidates.${input.id}.atomicTransferMismatchCount`,
      "Candidate cannot transfer paint ownership atomically."
    ));
  }
  if (
    input.id === "bounded-semantic-contact-co-presence" &&
    projected.certifiedContactCoverageRatio !== 1
  ) {
    diagnostics.push(diagnostic(
      "candidate.semantic-contact",
      `candidates.${input.id}.certifiedContactCoverageRatio`,
      "Every source/target co-presence frame requires pair-scoped semantic-contact authority."
    ));
  }
  if (input.aggregates.endpointMismatchCount !== 0) {
    diagnostics.push(diagnostic(
      "candidate.endpoint-mismatch",
      `candidates.${input.id}.endpointMetricMismatches`,
      "Candidate does not settle to exact native endpoint paint."
    ));
  }
  if (
    input.id === "target-style-reverse-flip" &&
    !structure.sourceTargetStyleCompatible
  ) {
    diagnostics.push(diagnostic(
      "candidate.style-incompatible",
      `candidates.${input.id}.style`,
      "Reverse FLIP requires compatible measured source and target paint."
    ));
  }
  if (
    input.id === "target-style-reverse-flip" &&
    !structure.structuralPaintCompatible
  ) {
    diagnostics.push(diagnostic(
      "candidate.structural-paint-incompatible",
      `candidates.${input.id}.structuralPaint`,
      "Reverse FLIP cannot substitute structurally incompatible paint."
    ));
  }
  if (input.aggregates.nativeMutationCount !== 0) {
    diagnostics.push(diagnostic(
      "candidate.native-mutation",
      `candidates.${input.id}.nativeMutationCount`,
      "Continuity comparison forbids mutation of native endpoint DOM."
    ));
  }
  if (
    input.id === "visible-motif-owned-carrier" &&
    !structure.existingMaterialCarrierAvailable
  ) {
    diagnostics.push(diagnostic(
      "candidate.carrier-unavailable",
      `candidates.${input.id}.carrier`,
      "Visible carrier is unavailable without adding a renderer lifecycle."
    ));
  }

  return Object.freeze({
    id: input.id,
    status: diagnostics.length === 0 ? "eligible" : "ineligible",
    preservesReferenceChoreography:
      projected.preservesReferenceChoreography,
    exactNativeEndpoints: input.aggregates.endpointMismatchCount === 0,
    minimumVisibleInkRatio:
      input.aggregates.minimumVisibleInkRatio,
    maximumNormalizedGeometryDelta:
      input.aggregates.maximumNormalizedGeometryDelta,
    maximumNormalizedRasterDelta:
      projected.maximumNormalizedRasterDelta,
    programRoleCoverageRatio: projected.programRoleCoverageRatio,
    certifiedContactCoverageRatio:
      projected.certifiedContactCoverageRatio,
    endpointMismatchCount: input.aggregates.endpointMismatchCount,
    nativeMutationCount: input.aggregates.nativeMutationCount,
    addedPaintOwnerCount: projected.addedPaintOwnerCount,
    estimatedPaintAtomsPerFrame: projected.estimatedPaintAtomsPerFrame,
    diagnostics: Object.freeze(diagnostics)
  });
}

function compareCandidatePriority(
  left: KpOperationEvaluationContinuityCandidateAssessment,
  right: KpOperationEvaluationContinuityCandidateAssessment
): number {
  return left.addedPaintOwnerCount - right.addedPaintOwnerCount ||
    left.maximumNormalizedRasterDelta -
      right.maximumNormalizedRasterDelta ||
    left.maximumNormalizedGeometryDelta -
      right.maximumNormalizedGeometryDelta ||
    left.estimatedPaintAtomsPerFrame - right.estimatedPaintAtomsPerFrame ||
    left.id.localeCompare(right.id);
}

function comparisonReport(input: {
  readonly input: {
    readonly program: KpVerifiedExecutableSuccessorMotifProgram;
    readonly contract: KpVerifiedPerceptualContinuityContract;
    readonly recording: KpOperationEvaluationReferencePaintRecording;
  };
  readonly selectedTopology:
    KpOperationEvaluationContinuityTopologyId | null;
  readonly candidates:
    readonly KpOperationEvaluationContinuityCandidateAssessment[];
  readonly diagnostics:
    readonly KpOperationEvaluationContinuityDiagnostic[];
}): KpOperationEvaluationContinuityTopologyComparison {
  return Object.freeze({
    kind: "operation-evaluation-continuity-topology-comparison",
    recordingId: input.input.recording.id,
    programId: input.input.program.id,
    programVersion: input.input.program.programVersion,
    contractId: input.input.contract.id,
    selectedTopology: input.selectedTopology,
    candidates: Object.freeze([...input.candidates]),
    diagnostics: Object.freeze([...input.diagnostics])
  });
}

function diagnostic(
  code: KpOperationEvaluationContinuityDiagnosticCode,
  path: string,
  message: string
): KpOperationEvaluationContinuityDiagnostic {
  return Object.freeze({ code, path, message });
}

function unit(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0;
}

function minimum(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}
