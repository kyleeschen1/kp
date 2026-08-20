import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexConformanceShapeDescriptor,
  createKpNativeKatexConformanceShapeRegistry
} from "./support/native-katex-compositor-conformance-schema.ts";

function digitShape() {
  return createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.digit",
    label: "digit",
    representativeLatex: "2",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  });
}

test("creates a strict test-only atomic shape descriptor and registry", () => {
  const descriptor = digitShape();
  const registry = createKpNativeKatexConformanceShapeRegistry([descriptor]);

  assert.equal(descriptor.schemaVersion, "kp.native-katex-conformance-shape.v1");
  assert.equal(registry.byId.get(descriptor.id), descriptor);
  assert.deepEqual(registry.descriptors, [descriptor]);
  assert.ok(Object.isFrozen(descriptor));
  assert.ok(Object.isFrozen(registry.descriptors));
});

test("rejects measurement contracts that contradict the shape class", () => {
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.invalid-baseline",
    label: "invalid atomic glyph",
    representativeLatex: "x",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "not-applicable",
    riskTags: ["glyph"]
  }), /requires a baseline/u);
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.rule.invalid-baseline",
    label: "invalid rule",
    representativeLatex: "\\frac{1}{2}",
    shapeClass: "rule",
    paintClass: "rule",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["rule"]
  }), /cannot claim a text baseline/u);
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.multirow.invalid-owner",
    label: "invalid matrix",
    representativeLatex: "\\begin{matrix}1&2\\\\3&4\\end{matrix}",
    shapeClass: "multirow-compound",
    paintClass: "subtree",
    ownershipGrain: "leaf",
    baseline: "not-applicable",
    riskTags: ["multirow"]
  }), /compound ownership/u);
});

test("rejects blank fixture data and duplicate shape IDs", () => {
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.blank",
    label: " ",
    representativeLatex: "2",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph"]
  }), /label must be non-empty/u);
  const descriptor = digitShape();
  assert.throws(() => createKpNativeKatexConformanceShapeRegistry([
    descriptor,
    descriptor
  ]), /shape IDs must be unique/u);
  assert.throws(
    () => createKpNativeKatexConformanceShapeRegistry([]),
    /at least one shape/u
  );
});

test("requires structural risk tags and stores them in canonical order", () => {
  const descriptor = createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.italic",
    label: "italic variable",
    representativeLatex: "x",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["font-style", "glyph"]
  });

  assert.deepEqual(descriptor.riskTags, ["glyph", "font-style"]);
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.missing-risk",
    label: "missing structural risk",
    representativeLatex: "x",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["font-style"]
  }), /requires the glyph risk tag/u);
  assert.throws(() => createKpNativeKatexConformanceShapeDescriptor({
    id: "shape.atomic.duplicate-risk",
    label: "duplicate risk",
    representativeLatex: "x",
    shapeClass: "atomic-glyph",
    paintClass: "atomic-text",
    ownershipGrain: "leaf",
    baseline: "required",
    riskTags: ["glyph", "glyph"]
  }), /risk tags must be unique/u);
});
