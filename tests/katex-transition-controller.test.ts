import { strict as assert } from "node:assert";
import test from "node:test";

import {
  prefersReducedKatexMotion,
  summarizeKatexTransitionResult
} from "../src/rendering/katex-transition-controller.ts";

test("prefersReducedKatexMotion reads matchMedia defensively", () => {
  assert.equal(prefersReducedKatexMotion(undefined), false);
  assert.equal(
    prefersReducedKatexMotion((query) => ({
      media: query,
      matches: true,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })),
    true
  );
});

test("summarizeKatexTransitionResult reports plan diagnostics and fallback reason", () => {
  assert.deepEqual(
    summarizeKatexTransitionResult(
      {
        matched: [],
        sourceOnly: [{ source: token("source") }],
        targetOnly: [{ target: token("target") }],
        diagnostics: {
          sourceTokenCount: 1,
          targetTokenCount: 1,
          matchedCount: 0,
          sourceOnlyCount: 1,
          targetOnlyCount: 1,
          ambiguousGroupCount: 0
        }
      },
      "css-fallback",
      120,
      0,
      "reduced-motion"
    ),
    {
      renderer: "css-fallback",
      sourceTokenCount: 1,
      targetTokenCount: 1,
      matchedCount: 0,
      sourceOnlyCount: 1,
      targetOnlyCount: 1,
      textureCount: 0,
      durationMs: 120,
      fallbackReason: "reduced-motion"
    }
  );
});

function token(id: string) {
  return {
    id,
    text: id,
    signature: "mord",
    rect: { left: 0, top: 0, width: 10, height: 12 },
    localRect: { left: 0, top: 0, width: 10, height: 12 },
    row: 0
  };
}
