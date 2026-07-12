import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createGeneratedAlgebraFixtureAgendaRows
} from "../src/project-dashboard/generated-algebra-catalog.ts";

test("generated algebra dashboard catalog exposes fixture agenda rows", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows("");

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-x-plus-3",
    "generated-linear-solve-y-plus-5"
  ]);
  assert.deepEqual(rows[1]?.previewFields?.slice(0, 4), [
    { label: "Generated fixture", value: "generated.linear-solve.y-plus-5" },
    { label: "Initial LaTeX", value: "y + 5 = 12" },
    { label: "Solved LaTeX", value: "y = 7" },
    { label: "Trace steps", value: "4" }
  ]);
});

test("generated algebra dashboard catalog filters rows by search text", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows("x + 3");

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-x-plus-3"
  ]);
});

test("generated algebra dashboard catalog searches transformation metadata", () => {
  const rows = createGeneratedAlgebraFixtureAgendaRows(
    "transform.generated.linear-solve.y-plus-5.cancel-additive-inverse"
  );

  assert.deepEqual(rows.map((row) => row.id), [
    "generated-linear-solve-y-plus-5"
  ]);
});
