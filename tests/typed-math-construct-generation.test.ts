import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { renderKpTypedMathConstructPlumbing } from "../scripts/generate-typed-math-construct-plumbing.ts";
import { kpGeneratedConstructPlumbing } from "../src/math/authoring/generated/construct-plumbing.generated.ts";

const generatedPath = resolve(
  import.meta.dirname,
  "../src/math/authoring/generated/construct-plumbing.generated.ts"
);

test("construct plumbing generation is deterministic and checked in", () => {
  const first = renderKpTypedMathConstructPlumbing();
  const second = renderKpTypedMathConstructPlumbing();

  assert.equal(first, second);
  assert.equal(readFileSync(generatedPath, "utf8"), first);
  assert.match(first, /Descriptor metadata only; mathematical rules remain/);
});

test("generated plumbing derives children, optics, correspondence, and docs", () => {
  assert.equal(kpGeneratedConstructPlumbing.constructs.length, 2);
  const jacobian = kpGeneratedConstructPlumbing.constructs.find(
    ({ construct }) => construct === "jacobian"
  );
  assert.ok(jacobian);
  assert.deepEqual(jacobian.childInventory.map(({ role }) => role), [
    "compact",
    "matrix",
    "entry"
  ]);
  assert.deepEqual(jacobian.optics.map(({ path }) => path), [
    ["compact"],
    ["matrix"],
    ["matrix", "entries"]
  ]);
  assert.deepEqual(jacobian.correspondence, {
    id: "kp.math.construct.jacobian.v1.correspondence.compact-to-entries",
    relation: "fan-out",
    sourceRole: "compact",
    targetRole: "entry"
  });
  assert.deepEqual(jacobian.autocomplete.projectionForms, [
    "compact",
    "operator",
    "expanded"
  ]);
  assert.equal(jacobian.serializationFields.includes("authorityIds"), true);
  assert.equal(jacobian.conformanceCases.length, 3);
});
