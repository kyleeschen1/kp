import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import { renderProjectDashboard } from "../src/project-dashboard/render.ts";
import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";

test("semantic asset catalog exposes representation transform sample rows", () => {
  const rows = createSemanticAssetCatalogAgendaRows("representation transform");

  assert.deepEqual(
    rows
      .filter((row) => row.detail === "representation transform")
      .map((row) => row.id),
    [
      "representation-equation-to-graph-explicit-2d",
      "representation-equation-to-matrix-linear-map"
    ]
  );
  assert.ok(
    rows
      .find((row) => row.id === "representation-equation-to-graph-explicit-2d")
      ?.searchFields.includes("graphDerivationCapability:equation.graph2d")
  );
  assert.ok(
    rows
      .find((row) => row.id === "representation-equation-to-matrix-linear-map")
      ?.searchFields.includes("matrixDerivationCapability:equation.matrix")
  );
});

test("project dashboard search and preview include representation transform rows", () => {
  const html = renderProjectDashboard(projectDashboardData, {
    query: "equation matrix representation",
    selectedAgendaRowId: "representation-equation-to-matrix-linear-map"
  });

  assert.match(
    html,
    /data-kp-agenda-row="representation-equation-to-matrix-linear-map"/
  );
  assert.match(
    html,
    /data-kp-representation-transform="representation\.equation-to-matrix\.linear-map"/
  );
  assert.match(
    html,
    /data-kp-preview-field="Target representation"[^>]*>matrix</
  );
  assert.match(
    html,
    /data-kp-preview-field="Derivation"[^>]*>equation\.matrix/
  );
});
