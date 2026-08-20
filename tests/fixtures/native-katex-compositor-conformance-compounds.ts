import {
  kpNativeKatexCompositorConformanceBudget
} from "../support/native-katex-compositor-conformance-budget.ts";
import {
  createKpNativeKatexConformanceCoverageManifest
} from "../support/native-katex-compositor-conformance-manifest.ts";
import {
  planKpNativeKatexPairwiseCoverage,
  type KpConformanceCoverageFactor
} from "../support/native-katex-compositor-pairwise-coverage.ts";
import {
  kpNativeKatexContextMutations
} from "./native-katex-compositor-conformance-context-mutations.ts";
import {
  kpNativeKatexCompoundConformanceShapes
} from "./native-katex-compositor-conformance-shapes.ts";

export const kpNativeKatexNestedCompoundRiskFixture = Object.freeze({
  kind: "native-katex-conformance-compound-risk-fixture" as const,
  id: "compound.fixture.nested-three-way" as const,
  latex: [
    "\\begin{cases}\\left(\\frac{x^{2}}{1+y}\\right),&x>0",
    "\\sum_{i=1}^{n}x_i,&x\\leq0\\end{cases}"
  ].join("\\\\"),
  requiredRiskInteraction: Object.freeze([
    "vertical-list",
    "delimiter",
    "multirow"
  ] as const),
  paintClass: "subtree" as const,
  ownershipGrain: "compound" as const
});

const compoundPromotionFactors = Object.freeze([
  {
    id: "compoundCase",
    values: [
      ...kpNativeKatexCompoundConformanceShapes.map(({ id }) => id),
      kpNativeKatexNestedCompoundRiskFixture.id
    ]
  },
  {
    id: "contextMutation",
    values: kpNativeKatexContextMutations.map(({ id }) => id)
  },
  {
    id: "topology",
    values: ["compound-owner", "persistent-leaves", "many-to-one"]
  },
  {
    id: "lifecycle",
    values: ["forward", "direct-seek", "reverse"]
  },
  {
    id: "renderingMode",
    values: ["dark", "light"]
  }
] satisfies readonly KpConformanceCoverageFactor[]);

const nestedThreeWayOverride = Object.freeze({
  id: "risk.nested-vertical-delimiter-multirow",
  riskFactorIds: ["compoundCase", "contextMutation", "topology"] as const,
  assignments: Object.freeze({
    compoundCase: kpNativeKatexNestedCompoundRiskFixture.id,
    contextMutation: "context.sibling.taller",
    topology: "compound-owner",
    lifecycle: "reverse",
    renderingMode: "dark"
  })
});

export const kpNativeKatexCompoundPromotionPlan =
  planKpNativeKatexPairwiseCoverage({
    factors: compoundPromotionFactors,
    overrides: [nestedThreeWayOverride],
    maximumScenarios: kpNativeKatexCompositorConformanceBudget.hard
      .promotionMaximumScenarios
  });

export const kpNativeKatexCompoundPromotionManifest =
  createKpNativeKatexConformanceCoverageManifest(
    kpNativeKatexCompoundPromotionPlan
  );
