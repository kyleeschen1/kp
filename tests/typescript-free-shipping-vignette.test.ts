import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpTypeScriptFreeShippingConstruction,
  kpTypeScriptFreeShippingVignetteRelease
} from "../src/article/vignettes/typescript-free-shipping-vignette.ts";
import { validateKpCanonicalAnimationConstruction } from
  "../src/authoring/canonical-animation-public-api.ts";

test("production vignette compiles through the canonical public authoring seam", () => {
  assert.deepEqual(
    validateKpCanonicalAnimationConstruction(kpTypeScriptFreeShippingConstruction),
    []
  );
  assert.equal(kpTypeScriptFreeShippingConstruction.operations.length, 4);
  assert.equal(kpTypeScriptFreeShippingConstruction.checkpoints.length, 5);
  assert.equal(
    kpTypeScriptFreeShippingConstruction.semanticSource.operationPacks[0]?.packId,
    "project.typescript-refactor"
  );
});

test("vignette exports portable semantic paths and accessibility", () => {
  assert.equal(
    kpTypeScriptFreeShippingVignetteRelease.animationId,
    "animation.programming.typescript-free-shipping-refactor"
  );
  assert.equal(kpTypeScriptFreeShippingVignetteRelease.checkpointPaths.length, 7);
  assert.equal(
    kpTypeScriptFreeShippingVignetteRelease.accessibility?.reducedMotion,
    "direct-checkpoint-seek"
  );
});

test("production caller imports the public facade rather than authoring internals", () => {
  const source = readFileSync(
    new URL("../src/article/vignettes/typescript-free-shipping-vignette.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /authoring\/canonical-animation-public-api\.ts/);
  assert.doesNotMatch(source, /authoring\/(?:canonical-animation-construction|canonical-animation-construction-compiler)\.ts/);
});
