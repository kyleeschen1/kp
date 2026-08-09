import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  serializeKpVignetteReleasePayload
} from "../src/article/kp-article-import-lock.ts";
import {
  fractionCompositionArticleVignetteRelease,
  kpFractionCompositionArticleCheckpointBindings,
  kpFractionCompositionArticleObjectBindings,
  kpFractionCompositionArticleTransitionBindings
} from "../src/article/vignettes/fraction-composition-vignette.ts";
import {
  createKpFractionCompositionEvaluationTree
} from "../src/semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpFractionCompositionSalienceInventory
} from "../src/semantic/fraction-composition-salience-inventory.ts";

test("fraction composition vignette exports only canonical semantic authority", () => {
  const release = fractionCompositionArticleVignetteRelease;
  const inventory = createKpFractionCompositionSalienceInventory();
  const targetIds = new Set(inventory.endpoints.flatMap((endpoint) => [
    ...endpoint.selectorIds,
    ...endpoint.structuralAnchorIds,
    ...endpoint.envelopeIds
  ]));

  assert.equal(release.animationId, "animation.fraction-composition.two-thirds-solve");
  assert.deepEqual(
    release.objectPaths,
    [...kpFractionCompositionArticleObjectBindings.map(({ path }) => path)].sort()
  );
  for (const binding of kpFractionCompositionArticleObjectBindings) {
    assert.ok(binding.targets.length > 0);
    for (const { targetId } of binding.targets) assert.ok(targetIds.has(targetId), targetId);
  }
});

test("fraction composition vignette checkpoints and ranges cover exact groups", () => {
  const release = fractionCompositionArticleVignetteRelease;
  const inventory = createKpFractionCompositionSalienceInventory();
  const tree = createKpFractionCompositionEvaluationTree();
  assert.equal(tree.root.kind, "sequence");
  if (tree.root.kind !== "sequence") return;

  assert.deepEqual(
    kpFractionCompositionArticleCheckpointBindings.map(({ path, stateId, defaultFocusTargetId }) => ({
      path,
      stateId,
      defaultFocusTargetId
    })),
    inventory.checkpoints.map(({ id, stateId, defaultFocusTargetId }) => ({
      path: id,
      stateId,
      defaultFocusTargetId
    }))
  );
  assert.deepEqual(
    kpFractionCompositionArticleTransitionBindings.map(({ evaluationNodeId }) => evaluationNodeId),
    tree.root.children.map(({ id }) => id)
  );
  assert.deepEqual(
    release.staticProjection?.transitions,
    [...kpFractionCompositionArticleTransitionBindings]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(({ path, from, to }) => ({ id: path, from, to }))
  );
  assert.equal(release.staticProjection?.checkpoints.length, 6);
  assert.equal(release.accessibility?.reducedMotion, "direct-checkpoint-seek");
});

test("fraction composition vignette integrity covers its normalized payload", () => {
  const release = fractionCompositionArticleVignetteRelease;
  const integrity = `sha256:${createHash("sha256")
    .update(serializeKpVignetteReleasePayload(release))
    .digest("hex")}`;

  assert.equal(release.integrity, integrity);
});
