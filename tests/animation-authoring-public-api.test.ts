import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import * as animationAuthoring from "../src/animation/public-api.ts";
import {
  createKpCanonicalBalancedSolveAnimationAsset as createInternalBalancedSolve
} from "../src/animation/canonical-balanced-solve-animation.ts";
import {
  validateKpAnimationAsset as validateInternalAsset
} from "../src/animation/asset.ts";

const source = readFileSync(
  fileURLToPath(new URL("../src/animation/public-api.ts", import.meta.url)),
  "utf8"
);

test("animation authoring facade has exactly two runtime exports", () => {
  assert.deepEqual(Object.keys(animationAuthoring).sort(), [
    "createKpCanonicalBalancedSolveAnimationAsset",
    "validateKpAnimationAsset"
  ]);
  assert.equal(
    animationAuthoring.createKpCanonicalBalancedSolveAnimationAsset,
    createInternalBalancedSolve
  );
  assert.equal(animationAuthoring.validateKpAnimationAsset, validateInternalAsset);
});

test("animation authoring facade names every export and owns no implementation", () => {
  assert.doesNotMatch(source, /export\s+\*/);
  assert.doesNotMatch(source, /reader|rendering|editor|integrations|domains/);
  assert.match(source, /canonical-balanced-solve-animation\.ts/);
  assert.match(source, /asset\.ts/);
});

test("animation authoring facade excludes internal and domain-specific surfaces", () => {
  const runtimeExports = new Set(Object.keys(animationAuthoring));
  for (const forbidden of [
    "createKpAnimationAsset",
    "createKpAnimationAssetBuilder",
    "compileVerifiedLinearProblemAnimation",
    "createKpEconomicsEquilibriumSynchronizedView",
    "createKpReaderEquationRenderPlan",
    "kpExecutableMotifGrammar"
  ]) {
    assert.equal(runtimeExports.has(forbidden), false, forbidden);
  }
});
