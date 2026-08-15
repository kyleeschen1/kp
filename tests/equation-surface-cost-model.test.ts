import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpEquationSurfaceCostPlan
} from "../src/architecture/equation-surface-cost-model.ts";

test("equation cost plan covers one representative per preservation family", () => {
  const plan = createKpEquationSurfaceCostPlan();

  assert.equal(plan.families.length, 14);
  assert.equal(new Set(plan.families.map(({ familyId }) => familyId)).size, 14);
  assert.equal(
    plan.families.every((family) =>
      family.sourcePaths.length > 0 &&
      family.authorityNodeIds.length > 0 &&
      family.route === `/?artifact=${encodeURIComponent(family.animationId)}`
    ),
    true
  );
});

test("equation cost closure excludes unrelated Graph3D and programming capabilities", () => {
  const sourcePaths = createKpEquationSurfaceCostPlan().families.flatMap(
    ({ sourcePaths }) => sourcePaths
  );

  assert.equal(sourcePaths.some((sourcePath) =>
    /graph-3d|graph-webgl|programming-surface/.test(sourcePath)), false);
});

test("compatibility counts preserve the measured pre-migration authority split", () => {
  const counts = createKpEquationSurfaceCostPlan().compatibility;

  assert.deepEqual(counts, {
    equationSurfaceCount: 28,
    familyCount: 14,
    genericCompatibilityRows: 23,
    specializedAdapterRows: 5,
    rowsWithNonSemanticTransitions: 5,
    nonSemanticTransitionCount: 8,
    wholeEquationFallbackRows: 23,
    privateClockRows: 0,
    cssAnimationAuthorityRows: 0,
    uniqueLocalSamplerNodes: 16
  });
});

test("stable cost command owns one build and one equation-only measurement", async () => {
  const [packageSource, scriptSource, reviewSource] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("scripts/measure-equation-surface-cost.ts", "utf8"),
    readFile(
      "docs/project/reviews/2026-08-15-equation-surface-cost-baseline.md",
      "utf8"
    )
  ]);
  const scripts = (JSON.parse(packageSource) as {
    readonly scripts: Readonly<Record<string, string>>;
  }).scripts;

  assert.equal(
    scripts["measure:equation-surface-cost"],
    "npm run build:bundle && node --disable-warning=ExperimentalWarning " +
    "scripts/measure-equation-surface-cost.ts"
  );
  assert.match(scriptSource, /routeRuns: 2/);
  assert.match(scriptSource, /exactClosureReproducible: true/);
  assert.match(scriptSource, /unrelatedCapabilityOwners/);
  assert.match(
    scriptSource,
    /tmp\/codex\/equation-surface-cost-baseline\.json/
  );
  assert.match(reviewSource, /72 emitted files/);
  assert.match(reviewSource, /35 unique source files/);
});
