import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import {
  compileKpStructuredExpressionNormalForm,
  createKpStructuredExpressionNormalFormIntent,
  type KpCompiledStructuredExpressionNormalForm
} from "./structured-expression-normal-form.ts";
import {
  kpDistributionRewriteRoleIds,
  kpDistributionRewriteRoleSpecs
} from "./structured-expression-rewrite.ts";
import {
  createKpStructuredExpression,
  resolveKpStructuredExpressionSubtree,
  type KpStructuredExpression,
  type KpStructuredExpressionNode
} from "./structured-expression.ts";

const verifiedOpaqueFractionDistributionAuthority = Symbol(
  "kp.verified-opaque-fraction-distribution"
);

export interface KpVerifiedOpaqueFractionDistribution {
  readonly schemaVersion: "kp.verified-opaque-fraction-distribution.v1";
  readonly lawId: "kp.algebra.distribute.v1";
  readonly sourceRootId: string;
  readonly targetRootId: string;
  readonly commonFactorId: string;
  readonly copiedFactorIds: readonly [string, string];
  readonly denominatorIds: readonly [string, string, string];
  readonly denominatorValue: number;
  // Only the semantic verifier may mint this proof; paint code must not infer algebra from glyphs.
  readonly [verifiedOpaqueFractionDistributionAuthority]: true;
}

export interface KpOpaqueFractionFanOutFixture {
  readonly schemaVersion: "kp.opaque-fraction-fan-out-fixture.v1";
  readonly id: "fixture.fraction-fan-out.two-thirds-x-plus-six";
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly normalFormPlan: KpCompiledStructuredExpressionNormalForm;
  readonly verification: KpVerifiedOpaqueFractionDistribution;
}

export function createKpOpaqueFractionFanOutFixture(input: {
  readonly secondCopyDenominator?: number | undefined;
} = {}): KpOpaqueFractionFanOutFixture {
  const source = createKpStructuredExpression({
    root: {
      id: "fraction-fan-out.source.root",
      kind: "product",
      factors: [
        quotient("fraction-fan-out.source.factor", 2, 3),
        {
          id: "fraction-fan-out.source.grouped-sum",
          kind: "sum",
          terms: [
            { id: "fraction-fan-out.source.addend.x", kind: "symbol", name: "x" },
            { id: "fraction-fan-out.source.addend.6", kind: "number", value: 6 }
          ]
        }
      ]
    }
  });
  const target = createKpStructuredExpression({
    root: {
      id: "fraction-fan-out.target.root",
      kind: "sum",
      terms: [
        {
          id: "fraction-fan-out.target.term.x",
          kind: "product",
          factors: [
            quotient("fraction-fan-out.target.factor.x", 2, 3),
            { id: "fraction-fan-out.target.addend.x", kind: "symbol", name: "x" }
          ]
        },
        {
          id: "fraction-fan-out.target.term.6",
          kind: "product",
          factors: [
            quotient(
              "fraction-fan-out.target.factor.6",
              2,
              input.secondCopyDenominator ?? 3
            ),
            { id: "fraction-fan-out.target.addend.6", kind: "number", value: 6 }
          ]
        }
      ]
    }
  });
  const bindings = bindKpStructuredExpressionRoles({
    contractId: "fixture.fraction-fan-out.two-thirds-x-plus-six.rewrite",
    expressions: { source, target },
    roles: kpDistributionRewriteRoleSpecs,
    bindings: {
      [kpDistributionRewriteRoleIds.sourceRoot]: source.root.id,
      [kpDistributionRewriteRoleIds.commonFactor]: "fraction-fan-out.source.factor",
      [kpDistributionRewriteRoleIds.sourceGroupedSum]: "fraction-fan-out.source.grouped-sum",
      [kpDistributionRewriteRoleIds.sourceAddends]: [
        "fraction-fan-out.source.addend.x",
        "fraction-fan-out.source.addend.6"
      ],
      [kpDistributionRewriteRoleIds.targetRoot]: target.root.id,
      [kpDistributionRewriteRoleIds.distributedTerms]: [
        "fraction-fan-out.target.term.x",
        "fraction-fan-out.target.term.6"
      ],
      [kpDistributionRewriteRoleIds.factorCopies]: [
        "fraction-fan-out.target.factor.x",
        "fraction-fan-out.target.factor.6"
      ],
      [kpDistributionRewriteRoleIds.distributedAddends]: [
        "fraction-fan-out.target.addend.x",
        "fraction-fan-out.target.addend.6"
      ]
    }
  });
  const intent = createKpStructuredExpressionNormalFormIntent({
    id: "fixture.fraction-fan-out.two-thirds-x-plus-six.distributed-sum",
    targetForm: "distributed-sum",
    rewriteLawId: "kp.algebra.distribute.v1",
    sourceRootId: source.root.id,
    targetRootId: target.root.id,
    requiredSourceSubtreeIds: [
      "fraction-fan-out.source.factor",
      "fraction-fan-out.source.addend.x",
      "fraction-fan-out.source.addend.6"
    ]
  });
  const compiled = compileKpStructuredExpressionNormalForm({ intent, bindings });
  if (!compiled.ok) {
    throw new Error(
      compiled.diagnostics.map(({ path, message }) => `${path}: ${message}`).join("\n")
    );
  }
  const verification = verifyOpaqueFractionDistribution({ source, target });
  return Object.freeze({
    schemaVersion: "kp.opaque-fraction-fan-out-fixture.v1" as const,
    id: "fixture.fraction-fan-out.two-thirds-x-plus-six" as const,
    source,
    target,
    normalFormPlan: compiled.plan,
    verification
  });
}

function verifyOpaqueFractionDistribution(input: {
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
}): KpVerifiedOpaqueFractionDistribution {
  const commonFactorId = "fraction-fan-out.source.factor";
  const copiedFactorIds = [
    "fraction-fan-out.target.factor.x",
    "fraction-fan-out.target.factor.6"
  ] as const;
  const commonFactor = requireNumericQuotient(input.source, commonFactorId);
  const copiedFactors = copiedFactorIds.map((id) => requireNumericQuotient(input.target, id));
  const denominatorValue = numberValue(commonFactor.denominator, commonFactorId);
  if (
    copiedFactors.some(
      (factor, index) =>
        numberValue(factor.numerator, copiedFactorIds[index]!) !==
          numberValue(commonFactor.numerator, commonFactorId) ||
        numberValue(factor.denominator, copiedFactorIds[index]!) !== denominatorValue
    )
  ) {
    throw new Error("Opaque fraction distribution must preserve the complete quotient");
  }
  return Object.freeze({
    schemaVersion: "kp.verified-opaque-fraction-distribution.v1" as const,
    lawId: "kp.algebra.distribute.v1" as const,
    sourceRootId: input.source.root.id,
    targetRootId: input.target.root.id,
    commonFactorId,
    copiedFactorIds,
    denominatorIds: [
      commonFactor.denominator.id,
      copiedFactors[0]!.denominator.id,
      copiedFactors[1]!.denominator.id
    ] as const,
    denominatorValue,
    [verifiedOpaqueFractionDistributionAuthority]: true as const
  });
}

function requireNumericQuotient(
  expression: KpStructuredExpression,
  id: string
): Extract<KpStructuredExpressionNode, { readonly kind: "quotient" }> {
  const node = resolveKpStructuredExpressionSubtree(expression, id);
  if (
    node?.kind !== "quotient" ||
    node.numerator.kind !== "number" ||
    node.denominator.kind !== "number"
  ) {
    throw new Error(`${id} must be a quotient with numeric numerator and denominator`);
  }
  return node;
}

function numberValue(node: KpStructuredExpressionNode, ownerId: string): number {
  if (node.kind !== "number") {
    throw new Error(`${ownerId} must contain numeric quotient parts`);
  }
  return node.value;
}

function quotient(id: string, numerator: number, denominator: number) {
  return {
    id,
    kind: "quotient" as const,
    numerator: { id: `${id}.numerator`, kind: "number" as const, value: numerator },
    denominator: { id: `${id}.denominator`, kind: "number" as const, value: denominator }
  };
}
