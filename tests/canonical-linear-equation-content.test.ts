import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { solveWithBalanceConcept } from "../content/public-api.ts";
import { draftConceptManifestSchema } from "../src/authoring/public-api.ts";

test("canonical linear-equation content is a valid declarative draft", () => {
  assert.equal(draftConceptManifestSchema.safeParse(solveWithBalanceConcept).success, true);
  assert.deepEqual(
    solveWithBalanceConcept.checkpoints.map((checkpoint) => checkpoint.id),
    ["start", "subtract-three", "divide-two", "solved"]
  );
  assert.deepEqual(solveWithBalanceConcept.capabilities, [{ id: "kp.equation", major: 1 }]);
  assert.deepEqual(solveWithBalanceConcept.providers, [{
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    version: "1.0.0"
  }]);
});

test("canonical content owns prose and references, not runtime presentation", () => {
  const source = readFileSync(new URL(
    "../content/mathematics/linear-equations/solve-with-balance/concept.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of ["<div", "document.", "#ff", "font-family", "@keyframes", "onEnter"]) {
    assert.equal(source.includes(forbidden), false, `unexpected authored runtime token: ${forbidden}`);
  }
});
