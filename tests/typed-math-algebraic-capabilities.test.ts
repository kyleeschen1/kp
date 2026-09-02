import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticSpace,
  defineKpSemanticSpace,
  sameKpSemanticSpace
} from "../src/math/algebra/semantic-space.ts";

test("semantic spaces retain deterministic nominal identity and dimensions", () => {
  const quantity = defineKpSemanticSpace<number>()({
    id: "kp.space.quantity",
    label: "Quantity",
    dimension: 1
  });
  const reconstructed = defineKpSemanticSpace<number>()({
    id: "kp.space.quantity",
    label: "Quantity in another process",
    dimension: 1
  });
  const price = defineKpSemanticSpace<number>()({
    id: "kp.space.price",
    label: "Price",
    dimension: 1
  });

  assert.deepEqual(quantity, {
    kind: "semantic-space",
    id: "kp.space.quantity",
    label: "Quantity",
    dimension: 1
  });
  assert.equal(Object.isFrozen(quantity), true);
  assert.equal(sameKpSemanticSpace(quantity, reconstructed), true);
  assert.equal(sameKpSemanticSpace(quantity, price), false);
});

test("semantic spaces reject identities or dimensions that cannot be authority", () => {
  assert.throws(
    () => createKpSemanticSpace({ id: "", dimension: 1 }),
    /id must not be empty/
  );
  assert.throws(
    () => createKpSemanticSpace({ id: "kp.space.invalid", dimension: 0 }),
    /positive integer dimension/
  );
  assert.throws(
    () => createKpSemanticSpace({
      id: "kp.space.invalid-label",
      label: " ",
      dimension: 1
    }),
    /label must not be empty/
  );
});
