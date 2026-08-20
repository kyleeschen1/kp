import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexCompoundPromotionManifest,
  kpNativeKatexCompoundPromotionPlan,
  kpNativeKatexNestedCompoundRiskFixture
} from "./fixtures/native-katex-compositor-conformance-compounds.ts";
import {
  kpNativeKatexCompoundConformanceShapes,
  kpNativeKatexConformanceShapeRegistry
} from "./fixtures/native-katex-compositor-conformance-shapes.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

test("fills the bounded registry with large-operator and alignment compounds", () => {
  assert.deepEqual(
    kpNativeKatexCompoundConformanceShapes.map(
      ({ id, representativeLatex }) => [id, representativeLatex]
    ),
    [
      ["shape.compound.large-operator", "\\sum_{i=1}^{n}x_i"],
      [
        "shape.compound.cases",
        "\\begin{cases}x,&x>0\\\\-x,&x\\leq0\\end{cases}"
      ],
      [
        "shape.compound.aligned",
        "\\begin{aligned}x&=1\\\\y&=2\\end{aligned}"
      ]
    ]
  );
  assert.equal(
    kpNativeKatexConformanceShapeRegistry.descriptors.length,
    kpNativeKatexCompositorConformanceBudget.hard
      .fastCanaryMaximumScenarios
  );

  for (const descriptor of kpNativeKatexCompoundConformanceShapes) {
    assert.equal(descriptor.paintClass, "subtree");
    assert.equal(descriptor.ownershipGrain, "compound");
    assert.equal(
      kpNativeKatexConformanceShapeRegistry.byId.get(descriptor.id),
      descriptor
    );
    assert.doesNotThrow(() => katex.renderToString(
      descriptor.representativeLatex,
      { throwOnError: true }
    ));
  }
});

test("names one nested three-way structural risk without choreography", () => {
  assert.deepEqual(kpNativeKatexNestedCompoundRiskFixture, {
    kind: "native-katex-conformance-compound-risk-fixture",
    id: "compound.fixture.nested-three-way",
    latex: [
      "\\begin{cases}\\left(\\frac{x^{2}}{1+y}\\right),&x>0",
      "\\sum_{i=1}^{n}x_i,&x\\leq0\\end{cases}"
    ].join("\\\\"),
    requiredRiskInteraction: ["vertical-list", "delimiter", "multirow"],
    paintClass: "subtree",
    ownershipGrain: "compound"
  });
  assert.doesNotThrow(() => katex.renderToString(
    kpNativeKatexNestedCompoundRiskFixture.latex,
    { throwOnError: true }
  ));
  assert.ok(!("timing" in kpNativeKatexNestedCompoundRiskFixture));
  assert.ok(!("choreography" in kpNativeKatexNestedCompoundRiskFixture));
});

test("routes compound risks through the bounded promotion plan", () => {
  assert.equal(kpNativeKatexCompoundPromotionManifest.coverageComplete, true);
  assert.ok(
    kpNativeKatexCompoundPromotionPlan.scenarios.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .promotionMaximumScenarios
  );

  const selectedCases = new Set(
    kpNativeKatexCompoundPromotionPlan.scenarios.map(
      ({ assignments }) => assignments["compoundCase"]
    )
  );
  assert.deepEqual([...selectedCases].sort(), [
    ...kpNativeKatexCompoundConformanceShapes.map(({ id }) => id),
    kpNativeKatexNestedCompoundRiskFixture.id
  ].sort());

  const nestedScenario = kpNativeKatexCompoundPromotionManifest.scenarios
    .find(({ overrideIds }) =>
      overrideIds.includes("risk.nested-vertical-delimiter-multirow")
    );
  assert.ok(nestedScenario);
  assert.equal(nestedScenario.inclusionKind, "three-way-override");
  assert.equal(
    nestedScenario.assignments["compoundCase"],
    kpNativeKatexNestedCompoundRiskFixture.id
  );
});
