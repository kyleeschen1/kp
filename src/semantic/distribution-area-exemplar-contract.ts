import { bindKpStructuredExpressionRoles } from "./structured-expression-role-binding.ts";
import {
  compileKpStructuredExpressionNormalForm,
  createKpStructuredExpressionNormalFormIntent
} from "./structured-expression-normal-form.ts";
import {
  kpDistributionRewriteRoleIds,
  kpDistributionRewriteRoleSpecs
} from "./structured-expression-rewrite.ts";
import { createKpStructuredExpression } from "./structured-expression.ts";

const dimensions = Object.freeze({
  height: Object.freeze({ id: "factor.3", latex: "3" }),
  widths: Object.freeze([
    Object.freeze({ id: "term.x", latex: "x" }),
    Object.freeze({ id: "term.2", latex: "2" })
  ])
});

const regions = Object.freeze([
  Object.freeze({ id: "region.3x", heightId: "factor.3", widthId: "term.x", areaLatex: "3x" }),
  Object.freeze({ id: "region.6", heightId: "factor.3", widthId: "term.2", areaLatex: "6" })
]);

const factoredExpression = createKpStructuredExpression({
  root: {
    id: "distribution.factored.root",
    kind: "product",
    factors: [
      { id: "distribution.factored.factor.3", kind: "number", value: 3 },
      {
        id: "distribution.factored.grouped-sum",
        kind: "sum",
        terms: [
          { id: "distribution.factored.addend.x", kind: "symbol", name: "x" },
          { id: "distribution.factored.addend.2", kind: "number", value: 2 }
        ]
      }
    ]
  }
});

const distributedExpression = createKpStructuredExpression({
  root: {
    id: "distribution.distributed.root",
    kind: "sum",
    terms: [
      {
        id: "distribution.distributed.term.x",
        kind: "product",
        factors: [
          { id: "distribution.distributed.factor.3.x", kind: "number", value: 3 },
          { id: "distribution.distributed.addend.x", kind: "symbol", name: "x" }
        ]
      },
      {
        id: "distribution.distributed.term.2",
        kind: "product",
        factors: [
          { id: "distribution.distributed.factor.3.2", kind: "number", value: 3 },
          { id: "distribution.distributed.addend.2", kind: "number", value: 2 }
        ]
      }
    ]
  }
});

const expandedExpression = createKpStructuredExpression({
  root: {
    id: "distribution.expanded.root",
    kind: "sum",
    terms: [
      {
        id: "distribution.expanded.term.x",
        kind: "product",
        factors: [
          { id: "distribution.expanded.factor.3.x", kind: "number", value: 3 },
          { id: "distribution.expanded.addend.x", kind: "symbol", name: "x" }
        ]
      },
      { id: "distribution.expanded.product.6", kind: "number", value: 6 }
    ]
  }
});

const distributionBindings = bindKpStructuredExpressionRoles({
  contractId: "exemplar.distribution-area.3-times-x-plus-2.rewrite",
  expressions: { source: factoredExpression, target: distributedExpression },
  roles: kpDistributionRewriteRoleSpecs,
  bindings: {
    [kpDistributionRewriteRoleIds.sourceRoot]: factoredExpression.root.id,
    [kpDistributionRewriteRoleIds.commonFactor]: "distribution.factored.factor.3",
    [kpDistributionRewriteRoleIds.sourceGroupedSum]: "distribution.factored.grouped-sum",
    [kpDistributionRewriteRoleIds.sourceAddends]: [
      "distribution.factored.addend.x",
      "distribution.factored.addend.2"
    ],
    [kpDistributionRewriteRoleIds.targetRoot]: distributedExpression.root.id,
    [kpDistributionRewriteRoleIds.distributedTerms]: [
      "distribution.distributed.term.x",
      "distribution.distributed.term.2"
    ],
    [kpDistributionRewriteRoleIds.factorCopies]: [
      "distribution.distributed.factor.3.x",
      "distribution.distributed.factor.3.2"
    ],
    [kpDistributionRewriteRoleIds.distributedAddends]: [
      "distribution.distributed.addend.x",
      "distribution.distributed.addend.2"
    ]
  }
});

const distributionNormalFormIntent = createKpStructuredExpressionNormalFormIntent({
  id: "exemplar.distribution-area.3-times-x-plus-2.normal-form.distributed-sum",
  targetForm: "distributed-sum",
  rewriteLawId: "kp.algebra.distribute.v1",
  sourceRootId: factoredExpression.root.id,
  targetRootId: distributedExpression.root.id,
  requiredSourceSubtreeIds: [
    "distribution.factored.factor.3",
    "distribution.factored.addend.x",
    "distribution.factored.addend.2"
  ]
});

const compiledNormalForm = compileKpStructuredExpressionNormalForm({
  intent: distributionNormalFormIntent,
  bindings: distributionBindings
});
if (!compiledNormalForm.ok) {
  throw new Error(
    `Distribution area exemplar has an invalid structured rewrite: ${compiledNormalForm.diagnostics
      .map(({ path, message }) => `${path}: ${message}`)
      .join("\n")}`
  );
}

/** The first area model is an exemplar contract, not a promoted family API. */
export const kpDistributionAreaExemplarContract = Object.freeze({
  id: "exemplar.distribution-area.3-times-x-plus-2",
  algebra: Object.freeze({
    expressions: Object.freeze({
      factored: factoredExpression,
      distributed: distributedExpression,
      expanded: expandedExpression
    }),
    distributionBindings,
    distributionNormalFormIntent,
    distributionNormalFormPlan: compiledNormalForm.plan,
    forwardOperationId: "kp.algebra.distribute-multiplication",
    reverseOperationId: "kp.algebra.factor-common-term"
  }),
  geometry: Object.freeze({
    kind: "partitioned-rectangle" as const,
    dimensions,
    regions
  }),
  surfaces: Object.freeze(["katex-algebra", "svg-area"] as const),
  promotion: Object.freeze({
    scope: "exact-exemplar-only" as const,
    requiresHumanVisualApproval: true
  })
});
