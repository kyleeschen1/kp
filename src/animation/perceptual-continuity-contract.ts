import type {
  KpExecutableSuccessorMotifProgramKind,
  KpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "./motifs/executable-successor-motif-program-validator.ts";

const kpPerceptualContinuityContractAuthority = Symbol(
  "kp.perceptual-continuity-contract"
);
const verifiedContracts = new WeakSet<object>();

export const kpPerceptualContinuityEndpointMetrics = Object.freeze([
  "paint-geometry",
  "computed-style",
  "font",
  "baseline",
  "inner-paint",
  "structural-rule",
  "silhouette"
] as const);

export type KpPerceptualContinuityEndpointMetric =
  typeof kpPerceptualContinuityEndpointMetrics[number];
export type KpPerceptualContinuityDirection = "forward" | "rewind";
export type KpPerceptualContinuitySamplingMode =
  | "direct-seek"
  | "natural-playback"
  | "replay";
export type KpPerceptualContinuityBrowser =
  | "chromium"
  | "firefox"
  | "webkit";
export type KpPerceptualContinuityViewport = "wide" | "phone";

export type KpPerceptualContinuityVisibilityPolicy =
  | {
      readonly kind: "continuous-visible-ink";
      readonly minimumVisibleInkRatio: number;
    }
  | {
      readonly kind: "intentional-vanish";
      readonly minimumVisibleInkRatio: number;
      readonly authorizedPhaseId: string;
    };

export interface KpPerceptualContinuityContractDraft {
  readonly schemaVersion: "kp.perceptual-continuity-contract.v1";
  readonly id: string;
  readonly programId: string;
  readonly programVersion: string;
  readonly programKind: KpExecutableSuccessorMotifProgramKind;
  readonly visibility: KpPerceptualContinuityVisibilityPolicy;
  readonly adjacentFrameBudgets: {
    readonly maximumNormalizedGeometryDelta: number;
    readonly maximumNormalizedRasterDelta: number;
  };
  readonly ownerCoverage: {
    readonly requiredCoverageRatio: 1;
    readonly maximumAmbiguousOwnerCount: 0;
    readonly maximumAtomicTransferMismatchCount: 0;
  };
  readonly endpointEquivalence: {
    readonly settlement: "exact-native-source-and-target";
    readonly requiredMetrics:
      readonly KpPerceptualContinuityEndpointMetric[];
  };
  readonly invariance: {
    readonly directions: readonly KpPerceptualContinuityDirection[];
    readonly samplingModes: readonly KpPerceptualContinuitySamplingMode[];
    readonly browsers: readonly KpPerceptualContinuityBrowser[];
    readonly viewports: readonly KpPerceptualContinuityViewport[];
    readonly deviceScaleFactors: readonly number[];
  };
  readonly evidenceBudget: {
    readonly maximumTraceCount: number;
    readonly maximumSamplesPerTrace: number;
    readonly maximumTotalSamples: number;
  };
  readonly semanticAuthority: {
    readonly identity: "program-roles-and-lineage";
    readonly measurements: "current-frame-observation-only";
    readonly rasterHistory: "never-semantic-authority";
  };
}

export interface KpVerifiedPerceptualContinuityContract extends
KpPerceptualContinuityContractDraft {
  readonly phaseIds: readonly string[];
  readonly [kpPerceptualContinuityContractAuthority]: true;
}

export type KpPerceptualContinuityContractIssueCode =
  | "contract.input.invalid"
  | "contract.input.unsupported-field"
  | "contract.schema.unsupported"
  | "contract.identity.invalid"
  | "contract.program.unverified"
  | "contract.program.mismatch"
  | "contract.visibility.invalid"
  | "contract.visibility.program-mismatch"
  | "contract.budget.invalid"
  | "contract.owner-coverage.invalid"
  | "contract.endpoint.invalid"
  | "contract.invariance.invalid"
  | "contract.semantic-authority.invalid";

export interface KpPerceptualContinuityContractIssue {
  readonly code: KpPerceptualContinuityContractIssueCode;
  readonly path: string;
  readonly message: string;
}

export type KpPerceptualContinuityContractValidationResult =
  | {
      readonly status: "verified";
      readonly contract: KpVerifiedPerceptualContinuityContract;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpPerceptualContinuityContractIssue[];
    };

/**
 * This is the sole continuity-contract mint. It fixes measurable quality and
 * evidence obligations around a program without choosing a renderer topology,
 * path, timing table, DOM strategy, or notation-specific exception.
 */
export function validateAndMintKpPerceptualContinuityContract(input: {
  readonly draft: unknown;
  readonly program: KpVerifiedExecutableSuccessorMotifProgram;
}): KpPerceptualContinuityContractValidationResult {
  const issues = checkContract(input.draft, input.program);
  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues)
    });
  }

  const draft = input.draft as KpPerceptualContinuityContractDraft;
  const contract = Object.freeze({
    ...draft,
    visibility: Object.freeze({ ...draft.visibility }),
    adjacentFrameBudgets: Object.freeze({
      ...draft.adjacentFrameBudgets
    }),
    ownerCoverage: Object.freeze({ ...draft.ownerCoverage }),
    endpointEquivalence: Object.freeze({
      ...draft.endpointEquivalence,
      requiredMetrics: Object.freeze([
        ...draft.endpointEquivalence.requiredMetrics
      ])
    }),
    invariance: Object.freeze({
      directions: Object.freeze([...draft.invariance.directions]),
      samplingModes: Object.freeze([...draft.invariance.samplingModes]),
      browsers: Object.freeze([...draft.invariance.browsers]),
      viewports: Object.freeze([...draft.invariance.viewports]),
      deviceScaleFactors: Object.freeze([
        ...draft.invariance.deviceScaleFactors
      ])
    }),
    evidenceBudget: Object.freeze({ ...draft.evidenceBudget }),
    semanticAuthority: Object.freeze({ ...draft.semanticAuthority }),
    phaseIds: Object.freeze(input.program.phases.map(({ id }) => id)),
    [kpPerceptualContinuityContractAuthority]: true as const
  }) as KpVerifiedPerceptualContinuityContract;
  verifiedContracts.add(contract);
  return Object.freeze({ status: "verified", contract });
}

export function isKpVerifiedPerceptualContinuityContract(
  value: unknown
): value is KpVerifiedPerceptualContinuityContract {
  return (
    typeof value === "object" &&
    value !== null &&
    verifiedContracts.has(value)
  );
}

export interface KpPerceptualContinuitySample {
  readonly progress: number;
  readonly phaseId: string;
  readonly visibleInkRatio: number;
  readonly normalizedGeometryDeltaFromPrevious: number;
  readonly normalizedRasterDeltaFromPrevious: number;
  readonly ownerCoverageRatio: number;
  readonly ambiguousOwnerCount: number;
  readonly atomicTransferMismatchCount: number;
  readonly endpoint: "source" | "target" | "none";
  readonly endpointMetricMismatches:
    readonly KpPerceptualContinuityEndpointMetric[];
}

export interface KpPerceptualContinuityTrace {
  readonly id: string;
  readonly direction: KpPerceptualContinuityDirection;
  readonly samplingMode: KpPerceptualContinuitySamplingMode;
  readonly browser: KpPerceptualContinuityBrowser;
  readonly viewport: KpPerceptualContinuityViewport;
  readonly deviceScaleFactor: number;
  readonly samples: readonly KpPerceptualContinuitySample[];
}

export type KpPerceptualContinuityDiagnosticCode =
  | "evidence.unverified-contract"
  | "evidence.trace-budget"
  | "evidence.trace-missing"
  | "evidence.trace-duplicate"
  | "evidence.trace-unexpected"
  | "evidence.sample-budget"
  | "evidence.sample-invalid"
  | "evidence.phase-invalid"
  | "evidence.visible-ink-floor"
  | "evidence.unapproved-vanish"
  | "evidence.geometry-delta"
  | "evidence.raster-delta"
  | "evidence.owner-coverage"
  | "evidence.owner-conflict"
  | "evidence.owner-transfer"
  | "evidence.endpoint-label"
  | "evidence.endpoint-mismatch"
  | "evidence.semantic-sampling-drift";

export interface KpPerceptualContinuityDiagnostic {
  readonly code: KpPerceptualContinuityDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpPerceptualContinuityEvidenceReport {
  readonly kind: "perceptual-continuity-evidence-report";
  readonly contractId: string;
  readonly passed: boolean;
  readonly expectedTraceCount: number;
  readonly traceCount: number;
  readonly sampleCount: number;
  readonly diagnostics: readonly KpPerceptualContinuityDiagnostic[];
}

export function evaluateKpPerceptualContinuityEvidence(input: {
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly traces: readonly KpPerceptualContinuityTrace[];
}): KpPerceptualContinuityEvidenceReport {
  if (!isKpVerifiedPerceptualContinuityContract(input.contract)) {
    return evidenceReport(
      "unverified",
      0,
      input.traces,
      [diagnostic(
        "evidence.unverified-contract",
        "contract",
        "Perceptual continuity evidence requires a minted contract."
      )]
    );
  }
  const expectedKeys = expectedTraceKeys(input.contract);
  const diagnostics: KpPerceptualContinuityDiagnostic[] = [];
  const tracesByKey = new Map<string, KpPerceptualContinuityTrace[]>();
  let sampleCount = 0;

  if (input.traces.length > input.contract.evidenceBudget.maximumTraceCount) {
    diagnostics.push(diagnostic(
      "evidence.trace-budget",
      "traces",
      "Perceptual continuity evidence exceeds its trace budget."
    ));
  }
  for (const [traceIndex, trace] of input.traces.entries()) {
    const key = traceKey(trace);
    tracesByKey.set(key, [...tracesByKey.get(key) ?? [], trace]);
    sampleCount += trace.samples.length;
    evaluateTrace({
      contract: input.contract,
      trace,
      traceIndex,
      diagnostics
    });
  }
  if (sampleCount > input.contract.evidenceBudget.maximumTotalSamples) {
    diagnostics.push(diagnostic(
      "evidence.sample-budget",
      "traces",
      "Perceptual continuity evidence exceeds its total sample budget."
    ));
  }
  for (const key of expectedKeys) {
    const matches = tracesByKey.get(key) ?? [];
    if (matches.length === 0) {
      diagnostics.push(diagnostic(
        "evidence.trace-missing",
        `traces.${key}`,
        `Perceptual continuity evidence is missing ${key}.`
      ));
    } else if (matches.length > 1) {
      diagnostics.push(diagnostic(
        "evidence.trace-duplicate",
        `traces.${key}`,
        `Perceptual continuity evidence repeats ${key}.`
      ));
    }
  }
  for (const key of tracesByKey.keys()) {
    if (!expectedKeys.has(key)) {
      diagnostics.push(diagnostic(
        "evidence.trace-unexpected",
        `traces.${key}`,
        `Perceptual continuity evidence includes unexpected trace ${key}.`
      ));
    }
  }
  compareSemanticSampling(tracesByKey, diagnostics);

  return evidenceReport(
    input.contract.id,
    expectedKeys.size,
    input.traces,
    diagnostics
  );
}

function checkContract(
  value: unknown,
  program: KpVerifiedExecutableSuccessorMotifProgram
): readonly KpPerceptualContinuityContractIssue[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [contractIssue(
      "contract.input.invalid",
      "$",
      "Perceptual continuity contract must be an object."
    )];
  }
  const draft = value as Record<string, unknown>;
  const issues: KpPerceptualContinuityContractIssue[] = [];
  exactKeys(draft, [
    "schemaVersion",
    "id",
    "programId",
    "programVersion",
    "programKind",
    "visibility",
    "adjacentFrameBudgets",
    "ownerCoverage",
    "endpointEquivalence",
    "invariance",
    "evidenceBudget",
    "semanticAuthority"
  ], "$", issues);
  if (draft["schemaVersion"] !== "kp.perceptual-continuity-contract.v1") {
    issues.push(contractIssue(
      "contract.schema.unsupported",
      "schemaVersion",
      "Perceptual continuity contract has an unsupported schema."
    ));
  }
  if (!nonEmptyString(draft["id"])) {
    issues.push(contractIssue(
      "contract.identity.invalid",
      "id",
      "Perceptual continuity contract requires an id."
    ));
  }
  if (!isKpVerifiedExecutableSuccessorMotifProgram(program)) {
    issues.push(contractIssue(
      "contract.program.unverified",
      "program",
      "Perceptual continuity contract requires a minted program."
    ));
  } else if (
    draft["programId"] !== program.id ||
    draft["programVersion"] !== program.programVersion ||
    draft["programKind"] !== program.kind
  ) {
    issues.push(contractIssue(
      "contract.program.mismatch",
      "programId",
      "Perceptual continuity contract does not match its exact program."
    ));
  }
  validateVisibility(draft["visibility"], program, issues);
  validateAdjacentBudgets(draft["adjacentFrameBudgets"], issues);
  validateOwnerCoverage(draft["ownerCoverage"], issues);
  validateEndpoint(draft["endpointEquivalence"], issues);
  validateInvariance(draft["invariance"], issues);
  validateEvidenceBudget(draft["evidenceBudget"], issues);
  validateSemanticAuthority(draft["semanticAuthority"], issues);
  return issues;
}

function validateVisibility(
  value: unknown,
  program: KpVerifiedExecutableSuccessorMotifProgram,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (!record(value)) {
    issues.push(contractIssue(
      "contract.visibility.invalid",
      "visibility",
      "Perceptual continuity requires a visibility policy."
    ));
    return;
  }
  const intentional = value["kind"] === "intentional-vanish";
  exactKeys(
    value,
    intentional
      ? ["kind", "minimumVisibleInkRatio", "authorizedPhaseId"]
      : ["kind", "minimumVisibleInkRatio"],
    "visibility",
    issues
  );
  if (
    value["kind"] !== "continuous-visible-ink" &&
    value["kind"] !== "intentional-vanish"
  ) {
    issues.push(contractIssue(
      "contract.visibility.invalid",
      "visibility.kind",
      "Perceptual continuity visibility policy is unsupported."
    ));
  }
  if (!unitExclusiveZero(value["minimumVisibleInkRatio"])) {
    issues.push(contractIssue(
      "contract.visibility.invalid",
      "visibility.minimumVisibleInkRatio",
      "Visible ink floor must be greater than zero and at most one."
    ));
  }
  if (
    intentional &&
    (
      program.continuity.intentionalVanish === "forbidden" ||
      !nonEmptyString(value["authorizedPhaseId"]) ||
      !program.phases.some(({ id }) => id === value["authorizedPhaseId"])
    )
  ) {
    issues.push(contractIssue(
      "contract.visibility.program-mismatch",
      "visibility.authorizedPhaseId",
      "Intentional vanish requires explicit authority from the exact program phase."
    ));
  }
}

function validateAdjacentBudgets(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (!record(value)) {
    issues.push(contractIssue(
      "contract.budget.invalid",
      "adjacentFrameBudgets",
      "Adjacent-frame budgets are required."
    ));
    return;
  }
  exactKeys(value, [
    "maximumNormalizedGeometryDelta",
    "maximumNormalizedRasterDelta"
  ], "adjacentFrameBudgets", issues);
  for (const field of [
    "maximumNormalizedGeometryDelta",
    "maximumNormalizedRasterDelta"
  ]) {
    if (!unitExclusiveZero(value[field])) {
      issues.push(contractIssue(
        "contract.budget.invalid",
        `adjacentFrameBudgets.${field}`,
        "Normalized adjacent-frame budgets must be greater than zero and at most one."
      ));
    }
  }
}

function validateOwnerCoverage(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (
    !record(value) ||
    value["requiredCoverageRatio"] !== 1 ||
    value["maximumAmbiguousOwnerCount"] !== 0 ||
    value["maximumAtomicTransferMismatchCount"] !== 0
  ) {
    issues.push(contractIssue(
      "contract.owner-coverage.invalid",
      "ownerCoverage",
      "Owner coverage must be total, unambiguous, and atomically matched."
    ));
    return;
  }
  exactKeys(value, [
    "requiredCoverageRatio",
    "maximumAmbiguousOwnerCount",
    "maximumAtomicTransferMismatchCount"
  ], "ownerCoverage", issues);
}

function validateEndpoint(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (!record(value)) {
    issues.push(contractIssue(
      "contract.endpoint.invalid",
      "endpointEquivalence",
      "Native endpoint equivalence is required."
    ));
    return;
  }
  exactKeys(value, ["settlement", "requiredMetrics"], "endpointEquivalence", issues);
  if (
    value["settlement"] !== "exact-native-source-and-target" ||
    !sameStringSet(
      value["requiredMetrics"],
      kpPerceptualContinuityEndpointMetrics
    )
  ) {
    issues.push(contractIssue(
      "contract.endpoint.invalid",
      "endpointEquivalence",
      "Endpoint equivalence must cover every exact native paint metric."
    ));
  }
}

function validateInvariance(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (!record(value)) {
    issues.push(contractIssue(
      "contract.invariance.invalid",
      "invariance",
      "Perceptual continuity invariance coverage is required."
    ));
    return;
  }
  exactKeys(value, [
    "directions",
    "samplingModes",
    "browsers",
    "viewports",
    "deviceScaleFactors"
  ], "invariance", issues);
  if (
    !sameStringSet(value["directions"], ["forward", "rewind"]) ||
    !sameStringSet(value["samplingModes"], [
      "direct-seek",
      "natural-playback",
      "replay"
    ]) ||
    !sameStringSet(value["browsers"], ["chromium", "firefox", "webkit"]) ||
    !sameStringSet(value["viewports"], ["wide", "phone"]) ||
    !sameNumberSet(value["deviceScaleFactors"], [1, 2])
  ) {
    issues.push(contractIssue(
      "contract.invariance.invalid",
      "invariance",
      "Perceptual continuity requires both directions, three sampling modes, three browsers, wide/phone, and DPR 1/2."
    ));
  }
}

function validateEvidenceBudget(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (!record(value)) {
    issues.push(contractIssue(
      "contract.budget.invalid",
      "evidenceBudget",
      "Perceptual continuity evidence budget is required."
    ));
    return;
  }
  exactKeys(value, [
    "maximumTraceCount",
    "maximumSamplesPerTrace",
    "maximumTotalSamples"
  ], "evidenceBudget", issues);
  const traceCount = value["maximumTraceCount"];
  const samplesPerTrace = value["maximumSamplesPerTrace"];
  const totalSamples = value["maximumTotalSamples"];
  if (
    !positiveInteger(traceCount) ||
    !positiveInteger(samplesPerTrace) ||
    !positiveInteger(totalSamples) ||
    traceCount < 72 ||
    totalSamples < traceCount * samplesPerTrace
  ) {
    issues.push(contractIssue(
      "contract.budget.invalid",
      "evidenceBudget",
      "Evidence budget must bound all 72 invariant traces and their samples."
    ));
  }
}

function validateSemanticAuthority(
  value: unknown,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  if (
    !record(value) ||
    value["identity"] !== "program-roles-and-lineage" ||
    value["measurements"] !== "current-frame-observation-only" ||
    value["rasterHistory"] !== "never-semantic-authority"
  ) {
    issues.push(contractIssue(
      "contract.semantic-authority.invalid",
      "semanticAuthority",
      "Program roles and lineage remain semantic truth; frame measurements are evidence only."
    ));
    return;
  }
  exactKeys(value, [
    "identity",
    "measurements",
    "rasterHistory"
  ], "semanticAuthority", issues);
}

function evaluateTrace(input: {
  readonly contract: KpVerifiedPerceptualContinuityContract;
  readonly trace: KpPerceptualContinuityTrace;
  readonly traceIndex: number;
  readonly diagnostics: KpPerceptualContinuityDiagnostic[];
}): void {
  const path = `traces[${input.traceIndex}]`;
  if (
    input.trace.samples.length === 0 ||
    input.trace.samples.length >
      input.contract.evidenceBudget.maximumSamplesPerTrace
  ) {
    input.diagnostics.push(diagnostic(
      "evidence.sample-budget",
      `${path}.samples`,
      "Trace sample count is empty or exceeds its bounded budget."
    ));
  }
  const samples = [...input.trace.samples].sort(
    (left, right) => left.progress - right.progress
  );
  for (const [index, sample] of samples.entries()) {
    const samplePath = `${path}.samples[${index}]`;
    const previous = samples[index - 1];
    if (
      !unit(sample.progress) ||
      (previous !== undefined && sample.progress <= previous.progress) ||
      (index === 0 && sample.progress !== 0) ||
      (index === samples.length - 1 && sample.progress !== 1)
    ) {
      input.diagnostics.push(diagnostic(
        "evidence.sample-invalid",
        `${samplePath}.progress`,
        "Trace samples require unique increasing canonical progress with exact endpoints."
      ));
    }
    if (!input.contract.phaseIds.includes(sample.phaseId)) {
      input.diagnostics.push(diagnostic(
        "evidence.phase-invalid",
        `${samplePath}.phaseId`,
        `Trace sample references unknown phase ${sample.phaseId}.`
      ));
    }
    evaluateVisibility(input.contract, sample, samplePath, input.diagnostics);
    evaluateDelta(
      sample.normalizedGeometryDeltaFromPrevious,
      index,
      input.contract.adjacentFrameBudgets.maximumNormalizedGeometryDelta,
      "evidence.geometry-delta",
      `${samplePath}.normalizedGeometryDeltaFromPrevious`,
      input.diagnostics
    );
    evaluateDelta(
      sample.normalizedRasterDeltaFromPrevious,
      index,
      input.contract.adjacentFrameBudgets.maximumNormalizedRasterDelta,
      "evidence.raster-delta",
      `${samplePath}.normalizedRasterDeltaFromPrevious`,
      input.diagnostics
    );
    if (sample.ownerCoverageRatio !== 1) {
      input.diagnostics.push(diagnostic(
        "evidence.owner-coverage",
        `${samplePath}.ownerCoverageRatio`,
        "Every observed visible atom must have logical owner coverage."
      ));
    }
    if (sample.ambiguousOwnerCount !== 0) {
      input.diagnostics.push(diagnostic(
        "evidence.owner-conflict",
        `${samplePath}.ambiguousOwnerCount`,
        "Observed paint cannot have ambiguous logical owners."
      ));
    }
    if (sample.atomicTransferMismatchCount !== 0) {
      input.diagnostics.push(diagnostic(
        "evidence.owner-transfer",
        `${samplePath}.atomicTransferMismatchCount`,
        "Owner transfer must be atomic and paint-equivalent."
      ));
    }
    const expectedEndpoint = sample.progress === 0
      ? "source"
      : sample.progress === 1 ? "target" : "none";
    if (sample.endpoint !== expectedEndpoint) {
      input.diagnostics.push(diagnostic(
        "evidence.endpoint-label",
        `${samplePath}.endpoint`,
        `Sample at ${sample.progress} must declare ${expectedEndpoint}.`
      ));
    }
    if (
      expectedEndpoint !== "none" &&
      sample.endpointMetricMismatches.length > 0
    ) {
      input.diagnostics.push(diagnostic(
        "evidence.endpoint-mismatch",
        `${samplePath}.endpointMetricMismatches`,
        "Native endpoint paint metrics must match exactly."
      ));
    }
  }
}

function evaluateVisibility(
  contract: KpVerifiedPerceptualContinuityContract,
  sample: KpPerceptualContinuitySample,
  path: string,
  diagnostics: KpPerceptualContinuityDiagnostic[]
): void {
  if (!unit(sample.visibleInkRatio)) {
    diagnostics.push(diagnostic(
      "evidence.sample-invalid",
      `${path}.visibleInkRatio`,
      "Visible ink ratio must be finite and normalized."
    ));
    return;
  }
  if (sample.visibleInkRatio >= contract.visibility.minimumVisibleInkRatio) {
    return;
  }
  if (
    contract.visibility.kind !== "intentional-vanish" ||
    sample.phaseId !== contract.visibility.authorizedPhaseId
  ) {
    diagnostics.push(diagnostic(
      contract.visibility.kind === "intentional-vanish"
        ? "evidence.unapproved-vanish"
        : "evidence.visible-ink-floor",
      `${path}.visibleInkRatio`,
      "Visible paint fell below the motif-specific floor without phase authority."
    ));
  }
}

function evaluateDelta(
  value: number,
  index: number,
  maximum: number,
  code: "evidence.geometry-delta" | "evidence.raster-delta",
  path: string,
  diagnostics: KpPerceptualContinuityDiagnostic[]
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > maximum ||
    (index === 0 && value !== 0)
  ) {
    diagnostics.push(diagnostic(
      code,
      path,
      `Adjacent-frame delta must be finite, bounded by ${maximum}, and zero at the first sample.`
    ));
  }
}

function compareSemanticSampling(
  tracesByKey: ReadonlyMap<string, readonly KpPerceptualContinuityTrace[]>,
  diagnostics: KpPerceptualContinuityDiagnostic[]
): void {
  const phaseByProgress = new Map<number, string>();
  for (const traces of tracesByKey.values()) {
    if (traces.length !== 1) continue;
    for (const sample of traces[0]!.samples) {
      const existing = phaseByProgress.get(sample.progress);
      if (existing === undefined) {
        phaseByProgress.set(sample.progress, sample.phaseId);
      } else if (existing !== sample.phaseId) {
        diagnostics.push(diagnostic(
          "evidence.semantic-sampling-drift",
          `progress.${sample.progress}`,
          "Direction, playback, browser, viewport, or DPR changed the program phase at one canonical progress."
        ));
      }
    }
  }
}

function expectedTraceKeys(
  contract: KpVerifiedPerceptualContinuityContract
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const direction of contract.invariance.directions) {
    for (const samplingMode of contract.invariance.samplingModes) {
      for (const browser of contract.invariance.browsers) {
        for (const viewport of contract.invariance.viewports) {
          for (const deviceScaleFactor of
            contract.invariance.deviceScaleFactors) {
            keys.add(traceKey({
              direction,
              samplingMode,
              browser,
              viewport,
              deviceScaleFactor
            }));
          }
        }
      }
    }
  }
  return keys;
}

function traceKey(input: {
  readonly direction: KpPerceptualContinuityDirection;
  readonly samplingMode: KpPerceptualContinuitySamplingMode;
  readonly browser: KpPerceptualContinuityBrowser;
  readonly viewport: KpPerceptualContinuityViewport;
  readonly deviceScaleFactor: number;
}): string {
  return [
    input.direction,
    input.samplingMode,
    input.browser,
    input.viewport,
    `dpr-${input.deviceScaleFactor}`
  ].join(".");
}

function evidenceReport(
  contractId: string,
  expectedTraceCount: number,
  traces: readonly KpPerceptualContinuityTrace[],
  diagnostics: readonly KpPerceptualContinuityDiagnostic[]
): KpPerceptualContinuityEvidenceReport {
  return Object.freeze({
    kind: "perceptual-continuity-evidence-report",
    contractId,
    passed: diagnostics.length === 0,
    expectedTraceCount,
    traceCount: traces.length,
    sampleCount: traces.reduce(
      (count, trace) => count + trace.samples.length,
      0
    ),
    diagnostics: Object.freeze(diagnostics)
  });
}

function exactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
  path: string,
  issues: KpPerceptualContinuityContractIssue[]
): void {
  const supported = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!supported.has(key)) {
      issues.push(contractIssue(
        "contract.input.unsupported-field",
        `${path}.${key}`,
        `Perceptual continuity contract cannot author ${key}.`
      ));
    }
  }
  for (const key of keys) {
    if (!(key in value)) {
      issues.push(contractIssue(
        "contract.input.invalid",
        `${path}.${key}`,
        `Perceptual continuity contract is missing ${key}.`
      ));
    }
  }
}

function contractIssue(
  code: KpPerceptualContinuityContractIssueCode,
  path: string,
  message: string
): KpPerceptualContinuityContractIssue {
  return Object.freeze({ code, path, message });
}

function diagnostic(
  code: KpPerceptualContinuityDiagnosticCode,
  path: string,
  message: string
): KpPerceptualContinuityDiagnostic {
  return Object.freeze({ code, path, message });
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) &&
    value >= 0 && value <= 1;
}

function unitExclusiveZero(value: unknown): value is number {
  return unit(value) && value > 0;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function sameStringSet(
  value: unknown,
  expected: readonly string[]
): boolean {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string") &&
    value.length === expected.length &&
    new Set(value).size === value.length &&
    expected.every((item) => value.includes(item));
}

function sameNumberSet(
  value: unknown,
  expected: readonly number[]
): boolean {
  return Array.isArray(value) &&
    value.every(Number.isFinite) &&
    value.length === expected.length &&
    new Set(value).size === value.length &&
    expected.every((item) => value.includes(item));
}
