import { strict as assert } from "node:assert";
import test from "node:test";

import { packKatexTextureRegions } from "../src/rendering/katex-texture-atlas.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

test("packKatexTextureRegions packs token rects with padding and uv coordinates", () => {
  const regions = packKatexTextureRegions(
    [token("x", 10, 12), token("plus", 8, 12)],
    { width: 64, height: 64, padding: 2, pixelRatio: 2 }
  );

  assert.equal(regions.length, 2);
  assert.equal(regions[0]?.tokenId, "x");
  assert.deepEqual(
    regions.map((region) => [region.page, region.x, region.y, region.width, region.height]),
    [
      [0, 2, 2, 20, 24],
      [0, 26, 2, 16, 24]
    ]
  );
  assert.equal(regions[0]?.u0, 2 / 64);
  assert.equal(regions[0]?.v0, 2 / 64);
});

test("packKatexTextureRegions starts a new row when the current row is full", () => {
  const regions = packKatexTextureRegions(
    [token("a", 12, 10), token("b", 12, 10), token("c", 12, 10)],
    { width: 40, height: 64, padding: 2, pixelRatio: 1 }
  );

  assert.deepEqual(
    regions.map((region) => [region.tokenId, region.x, region.y]),
    [
      ["a", 2, 2],
      ["b", 18, 2],
      ["c", 2, 16]
    ]
  );
});

test("packKatexTextureRegions rejects tokens larger than the atlas page", () => {
  assert.throws(
    () =>
      packKatexTextureRegions([token("huge", 100, 100)], {
        width: 64,
        height: 64,
        padding: 2,
        pixelRatio: 1
      }),
    /does not fit/
  );
});

function token(id: string, width: number, height: number): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top: 0, width, height },
    localRect: { left: 0, top: 0, width, height },
    row: 0
  };
}
