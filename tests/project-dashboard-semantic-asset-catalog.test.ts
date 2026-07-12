import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSemanticAssetCatalogAgendaRows
} from "../src/project-dashboard/semantic-asset-catalog.ts";

test("semantic asset dashboard catalog combines derived and generated rows", () => {
  const rowIds = createSemanticAssetCatalogAgendaRows("").map((row) => row.id);

  assert.ok(
    rowIds.includes("drilldown-linear-solve-cancel-additive-inverse")
  );
  assert.ok(rowIds.includes("flashcard-linear-solve-cloze-plus3"));
  assert.ok(rowIds.includes("generated-linear-solve-x-plus-3"));
});

test("semantic asset dashboard catalog filters across derived and generated rows", () => {
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows("12 - 5").map((row) => row.id),
    ["generated-linear-solve-y-plus-5"]
  );
  assert.deepEqual(
    createSemanticAssetCatalogAgendaRows(
      "drilldown.linear-solve.cancel-additive-inverse"
    ).map((row) => row.id),
    ["drilldown-linear-solve-cancel-additive-inverse"]
  );
});
