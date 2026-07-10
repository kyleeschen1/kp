import { strict as assert } from "node:assert";
import test from "node:test";

import {
  apiCatalogGroups,
  apiCatalogItemDetailFields,
  apiCatalogItemSearchFields,
  findApiCatalogItem
} from "../src/editor/api-catalog.ts";

test("API catalog exposes typed metadata for semantic objects", () => {
  const expression = findApiCatalogItem("semantic-expression");
  const matrix = findApiCatalogItem("semantic-matrix");

  assert.equal(expression?.group.id, "semantic-objects");
  assert.deepEqual(expression?.item.details?.protocols, [
    "toLatex",
    "evaluate",
    "differentiate",
    "graphForm",
    "numericSample"
  ]);
  assert.ok(expression?.item.details?.computes?.includes("derivative"));

  assert.equal(matrix?.group.id, "semantic-objects");
  assert.equal(matrix?.group.category, "semantic-object");
  assert.deepEqual(matrix?.item.details?.protocols, [
    "toLatex",
    "evaluate",
    "matrixForm"
  ]);
  assert.deepEqual(matrix?.item.details?.views, [
    "latex",
    "matrix-grid",
    "linear-map"
  ]);
  assert.deepEqual(matrix?.item.details?.lenses, [
    "rows",
    "columns",
    "entries"
  ]);
  assert.deepEqual(matrix?.item.details?.computes, ["shape", "determinant"]);
});

test("API catalog exposes typed metadata for semantic transformations", () => {
  const jacobian = findApiCatalogItem("transform-compute-jacobian");

  assert.equal(jacobian?.group.category, "semantic-transformation");
  assert.deepEqual(jacobian?.item.details?.inputs, ["Function"]);
  assert.deepEqual(jacobian?.item.details?.outputs, [
    "Matrix",
    "LinearMap"
  ]);
  assert.deepEqual(jacobian?.item.details?.preserves, [
    "domain point",
    "local derivative provenance"
  ]);
  assert.ok(
    jacobian?.item.details?.visualMotifs?.includes(
      "jacobian-local-linearization"
    )
  );
});

test("API catalog covers notation and layout entities with the same metadata protocol", () => {
  const radical = findApiCatalogItem("notation-radical-to-exponent");
  const synchronizedPanel = findApiCatalogItem("layout-synchronized-panel");

  assert.equal(radical?.group.category, "notation-transformation");
  assert.deepEqual(radical?.item.details?.preserves, [
    "semantic object identity"
  ]);
  assert.ok(
    radical?.item.details?.visualMotifs?.includes("radical-fold-bundle-swap")
  );

  assert.equal(synchronizedPanel?.group.category, "layout");
  assert.deepEqual(synchronizedPanel?.item.details?.protocols, [
    "render",
    "animate"
  ]);
  assert.deepEqual(synchronizedPanel?.item.details?.views, [
    "equation-panel",
    "graph-panel",
    "code-panel"
  ]);
  assert.deepEqual(synchronizedPanel?.item.details?.preserves, [
    "shared playhead",
    "selected semantic object"
  ]);
});

test("API catalog exposes the complete layout object vocabulary", () => {
  const layoutGroup = apiCatalogGroups.find(
    (group) => group.id === "layout-objects"
  );
  const split = findApiCatalogItem("layout-split");
  const overlay = findApiCatalogItem("layout-overlay");
  const pinnedStage = findApiCatalogItem("layout-pinned-stage");

  assert.deepEqual(
    layoutGroup?.items.map((item) => item.id),
    [
      "layout-row",
      "layout-column",
      "layout-stack",
      "layout-grid",
      "layout-split",
      "layout-tabs",
      "layout-overlay",
      "layout-scroll-sequence",
      "layout-pinned-stage",
      "layout-synchronized-panel"
    ]
  );
  assert.deepEqual(split?.item.details?.lenses, [
    "primary pane",
    "secondary pane",
    "resizer"
  ]);
  assert.deepEqual(overlay?.item.details?.preserves, [
    "base view identity",
    "overlay selector targets"
  ]);
  assert.deepEqual(pinnedStage?.item.details?.protocols, [
    "render",
    "animate",
    "pin"
  ]);
});

test("API catalog detail helpers normalize preview and search fields", () => {
  const matrix = findApiCatalogItem("semantic-matrix");
  assert.ok(matrix);

  const fields = apiCatalogItemDetailFields(matrix.group, matrix.item);
  const searchFields = apiCatalogItemSearchFields(matrix.group, matrix.item);

  assert.deepEqual(
    fields.map((field) => field.label),
    [
      "API group",
      "API category",
      "API id",
      "API kind",
      "API status",
      "Protocols",
      "Views",
      "Lenses",
      "Computes"
    ]
  );
  assert.ok(searchFields.includes("matrix-grid"));
  assert.ok(searchFields.includes("determinant"));
  assert.ok(searchFields.includes("semantic-object"));
});
