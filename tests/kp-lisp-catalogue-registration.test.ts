import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  createKpLispLambdaApplicationAnimationAsset,
  kpLispLambdaApplicationAnimationId
} from "../src/animation/lisp-lambda-application-adapter.ts";
import { createKpEditorAnimationDescriptor } from
  "../src/editor/animation-descriptor.ts";
import { createKpEditorAnimationPlayerState } from
  "../src/editor/animation-player-state.ts";
import {
  kpEditorLispMaterialSurfaceAdapter,
  kpEditorLispMaterialSurfaceAdapterId
} from "../src/editor/lisp-material-surface-adapter.ts";

test("canonical Lisp asset validates as an experimental programming animation", () => {
  const animation = createKpLispLambdaApplicationAnimationAsset();

  assert.equal(animation.id, kpLispLambdaApplicationAnimationId);
  assert.equal(animation.timeline?.durationMs, 14_000);
  assert.equal(animation.renderTargets[0]?.kind, "programming");
  assert.equal(animation.metadata?.["presentationStatus"], "experimental-local");
  assert.ok(animation.dashboard?.tags.includes("s-expression"));
  assert.equal(
    animation.metadata?.["rendererKind"],
    "lisp-s-expression-material-v0"
  );
});

test("eager and lazy catalogues expose the same Lisp identity", async () => {
  assert.ok(createKpAnimationAssets().some(
    ({ id }) => id === kpLispLambdaApplicationAnimationId
  ));
  const loaded = await loadKpAnimationAsset(kpLispLambdaApplicationAnimationId);
  assert.equal(loaded.packId, "programming");
  assert.equal(loaded.animation.id, kpLispLambdaApplicationAnimationId);
});

test("registration does not claim material renderer promotion", () => {
  const animation = createKpLispLambdaApplicationAnimationAsset();
  assert.equal(animation.metadata?.["presentationStatus"], "experimental-local");
  assert.notEqual(animation.metadata?.["presentationStatus"], "promoted");
});

test("catalogue resolves the Lisp material projection to its exact adapter", () => {
  const animation = createKpLispLambdaApplicationAnimationAsset();
  const state = createKpEditorAnimationPlayerState({
    animation,
    descriptor: createKpEditorAnimationDescriptor({
      animationId: animation.id,
      title: animation.title,
      summary: animation.title,
      renderTargetKinds: animation.renderTargets.map(({ kind }) => kind)
    })
  });

  assert.equal(kpEditorLispMaterialSurfaceAdapter.supports(state), true);
  assert.equal(
    kpEditorLispMaterialSurfaceAdapter.id,
    kpEditorLispMaterialSurfaceAdapterId
  );
});
