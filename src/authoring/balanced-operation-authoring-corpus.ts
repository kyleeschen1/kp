import { compileKpEquationTransformSeries } from
  "./compile-equation-transform-series.ts";
import {
  kpEquationSeriesBothSidesAuthoringDeclarations,
  type KpEquationSeriesBothSidesAuthoringDeclaration,
  type KpEquationSeriesBothSidesSemanticArguments,
  type KpEquationSeriesVerifiedSemanticSource
} from "./equation-series-both-sides-authoring.ts";
import type { KpEquationSeriesIntentProposal } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationSeriesRepair } from
  "./equation-series-repair-taxonomy.ts";

export type KpBalancedOperationCorpusScenario =
  | "add"
  | "subtract"
  | "multiply"
  | "divide"
  | "apply-log"
  | "divide-by-log-base"
  | "division-by-zero"
  | "log-domain"
  | "ambiguous-operation"
  | "compound-operation";

interface KpBalancedOperationCorpusFixture {
  readonly id: string;
  readonly scenario: KpBalancedOperationCorpusScenario;
  readonly operandShape: string;
  readonly input: Readonly<{
    value: unknown;
    proposals?: readonly KpEquationSeriesIntentProposal[] | undefined;
    governedSources?:
      readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
  }>;
  readonly expectedStatus: "compiled" | "repair-required";
  readonly expectedRepairKinds: readonly KpEquationSeriesRepair["kind"][];
  readonly expectedSourceCodes: readonly string[];
}

export interface KpBalancedOperationCorpusReportCase {
  readonly fixtureId: string;
  readonly scenario: KpBalancedOperationCorpusScenario;
  readonly operandShape: string;
  readonly actualStatus: "compiled" | "repair-required";
  readonly operationId?: string | undefined;
  readonly repairKinds: readonly KpEquationSeriesRepair["kind"][];
  readonly repairSourceCodes: readonly string[];
  readonly activeCandidatePresent: boolean;
  readonly passed: boolean;
}

export interface KpBalancedOperationCorpusReport {
  readonly schemaVersion: "kp.balanced-operation-authoring-corpus-report.v1";
  readonly corpusId: string;
  readonly status: "passed" | "failed";
  readonly cases: readonly KpBalancedOperationCorpusReportCase[];
}

const declarationByRegistrationId = Object.freeze(Object.fromEntries(
  kpEquationSeriesBothSidesAuthoringDeclarations.map((declaration) => [
    declaration.registrationId,
    declaration
  ])
) as Readonly<Record<string, KpEquationSeriesBothSidesAuthoringDeclaration>>);

const compiledFixtures = [
  success("add", "addBothSides", "x-3=7", "x-3+3=7+3",
    "signed-addend"),
  success("subtract", "subtractBothSides", "x+3=7", "x+3-3=7-3",
    "positive-addend"),
  success("multiply", "multiplyBothSides", "\\frac{x}{3}=4",
    "3*\\frac{x}{3}=3*4", "fractional-variable"),
  success("divide", "divideBothSides", "3*x=12",
    "\\frac{3*x}{3}=\\frac{12}{3}", "explicit-product"),
  success("apply-log", "applyNaturalLogBothSides", "2^x=7",
    "\\ln(2^x)=\\ln(7)", "power-and-constant"),
  success("divide-by-log-base", "divideBothSidesByLogBase",
    "x*\\ln(2)=\\ln(7)",
    "x=\\frac{\\ln(7)}{\\ln(2)}", "logarithmic-compound")
] as const;

const divideDeclaration = declaration("divideBothSides");
const divideSource = sourceAuthority(divideDeclaration,
  "fixture.corpus.divide-zero");
const logDeclaration = declaration("applyNaturalLogBothSides");
const logSource = sourceAuthority(logDeclaration,
  "fixture.corpus.log-domain");

export const kpBalancedOperationAuthoringCorpus = deepFreeze({
  schemaVersion: "kp.balanced-operation-authoring-corpus.v1" as const,
  id: "corpus.equation.balanced-operation-authoring.v1",
  liveModelEvidence: false as const,
  fixtures: [
    ...compiledFixtures,
    fixture({
      id: "fixture.corpus.balanced.division-by-zero",
      scenario: "division-by-zero",
      operandShape: "zero-divisor",
      input: {
        value: request({
          id: "fixture.corpus.divide-zero",
          declaration: divideDeclaration,
          sourceLatex: "3*x=12",
          targetLatex: "\\frac{3*x}{0}=\\frac{12}{0}",
          semanticArguments: semanticArguments(
            divideDeclaration,
            divideSource
          )
        }),
        // The source cannot certify the registered nonzero assumption.
        governedSources: [{ ...divideSource, assumptionEvidenceIds: [] }]
      },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["assumption-evidence"],
      expectedSourceCodes: [
        "equation-series.governance.assumption.mismatch"
      ]
    }),
    fixture({
      id: "fixture.corpus.balanced.log-domain",
      scenario: "log-domain",
      operandShape: "nonpositive-log-argument",
      input: {
        value: request({
          id: "fixture.corpus.log-domain",
          declaration: logDeclaration,
          sourceLatex: "2^x=-7",
          targetLatex: "\\ln(2^x)=\\ln(-7)",
          semanticArguments: semanticArguments(logDeclaration, logSource)
        }),
        governedSources: [{ ...logSource, assumptionEvidenceIds: [] }]
      },
      expectedStatus: "repair-required",
      expectedRepairKinds: ["assumption-evidence"],
      expectedSourceCodes: [
        "equation-series.governance.assumption.mismatch"
      ]
    }),
    proposedFixture({
      id: "fixture.corpus.balanced.ambiguous-operation",
      scenario: "ambiguous-operation",
      proposal: {
        adjacencyId: "adjacency.fixture.corpus.ambiguous",
        kind: "alternatives",
        operationIds: [
          declaration("addBothSides").operationId,
          declaration("subtractBothSides").operationId
        ]
      },
      expectedRepairKind: "ambiguous-jump",
      expectedSourceCode: "equation-series.segmentation.choose-single-operation"
    }),
    proposedFixture({
      id: "fixture.corpus.balanced.compound-operation",
      scenario: "compound-operation",
      proposal: {
        adjacencyId: "adjacency.fixture.corpus.compound",
        kind: "sequence",
        operationIds: [
          declaration("subtractBothSides").operationId,
          declaration("divideBothSides").operationId
        ]
      },
      expectedRepairKind: "compound-jump",
      expectedSourceCode: "equation-series.segmentation.insert-intermediate-states"
    })
  ]
});

export function evaluateKpBalancedOperationAuthoringCorpus():
KpBalancedOperationCorpusReport {
  const cases = kpBalancedOperationAuthoringCorpus.fixtures.map((entry) => {
    const result = compileKpEquationTransformSeries(entry.input);
    const repairKinds = result.repairs.map(({ kind }) => kind);
    const repairSourceCodes = result.repairs.map(({ sourceCode }) => sourceCode);
    const activeCandidatePresent = result.active !== undefined;
    const operationId = result.active?.runtime.plans[0]?.operationId;
    const passed = result.status === entry.expectedStatus &&
      equal(repairKinds, entry.expectedRepairKinds) &&
      equal(repairSourceCodes, entry.expectedSourceCodes) &&
      (result.status === "compiled" || !activeCandidatePresent);
    return {
      fixtureId: entry.id,
      scenario: entry.scenario,
      operandShape: entry.operandShape,
      actualStatus: result.status,
      ...(operationId === undefined ? {} : { operationId }),
      repairKinds,
      repairSourceCodes,
      activeCandidatePresent,
      passed
    };
  });
  return deepFreeze({
    schemaVersion:
      "kp.balanced-operation-authoring-corpus-report.v1" as const,
    corpusId: kpBalancedOperationAuthoringCorpus.id,
    status: cases.every(({ passed }) => passed)
      ? "passed" as const
      : "failed" as const,
    cases
  });
}

function success(
  scenario: Extract<KpBalancedOperationCorpusScenario,
    "add" | "subtract" | "multiply" | "divide" | "apply-log" |
      "divide-by-log-base">,
  registrationId: string,
  sourceLatex: string,
  targetLatex: string,
  operandShape: string
): KpBalancedOperationCorpusFixture {
  const operation = declaration(registrationId);
  const id = `fixture.corpus.balanced.${scenario}`;
  const source = sourceAuthority(operation, id);
  return fixture({
    id,
    scenario,
    operandShape,
    input: {
      value: request({
        id,
        declaration: operation,
        sourceLatex,
        targetLatex,
        semanticArguments: semanticArguments(operation, source)
      }),
      governedSources: [source]
    },
    expectedStatus: "compiled",
    expectedRepairKinds: [],
    expectedSourceCodes: []
  });
}

function proposedFixture(input: {
  readonly id: string;
  readonly scenario: "ambiguous-operation" | "compound-operation";
  readonly proposal: KpEquationSeriesIntentProposal;
  readonly expectedRepairKind: KpEquationSeriesRepair["kind"];
  readonly expectedSourceCode: string;
}): KpBalancedOperationCorpusFixture {
  const suffix = input.scenario === "ambiguous-operation"
    ? "ambiguous"
    : "compound";
  return fixture({
    id: input.id,
    scenario: input.scenario,
    operandShape: "multi-law-jump",
    input: {
      value: {
        schemaVersion: "kp.equation-transform-series-request.v1",
        kind: "equation-transform-series-request",
        id: `series.fixture.corpus.${suffix}`,
        states: [
          { id: `state.fixture.corpus.${suffix}.before`, latex: "3*x+2=14" },
          { id: `state.fixture.corpus.${suffix}.after`, latex: "x=4" }
        ],
        adjacencies: [{
          id: `adjacency.fixture.corpus.${suffix}`,
          fromStateId: `state.fixture.corpus.${suffix}.before`,
          toStateId: `state.fixture.corpus.${suffix}.after`,
          intent: {
            mode: "proposed",
            instruction: "Resolve exactly one semantic operation."
          }
        }]
      },
      proposals: [input.proposal]
    },
    expectedStatus: "repair-required",
    expectedRepairKinds: [input.expectedRepairKind],
    expectedSourceCodes: [input.expectedSourceCode]
  });
}

function request(input: {
  readonly id: string;
  readonly declaration: KpEquationSeriesBothSidesAuthoringDeclaration;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly semanticArguments: KpEquationSeriesBothSidesSemanticArguments;
}) {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request",
    id: `series.${input.id}`,
    states: [
      { id: `state.${input.id}.before`, latex: input.sourceLatex },
      { id: `state.${input.id}.after`, latex: input.targetLatex }
    ],
    adjacencies: [{
      id: `adjacency.${input.id}`,
      fromStateId: `state.${input.id}.before`,
      toStateId: `state.${input.id}.after`,
      intent: {
        mode: "explicit",
        operationId: input.declaration.operationId,
        semanticArguments: input.semanticArguments
      }
    }]
  };
}

function semanticArguments(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration,
  source: KpEquationSeriesVerifiedSemanticSource
): KpEquationSeriesBothSidesSemanticArguments {
  const prefix = source.sourceId;
  return {
    schemaVersion: "kp.equation-series.both-sides-intent.v1",
    sourcePin: {
      sourceId: source.sourceId,
      revisionId: source.revisionId
    },
    operationPin: { ...declaration.operationPin },
    roleBindings: {
      lhs: [`${prefix}.entity.lhs`],
      rhs: [`${prefix}.entity.rhs`],
      relation: [`${prefix}.entity.relation`],
      "applied-operation": [`${prefix}.entity.operation`]
    },
    assumptionEvidenceIds: [
      ...declaration.requiredAssumptionEvidenceIds
    ]
  };
}

function sourceAuthority(
  declaration: KpEquationSeriesBothSidesAuthoringDeclaration,
  fixtureId: string
): KpEquationSeriesVerifiedSemanticSource {
  const sourceId = `source.${fixtureId}`;
  return deepFreeze({
    sourceId,
    revisionId: `revision.${fixtureId}.v1`,
    operationIds: [declaration.operationId],
    entityIds: [
      `${sourceId}.entity.lhs`,
      `${sourceId}.entity.rhs`,
      `${sourceId}.entity.relation`,
      `${sourceId}.entity.operation`
    ],
    assumptionEvidenceIds: [
      ...declaration.requiredAssumptionEvidenceIds
    ]
  });
}

function declaration(
  registrationId: string
): KpEquationSeriesBothSidesAuthoringDeclaration {
  const resolved = declarationByRegistrationId[registrationId];
  if (resolved === undefined) {
    throw new Error(`Missing both-sides declaration ${registrationId}.`);
  }
  return resolved;
}

function fixture(
  input: KpBalancedOperationCorpusFixture
): KpBalancedOperationCorpusFixture {
  return deepFreeze(input);
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
