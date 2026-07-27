import {
  createKpFoldableDistributionExpressionChain
} from "./foldable-distribution-expression-chain.ts";
import {
  createKpSemanticTransformation
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
