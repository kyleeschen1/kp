import { compileKpEquationTransformSeries } from
  "./compile-equation-transform-series.ts";
import type { KpEquationSeriesIntentProposal } from
  "./equation-series-intent-resolver.ts";
import type {
  KpEquationSeriesExternalDiagnostic,
  KpEquationSeriesRepair
} from "./equation-series-repair-taxonomy.ts";

export type KpEquationTransformSeriesCorpusScenario =
  | "direct-success"
  | "one-typed-repair"
  | "invalid-algebra-authority"
  | "unsupported-syntax"
  | "unsupported-motif";

interface KpEquationTransformSeriesCorpusFixture {
  readonly id: string;
  readonly scenario: KpEquationTransformSeriesCorpusScenario;
  readonly evidenceKind: "deterministic-fixture";
  readonly input: Readonly<{
    value: unknown;
    proposals?: readonly KpEquationSeriesIntentProposal[] | undefined;
    externalDiagnostics?:
      readonly KpEquationSeriesExternalDiagnostic[] | undefined;
  }>;
  readonly expectedStatus: "compiled" | "repair-required";
  readonly expectedRepairKinds: readonly KpEquationSeriesRepair["kind"][];
  readonly expectedSourceCodes: readonly string[];
}

export interface KpEquationTransformSeriesCorpusReportCase {
  readonly fixtureId: string;
  readonly scenario: KpEquationTransformSeriesCorpusScenario;
  readonly actualStatus: "compiled" | "repair-required";
  readonly repairKinds: readonly KpEquationSeriesRepair["kind"][];
  readonly repairSourceCodes: readonly string[];
  readonly activeCandidatePresent: boolean;
  readonly passed: boolean;
}

export interface KpEquationTransformSeriesCorpusReport {
  readonly schemaVersion: "kp.equation-transform-series-corpus-report.v1";
  readonly corpusId: string;
  readonly status: "passed" | "failed";
  readonly cases: readonly KpEquationTransformSeriesCorpusReportCase[];
}

const direct = request({
  id: "series.corpus.direct.v1",
  intent: {
    mode: "explicit",
    operationId: "kp.algebra.wrap-function",
    semanticArguments: { wrapper: "ln" }
  }
});

const proposed = request({
  id: "series.corpus.proposed.v1",
  intent: {
    mode: "proposed",
    instruction: "Select one registered operation."
  }
});

export const kpEquationTransformSeriesCorpus = deepFreeze({
  schemaVersion: "kp.equation-transform-series-corpus.v1" as const,
  id: "corpus.equation.transform-series.v1",
  liveModelEvidence: false as const,
  fixtures: [
    fixture({
      id: "fixture.equation-series.direct-success",
      scenario: "direct-success",
      input: { value: direct },
      expectedStatus: "compiled",
      expectedRepairKinds: [],
      expectedSourceCodes: []
    }),
    fixture({
      id: "fixture.equation-series.one-typed-repair",
      scenario: "one-typed-repair",
      input: { value: proposed },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["unknown-operation"],
      expectedSourceCodes: ["equation-series.segmentation.resolve-operation"]
    }),
    fixture({
      id: "fixture.equation-series.invalid-algebra-authority",
      scenario: "invalid-algebra-authority",
      input: {
        value: direct,
        externalDiagnostics: [{
          code: "equation-series.algebra-authority.invalid",
          path: "$.adjacencies[0].intent.semanticArguments",
          message: "The claimed algebra law has no verified authority.",
          repair: "Select a verified semantic operation authority."
        }]
      },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["invalid-request"],
      expectedSourceCodes: ["equation-series.algebra-authority.invalid"]
    }),
    fixture({
      id: "fixture.equation-series.unsupported-syntax",
      scenario: "unsupported-syntax",
      input: {
        value: {
          ...direct,
          states: [
            direct.states[0],
            { id: "state.corpus.after", latex: "\\sum_{i=1}^{n} i" }
          ]
        }
      },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["unsupported-syntax"],
      expectedSourceCodes: ["equation-series.endpoint.unsupported-syntax"]
    }),
    fixture({
      id: "fixture.equation-series.unsupported-motif",
      scenario: "unsupported-motif",
      input: {
        value: direct,
        externalDiagnostics: [{
          code: "equation-series.motif.unavailable",
          path: "$.adjacencies[0]",
          message: "The semantic operation has no registered presentation motif.",
          operationId: "kp.algebra.wrap-function",
          motifId: "motif.equation.unavailable.v1"
        }]
      },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["unsupported-motif"],
      expectedSourceCodes: ["equation-series.motif.unavailable"]
    })
  ]
});

export function evaluateKpEquationTransformSeriesCorpus():
KpEquationTransformSeriesCorpusReport {
  const cases = kpEquationTransformSeriesCorpus.fixtures.map((entry) => {
    const result = compileKpEquationTransformSeries(entry.input);
    const repairKinds = result.repairs.map(({ kind }) => kind);
    const repairSourceCodes = result.repairs.map(({ sourceCode }) => sourceCode);
    const activeCandidatePresent = result.active !== undefined;
    const passed = result.status === entry.expectedStatus &&
      equal(repairKinds, entry.expectedRepairKinds) &&
      equal(repairSourceCodes, entry.expectedSourceCodes) &&
      (result.status === "compiled" || !activeCandidatePresent);
    return {
      fixtureId: entry.id,
      scenario: entry.scenario,
      actualStatus: result.status,
      repairKinds,
      repairSourceCodes,
      activeCandidatePresent,
      passed
    };
  });
  return deepFreeze({
    schemaVersion: "kp.equation-transform-series-corpus-report.v1" as const,
    corpusId: kpEquationTransformSeriesCorpus.id,
    status: cases.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    cases
  });
}

function request(input: {
  readonly id: string;
  readonly intent: Readonly<Record<string, unknown>>;
}) {
  return deepFreeze({
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: input.id,
    states: [
      { id: "state.corpus.before", latex: "x" },
      { id: "state.corpus.after", latex: "\\ln(x)" }
    ],
    adjacencies: [{
      id: "adjacency.corpus.transform",
      fromStateId: "state.corpus.before",
      toStateId: "state.corpus.after",
      intent: input.intent
    }]
  });
}

function fixture(
  input: Omit<KpEquationTransformSeriesCorpusFixture, "evidenceKind">
): KpEquationTransformSeriesCorpusFixture {
  return deepFreeze({ ...input, evidenceKind: "deterministic-fixture" as const });
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
