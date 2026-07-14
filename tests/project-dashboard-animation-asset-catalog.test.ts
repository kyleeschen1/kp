import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createAnimationAssetAgendaRows,
  createGeneratedAlgebraAnimationAssetAgendaRows
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
  assert.ok(
    comparison?.searchFields.includes(
      "runtime-child:animation.programming.add.execution-trace"
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
