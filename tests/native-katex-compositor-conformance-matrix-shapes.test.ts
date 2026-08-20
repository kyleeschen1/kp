import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexMatrixConformanceFixtures
} from "./fixtures/native-katex-compositor-conformance-matrices.ts";
import {
  kpNativeKatexConformanceShapeRegistry,
  kpNativeKatexMatrixConformanceShapes
} from "./fixtures/native-katex-compositor-conformance-shapes.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

test("adds exactly two diagnostic matrix shape representatives", () => {
  assert.deepEqual(
    kpNativeKatexMatrixConformanceShapes.map(
      ({ id, representativeLatex }) => [id, representativeLatex]
    ),
    [
      [
        "shape.matrix.whole-2x2",
        "\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}"
      ],
      [
        "shape.matrix.heterogeneous-2x2",
        "\\begin{pmatrix}x&\\frac{1}{2}\\\\g&y^{2}\\end{pmatrix}"
      ]
    ]
  );
  assert.ok(
    kpNativeKatexConformanceShapeRegistry.descriptors.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .fastCanaryMaximumScenarios
  );

  for (const descriptor of kpNativeKatexMatrixConformanceShapes) {
    assert.equal(descriptor.shapeClass, "multirow-compound");
    assert.equal(descriptor.paintClass, "subtree");
    assert.equal(descriptor.ownershipGrain, "compound");
    assert.equal(descriptor.baseline, "required");
    assert.equal(
      kpNativeKatexConformanceShapeRegistry.byId.get(descriptor.id),
      descriptor
    );
    assert.doesNotThrow(() => katex.renderToString(
      descriptor.representativeLatex,
      { throwOnError: true }
    ));
  }
  assert.deepEqual(kpNativeKatexMatrixConformanceShapes[0]?.riskTags, [
    "vertical-list",
    "delimiter",
    "multirow"
  ]);
  assert.deepEqual(kpNativeKatexMatrixConformanceShapes[1]?.riskTags, [
    "glyph",
    "rule",
    "script",
    "vertical-list",
    "delimiter",
    "multirow",
    "font-style"
  ]);
});

test("separates whole-compound ownership from persistent cell identity", () => {
  const [whole, heterogeneous] = kpNativeKatexMatrixConformanceFixtures;

  assert.equal(whole?.ownershipMode, "compound-owner");
  assert.deepEqual(whole?.cells, []);
  assert.equal(heterogeneous?.ownershipMode, "persistent-cells");
  assert.deepEqual(heterogeneous?.cells, [
    {
      semanticObjectId: "matrix.cell.variable-x",
      row: 0,
      column: 0,
      latex: "x",
      shapeId: "shape.italic-x"
    },
    {
      semanticObjectId: "matrix.cell.fraction-half",
      row: 0,
      column: 1,
      latex: "\\frac{1}{2}",
      shapeId: "shape.structure.fraction"
    },
    {
      semanticObjectId: "matrix.cell.descender-g",
      row: 1,
      column: 0,
      latex: "g",
      shapeId: "shape.descender-g"
    },
    {
      semanticObjectId: "matrix.cell.script-y-two",
      row: 1,
      column: 1,
      latex: "y^{2}",
      shapeId: "shape.script.superscript-two"
    }
  ]);

  const semanticIds = heterogeneous?.cells.map(({ semanticObjectId }) =>
    semanticObjectId
  ) ?? [];
  const coordinates = heterogeneous?.cells.map(({ row, column }) =>
    `${row}:${column}`
  ) ?? [];
  assert.equal(new Set(semanticIds).size, semanticIds.length);
  assert.equal(new Set(coordinates).size, coordinates.length);
  for (const cell of heterogeneous?.cells ?? []) {
    assert.ok(kpNativeKatexConformanceShapeRegistry.byId.has(cell.shapeId));
    assert.doesNotThrow(() => katex.renderToString(cell.latex, {
      throwOnError: true
    }));
  }
});

test("keeps matrix fixtures diagnostic rather than pedagogical", () => {
  for (const fixture of kpNativeKatexMatrixConformanceFixtures) {
    assert.deepEqual(
      Object.keys(fixture).sort(),
      ["cells", "id", "kind", "latex", "ownershipMode", "shapeId"]
    );
    assert.ok(!("timing" in fixture));
    assert.ok(!("choreography" in fixture));
    assert.ok(!("narration" in fixture));
  }
});
