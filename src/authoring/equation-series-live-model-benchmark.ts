import {
  compileKpEquationTransformSeries
} from "./compile-equation-transform-series.ts";
import {
  createKpEquationSeriesPlannerPrompt,
  validateKpEquationSeriesPlannerRecord,
  type KpEquationSeriesPlannerDiagnostic,
  type KpEquationSeriesPlannerPrompt
} from "./equation-series-natural-language-planner-port.ts";
import type { KpEquationSeriesRepair } from
  "./equation-series-repair-taxonomy.ts";
import {
  validateKpEquationTransformSeriesRequest,
  type KpEquationTransformSeriesRequest
} from "./equation-transform-series-request.ts";

export type KpEquationSeriesLiveBenchmarkExpectation =
  | Readonly<{
      kind: "compiled";
      operationIds: readonly string[];
    }>
  | Readonly<{
      kind: "governance-repair";
      operationIds: readonly string[];
      repairSourceCodes: readonly string[];
    }>
  | Readonly<{
      kind: "unsupported";
    }>;

export interface KpEquationSeriesLiveModelBenchmarkCase {
  readonly id: string;
  readonly intent: string;
  readonly request: KpEquationTransformSeriesRequest;
  readonly expectation: KpEquationSeriesLiveBenchmarkExpectation;
}

export interface KpEquationSeriesLiveModelBatchPort {
  readonly id: string;
  readonly modelId: string;
  readonly propose: (
    input: Readonly<{
      prompts: readonly KpEquationSeriesPlannerPrompt[];
      repetitionIndex: number;
      promptFingerprint: string;
    }>
  ) => Promise<KpEquationSeriesLiveModelBatchResult>;
}

export interface KpEquationSeriesLiveModelRawResponseProvenance {
  readonly kind: "captured-file" | "replayed-file" | "fixture";
  readonly locator: string;
  readonly contentFingerprint: string;
}

export interface KpEquationSeriesLiveModelBatchResult {
  readonly candidates: readonly unknown[];
  readonly rawResponseProvenance:
    KpEquationSeriesLiveModelRawResponseProvenance;
}

export interface KpEquationSeriesLiveModelBenchmarkCaseReport {
  readonly repetitionIndex: number;
  readonly caseId: string;
  readonly expectation: KpEquationSeriesLiveBenchmarkExpectation["kind"];
  readonly plannerStatus: "proposed" | "unsupported" | "repair-required";
  readonly proposedOperationIds: readonly string[];
  readonly exactOperationSelection: boolean;
  readonly adjacencyIdentityPreserved: boolean;
  readonly explicitUnsupportedAbstention: boolean;
  readonly compilationStatus: "compiled" | "repair-required" | "not-run";
  readonly plannerDiagnosticCodes:
    readonly KpEquationSeriesPlannerDiagnostic["code"][];
  readonly compilerRepairSourceCodes: readonly string[];
  readonly repairGuidancePresent: boolean;
  readonly authorityAttemptCount: number;
  readonly compiledSelectionMismatchCount: number;
  readonly silentFallbackCount: number;
  readonly passed: boolean;
}

export interface KpEquationSeriesLiveModelBenchmarkReport {
  readonly schemaVersion: "kp.equation-series-live-model-benchmark-report.v2";
  readonly benchmarkId: "benchmark.equation-series.live-model.v1";
  readonly evidenceKind: "live-model";
  readonly plannerId: string;
  readonly modelId: string;
  readonly repetitionCount: number;
  readonly promptFingerprint: string;
  readonly rawResponseProvenance:
    readonly Readonly<KpEquationSeriesLiveModelRawResponseProvenance & {
      repetitionIndex: number;
    }>[];
  readonly status: "passed" | "failed";
  readonly metrics: Readonly<{
    caseCount: number;
    exactOperationSelections: number;
    preservedAdjacencyIdentities: number;
    explicitUnsupportedAbstentions: number;
    repairCasesWithGuidance: number;
    authorityAttemptCount: number;
    compiledSelectionMismatchCount: number;
    silentFallbackCount: number;
  }>;
  readonly cases: readonly KpEquationSeriesLiveModelBenchmarkCaseReport[];
  readonly providerErrors: readonly Readonly<{
    repetitionIndex: number;
    message: string;
  }>[];
}

export const kpEquationSeriesLiveModelBenchmarkCases = deepFreeze([
  benchmarkCase({
    id: "benchmark.equation.live.wrap-function",
    intent: "Wrap x in the natural logarithm.",
    states: ["x", "\\ln(x)"],
    instructions: ["Introduce the natural logarithm as a function wrapper."],
    expectation: {
      kind: "compiled",
      operationIds: ["kp.algebra.wrap-function"]
    }
  }),
  benchmarkCase({
    id: "benchmark.equation.live.distribution",
    intent: "Distribute a across the sum b plus c.",
    states: ["a*(b+c)", "a*b+a*c"],
    instructions: ["Distribute the outer multiplication over the sum."],
    expectation: {
      kind: "compiled",
      operationIds: ["kp.algebra.distribute-multiplication"]
    }
  }),
  benchmarkCase({
    id: "benchmark.equation.live.log-product",
    intent: "Expand the logarithm of a product into a sum of logarithms.",
    states: ["\\ln(x*y)", "\\ln(x)+\\ln(y)"],
    instructions: ["Apply the product law for logarithms."],
    expectation: {
      kind: "compiled",
      operationIds: ["kp.semantic-motion.log-product"]
    }
  }),
  benchmarkCase({
    id: "benchmark.equation.live.solve-exponential",
    intent: "Solve 2 to the x equals 7 by taking natural logs.",
    states: [
      "2^x=7",
      "\\ln(2^x)=\\ln(7)",
      "x*\\ln(2)=\\ln(7)",
      "x=\\frac{\\ln(7)}{\\ln(2)}"
    ],
    instructions: [
      "Apply the natural logarithm to both sides.",
      "Use the logarithm power law to lower the exponent.",
      "Divide both sides by the logarithm of the base."
    ],
    expectation: {
      kind: "governance-repair",
      operationIds: [
        "kp.algebra.apply-natural-log-both-sides",
        "kp.algebra.lower-exponent",
        "kp.algebra.divide-both-sides-by-log-base"
      ],
      repairSourceCodes: [
        "equation-series.governance.arguments.invalid",
        "equation-series.governance.arguments.invalid"
      ]
    }
  }),
  benchmarkCase({
    id: "benchmark.equation.live.change-log-base",
    intent: "Rewrite log base 2 of 7 using natural logarithms.",
    states: ["\\log_2(7)", "\\frac{\\ln(7)}{\\ln(2)}"],
    instructions: ["Apply the logarithm change-of-base law."],
    expectation: {
      kind: "governance-repair",
      operationIds: ["kp.algebra.change-logarithm-base"],
      repairSourceCodes: ["equation-series.governance.arguments.invalid"]
    }
  }),
  benchmarkCase({
    id: "benchmark.equation.live.unsupported-fraction-equivalence",
    intent:
      "Multiply a fraction's numerator and denominator by the same nonzero factor.",
    states: ["\\frac{a}{b}", "\\frac{2*a}{2*b}"],
    instructions: [
      "Use an exact registered operation only; otherwise declare unsupported."
    ],
    expectation: { kind: "unsupported" }
  })
] satisfies readonly KpEquationSeriesLiveModelBenchmarkCase[]);

/**
 * The model is measured as a planner, never promoted to mathematical or
 * presentation authority. Every proposal still passes through KP validation
 * and compilation, including the intentionally unsupported pressure case.
 */
export async function runKpEquationSeriesLiveModelBenchmark(input: {
  readonly port: KpEquationSeriesLiveModelBatchPort;
  readonly repetitionCount: number;
  readonly cases?:
    readonly KpEquationSeriesLiveModelBenchmarkCase[] | undefined;
}): Promise<KpEquationSeriesLiveModelBenchmarkReport> {
  assertReproducibleInput(input.port.modelId, input.repetitionCount);
  const cases = input.cases ?? kpEquationSeriesLiveModelBenchmarkCases;
  const prompts = cases.map((entry) => createKpEquationSeriesPlannerPrompt({
    request: entry.request,
    naturalLanguageIntent: entry.intent
  }));
  const promptFingerprint = fingerprintKpEquationSeriesBenchmarkPrompt(prompts);
  const reports: KpEquationSeriesLiveModelBenchmarkCaseReport[] = [];
  const rawResponseProvenance: Array<Readonly<
    KpEquationSeriesLiveModelRawResponseProvenance & {
      repetitionIndex: number;
    }
  >> = [];
  const providerErrors: Array<Readonly<{
    repetitionIndex: number;
    message: string;
  }>> = [];
  for (
    let repetitionIndex = 1;
    repetitionIndex <= input.repetitionCount;
    repetitionIndex += 1
  ) {
    let candidates: readonly unknown[] = [];
    try {
      const batch = await input.port.propose({
        prompts,
        repetitionIndex,
        promptFingerprint
      });
      validateRawResponseProvenance(batch.rawResponseProvenance);
      candidates = batch.candidates;
      rawResponseProvenance.push(Object.freeze({
        repetitionIndex,
        ...batch.rawResponseProvenance
      }));
    } catch (error) {
      providerErrors.push(Object.freeze({
        repetitionIndex,
        message: error instanceof Error ? error.message : String(error)
      }));
    }
    reports.push(...cases.map((entry, index) => evaluateCase({
      entry,
      candidate: candidates[index],
      plannerId: input.port.id,
      repetitionIndex
    })));
  }
  const metrics = {
    caseCount: reports.length,
    exactOperationSelections: count(reports, "exactOperationSelection"),
    preservedAdjacencyIdentities: count(
      reports,
      "adjacencyIdentityPreserved"
    ),
    explicitUnsupportedAbstentions: count(
      reports,
      "explicitUnsupportedAbstention"
    ),
    repairCasesWithGuidance: count(reports, "repairGuidancePresent"),
    authorityAttemptCount: sum(reports, "authorityAttemptCount"),
    compiledSelectionMismatchCount: sum(
      reports,
      "compiledSelectionMismatchCount"
    ),
    silentFallbackCount: sum(reports, "silentFallbackCount")
  };
  return deepFreeze({
    schemaVersion:
      "kp.equation-series-live-model-benchmark-report.v2" as const,
    benchmarkId: "benchmark.equation-series.live-model.v1" as const,
    evidenceKind: "live-model" as const,
    plannerId: input.port.id,
    modelId: input.port.modelId,
    repetitionCount: input.repetitionCount,
    promptFingerprint,
    rawResponseProvenance,
    status: providerErrors.length === 0 &&
      reports.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    metrics,
    cases: reports,
    providerErrors
  });
}

export function fingerprintKpEquationSeriesBenchmarkPrompt(
  prompts: readonly KpEquationSeriesPlannerPrompt[]
): string {
  return fingerprintKpEquationSeriesBenchmarkPayload(JSON.stringify(prompts));
}

export function fingerprintKpEquationSeriesBenchmarkPayload(
  value: string
): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return `fnv1a64:${hash.toString(16).padStart(16, "0")}`;
}

function evaluateCase(input: {
  readonly entry: KpEquationSeriesLiveModelBenchmarkCase;
  readonly candidate: unknown;
  readonly plannerId: string;
  readonly repetitionIndex: number;
}): KpEquationSeriesLiveModelBenchmarkCaseReport {
  const planner = validateKpEquationSeriesPlannerRecord(
    input.candidate,
    input.entry.request,
    input.plannerId
  );
  const proposedOperationIds = planner.status === "proposed"
    ? planner.record.proposals.flatMap((proposal) => proposal.kind === "single"
      ? [proposal.operationId]
      : [...proposal.operationIds])
    : [];
  const expectedOperationIds = input.entry.expectation.kind === "unsupported"
    ? []
    : input.entry.expectation.operationIds;
  const exactOperationSelection = equal(
    proposedOperationIds,
    expectedOperationIds
  ) && input.entry.expectation.kind !== "unsupported";
  const adjacencyIdentityPreserved = planner.status === "proposed" &&
    equal(
      planner.record.proposals.map(({ adjacencyId }) => adjacencyId),
      input.entry.request.adjacencies.map(({ id }) => id)
    );
  const explicitUnsupportedAbstention =
    input.entry.expectation.kind === "unsupported" &&
    planner.status === "unsupported";
  const compiled = planner.status === "proposed"
    ? compileKpEquationTransformSeries({
        value: input.entry.request,
        proposals: planner.record.proposals
      })
    : undefined;
  const plannerDiagnosticCodes = planner.diagnostics.map(({ code }) => code);
  const compilerRepairs = compiled?.repairs ?? [];
  const compilerRepairSourceCodes = compilerRepairs.map(
    ({ sourceCode }) => sourceCode
  );
  const authorityAttemptCount = planner.diagnostics.filter(({ code }) =>
    code === "equation-series.planner.field.forbidden"
  ).length;
  const compiledSelectionMismatchCount = compiled?.status === "compiled" &&
    input.entry.expectation.kind !== "unsupported" &&
    !exactOperationSelection
    ? 1
    : 0;
  const silentFallbackCount = compiled?.status === "compiled" &&
    input.entry.expectation.kind === "unsupported"
    ? 1
    : 0;
  const repairGuidancePresent = planner.status === "unsupported"
    ? planner.record.reason.trim().length > 0
    : hasRepairGuidance(planner.diagnostics, compilerRepairs);
  const passed = passesExpectation({
    expectation: input.entry.expectation,
    plannerStatus: planner.status,
    exactOperationSelection,
    explicitUnsupportedAbstention,
    compilationStatus: compiled?.status ?? "not-run",
    compilerRepairSourceCodes,
    authorityAttemptCount,
    silentFallbackCount
  });
  return deepFreeze({
    repetitionIndex: input.repetitionIndex,
    caseId: input.entry.id,
    expectation: input.entry.expectation.kind,
    plannerStatus: planner.status,
    proposedOperationIds,
    exactOperationSelection,
    adjacencyIdentityPreserved,
    explicitUnsupportedAbstention,
    compilationStatus: compiled?.status ?? "not-run",
    plannerDiagnosticCodes,
    compilerRepairSourceCodes,
    repairGuidancePresent,
    authorityAttemptCount,
    compiledSelectionMismatchCount,
    silentFallbackCount,
    passed
  });
}

function assertReproducibleInput(
  modelId: string,
  repetitionCount: number
): void {
  if (modelId.trim() === "") {
    throw new TypeError("Live benchmark requires an explicit model ID.");
  }
  if (
    !Number.isSafeInteger(repetitionCount) || repetitionCount < 1 ||
    repetitionCount > 20
  ) {
    throw new TypeError("Live benchmark repetitions must be an integer from 1 to 20.");
  }
}

function validateRawResponseProvenance(
  value: KpEquationSeriesLiveModelRawResponseProvenance
): void {
  if (
    !["captured-file", "replayed-file", "fixture"].includes(value.kind) ||
    value.locator.trim() === "" || value.contentFingerprint.trim() === ""
  ) {
    throw new TypeError(
      "Every benchmark repetition requires raw-response provenance."
    );
  }
}

function passesExpectation(input: {
  readonly expectation: KpEquationSeriesLiveBenchmarkExpectation;
  readonly plannerStatus: "proposed" | "unsupported" | "repair-required";
  readonly exactOperationSelection: boolean;
  readonly explicitUnsupportedAbstention: boolean;
  readonly compilationStatus: "compiled" | "repair-required" | "not-run";
  readonly compilerRepairSourceCodes: readonly string[];
  readonly authorityAttemptCount: number;
  readonly silentFallbackCount: number;
}): boolean {
  if (input.authorityAttemptCount > 0 || input.silentFallbackCount > 0) {
    return false;
  }
  if (input.expectation.kind === "unsupported") {
    return input.plannerStatus === "unsupported" &&
      input.explicitUnsupportedAbstention;
  }
  if (!input.exactOperationSelection) return false;
  if (input.expectation.kind === "compiled") {
    return input.compilationStatus === "compiled";
  }
  return input.compilationStatus === "repair-required" && equal(
    input.compilerRepairSourceCodes,
    input.expectation.repairSourceCodes
  );
}

function hasRepairGuidance(
  planner: readonly KpEquationSeriesPlannerDiagnostic[],
  compiler: readonly KpEquationSeriesRepair[]
): boolean {
  const guidance = [
    ...planner.map(({ repair }) => repair),
    ...compiler.map(({ action }) => action.kind)
  ];
  return guidance.length > 0 && guidance.every((value) => value.trim() !== "");
}

function benchmarkCase(input: {
  readonly id: string;
  readonly intent: string;
  readonly states: readonly [string, string, ...string[]];
  readonly instructions: readonly string[];
  readonly expectation: KpEquationSeriesLiveBenchmarkExpectation;
}): KpEquationSeriesLiveModelBenchmarkCase {
  const stateIds = input.states.map((_, index) =>
    `state.${input.id}.${index + 1}`
  );
  const result = validateKpEquationTransformSeriesRequest({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `series.${input.id}.v1`,
    states: input.states.map((latex, index) => ({
      id: stateIds[index],
      latex
    })),
    adjacencies: input.instructions.map((instruction, index) => ({
      id: `adjacency.${input.id}.${index + 1}`,
      fromStateId: stateIds[index],
      toStateId: stateIds[index + 1],
      intent: { mode: "proposed", instruction }
    }))
  });
  if (result.status !== "accepted") {
    throw new Error(`Invalid live benchmark case ${input.id}.`);
  }
  return deepFreeze({
    id: input.id,
    intent: input.intent,
    request: result.request,
    expectation: input.expectation
  });
}

function count<T, K extends keyof T>(values: readonly T[], key: K): number {
  return values.filter((entry) => entry[key] === true).length;
}

function sum<T, K extends keyof T>(values: readonly T[], key: K): number {
  return values.reduce((total, entry) => total + Number(entry[key]), 0);
}

function equal(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
