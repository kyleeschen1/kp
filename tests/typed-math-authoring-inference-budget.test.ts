import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpTypedMathAuthoringInferenceBudget
} from "../src/math/authoring/inference-budget.ts";

test("typed math authoring keeps a narrow, local inference budget", () => {
  const { measured, ceilings, measuredProject } =
    kpTypedMathAuthoringInferenceBudget;
  assert.equal(measuredProject, "tsconfig.typed-math-authoring-inference.json");
  assert.equal(kpTypedMathAuthoringInferenceBudget.fixtureCount, 6);
  assert.ok(ceilings.types > measured.types);
  assert.ok(ceilings.instantiations > measured.instantiations);
  assert.ok(ceilings.types / measured.types < 1.06);
  assert.ok(ceilings.instantiations / measured.instantiations < 1.08);

  const config = JSON.parse(readFileSync(measuredProject, "utf8")) as {
    readonly compilerOptions?: { readonly skipLibCheck?: boolean };
    readonly include?: readonly string[];
  };
  assert.notEqual(config.compilerOptions?.skipLibCheck, true);
  assert.equal(config.include?.length, 6);
});
