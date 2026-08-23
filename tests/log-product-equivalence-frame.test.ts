import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpLogProductEquivalenceFrameAnimationAsset
} from "../src/animation/log-product-equivalence-frame-adapter.ts";
import {
  kpAnimationCatalogPackId,
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarations
} from "../src/editor/selected-surface-capability-declarations.ts";
import {
  isKpVerifiedLogProductEquivalenceFrame,
  KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
  kpLogProductEquivalenceFrame,
  kpLogProductEquivalenceFrameOccurrenceIds
} from "../src/semantic/log-product-equivalence-frame.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("log-product equivalence projects one operation into distinct occurrences",
  () => {
    const frame = kpLogProductEquivalenceFrame;
    assert.equal(isKpVerifiedLogProductEquivalenceFrame(frame), true);
    assert.equal(frame.projection.policy, "equivalence-frame");
    assert.equal(frame.operationId,
      kpCanonicalCompiledLogProductOperation.transformation.id);
    assert.equal(frame.projection.semanticTransitionId, frame.operationId);

    const source = frame.projection.occurrences.find(({ id }) =>
      id === kpLogProductEquivalenceFrameOccurrenceIds.source);
    const target = frame.projection.occurrences.find(({ id }) =>
      id === kpLogProductEquivalenceFrameOccurrenceIds.target);
    assert.ok(source);
    assert.ok(target);
    assert.notEqual(source.id, target.id);
    assert.deepEqual(source.referentIds, target.referentIds);
  });

test("equivalence asset reuses the canonical operation without motif duplication",
  () => {
    const asset = createKpLogProductEquivalenceFrameAnimationAsset();
    assert.deepEqual(validateKpAnimationAsset(asset), []);
    assert.equal(asset.id, KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID);
    assert.equal(asset.transformations.length, 1);
    assert.equal(asset.transformations[0]?.id,
      kpCanonicalCompiledLogProductOperation.transformation.id);
    assert.equal(asset.metadata?.["reusedOperationId"],
      kpCanonicalCompiledLogProductOperation.transformation.id);
    assert.equal(asset.metadata?.["stateRetentionProjectionId"],
      kpLogProductEquivalenceFrame.projection.id);
  });

test("the equivalence frame stays in the lazy log-product capability", async () => {
  assert.equal(kpAnimationCatalogPackId(
    KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID), "log-product");
  const loaded = await loadKpAnimationAsset(
    KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID);
  assert.equal(loaded.packId, "log-product");
  assert.equal(loaded.animation.id,
    KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID);
  assert.equal(loaded.catalog.filter(({ id }) =>
    id === KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID).length, 1);

  const declaration = kpEditorSelectedSurfaceCapabilityDeclarations.find(
    ({ capabilityId }) => capabilityId === "log-product");
  assert.ok(declaration);
  assert.ok(declaration.adapterIds.includes(
    "editor-animation-surface.log-product.equivalence-frame.native-katex"));

  const [declarations, capability] = await Promise.all([
    readFile(new URL(
      "../src/editor/selected-surface-capability-declarations.ts",
      import.meta.url
    ), "utf8"),
    readFile(new URL(
      "../src/editor/log-product-surface-capability.ts",
      import.meta.url
    ), "utf8")
  ]);
  assert.match(
    declarations,
    /await import\("\.\/log-product-surface-capability\.ts"\)/u
  );
  assert.match(capability, /import "\.\/log-product-surface\.css"/u);
  assert.match(
    capability,
    /from "\.\/log-product-surface-adapter\.ts"/u
  );
});
