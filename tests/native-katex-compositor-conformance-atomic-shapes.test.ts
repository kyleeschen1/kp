import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexAtomicConformanceRegistry,
  kpNativeKatexAtomicConformanceShapes
} from "./fixtures/native-katex-compositor-conformance-shapes.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

const expectedAtomicShapes = Object.freeze([
  ["shape.digit-two", "2"],
  ["shape.italic-x", "x"],
  ["shape.descender-g", "g"],
  ["shape.greek-lambda", "\\lambda"],
  ["shape.operator-plus", "+"],
  ["shape.relation-equals", "="],
  ["shape.punctuation-comma", ","]
] as const);

test("registers one bounded representative for every atomic glyph family", () => {
  assert.deepEqual(
    kpNativeKatexAtomicConformanceShapes.map(({ id, representativeLatex }) =>
      [id, representativeLatex]),
    expectedAtomicShapes
  );
  assert.ok(
    kpNativeKatexAtomicConformanceShapes.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .fastCanaryMaximumScenarios
  );
  assert.equal(
    kpNativeKatexAtomicConformanceRegistry.descriptors.length,
    expectedAtomicShapes.length
  );
});

test("keeps the atomic promotion cohort leaf-owned and baseline-measured", () => {
  for (const descriptor of kpNativeKatexAtomicConformanceShapes) {
    assert.equal(descriptor.shapeClass, "atomic-glyph");
    assert.equal(descriptor.paintClass, "atomic-text");
    assert.equal(descriptor.ownershipGrain, "leaf");
    assert.equal(descriptor.baseline, "required");
    assert.ok(descriptor.riskTags.includes("glyph"));
    assert.equal(
      kpNativeKatexAtomicConformanceRegistry.byId.get(descriptor.id),
      descriptor
    );
  }
  assert.deepEqual(
    kpNativeKatexAtomicConformanceRegistry.byId
      .get("shape.italic-x")?.riskTags,
    ["glyph", "font-style"]
  );
  assert.deepEqual(
    kpNativeKatexAtomicConformanceRegistry.byId
      .get("shape.descender-g")?.riskTags,
    ["glyph", "font-style"]
  );
  assert.deepEqual(
    kpNativeKatexAtomicConformanceRegistry.byId
      .get("shape.greek-lambda")?.riskTags,
    ["glyph", "font-style"]
  );
});

test("renders every atomic representative through the installed KaTeX parser", () => {
  for (const descriptor of kpNativeKatexAtomicConformanceShapes) {
    assert.doesNotThrow(() => katex.renderToString(
      descriptor.representativeLatex,
      { throwOnError: true }
    ));
  }
});
