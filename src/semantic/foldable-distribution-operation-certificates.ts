import {
  createKpFoldableDistributionExpressionChain
} from "./foldable-distribution-expression-chain.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  executeKpDistributionCanonicalOperation
} from "./distribution-canonical-operation.ts";
import {
  createKpStructuredExpression,
  resolveKpStructuredExpressionSubtree,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";
import {
  bindKpStructuredExpressionRoles
} from "./structured-expression-role-binding.ts";
import {
  kpDistributionRewriteRoleIds as roles,
  kpDistributionRewriteRoleSpecs,
  verifyKpDistributionRewrite,
  type KpVerifiedStructuredExpressionRewrite
} from "./structured-expression-rewrite.ts";
import type {
  KpCanonicalOperationExecutionResult
} from "./transformation-definition-binding.ts";

export interface KpFoldableDistributionFanOutCertificate {
  readonly id: string;
  readonly branch: "left" | "right";
  readonly sourceExpression: KpStructuredExpression;
  readonly distributedExpression: KpStructuredExpression;
  readonly rewrite: KpVerifiedStructuredExpressionRewrite;
  readonly execution: KpCanonicalOperationExecutionResult;
}

export interface KpFoldableProductEvaluationCertificate {
  readonly schemaVersion: "kp.foldable-product-evaluation-certificate.v1";
  readonly id: string;
  readonly authority: {
    readonly operationId: "kp.algebra.simplify-constant-product";
    readonly strictLawId: "law.arithmetic.constant-product";
  };
  readonly inputSubtreeIds: readonly [string, string];
  readonly inputValues: readonly [number, number];
  readonly operatorSelectorId: string;
  readonly targetSubtreeId: string;
  readonly targetValue: number;
  readonly transformation: KpSemanticTransformation;
  readonly presentation: {
    readonly requiredMotif: "successor-synthesis";
    readonly materialPolicy: "inputs-opaque-through-target-recognition";
    readonly settlement: "exact-native-target";
    readonly geometryAuthority: "renderer-session-measurement";
  };
}

export interface KpFoldableSignedTermGroupingCertificate {
  readonly schemaVersion: "kp.foldable-signed-term-grouping-certificate.v1";
  readonly id: string;
  readonly canonicalOperationIds: readonly [
    "kp.core.reorder",
    "kp.core.group"
  ];
  readonly sourceTermIds: readonly string[];
  readonly targetTermIds: readonly string[];
  readonly sourceToTarget: Readonly<Record<string, string>>;
  readonly groups: readonly [
    {
      readonly id: "group.foldable-distribution.coefficients";
      readonly kind: "coefficient-terms";
      readonly memberIds: readonly [string, string];
    },
    {
      readonly id: "group.foldable-distribution.constants";
      readonly kind: "signed-constants";
      readonly memberIds: readonly [string, string];
    }
  ];
  readonly transformation: KpSemanticTransformation;
  readonly presentation: {
    readonly requiredMotif: "semantic-reorder-and-group";
    readonly termPaintPolicy: "opaque-identity-through-reflow";
    readonly groupingPolicy: "establish-after-reflow";
    readonly geometryAuthority: "reader-layout";
  };
}

export interface KpFoldableFinalCollectionCertificate {
  readonly schemaVersion: "kp.foldable-final-collection-certificate.v1";
  readonly id: string;
  readonly canonicalOperationIds: readonly ["kp.core.merge"];
  readonly arithmetic: readonly [
    {
      readonly id: "collection.foldable-distribution.coefficient";
      readonly inputValues: readonly [3, 2];
      readonly targetValue: 5;
    },
    {
      readonly id: "collection.foldable-distribution.constant";
      readonly inputValues: readonly [6, -2];
      readonly targetValue: 4;
    }
  ];
  readonly transformation: KpSemanticTransformation;
  readonly presentation: {
    readonly requiredMotif: "merge-fan-in";
    readonly fusionPaintPolicy: "opaque-many-to-one";
    readonly settlement: "exact-native-target";
    readonly geometryAuthority: "renderer-session-measurement";
  };
}

export function createKpFoldableDistributionFanOutCertificates():
  readonly KpFoldableDistributionFanOutCertificate[] {
  const factored = createKpFoldableDistributionExpressionChain()[0]!.expression;
  return Object.freeze([
    certifyBranch({
      branch: "left",
      sourceExpression: expressionFromSubtree(
        factored,
        "factored.left-product"
      ),
      source: {
        root: "factored.left-product",
        factor: "factored.left-factor",
        groupedSum: "factored.left-group",
        addends: ["factored.left-x", "factored.left-constant"]
      },
      targetExpression: leftDistributedExpression(),
      target: {
        root: "distribution.left.raw",
        terms: [
          "distribution.left.term-x",
          "distribution.left.term-constant"
        ],
        factors: [
          "distribution.left.factor-3-x",
          "distribution.left.factor-3-constant"
        ],
        addends: [
          "distribution.left.x",
          "distribution.left.constant-2"
        ]
      }
    }),
    certifyBranch({
      branch: "right",
      sourceExpression: expressionFromSubtree(
        factored,
        "factored.right-product"
      ),
      source: {
        root: "factored.right-product",
        factor: "factored.right-factor",
        groupedSum: "factored.right-group",
        addends: ["factored.right-x", "factored.right-negative-one"]
      },
      targetExpression: rightDistributedExpression(),
      target: {
        root: "distribution.right.raw",
        terms: [
          "distribution.right.term-x",
          "distribution.right.term-constant"
        ],
        factors: [
          "distribution.right.factor-2-x",
          "distribution.right.factor-2-constant"
        ],
        addends: [
          "distribution.right.x",
          "distribution.right.negative-one"
        ]
      }
    })
  ]);
}

export function createKpFoldableProductEvaluationCertificates():
  readonly KpFoldableProductEvaluationCertificate[] {
  const fanOut = createKpFoldableDistributionFanOutCertificates();
  const distributed = createKpFoldableDistributionExpressionChain()[1]!.expression;
  return Object.freeze([
    certifyProduct({
      id: "certificate.foldable-distribution.product.three-times-two",
      sourceExpression: fanOut[0]!.distributedExpression,
      inputSubtreeIds: [
        "distribution.left.factor-3-constant",
        "distribution.left.constant-2"
      ],
      inputValues: [3, 2],
      operatorSelectorId:
        "expression.foldable-distribution.distributed.operator.three-times-two",
      targetExpression: distributed,
      targetSubtreeId: "distributed.constant-6",
      targetValue: 6
    }),
    certifyProduct({
      id: "certificate.foldable-distribution.product.two-times-negative-one",
      sourceExpression: fanOut[1]!.distributedExpression,
      inputSubtreeIds: [
        "distribution.right.factor-2-constant",
        "distribution.right.negative-one"
      ],
      inputValues: [2, -1],
      operatorSelectorId:
        "expression.foldable-distribution.distributed.operator.two-times-negative-one",
      targetExpression: distributed,
      targetSubtreeId: "distributed.negative-2",
      targetValue: -2
    })
  ]);
}

export function createKpFoldableSignedTermGroupingCertificate():
  KpFoldableSignedTermGroupingCertificate {
  const chain = createKpFoldableDistributionExpressionChain();
  const source = chain[1]!.expression;
  const target = chain[2]!.expression;
  const mappings = Object.freeze([
    Object.freeze({
      sourceId: "distributed.term-3x",
      targetId: "grouped.term-3x"
    }),
    Object.freeze({
      sourceId: "distributed.term-2x",
      targetId: "grouped.term-2x"
    }),
    Object.freeze({
      sourceId: "distributed.constant-6",
      targetId: "grouped.constant-6"
    }),
    Object.freeze({
      sourceId: "distributed.negative-2",
      targetId: "grouped.negative-2"
    })
  ]);
  mappings.forEach(({ sourceId, targetId }) => {
    const sourceNode = requiredSubtree(source, sourceId);
    const targetNode = requiredSubtree(target, targetId);
    if (semanticFingerprint(sourceNode) !== semanticFingerprint(targetNode)) {
      throw new Error(
        `Signed-term grouping changes ${sourceId} while mapping it to ${targetId}.`
      );
    }
  });

  const sourceTermIds = Object.freeze([
    "distributed.term-3x",
    "distributed.constant-6",
    "distributed.term-2x",
    "distributed.negative-2"
  ]);
  const targetTermIds = Object.freeze([
    "grouped.term-3x",
    "grouped.term-2x",
    "grouped.constant-6",
    "grouped.negative-2"
  ]);
  if (
    new Set(mappings.map(({ sourceId }) => sourceId)).size !==
      sourceTermIds.length ||
    new Set(mappings.map(({ targetId }) => targetId)).size !==
      targetTermIds.length
  ) {
    throw new Error("Signed-term grouping requires total one-to-one term identity.");
  }

  const id = "certificate.foldable-distribution.signed-term-grouping";
  const transformation = createKpSemanticTransformation({
    id: "transform.foldable-distribution.group-like-terms",
    transformType: "groupLikeTerms",
    title: "Gather coefficient terms and signed constants",
    sourceObjectIds: ["expression.foldable-distribution.distributed"],
    targetObjectIds: ["expression.foldable-distribution.grouped"],
    preserves: ["identity", "value", "structure"],
    correspondenceMap: {
      id: `${id}.correspondence`,
      records: [
        ...mappings.map(({ sourceId, targetId }) => ({
          id: `${id}.${sourceId}.to.${targetId}`,
          relation: "identity" as const,
          sourceSelectorIds: [sourceId],
          targetSelectorIds: [targetId],
          summary: "The signed term persists while its group position changes."
        })),
        {
          id: `${id}.grouping-enters`,
          relation: "introduction" as const,
          sourceSelectorIds: [],
          targetSelectorIds: [
            "grouped.coefficients.left-parenthesis",
            "grouped.coefficients.right-parenthesis",
            "grouped.constants.left-parenthesis",
            "grouped.constants.right-parenthesis"
          ],
          summary: "Grouping structure enters after persistent terms reflow."
        }
      ]
    }
  });
  const groups: KpFoldableSignedTermGroupingCertificate["groups"] =
    Object.freeze([
      Object.freeze({
        id: "group.foldable-distribution.coefficients" as const,
        kind: "coefficient-terms" as const,
        memberIds: Object.freeze([
          "grouped.term-3x",
          "grouped.term-2x"
        ]) as readonly [string, string]
      }),
      Object.freeze({
        id: "group.foldable-distribution.constants" as const,
        kind: "signed-constants" as const,
        memberIds: Object.freeze([
          "grouped.constant-6",
          "grouped.negative-2"
        ]) as readonly [string, string]
      })
    ]);

  return Object.freeze({
    schemaVersion: "kp.foldable-signed-term-grouping-certificate.v1" as const,
    id,
    canonicalOperationIds: Object.freeze([
      "kp.core.reorder",
      "kp.core.group"
    ]) as readonly ["kp.core.reorder", "kp.core.group"],
    sourceTermIds,
    targetTermIds,
    sourceToTarget: Object.freeze(Object.fromEntries(
      mappings.map(({ sourceId, targetId }) => [sourceId, targetId])
    )),
    groups,
    transformation,
    presentation: Object.freeze({
      requiredMotif: "semantic-reorder-and-group" as const,
      termPaintPolicy: "opaque-identity-through-reflow" as const,
      groupingPolicy: "establish-after-reflow" as const,
      geometryAuthority: "reader-layout" as const
    })
  });
}

export function createKpFoldableFinalCollectionCertificate():
  KpFoldableFinalCollectionCertificate {
  const chain = createKpFoldableDistributionExpressionChain();
  const grouped = chain[2]!.expression;
  const collected = chain[3]!.expression;
  const coefficientInputs = [
    evaluateConstantSubtree(
      requiredSubtree(grouped, "grouped.coefficient-3")
    ),
    evaluateConstantSubtree(
      requiredSubtree(grouped, "grouped.coefficient-2")
    )
  ] as const;
  const constantInputs = [
    evaluateConstantSubtree(
      requiredSubtree(grouped, "grouped.constant-6")
    ),
    evaluateConstantSubtree(
      requiredSubtree(grouped, "grouped.negative-2")
    )
  ] as const;
  const coefficientTarget = evaluateConstantSubtree(
    requiredSubtree(collected, "collected.coefficient-5")
  );
  const constantTarget = evaluateConstantSubtree(
    requiredSubtree(collected, "collected.constant-4")
  );
  if (
    coefficientInputs[0] + coefficientInputs[1] !== coefficientTarget ||
    constantInputs[0] + constantInputs[1] !== constantTarget
  ) {
    throw new Error("Final collection does not certify exact signed addition.");
  }

  const id = "certificate.foldable-distribution.final-collection";
  const transformation = createKpSemanticTransformation({
    id: "transform.foldable-distribution.collect-results",
    transformType: "collectLikeTerms",
    title: "Collect coefficient terms and signed constants",
    sourceObjectIds: ["expression.foldable-distribution.grouped"],
    targetObjectIds: ["expression.foldable-distribution.collected"],
    preserves: ["value", "structure"],
    correspondenceMap: {
      id: `${id}.correspondence`,
      records: [
        {
          id: `${id}.coefficients-merge`,
          relation: "fan-in",
          sourceSelectorIds: [
            "grouped.coefficient-3",
            "grouped.coefficient-2"
          ],
          targetSelectorIds: ["collected.coefficient-5"],
          summary: "Three and two coalesce into coefficient five."
        },
        {
          id: `${id}.variables-merge`,
          relation: "fan-in",
          sourceSelectorIds: [
            "grouped.x-from-left",
            "grouped.x-from-right"
          ],
          targetSelectorIds: ["collected.x"],
          summary: "Both like-term variable roles coalesce into the result term."
        },
        {
          id: `${id}.constants-merge`,
          relation: "fan-in",
          sourceSelectorIds: [
            "grouped.constant-6",
            "grouped.negative-2"
          ],
          targetSelectorIds: ["collected.constant-4"],
          summary: "Six and signed negative two coalesce into four."
        },
        {
          id: `${id}.outer-plus-persists`,
          relation: "identity",
          sourceSelectorIds: ["grouped.outer-plus"],
          targetSelectorIds: ["collected.plus"],
          summary: "Addition persists between the collected result terms."
        },
        {
          id: `${id}.grouping-retires`,
          relation: "removal",
          sourceSelectorIds: [
            "grouped.coefficients.left-parenthesis",
            "grouped.coefficients.right-parenthesis",
            "grouped.constants.left-parenthesis",
            "grouped.constants.right-parenthesis",
            "grouped.coefficients.plus",
            "grouped.constants.minus"
          ],
          targetSelectorIds: [],
          summary: "Grouping and internal operators retire after fusion settles."
        }
      ]
    }
  });
  const arithmetic: KpFoldableFinalCollectionCertificate["arithmetic"] =
    Object.freeze([
      Object.freeze({
        id: "collection.foldable-distribution.coefficient" as const,
        inputValues: Object.freeze([3, 2]) as readonly [3, 2],
        targetValue: 5 as const
      }),
      Object.freeze({
        id: "collection.foldable-distribution.constant" as const,
        inputValues: Object.freeze([6, -2]) as readonly [6, -2],
        targetValue: 4 as const
      })
    ]);

  return Object.freeze({
    schemaVersion: "kp.foldable-final-collection-certificate.v1" as const,
    id,
    canonicalOperationIds: Object.freeze([
      "kp.core.merge"
    ]) as readonly ["kp.core.merge"],
    arithmetic,
    transformation,
    presentation: Object.freeze({
      requiredMotif: "merge-fan-in" as const,
      fusionPaintPolicy: "opaque-many-to-one" as const,
      settlement: "exact-native-target" as const,
      geometryAuthority: "renderer-session-measurement" as const
    })
  });
}

interface CertifyBranchInput {
  readonly branch: "left" | "right";
  readonly sourceExpression: KpStructuredExpression;
  readonly source: {
    readonly root: string;
    readonly factor: string;
    readonly groupedSum: string;
    readonly addends: readonly [string, string];
  };
  readonly targetExpression: KpStructuredExpression;
  readonly target: {
    readonly root: string;
    readonly terms: readonly [string, string];
    readonly factors: readonly [string, string];
    readonly addends: readonly [string, string];
  };
}

function certifyBranch(
  input: CertifyBranchInput
): KpFoldableDistributionFanOutCertificate {
  const id = `certificate.foldable-distribution.${input.branch}.fan-out`;
  const bindings = bindKpStructuredExpressionRoles({
    contractId: `${id}.structured-rewrite`,
    expressions: {
      source: input.sourceExpression,
      target: input.targetExpression
    },
    roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [roles.sourceRoot]: input.source.root,
      [roles.commonFactor]: input.source.factor,
      [roles.sourceGroupedSum]: input.source.groupedSum,
      [roles.sourceAddends]: input.source.addends,
      [roles.targetRoot]: input.target.root,
      [roles.distributedTerms]: input.target.terms,
      [roles.factorCopies]: input.target.factors,
      [roles.distributedAddends]: input.target.addends
    }
  });
  const rewrite = verifyKpDistributionRewrite(bindings);
  if (!rewrite.ok) {
    throw new Error(
      `${id} failed exact distribution verification: ` +
      rewrite.diagnostics.map(({ message }) => message).join(" ")
    );
  }

  const sourceObjectId =
    `expression.foldable-distribution.${input.branch}.factored`;
  const targetObjectId =
    `expression.foldable-distribution.${input.branch}.distributed-raw`;
  const transformation = createKpSemanticTransformation({
    id: `transform.foldable-distribution.${input.branch}.fan-out`,
    transformType: "distributeMultiplication",
    title: `Distribute the ${input.branch} factor`,
    sourceObjectIds: [sourceObjectId],
    targetObjectIds: [targetObjectId],
    preserves: ["identity", "value", "structure"]
  });
  const execution = executeKpDistributionCanonicalOperation({
    transformation,
    roleBindings: {
      "common-factor": input.source.factor,
      "source-addends": input.source.addends,
      "source-connectors": [
        `${sourceObjectId}.connector`
      ],
      "grouping-artifacts": [
        `${sourceObjectId}.left-parenthesis`,
        `${sourceObjectId}.right-parenthesis`
      ],
      "factor-copies": input.target.factors,
      "distributed-addends": input.target.addends,
      "target-connectors": [
        `${targetObjectId}.connector`
      ]
    }
  });

  return Object.freeze({
    id,
    branch: input.branch,
    sourceExpression: input.sourceExpression,
    distributedExpression: input.targetExpression,
    rewrite: rewrite.verification,
    execution
  });
}

function certifyProduct(input: {
  readonly id: string;
  readonly sourceExpression: KpStructuredExpression;
  readonly inputSubtreeIds: readonly [string, string];
  readonly inputValues: readonly [number, number];
  readonly operatorSelectorId: string;
  readonly targetExpression: KpStructuredExpression;
  readonly targetSubtreeId: string;
  readonly targetValue: number;
}): KpFoldableProductEvaluationCertificate {
  const observedInputs = input.inputSubtreeIds.map((subtreeId) =>
    evaluateConstantSubtree(
      requiredSubtree(input.sourceExpression, subtreeId)
    )
  ) as [number, number];
  const observedTarget = evaluateConstantSubtree(
    requiredSubtree(input.targetExpression, input.targetSubtreeId)
  );
  if (
    observedInputs[0] !== input.inputValues[0] ||
    observedInputs[1] !== input.inputValues[1]
  ) {
    throw new Error(
      `${input.id} input values ${observedInputs.join(" × ")} do not match ` +
      `${input.inputValues.join(" × ")}.`
    );
  }
  if (
    observedInputs[0] * observedInputs[1] !== input.targetValue ||
    observedTarget !== input.targetValue
  ) {
    throw new Error(
      `${input.id} does not certify ${observedInputs.join(" × ")} = ` +
      `${input.targetValue}.`
    );
  }

  const transformation = createKpSemanticTransformation({
    id: input.id.replace("certificate.", "transform."),
    transformType: "simplifyConstantProduct",
    title: `Evaluate ${input.inputValues[0]} times ${input.inputValues[1]}`,
    sourceObjectIds: ["expression.foldable-distribution.distributed-raw"],
    targetObjectIds: ["expression.foldable-distribution.distributed"],
    preserves: ["value", "structure"],
    correspondenceMap: {
      id: `${input.id}.correspondence`,
      records: [
        {
          id: `${input.id}.inputs-derive-result`,
          relation: "fan-in",
          sourceSelectorIds: input.inputSubtreeIds,
          targetSelectorIds: [input.targetSubtreeId],
          summary:
            "Both exact factors causally derive one evaluated product."
        },
        {
          id: `${input.id}.operator-retires`,
          relation: "removal",
          sourceSelectorIds: [input.operatorSelectorId],
          targetSelectorIds: [],
          summary:
            "The multiplication operator is a catalyst, not result material."
        }
      ]
    }
  });

  return Object.freeze({
    schemaVersion: "kp.foldable-product-evaluation-certificate.v1" as const,
    id: input.id,
    authority: Object.freeze({
      operationId: "kp.algebra.simplify-constant-product" as const,
      strictLawId: "law.arithmetic.constant-product" as const
    }),
    inputSubtreeIds: Object.freeze([...input.inputSubtreeIds]) as
      readonly [string, string],
    inputValues: Object.freeze([...input.inputValues]) as
      readonly [number, number],
    operatorSelectorId: input.operatorSelectorId,
    targetSubtreeId: input.targetSubtreeId,
    targetValue: input.targetValue,
    transformation,
    presentation: Object.freeze({
      requiredMotif: "successor-synthesis" as const,
      materialPolicy:
        "inputs-opaque-through-target-recognition" as const,
      settlement: "exact-native-target" as const,
      geometryAuthority: "renderer-session-measurement" as const
    })
  });
}

function expressionFromSubtree(
  expression: KpStructuredExpression,
  subtreeId: string
): KpStructuredExpression {
  const root = resolveKpStructuredExpressionSubtree(expression, subtreeId);
  if (root === undefined) {
    throw new Error(`Missing foldable distribution subtree ${subtreeId}.`);
  }
  return createKpStructuredExpression({ root });
}

function requiredSubtree(
  expression: KpStructuredExpression,
  subtreeId: string
): KpStructuredExpressionNode {
  const subtree = resolveKpStructuredExpressionSubtree(expression, subtreeId);
  if (subtree === undefined) {
    throw new Error(`Missing foldable distribution subtree ${subtreeId}.`);
  }
  return subtree;
}

function evaluateConstantSubtree(node: KpStructuredExpressionNode): number {
  switch (node.kind) {
    case "number":
      return node.value;
    case "negate":
      return -evaluateConstantSubtree(node.value);
    case "sum":
      return node.terms
        .map(evaluateConstantSubtree)
        .reduce((sum, value) => sum + value, 0);
    case "product":
      return node.factors
        .map(evaluateConstantSubtree)
        .reduce((product, value) => product * value, 1);
    case "quotient":
      return evaluateConstantSubtree(node.numerator) /
        evaluateConstantSubtree(node.denominator);
    case "power":
      return evaluateConstantSubtree(node.base) **
        evaluateConstantSubtree(node.exponent);
    case "symbol":
      throw new Error(`Subtree ${node.id} contains symbol ${node.name}.`);
  }
}

function semanticFingerprint(node: KpStructuredExpressionNode): string {
  switch (node.kind) {
    case "number":
      return `number:${node.value}`;
    case "symbol":
      return `symbol:${node.name}`;
    case "negate":
      return `negate(${semanticFingerprint(node.value)})`;
    case "sum":
      return `sum(${node.terms.map(semanticFingerprint).join(",")})`;
    case "product":
      return `product(${node.factors.map(semanticFingerprint).join(",")})`;
    case "quotient":
      return `quotient(${semanticFingerprint(node.numerator)},` +
        `${semanticFingerprint(node.denominator)})`;
    case "power":
      return `power(${semanticFingerprint(node.base)},` +
        `${semanticFingerprint(node.exponent)})`;
  }
}

function leftDistributedExpression(): KpStructuredExpression {
  return createKpStructuredExpression({
    root: sum(
      "distribution.left.raw",
      product(
        "distribution.left.term-x",
        number("distribution.left.factor-3-x", 3),
        symbol("distribution.left.x", "x")
      ),
      product(
        "distribution.left.term-constant",
        number("distribution.left.factor-3-constant", 3),
        number("distribution.left.constant-2", 2)
      )
    )
  });
}

function rightDistributedExpression(): KpStructuredExpression {
  return createKpStructuredExpression({
    root: sum(
      "distribution.right.raw",
      product(
        "distribution.right.term-x",
        number("distribution.right.factor-2-x", 2),
        symbol("distribution.right.x", "x")
      ),
      product(
        "distribution.right.term-constant",
        number("distribution.right.factor-2-constant", 2),
        negate(
          "distribution.right.negative-one",
          number("distribution.right.one", 1)
        )
      )
    )
  });
}

function number(id: string, value: number): KpStructuredExpressionNode {
  return { id, kind: "number", value };
}

function symbol(id: string, name: string): KpStructuredExpressionNode {
  return { id, kind: "symbol", name };
}

function sum(
  id: string,
  ...terms: readonly KpStructuredExpressionNode[]
): KpStructuredExpressionNode {
  return { id, kind: "sum", terms };
}

function product(
  id: string,
  ...factors: readonly KpStructuredExpressionNode[]
): KpStructuredExpressionNode {
  return { id, kind: "product", factors };
}

function negate(
  id: string,
  value: KpStructuredExpressionNode
): KpStructuredExpressionNode {
  return { id, kind: "negate", value };
}
