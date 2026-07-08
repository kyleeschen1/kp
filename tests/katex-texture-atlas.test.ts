import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKatexTextureAtlas,
  packKatexTextureRegions
} from "../src/rendering/katex-texture-atlas.ts";
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

test("packKatexTextureRegions starts a new page when the current page is full", () => {
  const regions = packKatexTextureRegions(
    [token("a", 20, 20), token("b", 20, 20), token("c", 20, 20)],
    { width: 32, height: 52, padding: 2, pixelRatio: 1 }
  );

  assert.deepEqual(
    regions.map((region) => [region.tokenId, region.page, region.x, region.y]),
    [
      ["a", 0, 2, 2],
      ["b", 0, 2, 26],
      ["c", 1, 2, 2]
    ]
  );
});

test("packKatexTextureRegions rejects duplicate token ids", () => {
  assert.throws(
    () =>
      packKatexTextureRegions([token("same", 10, 10), token("same", 8, 8)], {
        width: 64,
        height: 64,
        padding: 2,
        pixelRatio: 1
      }),
    /Duplicate KaTeX token id/
  );
});

test("packKatexTextureRegions rejects invalid atlas options", () => {
  const validOptions = { width: 64, height: 64, padding: 2, pixelRatio: 1 };

  for (const options of [
    { ...validOptions, width: 0 },
    { ...validOptions, width: Number.POSITIVE_INFINITY },
    { ...validOptions, height: -1 },
    { ...validOptions, height: Number.NaN },
    { ...validOptions, pixelRatio: 0 },
    { ...validOptions, pixelRatio: Number.NaN },
    { ...validOptions, padding: -1 },
    { ...validOptions, padding: Number.POSITIVE_INFINITY }
  ]) {
    assert.throws(
      () => packKatexTextureRegions([token("x", 10, 10)], options),
      /Invalid KaTeX texture atlas/
    );
  }
});

test("packKatexTextureRegions rejects invalid token dimensions", () => {
  for (const invalidToken of [
    token("zero-width", 0, 10),
    token("negative-height", 10, -1),
    token("nan-width", Number.NaN, 10),
    token("infinite-height", 10, Number.POSITIVE_INFINITY)
  ]) {
    assert.throws(
      () =>
        packKatexTextureRegions([invalidToken], {
          width: 64,
          height: 64,
          padding: 2,
          pixelRatio: 1
        }),
      /Invalid KaTeX token/
    );
  }
});

test("createKatexTextureAtlas rejects tokens without elements", async () => {
  await assert.rejects(
    () =>
      createKatexTextureAtlas([token("missing", 10, 10)], {
        maxTextureSize: 64,
        padding: 2,
        pixelRatio: 1
      }),
    /missing an element/
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
