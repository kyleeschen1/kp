import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileKpGovernedCanonicalConstruction } from "../src/authoring/governed-canonical-construction-compiler.ts";
import { createKpGovernedCanonicalConstructionRequest } from "../src/authoring/governed-semantic-request.ts";
import { planKpGovernedConstructionRepairs } from "../src/authoring/governed-canonical-construction-repair.ts";

test("narrow distribution imports retain public compatibility without loading unrelated cohort assembly", async () => {
  const caller = readFileSync("src/experiments/authoring-structural/distribution-projection.ts", "utf8");
  assert.doesNotMatch(caller, /from\s+["'][^"']*canonical-animation-public-api/);
  for (const owner of ["governed-canonical-construction-compiler", "governed-semantic-request", "governed-canonical-construction-repair"])
    assert.ok(caller.includes(`${owner}.ts`));
  const compatibility = await import("../src/authoring/canonical-animation-public-api.ts");
  assert.equal(compatibility.compileKpGovernedCanonicalConstruction, compileKpGovernedCanonicalConstruction);
  assert.equal(compatibility.createKpGovernedCanonicalConstructionRequest, createKpGovernedCanonicalConstructionRequest);
  assert.equal(compatibility.planKpGovernedConstructionRepairs, planKpGovernedConstructionRepairs);
});
