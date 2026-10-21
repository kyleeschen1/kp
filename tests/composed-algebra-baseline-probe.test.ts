import assert from "node:assert/strict";
import test from "node:test";
import { measureKpNativeKatexBaselineY, measureKpNativeKatexBaselines } from "../src/rendering/native-katex-paint-geometry.ts";

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

test("batched baselines separate probe writes from reads and always release every probe", () => {
  const events: string[] = [];
  const active = new Set<number>();
  let failRead = false;
  let failAppend = false;
  const elements = [0, 1, 2].map(index => ({
    childElementCount: 0,
    textContent: "x",
    ownerDocument: { createElement: () => ({
      style: { cssText: "" }, setAttribute() {},
      remove() { events.push(`remove:${index}`); active.delete(index); },
      getBoundingClientRect() {
        events.push(`read:${index}`);
        assert.equal(active.size, 3);
        if (failRead && index === 1) throw new Error("read failed");
        return { top: 223 + index };
      }
    }) },
    append() {
      events.push(`append:${index}`); active.add(index);
      if (failAppend && index === 1) throw new Error("append failed");
    }
  }));
  const stage = { offsetHeight: 200, getBoundingClientRect() {
    assert.equal(active.size, 3);
    events.push("stage"); return { top: 123, height: 100 };
  } };
  const measure = () => Reflect.apply(measureKpNativeKatexBaselines, undefined, [stage, elements]);
  assert.deepEqual(measure(), [200, 202, 204]);
  assert.deepEqual(events, ["append:0", "append:1", "append:2", "read:0", "read:1", "read:2", "stage", "remove:0", "remove:1", "remove:2"]);
  assert.equal(active.size, 0);
  events.length = 0;
  assert.deepEqual(measure(), [200, 202, 204]);
  assert.equal(events.length, 10, "a later observation measures afresh");
  failRead = true;
  assert.throws(measure, /read failed/);
  assert.equal(active.size, 0);
  failAppend = true;
  assert.throws(measure, /append failed/);
  assert.equal(active.size, 0);
  assert.deepEqual(Reflect.apply(measureKpNativeKatexBaselines, undefined, [stage, []]), []);
});

test("compound or empty owners retain individual baseline probes", () => {
  for (const shape of [{ childElementCount: 1, textContent: "x" }, { childElementCount: 0, textContent: "" }]) {
    let active = 0;
    let maximum = 0;
    const element = { ...shape,
      ownerDocument: { createElement: () => ({ style: { cssText: "" }, setAttribute() {},
        remove() { active--; }, getBoundingClientRect: () => ({ top: 30 }) }) },
      append() { maximum = Math.max(maximum, ++active); }
    };
    const stage = { offsetHeight: 100, getBoundingClientRect: () => ({ top: 10, height: 100 }) };
    assert.deepEqual(Reflect.apply(measureKpNativeKatexBaselines, undefined, [stage, [element, element]]), [20, 20]);
    assert.equal(maximum, 1);
    assert.equal(active, 0);
  }
});
