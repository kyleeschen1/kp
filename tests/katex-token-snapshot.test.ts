import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLocalTokenRect,
  normalizeKatexTokenText,
  normalizeKatexTokenSignature,
  assignKatexTokenRows
} from "../src/rendering/katex-token-snapshot.ts";
import type { KatexMotionToken } from "../src/rendering/katex-transition-types.ts";

test("normalizeKatexTokenText collapses whitespace and ignores empty content", () => {
  assert.equal(normalizeKatexTokenText("  x  "), "x");
  assert.equal(normalizeKatexTokenText("\n + \t"), "+");
  assert.equal(normalizeKatexTokenText("   "), "");
});

test("normalizeKatexTokenSignature keeps stable KaTeX class names", () => {
  assert.equal(
    normalizeKatexTokenSignature("mord mathnormal sizing reset-size6 size3"),
    "mathnormal mord size3"
  );
  assert.equal(normalizeKatexTokenSignature("mbin mspace"), "mbin mspace");
});

test("createLocalTokenRect maps viewport rects into overlay-local coordinates", () => {
  assert.deepEqual(
    createLocalTokenRect(
      { left: 120, top: 80, width: 30, height: 14 },
      { left: 100, top: 50, width: 200, height: 120 }
    ),
    { left: 20, top: 30, width: 30, height: 14 }
  );
});

test("assignKatexTokenRows groups nearby token tops into row buckets", () => {
  const tokens: KatexMotionToken[] = [
    token("a", 10),
    token("b", 12),
    token("c", 38),
    token("d", 41)
  ];

  assert.deepEqual(
    assignKatexTokenRows(tokens, 6).map((entry) => [entry.id, entry.row]),
    [
      ["a", 0],
      ["b", 0],
      ["c", 1],
      ["d", 1]
    ]
  );
});

function token(id: string, top: number): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top, width: 10, height: 12 },
    localRect: { left: 0, top, width: 10, height: 12 },
    row: 0
  };
}
