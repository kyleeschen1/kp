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
  type KpStructuredExpression
} from "./structured-expression.ts";

export interface KpOpaqueFractionFanOutFixture {
  readonly schemaVersion: "kp.opaque-fraction-fan-out-fixture.v1";
  readonly id: "fixture.fraction-fan-out.two-thirds-x-plus-six";
  readonly source: KpStructuredExpression;
  readonly target: KpStructuredExpression;
  readonly normalFormPlan: KpCompiledStructuredExpressionNormalForm;
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
  return Object.freeze({
    schemaVersion: "kp.opaque-fraction-fan-out-fixture.v1" as const,
    id: "fixture.fraction-fan-out.two-thirds-x-plus-six" as const,
    source,
    target,
    normalFormPlan: compiled.plan
  });
}

function quotient(id: string, numerator: number, denominator: number) {
  return {
    id,
    kind: "quotient" as const,
    numerator: { id: `${id}.numerator`, kind: "number" as const, value: numerator },
    denominator: { id: `${id}.denominator`, kind: "number" as const, value: denominator }
  };
}
