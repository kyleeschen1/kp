import { compileKpEquationTransformSeries } from
  "./compile-equation-transform-series.ts";
import {
  KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
  createKpEquationSeriesCommonDenominatorSemanticSource
} from "./equation-series-common-denominator-authoring.ts";
import {
  KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID,
  createKpEquationSeriesLikeDenominatorSemanticSource
} from "./equation-series-like-denominator-authoring.ts";
import { bindKpEquationSeriesGovernedRequest } from
  "./equation-series-governed-source-binding.ts";
import type { KpEquationSeriesIntentProposal } from
  "./equation-series-intent-resolver.ts";
import { validateKpEquationSeriesPlannerRecord } from
  "./equation-series-natural-language-planner-port.ts";
import type { KpEquationSeriesRepair } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";
import { kpCanonicalCommonDenominatorAlignment } from
  "../semantic/fraction-common-denominator.ts";
import { kpCanonicalLikeDenominatorCombination } from
  "../semantic/fraction-like-denominator-combination.ts";

export type KpFractionDenominatorCorpusScenario =
  | "align-common-denominator"
  | "align-then-evaluate"
  | "combine-like-denominators"
  | "normalize-source-alias"
  | "reject-mismatched-denominator"
  | "reject-hidden-reduction";

interface KpFractionDenominatorCorpusFixture {
  readonly id: string;
  readonly scenario: KpFractionDenominatorCorpusScenario;
  readonly naturalLanguageIntent: string;
  readonly request: KpEquationTransformSeriesRequest;
  readonly proposals: readonly KpEquationSeriesIntentProposal[];
  readonly sources: readonly ReturnType<
    typeof createKpEquationSeriesCommonDenominatorSemanticSource |
    typeof createKpEquationSeriesLikeDenominatorSemanticSource
  >[];
  readonly expectedStatus: "compiled" | "repair-required";
  readonly expectedOperationIds: readonly string[];
  readonly expectedRepairKinds: readonly KpEquationSeriesRepair["kind"][];
}

export interface KpFractionDenominatorCorpusReportCase {
  readonly fixtureId: string;
  readonly scenario: KpFractionDenominatorCorpusScenario;
  readonly actualStatus: "compiled" | "repair-required";
  readonly operationIds: readonly string[];
  readonly operationNormalizations: readonly Readonly<{
    requestedOperationId: string;
    canonicalOperationId: string;
  }>[];
  readonly repairKinds: readonly KpEquationSeriesRepair["kind"][];
  readonly activeCandidatePresent: boolean;
  readonly passed: boolean;
}

const alignment = kpCanonicalCommonDenominatorAlignment;
const combination = kpCanonicalLikeDenominatorCombination;

export const KP_FRACTION_DENOMINATOR_GENERATION_CORPUS_AUTHORITY =
  "corpus.equation.fraction-denominator.v1" as const;

export const kpFractionDenominatorGenerationCorpus = deepFreeze({
  schemaVersion: "kp.fraction-denominator-generation-corpus.v1" as const,
  id: KP_FRACTION_DENOMINATOR_GENERATION_CORPUS_AUTHORITY,
  liveModelEvidence: false as const,
  fixtures: [
    alignmentFixture({
      id: "fixture.fraction-denominator.align",
      scenario: "align-common-denominator",
      naturalLanguageIntent: "Give both fractions denominator six.",
      targetLatex: "\\frac{2*1}{2*3}+\\frac{1}{6}",
      proposalOperationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
      expectedStatus: "compiled",
      expectedOperations: [KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID]
    }),
    composedAlignmentFixture(),
    combinationFixture({
      id: "fixture.fraction-denominator.combine",
      scenario: "combine-like-denominators",
      naturalLanguageIntent:
        "Combine the fractions without reducing the result.",
      sourceLatex: "\\frac{2}{6}+\\frac{1}{6}",
      targetLatex: "\\frac{3}{6}",
      expectedStatus: "compiled",
      expectedRepairs: []
    }),
    alignmentFixture({
      id: "fixture.fraction-denominator.alias",
      scenario: "normalize-source-alias",
      naturalLanguageIntent:
        "Create a common denominator using the established source name.",
      targetLatex: "\\frac{2*1}{2*3}+\\frac{1}{6}",
      proposalOperationId:
        "definition.symbolic.algebra.create-common-denominator",
      expectedStatus: "compiled",
      expectedOperations: [KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID]
    }),
    combinationFixture({
      id: "fixture.fraction-denominator.mismatched",
      scenario: "reject-mismatched-denominator",
      naturalLanguageIntent:
        "Combine these fractions even though their denominators differ.",
      sourceLatex: "\\frac{2}{6}+\\frac{1}{5}",
      targetLatex: "\\frac{3}{6}",
      expectedStatus: "repair-required",
      expectedRepairs: ["semantic-source"]
    }),
    combinationFixture({
      id: "fixture.fraction-denominator.hidden-reduction",
      scenario: "reject-hidden-reduction",
      naturalLanguageIntent:
        "Combine the like denominators and reduce in the same step.",
      sourceLatex: "\\frac{2}{6}+\\frac{1}{6}",
      targetLatex: "\\frac{1}{2}",
      expectedStatus: "repair-required",
      expectedRepairs: ["semantic-source"]
    })
  ] satisfies readonly KpFractionDenominatorCorpusFixture[]
});

export function evaluateKpFractionDenominatorGenerationCorpus(): Readonly<{
  readonly schemaVersion: "kp.fraction-denominator-generation-report.v1";
  readonly corpusId: string;
  readonly status: "passed" | "failed";
  readonly cases: readonly KpFractionDenominatorCorpusReportCase[];
}> {
  const cases = kpFractionDenominatorGenerationCorpus.fixtures.map((entry) => {
    const planned = validateKpEquationSeriesPlannerRecord({
      schemaVersion: "kp.equation-series-planner-record.v1",
      kind: "equation-series-planner-record",
      requestId: entry.request.id,
      plannerId: "planner.fraction-denominator.corpus.v1",
      status: "proposed",
      proposals: entry.proposals,
      diagnostics: []
    }, entry.request);
    const bound = planned.status === "proposed"
      ? bindKpEquationSeriesGovernedRequest({
          request: entry.request,
          proposals: planned.record.proposals,
          sources: entry.sources
        })
      : undefined;
    const result = bound?.status === "bound"
      ? compileKpEquationTransformSeries({
          value: bound.request,
          governedSources: entry.sources
        })
      : undefined;
    const actualStatus = result?.status ?? "repair-required";
    const operationIds = result?.active?.runtime.plans.map(
      ({ operationId }) => operationId
    ) ?? [];
    const operationNormalizations = planned.status === "proposed"
      ? planned.record.operationNormalizations.map((normalization) => ({
          requestedOperationId: normalization.requestedOperationId,
          canonicalOperationId: normalization.canonicalOperationId
        }))
      : [];
    const repairKinds = result?.repairs.map(({ kind }) => kind) ?? [];
    const activeCandidatePresent = result?.active !== undefined;
    const passed = actualStatus === entry.expectedStatus &&
      equal(operationIds, entry.expectedOperationIds) &&
      equal(repairKinds, entry.expectedRepairKinds) &&
      (actualStatus === "compiled" || !activeCandidatePresent);
    return {
      fixtureId: entry.id,
      scenario: entry.scenario,
      actualStatus,
      operationIds,
      operationNormalizations,
      repairKinds,
      activeCandidatePresent,
      passed
    };
  });
  return deepFreeze({
    schemaVersion: "kp.fraction-denominator-generation-report.v1" as const,
    corpusId: kpFractionDenominatorGenerationCorpus.id,
    status: cases.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    cases
  });
}

function alignmentFixture(input: {
  readonly id: string;
  readonly scenario: "align-common-denominator" | "normalize-source-alias";
  readonly naturalLanguageIntent: string;
  readonly targetLatex: string;
  readonly proposalOperationId: string;
  readonly expectedStatus: "compiled";
  readonly expectedOperations: readonly string[];
}): KpFractionDenominatorCorpusFixture {
  const adjacencyId = `${input.id}.adjacency`;
  return {
    id: input.id,
    scenario: input.scenario,
    naturalLanguageIntent: input.naturalLanguageIntent,
    request: request({
      id: input.id,
      states: [
        { id: alignment.source.stateId,
          latex: "\\frac{1}{3}+\\frac{1}{6}" },
        { id: alignment.target.stateId, latex: input.targetLatex }
      ],
      adjacencies: [{
        id: adjacencyId,
        fromStateId: alignment.source.stateId,
        toStateId: alignment.target.stateId,
        instruction: input.naturalLanguageIntent
      }]
    }),
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: input.proposalOperationId
    }],
    sources: [createKpEquationSeriesCommonDenominatorSemanticSource({
      sourceId: `${input.id}.source`,
      revisionId: `${input.id}.revision.v1`,
      adjacencyId,
      transformation: alignment
    })],
    expectedStatus: input.expectedStatus,
    expectedOperationIds: input.expectedOperations,
    expectedRepairKinds: []
  };
}

function composedAlignmentFixture(): KpFractionDenominatorCorpusFixture {
  const id = "fixture.fraction-denominator.align-evaluate";
  const alignmentAdjacencyId = `${id}.align`;
  const evaluationAdjacencyId = `${id}.evaluate`;
  const evaluatedStateId = "state.fraction.common-denominator.corpus-evaluated";
  return {
    id,
    scenario: "align-then-evaluate",
    naturalLanguageIntent:
      "Make sixths, then evaluate the explicit numerator and denominator products.",
    request: request({
      id,
      states: [
        { id: alignment.source.stateId,
          latex: "\\frac{1}{3}+\\frac{1}{6}" },
        { id: alignment.target.stateId,
          latex: "\\frac{2*1}{2*3}+\\frac{1}{6}" },
        { id: evaluatedStateId, latex: "\\frac{2}{6}+\\frac{1}{6}" }
      ],
      adjacencies: [{
        id: alignmentAdjacencyId,
        fromStateId: alignment.source.stateId,
        toStateId: alignment.target.stateId,
        instruction: "Align both fractions to sixths."
      }, {
        id: evaluationAdjacencyId,
        fromStateId: alignment.target.stateId,
        toStateId: evaluatedStateId,
        instruction: "Evaluate the constant products."
      }]
    }),
    proposals: [{
      adjacencyId: alignmentAdjacencyId,
      kind: "single",
      operationId: KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID
    }, {
      adjacencyId: evaluationAdjacencyId,
      kind: "single",
      operationId: "kp.algebra.simplify-constant-product"
    }],
    sources: [createKpEquationSeriesCommonDenominatorSemanticSource({
      sourceId: `${id}.source`,
      revisionId: `${id}.revision.v1`,
      adjacencyId: alignmentAdjacencyId,
      transformation: alignment
    })],
    expectedStatus: "compiled",
    expectedOperationIds: [
      KP_COMMON_DENOMINATOR_AUTHORING_OPERATION_ID,
      "kp.algebra.simplify-constant-product"
    ],
    expectedRepairKinds: []
  };
}

function combinationFixture(input: {
  readonly id: string;
  readonly scenario: "combine-like-denominators" |
    "reject-mismatched-denominator" | "reject-hidden-reduction";
  readonly naturalLanguageIntent: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly expectedStatus: "compiled" | "repair-required";
  readonly expectedRepairs: readonly KpEquationSeriesRepair["kind"][];
}): KpFractionDenominatorCorpusFixture {
  const adjacencyId = `${input.id}.adjacency`;
  return {
    id: input.id,
    scenario: input.scenario,
    naturalLanguageIntent: input.naturalLanguageIntent,
    request: request({
      id: input.id,
      states: [
        { id: combination.source.stateId, latex: input.sourceLatex },
        { id: combination.target.stateId, latex: input.targetLatex }
      ],
      adjacencies: [{
        id: adjacencyId,
        fromStateId: combination.source.stateId,
        toStateId: combination.target.stateId,
        instruction: input.naturalLanguageIntent
      }]
    }),
    proposals: [{
      adjacencyId,
      kind: "single",
      operationId: KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID
    }],
    sources: [createKpEquationSeriesLikeDenominatorSemanticSource({
      sourceId: `${input.id}.source`,
      revisionId: `${input.id}.revision.v1`,
      adjacencyId,
      transformation: combination
    })],
    expectedStatus: input.expectedStatus,
    expectedOperationIds: input.expectedStatus === "compiled"
      ? [KP_LIKE_DENOMINATOR_AUTHORING_OPERATION_ID]
      : [],
    expectedRepairKinds: input.expectedRepairs
  };
}

function request(input: {
  readonly id: string;
  readonly states: readonly [
    { readonly id: string; readonly latex: string },
    { readonly id: string; readonly latex: string },
    ...{ readonly id: string; readonly latex: string }[]
  ];
  readonly adjacencies: readonly {
    readonly id: string;
    readonly fromStateId: string;
    readonly toStateId: string;
    readonly instruction: string;
  }[];
}): KpEquationTransformSeriesRequest {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `${input.id}.series`,
    states: input.states,
    adjacencies: input.adjacencies.map((entry) => ({
      id: entry.id,
      fromStateId: entry.fromStateId,
      toStateId: entry.toStateId,
      intent: { mode: "proposed", instruction: entry.instruction }
    }))
  };
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
