import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKatexQuadFrame } from "../src/rendering/katex-webgl-transition.ts";
import type {
  KatexAtlasRegion,
  KatexMatchedToken,
  KatexMotionToken
} from "../src/rendering/katex-transition-types.ts";

test("createKatexQuadFrame interpolates matched token position and opacity", () => {
  const source = token("s-x", 10, 20, 8, 12);
  const target = token("t-x", 50, 80, 16, 24);
  const region: KatexAtlasRegion = {
    tokenId: source.id,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };

  const frame = createKatexQuadFrame(
    {
      matched: [{ source, target } satisfies KatexMatchedToken],
      sourceOnly: [],
      targetOnly: [],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 1,
        sourceOnlyCount: 0,
        targetOnlyCount: 0,
        ambiguousGroupCount: 0
      }
    },
    new Map([[source.id, region]]),
    0.5
  );

  assert.equal(frame.quads.length, 1);
  assert.deepEqual(frame.quads[0]?.rect, {
    left: 30,
    top: 50,
    width: 12,
    height: 18
  });
  assert.equal(frame.quads[0]?.opacity, 1);
});

test("createKatexQuadFrame fades source-only and target-only tokens", () => {
  const source = token("s-minus", 10, 20, 8, 12);
  const target = token("t-one", 50, 80, 8, 12);
  const regions = new Map<string, KatexAtlasRegion>([
    [source.id, regionFor(source.id)],
    [target.id, regionFor(target.id)]
  ]);

  const frame = createKatexQuadFrame(
    {
      matched: [],
      sourceOnly: [{ source }],
      targetOnly: [{ target }],
      diagnostics: {
        sourceTokenCount: 1,
        targetTokenCount: 1,
        matchedCount: 0,
        sourceOnlyCount: 1,
        targetOnlyCount: 1,
        ambiguousGroupCount: 0
      }
    },
    regions,
    0.25
  );

  assert.deepEqual(
    frame.quads.map((quad) => [quad.tokenId, quad.opacity]),
    [
      ["s-minus", 0.75],
      ["t-one", 0.25]
    ]
  );
});

test("katex-webgl-transition does not import Three.js", () => {
  const source = readFileSync(
    new URL("../src/rendering/katex-webgl-transition.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /from "three"|from 'three'/);
});

function token(
  id: string,
  left: number,
  top: number,
  width: number,
  height: number
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left, top, width, height },
    localRect: { left, top, width, height },
    row: 0
  };
}

function regionFor(tokenId: string): KatexAtlasRegion {
  return {
    tokenId,
    page: 0,
    x: 0,
    y: 0,
    width: 8,
    height: 12,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };
}
