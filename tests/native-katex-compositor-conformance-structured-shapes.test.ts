import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexAtomicConformanceShapes,
  kpNativeKatexConformanceShapeRegistry,
  kpNativeKatexScriptStyleConformanceShapes,
  kpNativeKatexStructuredConformanceShapes
} from "./fixtures/native-katex-compositor-conformance-shapes.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

const expectedStructuredShapes = Object.freeze([
  ["shape.structure.fraction", "\\frac{1}{2}"],
  ["shape.structure.root", "\\sqrt{x}"],
  ["shape.structure.rule", "\\rule{1em}{0.04em}"],
  ["shape.structure.accent", "\\hat{x}"],
  ["shape.structure.fixed-delimiter", "(x)"],
  ["shape.structure.stretchy-delimiter", "\\left(\\frac{1}{2}\\right)"]
] as const);

test("adds a bounded structured-shape cohort to the shared registry", () => {
  assert.deepEqual(
    kpNativeKatexStructuredConformanceShapes.map(
      ({ id, representativeLatex }) => [id, representativeLatex]
    ),
    expectedStructuredShapes
  );
  assert.equal(
    kpNativeKatexConformanceShapeRegistry.descriptors.length,
    kpNativeKatexAtomicConformanceShapes.length +
      kpNativeKatexScriptStyleConformanceShapes.length +
      expectedStructuredShapes.length
  );
  assert.ok(
    kpNativeKatexConformanceShapeRegistry.descriptors.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .fastCanaryMaximumScenarios
  );
});

test("names paint and ownership risks instead of treating compounds as glyphs", () => {
  const byId = new Map(
    kpNativeKatexStructuredConformanceShapes.map((shape) => [shape.id, shape])
  );

  assert.deepEqual(byId.get("shape.structure.fraction"), {
    schemaVersion: "kp.native-katex-conformance-shape.v1",
    id: "shape.structure.fraction",
    label: "stacked fraction",
    representativeLatex: "\\frac{1}{2}",
    shapeClass: "vertical-list",
    paintClass: "subtree",
    ownershipGrain: "compound",
    baseline: "required",
    riskTags: ["rule", "vertical-list"]
  });
  assert.deepEqual(byId.get("shape.structure.rule"), {
    schemaVersion: "kp.native-katex-conformance-shape.v1",
    id: "shape.structure.rule",
    label: "standalone rule",
    representativeLatex: "\\rule{1em}{0.04em}",
    shapeClass: "rule",
    paintClass: "rule",
    ownershipGrain: "leaf",
    baseline: "not-applicable",
    riskTags: ["rule"]
  });
  assert.deepEqual(byId.get("shape.structure.fixed-delimiter")?.riskTags, [
    "delimiter"
  ]);
  assert.deepEqual(byId.get("shape.structure.stretchy-delimiter")?.riskTags, [
    "rule",
    "vertical-list",
    "delimiter"
  ]);
});

test("preserves prior identities and renders every structured representative", () => {
  for (const descriptor of [
    ...kpNativeKatexAtomicConformanceShapes,
    ...kpNativeKatexScriptStyleConformanceShapes
  ]) {
    assert.equal(
      kpNativeKatexConformanceShapeRegistry.byId.get(descriptor.id),
      descriptor
    );
  }
  for (const descriptor of kpNativeKatexStructuredConformanceShapes) {
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
