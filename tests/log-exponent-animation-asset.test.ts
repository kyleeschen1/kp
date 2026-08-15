import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogExponentAnimationAsset,
  kpLogExponentAnimationId
} from "../src/animation/log-exponent-adapter.ts";
import {
  validateKpAnimationAsset
} from "../src/animation/asset.ts";

test("canonical log-exponent animation asset closes exact semantic references", () => {
  const animation = createKpLogExponentAnimationAsset();
  assert.equal(animation.id, kpLogExponentAnimationId);
  assert.deepEqual(
    animation.bundle.objects.map(({ id }) => id),
    [
      "log-exponent.state.source",
      "log-exponent.state.logged-both-sides",
      "log-exponent.state.exponent-extracted",
      "log-exponent.state.solved"
    ]
  );
  assert.equal(animation.transformations.length, 3);
  assert.equal(animation.timeline?.id,
    "timeline.animation.algebra.log-exponent.solve-two-power-x");
  assert.deepEqual(validateKpAnimationAsset(animation), []);
});

test("catalogue asset keeps every state selector and native authority metadata", () => {
  const animation = createKpLogExponentAnimationAsset();
  assert.equal(animation.metadata?.["settledEndpointAuthority"], "native-katex");
  assert.ok(animation.bundle.objects.every((object) =>
    object.selectors.length > 0 &&
    object.selectors.every((selector) =>
      selector.metadata?.["semanticId"] !== undefined
    )
  ));
});
