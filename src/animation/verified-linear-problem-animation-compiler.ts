import {
  inspectVerifiedLinearProblemAnimationTrace,
  type KpVerifiedLinearProblemAnimationBridgeContract
} from "../integrations/public-api.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetMetadataValue,
  type KpAssetSelector,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import type {
  KpLinearEquation,
  KpLinearEquationFrame,
  KpExactRational
} from "../../domains/public-api.ts";
import {
  createGeneratedAlgebraSemanticTransformation
} from "../semantic/generated-algebra-transform-definition-registry.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpCanonicalBalancedSolveAnimationAsset
} from "./canonical-balanced-solve-animation.ts";
import {
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";

const bridgePortId = "bridge.verified-linear-problem-animation.v1";

export interface KpVerifiedLinearProblemFrameLineage {
  readonly sourceFrameId: string;
  readonly sourceEquationSemanticId: string;
  readonly objectId: string;
}

export interface KpVerifiedLinearProblemOperationLineage {
  readonly sourceOperationId: string;
  readonly sourceOperationSemanticId: string;
  readonly transformationIds: readonly string[];
}

export interface KpVerifiedLinearProblemAnimationCompilation {
  readonly animation: KpAnimationAsset;
  readonly frameLineage: readonly KpVerifiedLinearProblemFrameLineage[];
  readonly operationLineage:
    readonly KpVerifiedLinearProblemOperationLineage[];
}

export interface KpVerifiedLinearProblemAnimationCompileDiagnostic {
  readonly severity: "error";
  readonly code:
    | "bridge-contract-invalid"
    | "unsupported-operation-sequence"
    | "unsupported-equation-shape"
    | "animation-asset-invalid";
  readonly path: string;
  readonly message: string;
}

export type KpVerifiedLinearProblemAnimationCompileResult =
  | {
      readonly status: "compiled";
      readonly compilation: KpVerifiedLinearProblemAnimationCompilation;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "rejected";
      readonly diagnostics:
        readonly KpVerifiedLinearProblemAnimationCompileDiagnostic[];
    };

interface ExactTwoStepSolve {
  readonly initial: KpLinearEquationFrame;
  readonly afterSubtract: KpLinearEquationFrame;
  readonly solved: KpLinearEquationFrame;
  readonly coefficient: bigint;
  readonly addend: bigint;
  readonly rightConstant: bigint;
  readonly difference: bigint;
  readonly solution: KpExactRational;
}

/**
 * Expands verified provider checkpoints through trusted KP semantic states.
 * The bridge supplies truth and provenance; this compiler alone supplies the
 * canonical transformation vocabulary, timeline, layout, and presentation.
 */
export function compileVerifiedLinearProblemAnimation(
  contract: KpVerifiedLinearProblemAnimationBridgeContract
): KpVerifiedLinearProblemAnimationCompileResult {
  const bridge = inspectVerifiedLinearProblemAnimationTrace(contract.trace);
  if (
    bridge.status !== "accepted" ||
    canonicalJson(bridge.contract.identity) !==
      canonicalJson(contract.identity)
  ) {
    return rejected(
      "bridge-contract-invalid",
      "$",
      "Generated animation compilation requires the exact accepted bridge contract."
    );
  }
  const bindings = contract.operationBindings;
  if (
    bindings.length !== 2 ||
    bindings[0]?.kind !== "subtract-both-sides" ||
    bindings[1]?.kind !== "divide-both-sides"
  ) {
    return rejected(
      "unsupported-operation-sequence",
      "$.operationBindings",
      "The first generated exemplar requires subtract-both-sides followed by divide-both-sides."
    );
  }

  const solve = exactTwoStepSolve(contract);
  if (typeof solve === "string") {
    return rejected(
      "unsupported-equation-shape",
      "$.trace.frames",
      solve
    );
  }

  const semanticNamespace = contract.identity.semanticNamespace;
  const ids = generatedSolveIds(semanticNamespace);
  const objects = createEquationObjects(contract, solve, ids);
  const transformations = createTransformations(contract, solve, ids);
  const root = createSemanticTransformationSequence({
    id: ids.sequence,
    label: "Verified generated linear solve",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      }))
    ),
    summary:
      "Trusted KP operations expand two exact provider checkpoints without changing their mathematical identity."
  });
  const timelineId = `timeline.${semanticNamespace}`;
  const renderTargetId = `render.${semanticNamespace}.equation`;
  const animation = createKpCanonicalBalancedSolveAnimationAsset({
    id: contract.identity.animationId,
    title: `Solve ${equationLatex(solve.initial.equation)}`,
    bundle: createKpAssetBundle({
      id: `asset.${semanticNamespace}`,
      title: `Verified generated solve ${contract.identity.sourceProblemId}`,
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        focus(
          `focus.${semanticNamespace}.subtract-introduction`,
          ids.subtract,
          selectors(ids.subtractIntroduced, "lhs.subtract", "rhs.minus", "rhs.subtrahend")
        ),
        focus(
          `focus.${semanticNamespace}.additive-cancellation`,
          ids.cancelAdditive,
          selectors(ids.subtractIntroduced, "lhs.addend", "lhs.subtract")
        ),
        pause(
          `pause.${semanticNamespace}.provider-after-subtract`,
          ids.simplifyDifference,
          `Verified provider checkpoint ${solve.afterSubtract.semanticIds.equation}.`
        ),
        focus(
          `focus.${semanticNamespace}.divide-introduction`,
          ids.divide,
          selectors(ids.divideIntroduced, "lhs.divide", "rhs.rule", "rhs.divisor")
        ),
        focus(
          `focus.${semanticNamespace}.multiplicative-cancellation`,
          ids.cancelMultiplicative,
          selectors(ids.divideIntroduced, "lhs.coefficient", "lhs.divide")
        ),
        pause(
          `pause.${semanticNamespace}.provider-solved`,
          ids.cancelMultiplicative,
          `Verified provider checkpoint ${solve.solved.semanticIds.equation}.`
        )
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: 3_000,
      beatCount: 60,
      markerIds: [
        `pause.${semanticNamespace}.provider-after-subtract`,
        `pause.${semanticNamespace}.provider-solved`
      ]
    },
    layout: {
      id: `layout.${semanticNamespace}`,
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap((object) =>
        object.selectors.map(({ id }) => id)
      ),
      transformationIds: transformations.map(({ id }) => id),
      timelineId
    }],
    checks: [
      {
        id: `check.${semanticNamespace}.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: contract.identity.animationId
      },
      {
        id: `check.${semanticNamespace}.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [
      {
        id: `export.${semanticNamespace}.static-steps`,
        kind: "static-step",
        artifactId: `artifact.${semanticNamespace}.static-steps`
      },
      {
        id: `export.${semanticNamespace}.frames`,
        kind: "frame-sequence",
        artifactId: `artifact.${semanticNamespace}.frames`
      }
    ],
    dashboard: {
      rowId: `animation-generated-linear-${contract.identity.sourceProblemId}`,
      tags: [
        "animation",
        "equation",
        "generated-problem",
        "linear-solve",
        "verified"
      ],
      sourceRefIds: [
        contract.identity.instanceId,
        contract.identity.sourceTraceId,
        contract.identity.sourceProblemId,
        ...contract.operationBindings.map(({ sourceOperationId }) =>
          sourceOperationId
        )
      ]
    },
    metadata: {
      generatedProblemImport: true,
      generatedProblemInstanceId: contract.identity.instanceId,
      sourceTraceId: contract.identity.sourceTraceId,
      sourceProblemId: contract.identity.sourceProblemId,
      providerId: contract.provenance.providerId,
      providerVersion: contract.provenance.providerVersion,
      protocolVersion: contract.provenance.protocolVersion,
      providerSeed: contract.provenance.seed
    }
  });
  const issues = validateKpAnimationAsset(animation);
  if (issues.length > 0) {
    return {
      status: "rejected",
      diagnostics: Object.freeze(issues.map((issue) => Object.freeze({
        severity: "error" as const,
        code: "animation-asset-invalid" as const,
        path: issue.path,
        message: issue.message
      })))
    };
  }

  const compilation: KpVerifiedLinearProblemAnimationCompilation = {
    animation,
    frameLineage: Object.freeze([
      frameLineage(solve.initial, ids.initial),
      frameLineage(solve.afterSubtract, ids.afterSubtract),
      frameLineage(solve.solved, ids.solved)
    ]),
    operationLineage: Object.freeze([
      operationLineage(contract, 0, [
        ids.subtract,
        ids.cancelAdditive,
        ids.simplifyDifference
      ]),
      operationLineage(contract, 1, [
        ids.divide,
        ids.cancelMultiplicative
      ])
    ])
  };
  return Object.freeze({
    status: "compiled" as const,
    compilation: Object.freeze(compilation),
    diagnostics: [] as const
  });
}

interface GeneratedSolveIds {
  readonly initial: string;
  readonly subtractIntroduced: string;
  readonly additiveCancelled: string;
  readonly afterSubtract: string;
  readonly divideIntroduced: string;
  readonly solved: string;
  readonly subtract: string;
  readonly cancelAdditive: string;
  readonly simplifyDifference: string;
  readonly divide: string;
  readonly cancelMultiplicative: string;
  readonly sequence: string;
}

function generatedSolveIds(namespace: string): GeneratedSolveIds {
  return {
    initial: `equation.${namespace}.initial`,
    subtractIntroduced: `equation.${namespace}.subtract-introduced`,
    additiveCancelled: `equation.${namespace}.additive-cancelled`,
    afterSubtract: `equation.${namespace}.after-subtract`,
    divideIntroduced: `equation.${namespace}.divide-introduced`,
    solved: `equation.${namespace}.solved`,
    subtract: `transform.${namespace}.subtract-both-sides`,
    cancelAdditive: `transform.${namespace}.cancel-additive-inverses`,
    simplifyDifference: `transform.${namespace}.simplify-difference`,
    divide: `transform.${namespace}.divide-both-sides`,
    cancelMultiplicative:
      `transform.${namespace}.cancel-multiplicative-inverses`,
    sequence: `diagram.${namespace}.sequence`
  };
}

function exactTwoStepSolve(
  contract: KpVerifiedLinearProblemAnimationBridgeContract
): ExactTwoStepSolve | string {
  const [initial, afterSubtract, solved] = contract.trace.frames;
  if (initial === undefined || afterSubtract === undefined || solved === undefined) {
    return "The first generated exemplar requires exactly three verified equation frames.";
  }
  const coefficient = positiveInteger(initial.equation.left.coefficient);
  const addend = positiveInteger(initial.equation.left.constant);
  const rightConstant = positiveInteger(initial.equation.right.constant);
  const difference = positiveInteger(afterSubtract.equation.right.constant);
  if (
    coefficient === undefined || coefficient <= 1n ||
    addend === undefined || rightConstant === undefined ||
    difference === undefined
  ) {
    return "The first generated exemplar supports positive integer ax + b = c with a > 1 and c - b > 0.";
  }
  if (
    !isZero(initial.equation.right.coefficient) ||
    !sameVariable(initial.equation, afterSubtract.equation) ||
    !sameVariable(afterSubtract.equation, solved.equation) ||
    !sameRational(initial.equation.left.coefficient, afterSubtract.equation.left.coefficient) ||
    !isZero(afterSubtract.equation.left.constant) ||
    !isZero(afterSubtract.equation.right.coefficient) ||
    rightConstant - addend !== difference ||
    !isOne(solved.equation.left.coefficient) ||
    !isZero(solved.equation.left.constant) ||
    !isZero(solved.equation.right.coefficient) ||
    !sameRational(solved.equation.right.constant, contract.trace.solution)
  ) {
    return "Verified frames do not match the supported subtract-then-divide linear solve shape.";
  }
  return {
    initial,
    afterSubtract,
    solved,
    coefficient,
    addend,
    rightConstant,
    difference,
    solution: contract.trace.solution
  };
}

function createEquationObjects(
  contract: KpVerifiedLinearProblemAnimationBridgeContract,
  solve: ExactTwoStepSolve,
  ids: GeneratedSolveIds
): readonly KpSemanticAssetObject[] {
  const coefficient = String(solve.coefficient);
  const addend = String(solve.addend);
  const right = String(solve.rightConstant);
  const difference = String(solve.difference);
  const variable = solve.initial.equation.left.variable;
  const firstOperation = contract.operationBindings[0]!;
  const secondOperation = contract.operationBindings[1]!;
  const source = (
    frame: KpLinearEquationFrame,
    extra: Readonly<Record<string, KpAssetMetadataValue>> = {}
  ) => ({
    sourceTraceId: contract.trace.id,
    sourceTraceFrameId: frame.id,
    sourceEquationSemanticId: frame.semanticIds.equation,
    generatedProblemInstanceId: contract.identity.instanceId,
    providerVerified: true,
    ...extra
  });

  return [
    equationState({
      id: ids.initial,
      title: "Verified initial equation",
      latex: equationLatex(solve.initial.equation),
      parts: [
        part("lhs.coefficient", "term", coefficient, "coefficient"),
        part("lhs.variable", "term", variable, "variable"),
        part("lhs.addend", "term", `+${addend}`, "addend"),
        part("equals", "relation", "=", "relation"),
        part("rhs.value", "term", right, "constant")
      ],
      provenance: {
        kind: "imported",
        sourceIds: [
          contract.trace.id,
          solve.initial.id,
          solve.initial.semanticIds.equation
        ],
        portId: bridgePortId
      },
      metadata: source(solve.initial)
    }),
    equationState({
      id: ids.subtractIntroduced,
      title: "Subtract the addend from both sides",
      latex: `${coefficient}${variable}+${addend}-${addend}=${right}-${addend}`,
      parts: [
        part("lhs.coefficient", "term", coefficient, "coefficient"),
        part("lhs.variable", "term", variable, "variable"),
        part("lhs.addend", "term", `+${addend}`, "addend"),
        part("lhs.subtract", "term", `-${addend}`, "inverse-term"),
        part("equals", "relation", "=", "relation"),
        part("rhs.value", "term", right, "constant", {
          successorContribution: "material-input",
          successorRole: "minuend",
          successorRank: 0
        }),
        part("rhs.minus", "operator", "-", "operator", {
          successorContribution: "catalyst",
          successorRole: "subtraction-operator",
          successorRank: 0
        }),
        part("rhs.subtrahend", "term", addend, "inverse-term", {
          successorContribution: "material-input",
          successorRole: "subtrahend",
          successorRank: 1
        })
      ],
      provenance: transformed(ids.initial, ids.subtract, firstOperation),
      metadata: operationMetadata(contract, 0)
    }),
    equationState({
      id: ids.additiveCancelled,
      title: "Cancel the additive inverses",
      latex: `${coefficient}${variable}=${right}-${addend}`,
      parts: [
        part("lhs.coefficient", "term", coefficient, "coefficient"),
        part("lhs.variable", "term", variable, "variable"),
        part("equals", "relation", "=", "relation"),
        part("rhs.value", "term", right, "constant", {
          successorContribution: "material-input",
          successorRole: "minuend",
          successorRank: 0
        }),
        part("rhs.minus", "operator", "-", "operator", {
          successorContribution: "catalyst",
          successorRole: "subtraction-operator",
          successorRank: 0
        }),
        part("rhs.subtrahend", "term", addend, "inverse-term", {
          successorContribution: "material-input",
          successorRole: "subtrahend",
          successorRank: 1
        })
      ],
      provenance: transformed(
        ids.subtractIntroduced,
        ids.cancelAdditive,
        firstOperation
      ),
      metadata: operationMetadata(contract, 0)
    }),
    equationState({
      id: ids.afterSubtract,
      title: "Verified subtraction checkpoint",
      latex: equationLatex(solve.afterSubtract.equation),
      parts: [
        part("lhs.coefficient", "term", coefficient, "coefficient"),
        part("lhs.variable", "term", variable, "variable"),
        part("equals", "relation", "=", "relation"),
        part("rhs.constant", "term", difference, "constant", {
          successorTarget: true,
          successorRole: "evaluated-difference",
          successorRank: 0
        })
      ],
      provenance: {
        kind: "transformed",
        sourceIds: [
          ids.additiveCancelled,
          contract.trace.id,
          solve.afterSubtract.id,
          solve.afterSubtract.semanticIds.equation,
          firstOperation.sourceOperationId
        ],
        transformationId: ids.simplifyDifference,
        portId: bridgePortId
      },
      metadata: source(
        solve.afterSubtract,
        operationMetadata(contract, 0)
      )
    }),
    equationState({
      id: ids.divideIntroduced,
      title: "Divide both sides by the coefficient",
      latex:
        `\\frac{${coefficient}${variable}}{${coefficient}}=` +
        `\\frac{${difference}}{${coefficient}}`,
      parts: [
        part("lhs.coefficient", "term", coefficient, "coefficient"),
        part("lhs.variable", "term", variable, "variable"),
        part("lhs.rule", "artifact", "fraction rule", "fraction-rule"),
        part("lhs.divide", "term", coefficient, "divisor"),
        part("equals", "relation", "=", "relation"),
        part("rhs.constant", "term", difference, "constant", {
          successorContribution: "material-input",
          successorRole: "dividend",
          successorRank: 0
        }),
        part("rhs.rule", "artifact", "fraction rule", "fraction-rule", {
          successorContribution: "catalyst",
          successorRole: "division-operator",
          successorRank: 0
        }),
        part("rhs.divisor", "term", coefficient, "divisor", {
          successorContribution: "material-input",
          successorRole: "divisor",
          successorRank: 1
        })
      ],
      provenance: transformed(ids.afterSubtract, ids.divide, secondOperation),
      metadata: operationMetadata(contract, 1)
    }),
    equationState({
      id: ids.solved,
      title: "Verified solution checkpoint",
      latex: equationLatex(solve.solved.equation),
      parts: [
        part("lhs.variable", "term", variable, "variable"),
        part("equals", "relation", "=", "relation"),
        part("rhs.constant", "term", solve.solution.numerator, "constant"),
        ...(solve.solution.denominator === "1"
          ? []
          : [
              part("rhs.rule", "artifact", "fraction rule", "fraction-rule"),
              part(
                "rhs.divisor",
                "term",
                solve.solution.denominator,
                "divisor"
              )
            ])
      ],
      provenance: {
        kind: "transformed",
        sourceIds: [
          ids.divideIntroduced,
          contract.trace.id,
          solve.solved.id,
          solve.solved.semanticIds.equation,
          secondOperation.sourceOperationId
        ],
        transformationId: ids.cancelMultiplicative,
        portId: bridgePortId
      },
      metadata: source(solve.solved, operationMetadata(contract, 1))
    })
  ];
}

function createTransformations(
  _contract: KpVerifiedLinearProblemAnimationBridgeContract,
  _solve: ExactTwoStepSolve,
  ids: GeneratedSolveIds
): readonly KpSemanticTransformation[] {
  const transform = (input: Parameters<
    typeof createGeneratedAlgebraSemanticTransformation
  >[0]) => createGeneratedAlgebraSemanticTransformation(input);
  return [
    transform({
      familyId: "generated.linear-solve",
      id: ids.subtract,
      transformType: "subtractBothSides",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.subtractIntroduced],
      correspondence: identities(ids.initial, ids.subtractIntroduced, [
        "lhs.coefficient",
        "lhs.variable",
        "lhs.addend",
        "equals",
        "rhs.value"
      ]),
      correspondenceMap: map(ids.subtract, [
        ...identityRecords(ids.initial, ids.subtractIntroduced, [
          "lhs.coefficient",
          "lhs.variable",
          "lhs.addend",
          "equals",
          "rhs.value"
        ]),
        relation(
          "balanced-inverses-enter",
          "introduction",
          [],
          selectors(
            ids.subtractIntroduced,
            "lhs.subtract",
            "rhs.minus",
            "rhs.subtrahend"
          ),
          "Equal inverse terms enter on both sides."
        )
      ])
    }),
    transform({
      familyId: "generated.linear-solve",
      id: ids.cancelAdditive,
      transformType: "cancelAdditiveInverses",
      sourceObjectIds: [ids.subtractIntroduced],
      targetObjectIds: [ids.additiveCancelled],
      correspondence: identities(
        ids.subtractIntroduced,
        ids.additiveCancelled,
        [
          "lhs.coefficient",
          "lhs.variable",
          "equals",
          "rhs.value",
          "rhs.minus",
          "rhs.subtrahend"
        ]
      )
    }),
    transform({
      familyId: "generated.linear-solve",
      id: ids.simplifyDifference,
      transformType: "simplifyConstantDifference",
      sourceObjectIds: [ids.additiveCancelled],
      targetObjectIds: [ids.afterSubtract],
      correspondence: identities(
        ids.additiveCancelled,
        ids.afterSubtract,
        ["lhs.coefficient", "lhs.variable", "equals"]
      ),
      correspondenceMap: map(ids.simplifyDifference, [
        ...identityRecords(ids.additiveCancelled, ids.afterSubtract, [
          "lhs.coefficient",
          "lhs.variable",
          "equals"
        ]),
        relation(
          "difference-evaluates",
          "fan-in",
          selectors(
            ids.additiveCancelled,
            "rhs.value",
            "rhs.minus",
            "rhs.subtrahend"
          ),
          selectors(ids.afterSubtract, "rhs.constant"),
          "The exact constant difference derives the verified checkpoint."
        )
      ])
    }),
    transform({
      familyId: "generated.linear-solve",
      id: ids.divide,
      transformType: "divideBothSides",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.divideIntroduced],
      correspondence: [
        identity(
          ids.afterSubtract,
          "lhs.coefficient",
          ids.divideIntroduced,
          "lhs.coefficient"
        ),
        identity(
          ids.afterSubtract,
          "lhs.variable",
          ids.divideIntroduced,
          "lhs.variable"
        ),
        identity(ids.afterSubtract, "equals", ids.divideIntroduced, "equals"),
        identity(
          ids.afterSubtract,
          "rhs.constant",
          ids.divideIntroduced,
          "rhs.constant"
        )
      ],
      correspondenceMap: map(ids.divide, [
        identityRecord(
          "coefficient-enters-numerator",
          ids.afterSubtract,
          "lhs.coefficient",
          ids.divideIntroduced,
          "lhs.coefficient"
        ),
        identityRecord(
          "variable-enters-numerator",
          ids.afterSubtract,
          "lhs.variable",
          ids.divideIntroduced,
          "lhs.variable"
        ),
        identityRecord(
          "relation-persists",
          ids.afterSubtract,
          "equals",
          ids.divideIntroduced,
          "equals"
        ),
        identityRecord(
          "constant-enters-numerator",
          ids.afterSubtract,
          "rhs.constant",
          ids.divideIntroduced,
          "rhs.constant"
        ),
        relation(
          "matched-divisors-enter",
          "introduction",
          [],
          selectors(ids.divideIntroduced, "lhs.divide", "rhs.divisor"),
          "The same non-zero divisor enters beneath both sides."
        ),
        relation(
          "fraction-rules-enter",
          "introduction",
          [],
          selectors(ids.divideIntroduced, "lhs.rule", "rhs.rule"),
          "Fraction rules expose the whole-side quotients."
        )
      ])
    }),
    transform({
      familyId: "generated.linear-solve",
      id: ids.cancelMultiplicative,
      transformType: "cancelMultiplicativeInverses",
      sourceObjectIds: [ids.divideIntroduced],
      targetObjectIds: [ids.solved],
      correspondence: [
        identity(
          ids.divideIntroduced,
          "lhs.variable",
          ids.solved,
          "lhs.variable"
        ),
        identity(ids.divideIntroduced, "equals", ids.solved, "equals"),
        identity(
          ids.divideIntroduced,
          "rhs.constant",
          ids.solved,
          "rhs.constant"
        ),
        ...(_solve.solution.denominator === "1"
          ? []
          : [
              identity(
                ids.divideIntroduced,
                "rhs.rule",
                ids.solved,
                "rhs.rule"
              ),
              identity(
                ids.divideIntroduced,
                "rhs.divisor",
                ids.solved,
                "rhs.divisor"
              )
            ])
      ]
    })
  ];
}

interface EquationPart {
  readonly path: string;
  readonly kind: KpAssetSelector["kind"];
  readonly label: string;
  readonly structureRole: string;
  readonly metadata?:
    Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

function part(
  path: string,
  kind: KpAssetSelector["kind"],
  label: string,
  structureRole: string,
  metadata?: Readonly<Record<string, KpAssetMetadataValue>>
): EquationPart {
  return {
    path,
    kind,
    label,
    structureRole,
    ...(metadata === undefined ? {} : { metadata })
  };
}

function equationState(input: {
  readonly id: string;
  readonly title: string;
  readonly latex: string;
  readonly parts: readonly EquationPart[];
  readonly provenance: NonNullable<KpSemanticAssetObject["provenance"]>;
  readonly metadata: Readonly<Record<string, KpAssetMetadataValue>>;
}): KpSemanticAssetObject {
  return createKpSemanticAssetObject({
    id: input.id,
    objectType: "equation",
    title: input.title,
    value: { latex: input.latex },
    selectors: input.parts.map((value) => ({
      id: `${input.id}.${value.path}`,
      kind: value.kind,
      label: value.label,
      metadata: {
        equationStructureRole: value.structureRole,
        ...(value.metadata ?? {})
      }
    })),
    provenance: input.provenance,
    metadata: input.metadata
  });
}

function transformed(
  sourceObjectId: string,
  transformationId: string,
  operation: KpVerifiedLinearProblemAnimationBridgeContract[
    "operationBindings"
  ][number]
): NonNullable<KpSemanticAssetObject["provenance"]> {
  return {
    kind: "transformed",
    sourceIds: [
      sourceObjectId,
      operation.sourceOperationId,
      operation.sourceSemanticId
    ],
    transformationId,
    portId: bridgePortId
  };
}

function operationMetadata(
  contract: KpVerifiedLinearProblemAnimationBridgeContract,
  index: number
): Readonly<Record<string, KpAssetMetadataValue>> {
  const operation = contract.operationBindings[index]!;
  return {
    generatedProblemInstanceId: contract.identity.instanceId,
    sourceTraceId: contract.trace.id,
    sourceTraceOperationId: operation.sourceOperationId,
    sourceOperationSemanticId: operation.sourceSemanticId,
    providerVerified: true
  };
}

function map(
  transformationId: string,
  records: readonly SelectorCorrespondenceRecord[]
) {
  return {
    id: `correspondence.${transformationId}`,
    records
  };
}

function identities(
  sourceObjectId: string,
  targetObjectId: string,
  paths: readonly string[]
) {
  return paths.map((path) =>
    identity(sourceObjectId, path, targetObjectId, path)
  );
}

function identity(
  sourceObjectId: string,
  sourcePath: string,
  targetObjectId: string,
  targetPath: string
) {
  return {
    sourceSelectorId: `${sourceObjectId}.${sourcePath}`,
    targetSelectorId: `${targetObjectId}.${targetPath}`,
    preserves: ["identity" as const, "role" as const]
  };
}

function identityRecords(
  sourceObjectId: string,
  targetObjectId: string,
  paths: readonly string[]
): readonly SelectorCorrespondenceRecord[] {
  return paths.map((path) => identityRecord(
    `${path.replaceAll(".", "-")}-persists`,
    sourceObjectId,
    path,
    targetObjectId,
    path
  ));
}

function identityRecord(
  id: string,
  sourceObjectId: string,
  sourcePath: string,
  targetObjectId: string,
  targetPath: string
): SelectorCorrespondenceRecord {
  return relation(
    id,
    "identity",
    selectors(sourceObjectId, sourcePath),
    selectors(targetObjectId, targetPath),
    `${sourcePath} preserves semantic identity.`
  );
}

function relation(
  id: string,
  relationValue: SelectorCorrespondenceRecord["relation"],
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
): SelectorCorrespondenceRecord {
  return {
    id,
    relation: relationValue,
    sourceSelectorIds,
    targetSelectorIds,
    summary
  };
}

function selectors(objectId: string, ...paths: readonly string[]): string[] {
  return paths.map((path) => `${objectId}.${path}`);
}

function focus(id: string, targetNodeId: string, selectorIds: readonly string[]) {
  return {
    id,
    kind: "focus" as const,
    targetNodeId,
    placement: "during" as const,
    selectorIds
  };
}

function pause(id: string, targetNodeId: string, summary: string) {
  return {
    id,
    kind: "pause" as const,
    targetNodeId,
    placement: "after" as const,
    durationBeats: 1,
    summary
  };
}

function frameLineage(
  frame: KpLinearEquationFrame,
  objectId: string
): KpVerifiedLinearProblemFrameLineage {
  return Object.freeze({
    sourceFrameId: frame.id,
    sourceEquationSemanticId: frame.semanticIds.equation,
    objectId
  });
}

function operationLineage(
  contract: KpVerifiedLinearProblemAnimationBridgeContract,
  index: number,
  transformationIds: readonly string[]
): KpVerifiedLinearProblemOperationLineage {
  const operation = contract.operationBindings[index]!;
  return Object.freeze({
    sourceOperationId: operation.sourceOperationId,
    sourceOperationSemanticId: operation.sourceSemanticId,
    transformationIds: Object.freeze([...transformationIds])
  });
}

function equationLatex(equation: KpLinearEquation): string {
  const coefficient = equation.left.coefficient;
  const constant = equation.left.constant;
  const variable = equation.left.variable;
  const variableTerm = isOne(coefficient)
    ? variable
    : isNegativeOne(coefficient)
      ? `-${variable}`
      : `${rationalLatex(coefficient)}${variable}`;
  const constantTerm = isZero(constant)
    ? ""
    : BigInt(constant.numerator) > 0n
      ? `+${rationalLatex(constant)}`
      : `-${rationalLatex({
          numerator: String(-BigInt(constant.numerator)),
          denominator: constant.denominator
        })}`;
  return `${variableTerm}${constantTerm}=${rationalLatex(equation.right.constant)}`;
}

function rationalLatex(value: KpExactRational): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function positiveInteger(value: KpExactRational): bigint | undefined {
  if (value.denominator !== "1") return undefined;
  const parsed = BigInt(value.numerator);
  return parsed > 0n ? parsed : undefined;
}

function isZero(value: KpExactRational): boolean {
  return value.numerator === "0";
}

function isOne(value: KpExactRational): boolean {
  return value.numerator === "1" && value.denominator === "1";
}

function isNegativeOne(value: KpExactRational): boolean {
  return value.numerator === "-1" && value.denominator === "1";
}

function sameVariable(left: KpLinearEquation, right: KpLinearEquation): boolean {
  return left.left.variable === left.right.variable &&
    left.left.variable === right.left.variable &&
    right.left.variable === right.right.variable;
}

function sameRational(left: KpExactRational, right: KpExactRational): boolean {
  return left.numerator === right.numerator &&
    left.denominator === right.denominator;
}

function rejected(
  code: KpVerifiedLinearProblemAnimationCompileDiagnostic["code"],
  path: string,
  message: string
): KpVerifiedLinearProblemAnimationCompileResult {
  return Object.freeze({
    status: "rejected" as const,
    diagnostics: Object.freeze([
      Object.freeze({ severity: "error" as const, code, path, message })
    ])
  });
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}
