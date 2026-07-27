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
