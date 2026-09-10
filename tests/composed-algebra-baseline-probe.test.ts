import assert from "node:assert/strict";
import test from "node:test";
import { measureKpNativeKatexBaselineY } from "../src/rendering/native-katex-paint-geometry.ts";

test("native baseline reads one coordinate frame even when probing triggers scroll anchoring", () => {
  let probing = false;
  const marker = { style: { cssText: "" }, setAttribute() {}, remove() { probing = false; },
    getBoundingClientRect: () => ({ top: 223 }) };
  const stage = { offsetHeight: 200, getBoundingClientRect: () => ({ top: probing ? 123 : 100, height: 100 }) };
  const element = { ownerDocument: { createElement: () => marker }, append() { probing = true; } };
  // A minimal DOM double makes the old pre-probe read fail deterministically:
  // (223 - 100) * 2 = 246, instead of the native stage-relative baseline 200.
  assert.equal(Reflect.apply(measureKpNativeKatexBaselineY, undefined, [stage, element]), 200);
  assert.equal(probing, false);
  marker.getBoundingClientRect = () => { throw new Error("measurement failed"); };
  assert.throws(() => Reflect.apply(measureKpNativeKatexBaselineY, undefined, [stage, element]), /measurement failed/);
  assert.equal(probing, false);
});
