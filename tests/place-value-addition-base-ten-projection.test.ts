import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPlaceValueBaseTenProjection,
  isKpPlaceValueBaseTenProjection,
  sampleKpPlaceValueBaseTenFrame,
  type KpPlaceValueBaseTenProjection
} from "../src/rendering/place-value-addition-base-ten-projection.ts";

test("base-ten projection preserves one exact 434-unit truth in every state", () => {
  const projection = compileKpPlaceValueBaseTenProjection();

  assert.equal(projection.frames.length, 7);
  assert.ok(projection.frames.every(({ exactUnitCount }) =>
    exactUnitCount === 434
  ));
  assert.deepEqual(
    projection.frames.map(({ blockIds }) => blockIds.length),
    [29, 29, 20, 20, 11, 11, 11]
  );
  assert.deepEqual(
    projection.frames.map(({ stateId }) => stateId),
    [
      "state.place-value.established",
      "state.place-value.ones-evaluated",
      "state.place-value.ones-exchanged",
      "state.place-value.tens-evaluated",
      "state.place-value.tens-exchanged",
      "state.place-value.hundreds-evaluated",
      "state.place-value.settled"
    ]
  );
});

test("both exchanges consume ten lower blocks and retain exact lineage", () => {
  const projection = compileKpPlaceValueBaseTenProjection();
  const [ones, tens] = projection.exchanges;

  assert.equal(ones.consumedBlockIds.length, 10);
  assert.equal(ones.consumedExactUnitCount, 10);
  assert.equal(ones.producedExactUnitCount, 10);
  assert.equal(tens.consumedBlockIds.length, 10);
  assert.equal(tens.consumedExactUnitCount, 100);
  assert.equal(tens.producedExactUnitCount, 100);
  for (const exchange of projection.exchanges) {
    const produced = projection.blocks.find(
      ({ id }) => id === exchange.producedBlockId
    );
    assert.deepEqual(produced?.parentBlockIds, exchange.consumedBlockIds);
    assert.ok(
      exchange.consumedBlockIds.every((id) =>
        projection.blocks.some((block) => block.id === id)
      )
    );
  }
});

test("persistent blocks reuse one catalog object across all frames", () => {
  const projection = compileKpPlaceValueBaseTenProjection();
  const persistentId = "block.second.ones.2";
  const catalogBlock = projection.blocks.find(({ id }) => id === persistentId);

  assert.ok(catalogBlock);
  for (const frame of projection.frames) {
    if (!frame.blockIds.includes(persistentId)) continue;
    assert.strictEqual(
      projection.blocks.find(({ id }) => id === persistentId),
      catalogBlock
    );
  }
  assert.equal(new Set(projection.blocks.map(({ id }) => id)).size, 31);
});

test("packing is deterministic, intrinsic, and independent of seek history", () => {
  const projection = compileKpPlaceValueBaseTenProjection();
  const settled = sampleKpPlaceValueBaseTenFrame(
    projection,
    "state.place-value.settled"
  );
  const established = sampleKpPlaceValueBaseTenFrame(
    projection,
    "state.place-value.established"
  );
  const settledAgain = sampleKpPlaceValueBaseTenFrame(
    projection,
    "state.place-value.settled"
  );

  assert.strictEqual(settledAgain, settled);
  assert.strictEqual(
    sampleKpPlaceValueBaseTenFrame(
      projection,
      "state.place-value.established"
    ),
    established
  );
  for (const frame of projection.frames) {
    for (const placement of frame.placements) {
      assert.ok(placement.x >= 0 && placement.y >= 0);
      assert.ok(
        placement.x + placement.width <=
          projection.intrinsicViewBox.width
      );
      assert.ok(
        placement.y + placement.height <=
          projection.intrinsicViewBox.height
      );
    }
  }
});

test("secondary view remains projection-only and uses no WebGL or rebuild loop", () => {
  const projection = compileKpPlaceValueBaseTenProjection();

  assert.equal(isKpPlaceValueBaseTenProjection(projection), true);
  assert.equal(projection.authority, "projection-only");
  assert.equal(projection.rendering, "deterministic-svg");
  assert.deepEqual(projection.domPolicy, {
    persistentObjectInventory: true,
    rebuildPerFrame: false,
    opacityPolicy: "opaque",
    webglRequired: false
  });
  assert.equal(projection.promotionStatus, "not-promoted");
});

test("static types reject raw base-ten projection authority", () => {
  if (false as boolean) {
    // @ts-expect-error Only the compiler can mint projection authority.
    const raw: KpPlaceValueBaseTenProjection = {
      schemaVersion: "kp.place-value-addition-base-ten-projection.v1"
    };
    assert.ok(raw);
  }
  assert.equal(
    compileKpPlaceValueBaseTenProjection().status,
    "ready-for-session-binding"
  );
});
