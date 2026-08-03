import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  createKpLispLambdaApplicationAnimationAsset,
  kpLispLambdaApplicationAnimationId
} from "../src/animation/lisp-lambda-application-adapter.ts";

test("canonical Lisp asset validates as an experimental programming animation", () => {
  const animation = createKpLispLambdaApplicationAnimationAsset();

  assert.equal(animation.id, kpLispLambdaApplicationAnimationId);
  assert.equal(animation.timeline?.durationMs, 14_000);
  assert.equal(animation.renderTargets[0]?.kind, "programming");
  assert.equal(animation.metadata?.["presentationStatus"], "experimental-local");
  assert.ok(animation.dashboard?.tags.includes("botanical"));
});

test("eager and lazy catalogues expose the same Lisp identity", async () => {
  assert.ok(createKpAnimationAssets().some(
    ({ id }) => id === kpLispLambdaApplicationAnimationId
  ));
  const loaded = await loadKpAnimationAsset(kpLispLambdaApplicationAnimationId);
  assert.equal(loaded.packId, "programming");
  assert.equal(loaded.animation.id, kpLispLambdaApplicationAnimationId);
});

test("registration does not claim botanical promotion", () => {
  const animation = createKpLispLambdaApplicationAnimationAsset();
  assert.equal(animation.metadata?.["presentationStatus"], "experimental-local");
  assert.notEqual(animation.metadata?.["presentationStatus"], "promoted");
});
