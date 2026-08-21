import {
  isKpVerifiedInversePowerOperation,
  KP_INVERSE_POWER_OPERATION_AUTHORITY,
  verifyKpInversePowerOperation,
  type KpVerifiedInversePowerOperation
} from "./inverse-power-operation.ts";
import {
  normalizeKpRadicalEndpoint,
  type KpNormalizedPowerRootEndpoint,
  type KpNormalizedRadicalRootEndpoint
} from "./radical-endpoint-normalizer.ts";
import {
  isKpVerifiedRootValueEvaluation,
  KP_ROOT_VALUE_EVALUATION_AUTHORITY,
  verifyKpRootValueEvaluation,
  type KpVerifiedRootValueEvaluation
} from "./root-value-evaluation.ts";

declare const kpVerifiedEvenRootSolveExemplarBrand: unique symbol;

export const KP_EVEN_ROOT_SOLVE_EXEMPLAR_ID =
  "exemplar.equation.radical-succession.v1" as const;

export type KpEvenRootSolveStateId =
  | "state.even-root.source"
  | "state.even-root.radical-branches"
  | "state.even-root.evaluated-branches";

export type KpEvenRootBranchId =
  | "branch.even-root.positive"
  | "branch.even-root.negative";

export interface KpEvenRootBranchState {
  readonly branchId: KpEvenRootBranchId;
  readonly sign: "positive" | "negative";
  readonly solutionSemanticId:
    | "semantic.solution.x.positive-three"
    | "semantic.solution.x.negative-three";
  readonly representationEntityId: string;
  readonly valueForm: "radical" | "evaluated-number";
}

export type KpEvenRootSolveState =
  | Readonly<{
      id: "state.even-root.source";
      kind: "powered-equality";
      latex: "x^2=9";
      relationEntityId: "source.relation";
      subjectEntityId: "source.base.x";
      poweredExpressionEntityId: "source.power.x-squared";
      exponentEntityId: "source.exponent.two";
      rightEntityId: "source.right.nine";
      branchIds: readonly [];
    }>
  | Readonly<{
      id: "state.even-root.radical-branches";
      kind: "branched-radical-equality";
      latex: "x=\\pm\\sqrt{9}";
      relationEntityId: "radical.relation";
      subjectEntityId: "radical.subject.x";
      plusMinusEntityId: "radical.operator.plus-minus";
      rootExpressionEntityId: "radical.expression.sqrt-nine";
      radicalOperatorEntityId: "radical.operator.sqrt";
      rootIndexEntityId: "radical.index.implicit-two";
      radicandEntityId: "radical.radicand.nine";
      branches: readonly [KpEvenRootBranchState, KpEvenRootBranchState];
      branchIds: readonly [
        "branch.even-root.positive",
        "branch.even-root.negative"
      ];
    }>
  | Readonly<{
      id: "state.even-root.evaluated-branches";
      kind: "evaluated-branch-equality";
      latex: "x=\\pm3";
      relationEntityId: "evaluated.relation";
      subjectEntityId: "evaluated.subject.x";
      plusMinusEntityId: "evaluated.operator.plus-minus";
      valueEntityId: "evaluated.value.three";
      branches: readonly [KpEvenRootBranchState, KpEvenRootBranchState];
      branchIds: readonly [
        "branch.even-root.positive",
        "branch.even-root.negative"
      ];
    }>;

export interface KpVerifiedEvenRootSolveExemplar {
  readonly schemaVersion: "kp.even-root-solve-exemplar.v1";
  readonly id: typeof KP_EVEN_ROOT_SOLVE_EXEMPLAR_ID;
  readonly stateIds: readonly [
    "state.even-root.source",
    "state.even-root.radical-branches",
    "state.even-root.evaluated-branches"
  ];
  readonly states: readonly [
    Extract<KpEvenRootSolveState, { id: "state.even-root.source" }>,
    Extract<KpEvenRootSolveState, { id: "state.even-root.radical-branches" }>,
    Extract<KpEvenRootSolveState, { id: "state.even-root.evaluated-branches" }>
  ];
  readonly operations: readonly [
    KpVerifiedInversePowerOperation,
    KpVerifiedRootValueEvaluation
  ];
  readonly adjacency: readonly [
    Readonly<{
      sourceStateId: "state.even-root.source";
      targetStateId: "state.even-root.radical-branches";
      operationAuthority: typeof KP_INVERSE_POWER_OPERATION_AUTHORITY;
    }>,
    Readonly<{
      sourceStateId: "state.even-root.radical-branches";
      targetStateId: "state.even-root.evaluated-branches";
      operationAuthority: typeof KP_ROOT_VALUE_EVALUATION_AUTHORITY;
    }>
  ];
  readonly restoration: Readonly<{
    kind: "direct-immutable-state-lookup";
    stateIds: readonly KpEvenRootSolveStateId[];
    replayRequired: false;
  }>;
  readonly [kpVerifiedEvenRootSolveExemplarBrand]: true;
}

const verifiedExemplars = new WeakSet<object>();

export function createKpEvenRootSolveExemplar():
KpVerifiedEvenRootSolveExemplar {
  const states = createStates();
  const sourceEndpoint = requirePowerEndpoint("x^2");
  const radicalEndpoint = requireRadicalEndpoint("\\sqrt{9}");
  const inversePower = verifyKpInversePowerOperation({
    schemaVersion: "kp.inverse-power-operation.v1",
    id: "operation.even-root.apply-inverse-square",
    operationAuthority: KP_INVERSE_POWER_OPERATION_AUTHORITY,
    lawAuthority: {
      id: "law.equation.inverse-positive-integer-power-over-reals",
      authorityRefId: "definition.inverse-power.real-square",
      level: "strict"
    },
    relation: {
      semanticId: "semantic.relation.equality",
      sourceEntityId: states[0].relationEntityId,
      targetEntityId: states[1].relationEntityId
    },
    source: {
      stateId: states[0].id,
      poweredExpressionEntityId: states[0].poweredExpressionEntityId,
      base: {
        entityId: states[0].subjectEntityId,
        semanticId: "semantic.variable.x"
      },
      exponentEntityId: states[0].exponentEntityId,
      right: {
        entityId: states[0].rightEntityId,
        semanticId: "semantic.value.nine"
      },
      endpoint: sourceEndpoint
    },
    target: {
      stateId: states[1].id,
      subject: {
        entityId: states[1].subjectEntityId,
        semanticId: "semantic.variable.x"
      },
      rootExpressionEntityId: states[1].rootExpressionEntityId,
      radicalOperatorEntityId: states[1].radicalOperatorEntityId,
      rootIndexEntityId: states[1].rootIndexEntityId,
      radicand: {
        entityId: states[1].radicandEntityId,
        semanticId: "semantic.value.nine"
      },
      endpoint: radicalEndpoint
    },
    exponentEvidence: {
      kind: "positive-integer-exponent",
      exponent: 2,
      parity: "even",
      positiveIntegerEvidenceId: "evidence.exponent.two.positive-integer",
      parityEvidenceId: "evidence.exponent.two.even"
    },
    domainEvidence: {
      scalarDomain: "real",
      sourceBaseDomainEvidenceId: "evidence.variable.x.real",
      rightValueDomainEvidenceId: "evidence.value.nine.real",
      radicandSign: "positive",
      radicandSignEvidenceId: "evidence.value.nine.positive"
    },
    solutionSet: {
      kind: "enumerated-real-roots",
      multiplicity: 2,
      branches: [
        {
          id: states[1].branches[0].branchId,
          sign: "positive",
          solutionSemanticId: states[1].branches[0].solutionSemanticId,
          candidateEntityId: states[1].branches[0].representationEntityId,
          substitutionEvidenceId: "evidence.substitution.positive-three"
        },
        {
          id: states[1].branches[1].branchId,
          sign: "negative",
          solutionSemanticId: states[1].branches[1].solutionSemanticId,
          candidateEntityId: states[1].branches[1].representationEntityId,
          substitutionEvidenceId: "evidence.substitution.negative-three"
        }
      ],
      candidateAudit: {
        kind: "complete-candidate-audit",
        acceptedBranchIds: states[1].branchIds,
        rejectedCandidates: [],
        completenessEvidenceId: "evidence.even-root.candidates.complete"
      }
    }
  });
  const evaluation = verifyKpRootValueEvaluation({
    schemaVersion: "kp.root-value-evaluation.v1",
    id: "operation.even-root.evaluate-square-root-nine",
    operationAuthority: KP_ROOT_VALUE_EVALUATION_AUTHORITY,
    lawAuthority: {
      id: "law.arithmetic.real-root-evaluation",
      authorityRefId: "definition.arithmetic.square-root-nine",
      level: "strict"
    },
    sourceStateId: states[1].id,
    targetStateId: states[2].id,
    sourceRootExpressionEntityId: states[1].rootExpressionEntityId,
    targetValueEntityId: states[2].valueEntityId,
    rootValue: {
      index: 2,
      radicand: 9,
      value: 3,
      arithmeticEvidenceId: "evidence.arithmetic.three-squared-is-nine"
    },
    branchCorrespondence: [
      {
        branchId: states[1].branches[0].branchId,
        sign: states[1].branches[0].sign,
        solutionSemanticId: states[1].branches[0].solutionSemanticId,
        sourceEntityId: states[1].branches[0].representationEntityId,
        targetEntityId: states[2].branches[0].representationEntityId,
        substitutionEvidenceId: "evidence.substitution.positive-three"
      },
      {
        branchId: states[1].branches[1].branchId,
        sign: states[1].branches[1].sign,
        solutionSemanticId: states[1].branches[1].solutionSemanticId,
        sourceEntityId: states[1].branches[1].representationEntityId,
        targetEntityId: states[2].branches[1].representationEntityId,
        substitutionEvidenceId: "evidence.substitution.negative-three"
      }
    ]
  });
  assertBranchContinuity(states, inversePower, evaluation);
  const stateIds = [states[0].id, states[1].id, states[2].id] as const;
  const exemplar = deepFreeze({
    schemaVersion: "kp.even-root-solve-exemplar.v1" as const,
    id: KP_EVEN_ROOT_SOLVE_EXEMPLAR_ID,
    stateIds,
    states,
    operations: [inversePower, evaluation] as const,
    adjacency: [
      {
        sourceStateId: states[0].id,
        targetStateId: states[1].id,
        operationAuthority: KP_INVERSE_POWER_OPERATION_AUTHORITY
      },
      {
        sourceStateId: states[1].id,
        targetStateId: states[2].id,
        operationAuthority: KP_ROOT_VALUE_EVALUATION_AUTHORITY
      }
    ] as const,
    restoration: {
      kind: "direct-immutable-state-lookup" as const,
      stateIds,
      replayRequired: false as const
    }
  }) as unknown as KpVerifiedEvenRootSolveExemplar;
  verifiedExemplars.add(exemplar);
  return exemplar;
}

export function isKpVerifiedEvenRootSolveExemplar(
  value: unknown
): value is KpVerifiedEvenRootSolveExemplar {
  return typeof value === "object" && value !== null &&
    verifiedExemplars.has(value);
}

export function restoreKpEvenRootSolveState(
  exemplar: KpVerifiedEvenRootSolveExemplar,
  stateId: KpEvenRootSolveStateId
): KpEvenRootSolveState {
  if (!isKpVerifiedEvenRootSolveExemplar(exemplar)) {
    throw new Error("Direct restoration requires verified exemplar authority.");
  }
  const state = exemplar.states.find(({ id }) => id === stateId);
  if (state === undefined) {
    throw new Error(`Even-root exemplar has no state ${stateId}.`);
  }
  return state;
}

export const kpCanonicalEvenRootSolveExemplar =
  createKpEvenRootSolveExemplar();

function createStates(): KpVerifiedEvenRootSolveExemplar["states"] {
  const branchIds = [
    "branch.even-root.positive",
    "branch.even-root.negative"
  ] as const;
  return deepFreeze([
    {
      id: "state.even-root.source",
      kind: "powered-equality",
      latex: "x^2=9",
      relationEntityId: "source.relation",
      subjectEntityId: "source.base.x",
      poweredExpressionEntityId: "source.power.x-squared",
      exponentEntityId: "source.exponent.two",
      rightEntityId: "source.right.nine",
      branchIds: []
    },
    {
      id: "state.even-root.radical-branches",
      kind: "branched-radical-equality",
      latex: "x=\\pm\\sqrt{9}",
      relationEntityId: "radical.relation",
      subjectEntityId: "radical.subject.x",
      plusMinusEntityId: "radical.operator.plus-minus",
      rootExpressionEntityId: "radical.expression.sqrt-nine",
      radicalOperatorEntityId: "radical.operator.sqrt",
      rootIndexEntityId: "radical.index.implicit-two",
      radicandEntityId: "radical.radicand.nine",
      branches: [
        branchState("positive", "radical.branch.positive", "radical"),
        branchState("negative", "radical.branch.negative", "radical")
      ],
      branchIds
    },
    {
      id: "state.even-root.evaluated-branches",
      kind: "evaluated-branch-equality",
      latex: "x=\\pm3",
      relationEntityId: "evaluated.relation",
      subjectEntityId: "evaluated.subject.x",
      plusMinusEntityId: "evaluated.operator.plus-minus",
      valueEntityId: "evaluated.value.three",
      branches: [
        branchState("positive", "evaluated.branch.positive", "evaluated-number"),
        branchState("negative", "evaluated.branch.negative", "evaluated-number")
      ],
      branchIds
    }
  ] as const);
}

function branchState(
  sign: "positive" | "negative",
  representationEntityId: string,
  valueForm: "radical" | "evaluated-number"
): KpEvenRootBranchState {
  return Object.freeze({
    branchId: `branch.even-root.${sign}` as KpEvenRootBranchId,
    sign,
    solutionSemanticId: `semantic.solution.x.${sign}-three` as
      KpEvenRootBranchState["solutionSemanticId"],
    representationEntityId,
    valueForm
  });
}

function assertBranchContinuity(
  states: KpVerifiedEvenRootSolveExemplar["states"],
  inversePower: KpVerifiedInversePowerOperation,
  evaluation: KpVerifiedRootValueEvaluation
): void {
  if (
    !isKpVerifiedInversePowerOperation(inversePower) ||
    !isKpVerifiedRootValueEvaluation(evaluation)
  ) {
    throw new Error("Every even-root adjacency requires verified authority.");
  }
  const radicalBranches = states[1].branches;
  const evaluatedBranches = states[2].branches;
  if (
    inversePower.source.stateId !== states[0].id ||
    inversePower.target.stateId !== states[1].id ||
    evaluation.sourceStateId !== states[1].id ||
    evaluation.targetStateId !== states[2].id
  ) {
    throw new Error("Even-root operations must preserve exact state adjacency.");
  }
  for (const [index, radical] of radicalBranches.entries()) {
    const evaluated = evaluatedBranches[index];
    const inverseBranch = inversePower.solutionSet.branches[index];
    const evaluationBranch = evaluation.branchCorrespondence[index];
    if (
      evaluated === undefined || inverseBranch === undefined ||
      evaluationBranch === undefined ||
      radical.branchId !== evaluated.branchId ||
      radical.branchId !== inverseBranch.id ||
      radical.branchId !== evaluationBranch.branchId ||
      radical.solutionSemanticId !== evaluated.solutionSemanticId ||
      radical.solutionSemanticId !== inverseBranch.solutionSemanticId ||
      radical.solutionSemanticId !== evaluationBranch.solutionSemanticId
    ) {
      throw new Error("Even-root plus and minus branch identity must persist.");
    }
  }
}

function requirePowerEndpoint(latex: string): KpNormalizedPowerRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "power") {
    throw new Error(`Expected ${latex} to normalize as a power endpoint.`);
  }
  return result.endpoint;
}

function requireRadicalEndpoint(latex: string): KpNormalizedRadicalRootEndpoint {
  const result = normalizeKpRadicalEndpoint(latex);
  if (result.status !== "normalized" || result.endpoint.notation !== "radical") {
    throw new Error(`Expected ${latex} to normalize as a radical endpoint.`);
  }
  return result.endpoint;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
