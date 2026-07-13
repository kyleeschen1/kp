import { strict as assert } from "node:assert";
import test from "node:test";

import {
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
