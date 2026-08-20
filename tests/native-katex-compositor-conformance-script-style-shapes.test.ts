import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexAtomicConformanceShapes,
  kpNativeKatexConformanceShapeRegistry,
  kpNativeKatexScriptStyleConformanceShapes
} from "./fixtures/native-katex-compositor-conformance-shapes.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

const expectedScriptStyleShapes = Object.freeze([
  ["shape.script.superscript-two", "x^{2}"],
  ["shape.script.subscript-i", "x_{i}"],
  ["shape.style.roman-x", "\\mathrm{x}"],
  ["shape.style.bold-x", "\\mathbf{x}"],
  ["shape.style.calligraphic-f", "\\mathcal{F}"],
  ["shape.style.monospace-x", "\\mathtt{x}"]
] as const);

test("adds a bounded script and font-style cohort to the shared registry", () => {
  assert.deepEqual(
    kpNativeKatexScriptStyleConformanceShapes.map(
      ({ id, representativeLatex }) => [id, representativeLatex]
    ),
    expectedScriptStyleShapes
  );
  assert.ok(
    kpNativeKatexConformanceShapeRegistry.descriptors.length >=
    kpNativeKatexAtomicConformanceShapes.length +
      expectedScriptStyleShapes.length
  );
  assert.ok(
    kpNativeKatexConformanceShapeRegistry.descriptors.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .fastCanaryMaximumScenarios
  );
});

test("classifies script position separately from font realization", () => {
  const scripts = kpNativeKatexScriptStyleConformanceShapes.slice(0, 2);
  const styles = kpNativeKatexScriptStyleConformanceShapes.slice(2);

  for (const descriptor of scripts) {
    assert.equal(descriptor.shapeClass, "script");
    assert.equal(descriptor.paintClass, "atomic-text");
    assert.equal(descriptor.ownershipGrain, "leaf");
    assert.equal(descriptor.baseline, "required");
    assert.deepEqual(descriptor.riskTags, ["glyph", "script"]);
  }
  for (const descriptor of styles) {
    assert.equal(descriptor.shapeClass, "atomic-glyph");
    assert.equal(descriptor.paintClass, "atomic-text");
    assert.equal(descriptor.ownershipGrain, "leaf");
    assert.equal(descriptor.baseline, "required");
    assert.deepEqual(descriptor.riskTags, ["glyph", "font-style"]);
  }
});

test("preserves atomic identity and renders every new representative", () => {
  for (const descriptor of kpNativeKatexAtomicConformanceShapes) {
    assert.equal(
      kpNativeKatexConformanceShapeRegistry.byId.get(descriptor.id),
      descriptor
    );
  }
  for (const descriptor of kpNativeKatexScriptStyleConformanceShapes) {
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
