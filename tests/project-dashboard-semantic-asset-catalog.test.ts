import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";

test("semantic asset dashboard catalog combines derived and generated rows", () => {
  const rows = createSemanticAssetCatalogAgendaRows("");
  const rowIds = rows.map((row) => row.id);

  assert.ok(
    rowIds.includes("drilldown-linear-solve-cancel-additive-inverse")
  );
  assert.ok(rowIds.includes("flashcard-linear-solve-cloze-plus3"));
  assert.ok(rowIds.includes("generated-linear-solve-family-maturity"));
  assert.ok(rowIds.includes("generated-linear-solve-x-plus-3"));
  assert.ok(
    rows
      .find((row) => row.id === "flashcard-linear-solve-cloze-plus3")
      ?.searchFields.includes("linear solve flashcard catalog")
  );
});

test("semantic asset dashboard catalog filters across derived and generated rows", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows("generated fixture 12 - 5").map(
      (row) => row.id
    ),
    [
      "generated-problem-registry-generated-linear-solve-y-plus-5",
      "generated-linear-solve-y-plus-5"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "generated fixture dependency manifests"
    ).map((row) => row.id),
    [
      "generated-linear-solve-family-maturity",
      "generated-fraction-expression-family-maturity",
      "generated-exponent-family-maturity",
      "generated-radical-family-maturity",
      "generated-function-wrap-family-maturity",
      "generated-distribution-family-maturity"
    ]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "drilldown.linear-solve.cancel-additive-inverse"
    ).map((row) => row.id),
    ["drilldown-linear-solve-cancel-additive-inverse"]
  );
});
