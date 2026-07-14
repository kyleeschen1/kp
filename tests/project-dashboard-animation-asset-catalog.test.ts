import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createAnimationAssetAgendaRows,
  createGeneratedAlgebraAnimationAssetAgendaRows,
  createGeneratedProblemRegistryAgendaRows
} from "../src/project-dashboard/generated-algebra-catalog.ts";
import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";
import { projectDashboardData } from "../src/project-dashboard/data.ts";
import { renderProjectDashboard } from "../src/project-dashboard/render.ts";

test("generated algebra dashboard catalog exposes animation asset rows", () => {
  const rows = createGeneratedAlgebraAnimationAssetAgendaRows("");

  assert.deepEqual(rows.map((row) => row.id), [
    "animation-linear-solve-solve-x",
    "animation-generated-fraction-expression-two-fourths",
    "animation-generated-exponent-square-as-product",
    "animation-generated-radical-square-root-as-power",
    "animation-generated-function-wrap-apply-f",
    "animation-generated-distribution-expand-a-sum",
    "animation-generated-distribution-factor-common-a"
  ]);
  assert.deepEqual(rows[1]?.previewFields.slice(0, 6), [
    {
      label: "Animation asset",
      value: "animation.generated.fraction-expression.two-fourths"
    },
    {
      label: "Bundle",
      value: "asset.generated.fraction-expression.two-fourths"
    },
    {
      label: "Timeline",
      value: "timeline.generated.fraction-expression.two-fourths.shared"
    },
    { label: "Beats", value: "50" },
    { label: "Duration", value: "2400ms" },
    { label: "Layout", value: "single" }
  ]);
});

test("generated algebra animation asset rows are searchable by transformation metadata", () => {
  assert.deepEqual(
    createGeneratedAlgebraAnimationAssetAgendaRows(
      "animation asset transform:wrapFunction definition.generated.function-wrap.wrap-function"
    ).map((row) => row.id),
    ["animation-generated-function-wrap-apply-f"]
  );
  assert.deepEqual(
    createGeneratedAlgebraAnimationAssetAgendaRows(
      "animation asset motif source generated.distribution.factor-common-a"
    ).map((row) => row.id),
    ["animation-generated-distribution-factor-common-a"]
  );
});

test("semantic asset dashboard catalog includes animation asset rows", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "composable animation asset generated.radical.square-root-as-power"
    ).map((row) => row.id),
    ["animation-generated-radical-square-root-as-power"]
  );
});

test("dashboard animation asset rows include cross-domain component facets", () => {
  const rows = createAnimationAssetAgendaRows("");
  const rowIds = rows.map((row) => row.id);
  const comparison = rows.find(
    (row) => row.id === "animation-comparison-linear-solve-programming"
  );

  assert.ok(rowIds.includes("animation-graph-vector-linear-map-scale"));
  assert.ok(rowIds.includes("animation-programming-add-execution-trace"));
  assert.ok(rowIds.includes("animation-comparison-linear-solve-programming"));
  assert.ok(
    comparison?.searchFields.includes(
      "component:animation.programming.add.execution-trace"
    )
  );
  assert.ok(comparison?.searchFields.includes("layout-kind:row"));
  assert.ok(comparison?.searchFields.includes("render-target-kind:programming"));
  assert.deepEqual(
    comparison?.previewFields.find(
      (field) => field.label === "Render target kinds"
    ),
    {
      label: "Render target kinds",
      value: "equation, programming"
    }
  );
  assert.deepEqual(
    comparison?.previewFields.find(
      (field) => field.label === "Runtime child frames"
    ),
    {
      label: "Runtime child frames",
      value:
        "render.comparison.linear-solve.equation:animation.linear-solve.solve-x@animation.linear-solve.solve-x.forward.1, render.comparison.programming.trace:animation.programming.add.execution-trace@animation.programming.add.execution-trace.forward.2"
    }
  );
  assert.deepEqual(
    comparison?.previewFields.find(
      (field) => field.label === "Runtime scrubber"
    ),
    {
      label: "Runtime scrubber",
      value: "beat 0-50 step 1 default 25"
    }
  );
  assert.ok(comparison?.searchFields.includes("runtime-scrubber:beat"));
  assert.ok(
    comparison?.searchFields.includes(
      "runtime-child:animation.programming.add.execution-trace"
    )
  );
});

test("dashboard animation asset rows include flashcard projection facets", () => {
  const rows = createAnimationAssetAgendaRows("");
  const linearSolve = rows.find(
    (row) => row.id === "animation-linear-solve-solve-x"
  );

  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Flashcard projections"
    ),
    {
      label: "Flashcard projections",
      value: "4"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Flashcard kinds"
    ),
    {
      label: "Flashcard kinds",
      value: "cloze, predict-next, explain-transform, focus-relationship"
    }
  );
  assert.ok(
    linearSolve?.searchFields.includes("flashcard-projection:predict-next")
  );
  assert.ok(
    linearSolve?.searchFields.includes("card.linear-solve.predict-subtract")
  );
});

test("dashboard animation asset rows include flashcard preview renderer data", () => {
  const rows = createAnimationAssetAgendaRows("");
  const linearSolve = rows.find(
    (row) => row.id === "animation-linear-solve-solve-x"
  );

  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Flashcard preview data"
    ),
    {
      label: "Flashcard preview data",
      value: "flashcard-preview.animation.linear-solve.solve-x"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Flashcard preview interactions"
    ),
    {
      label: "Flashcard preview interactions",
      value: "cloze, predict-next, review"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Flashcard renderer sample"
    ),
    {
      label: "Flashcard renderer sample",
      value: "flashcard-renderer-sample.animation.linear-solve.solve-x"
    }
  );
  assert.ok(linearSolve?.searchFields.includes("flashcard-preview-renderer"));
  assert.ok(linearSolve?.searchFields.includes("flashcard-renderer-sample"));
  assert.ok(
    linearSolve?.searchFields.includes("flashcard-preview-interaction:cloze")
  );
  assert.ok(
    linearSolve?.searchFields.includes(
      "flashcard-preview-expected:transform.linear-solve.subtract-both-sides-3"
    )
  );
});

test("dashboard animation asset rows include generated calculus and linear algebra imports", () => {
  const rows = createAnimationAssetAgendaRows("generated-problem");
  const rowIds = rows.map((row) => row.id);
  const calculus = rows.find(
    (row) =>
      row.id ===
      "animation-generated-calculus-derivative-power-rule-x-cubed"
  );
  const linearAlgebra = rows.find(
    (row) =>
      row.id ===
      "animation-generated-linear-algebra-matrix-vector-two-by-two"
  );
  const dotProduct = rows.find(
    (row) =>
      row.id ===
      "animation-generated-linear-algebra-dot-product-three-vector"
  );
  const matrixMatrix = rows.find(
    (row) =>
      row.id ===
      "animation-generated-linear-algebra-matrix-matrix-two-by-two"
  );

  assert.ok(
    rowIds.includes("animation-generated-calculus-derivative-power-rule-x-cubed")
  );
  assert.ok(
    rowIds.includes(
      "animation-generated-linear-algebra-matrix-vector-two-by-two"
    )
  );
  assert.ok(
    rowIds.includes("animation-generated-linear-algebra-dot-product-three-vector")
  );
  assert.ok(
    rowIds.includes(
      "animation-generated-linear-algebra-matrix-matrix-two-by-two"
    )
  );
  assert.deepEqual(
    calculus?.previewFields.find(
      (field) => field.label === "Flashcard projections"
    ),
    {
      label: "Flashcard projections",
      value: "3"
    }
  );
  assert.deepEqual(
    linearAlgebra?.previewFields.find(
      (field) => field.label === "Flashcard kinds"
    ),
    {
      label: "Flashcard kinds",
      value: "predict-next, cloze, explain-transform"
    }
  );
  assert.ok(
    calculus?.searchFields.includes(
      "definition.generated.calculus.derivative.power-rule"
    )
  );
  assert.ok(
    linearAlgebra?.searchFields.includes(
      "law.linear-algebra.matrix-vector-product"
    )
  );
  assert.ok(dotProduct?.searchFields.includes("law.linear-algebra.dot-product"));
  assert.ok(
    matrixMatrix?.searchFields.includes(
      "law.linear-algebra.matrix-matrix-product"
    )
  );
});

test("dashboard animation asset rows include KaTeX runtime visual preview facets", () => {
  const rows = createAnimationAssetAgendaRows("");
  const linearSolve = rows.find(
    (row) => row.id === "animation-linear-solve-solve-x"
  );

  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "KaTeX visual frame"
    ),
    {
      label: "KaTeX visual frame",
      value: "visual.linear-solve.visual-sample"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "KaTeX focus token refs"
    ),
    {
      label: "KaTeX focus token refs",
      value:
        "equation.linear-solve.after-subtract.lhs.plus3:tok.plus tok.plus-three; equation.linear-solve.after-subtract.lhs.minus3:tok.left-minus tok.left-minus-three"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "KaTeX diagnostics panel"
    ),
    {
      label: "KaTeX diagnostics panel",
      value: "passed (0 warnings, 0 errors)"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "KaTeX binding coverage"
    ),
    {
      label: "KaTeX binding coverage",
      value: "targets 1/1, selectors 10/10, nodes 15"
    }
  );
  assert.ok(linearSolve?.searchFields.includes("katex-visual-frame"));
  assert.ok(
    linearSolve?.searchFields.includes("visual.linear-solve.visual-sample")
  );
  assert.ok(linearSolve?.searchFields.includes("katex-token:tok.plus"));
  assert.ok(
    linearSolve?.searchFields.includes("visual-frame-diagnostics-panel")
  );
  assert.ok(
    linearSolve?.searchFields.includes("visual-bindings-selectors:10/10")
  );
});

test("dashboard animation asset rows include paused-frame drill-down facets", () => {
  const rows = createAnimationAssetAgendaRows("");
  const linearSolve = rows.find(
    (row) => row.id === "animation-linear-solve-solve-x"
  );

  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Paused frame drill-down"
    ),
    {
      label: "Paused frame drill-down",
      value:
        "paused-frame-drilldown.animation.linear-solve.solve-x.forward.beat-25"
    }
  );
  assert.deepEqual(
    linearSolve?.previewFields.find(
      (field) => field.label === "Paused focus selectors"
    ),
    {
      label: "Paused focus selectors",
      value:
        "equation.linear-solve.after-subtract.lhs.plus3, equation.linear-solve.after-subtract.lhs.minus3"
    }
  );
  assert.ok(linearSolve?.searchFields.includes("paused-frame-drilldown"));
  assert.ok(
    linearSolve?.searchFields.includes(
      "paused-frame-focus:equation.linear-solve.after-subtract.lhs.plus3"
    )
  );
});

test("semantic asset dashboard search resolves animation component facets", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "render-target-kind:graph linear-map-vector-motion"
    ).map((row) => row.id),
    ["animation-graph-vector-linear-map-scale"]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "layout-kind:row component:animation.programming.add.execution-trace"
    ).map((row) => row.id),
    ["animation-comparison-linear-solve-programming"]
  );
});

test("semantic asset dashboard search resolves flashcard projection facets", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "flashcard-projection:predict-next card.linear-solve.predict-subtract"
    ).map((row) => row.id),
    ["animation-linear-solve-solve-x"]
  );
});

test("semantic asset dashboard search resolves generated problem animation imports", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated-problem generated.calculus.derivative"
    ).map((row) => row.id),
    [
      "animation-generated-calculus-derivative-power-rule-x-cubed",
      "animation-generated-calculus-derivative-sum-rule-polynomial",
      "generated-problem-registry-generated-calculus-derivative-power-rule-x-cubed",
      "generated-problem-registry-generated-calculus-derivative-sum-rule-polynomial"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated-problem matrix-vector-product"
    ).map((row) => row.id),
    [
      "animation-generated-linear-algebra-matrix-vector-two-by-two",
      "generated-problem-registry-generated-linear-algebra-matrix-vector-two-by-two"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated-problem dot-product"
    ).map((row) => row.id),
    [
      "animation-generated-linear-algebra-dot-product-three-vector",
      "generated-problem-registry-generated-linear-algebra-dot-product-three-vector"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated-problem matrix-matrix-product"
    ).map((row) => row.id),
    [
      "animation-generated-linear-algebra-matrix-matrix-two-by-two",
      "generated-problem-registry-generated-linear-algebra-matrix-matrix-two-by-two"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated-problem generated.calculus.integral"
    ).map((row) => row.id),
    [
      "animation-generated-calculus-integral-power-rule-quadratic",
      "generated-problem-registry-generated-calculus-integral-power-rule-quadratic"
    ]
  );
});

test("dashboard exposes generated problem registry rows", () => {
  assert.deepEqual(
    createGeneratedProblemRegistryAgendaRows(
      "definition.generated.calculus.derivative.power-rule"
    ).map((row) => row.id),
    [
      "generated-problem-registry-generated-calculus-derivative-power-rule-x-cubed"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "law.linear-algebra.matrix-vector-product"
    ).map((row) => row.id),
    [
      "animation-generated-linear-algebra-matrix-vector-two-by-two",
      "generated-problem-registry-generated-linear-algebra-matrix-vector-two-by-two"
    ]
  );
});

test("dashboard animation asset rows expose complex KaTeX search aliases", () => {
  assert.deepEqual(
    createAnimationAssetAgendaRows("ftc duality").map((row) => row.id),
    ["animation-sample-fundamental-theorem-calculus"]
  );
  assert.deepEqual(
    createAnimationAssetAgendaRows("fundamental theorem animation").map(
      (row) => row.id
    ),
    ["animation-sample-fundamental-theorem-calculus"]
  );
  assert.deepEqual(
    createAnimationAssetAgendaRows("fourier kernel").map((row) => row.id),
    ["animation-sample-fourier-transform-pair"]
  );
  assert.deepEqual(
    createAnimationAssetAgendaRows("derivative matrix comparison").map(
      (row) => row.id
    ),
    ["animation-comparison-jacobian-hessian"]
  );
});

test("project dashboard selected preview exposes animation time protocol fields", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    selectedAgendaRowId: "animation-generated-radical-square-root-as-power"
  });

  assert.match(
    html,
    /data-kp-selected-agenda-row="animation-generated-radical-square-root-as-power"/
  );
  assert.match(
    html,
    /data-kp-preview-field="Animation asset"[^>]*>[\s\S]*animation\.generated\.radical\.square-root-as-power/
  );
  assert.match(
    html,
    /data-kp-preview-field="Midpoint phase"[^>]*>[\s\S]*transform\.generated\.radical\.square-root-as-power\.rewrite-power-as-root/
  );
  assert.match(
    html,
    /data-kp-preview-field="Seek\/Rewind law"[^>]*>[\s\S]*passed/
  );
  assert.match(
    html,
    /data-kp-preview-field="Reference closure"[^>]*>[\s\S]*passed/
  );
});
