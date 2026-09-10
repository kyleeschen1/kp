import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import legacy from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { KpComposedAlgebraRepair, readKpComposedAlgebraSource } from "../src/authoring/composed-algebra-source.ts";
import { readKpComposedAlgebraSourceV2, parseKpComposedAlgebraSourceV2, type KpComposedAlgebraSourceV2 } from "../src/authoring/composed-algebra-source-v2.ts";
import { normalizeKpComposedAlgebraEndpointsV2 } from "../src/authoring/composed-algebra-normalizer-v2.ts";

test("bounded v2 source supports four/five states without widening v1", () => {
  for (const count of [4, 5]) {
    const raw = { ...primary, states: primary.states.slice(0, count) };
    const source = readKpComposedAlgebraSourceV2(raw);
    assert.equal(source.states.length, count);
    assert.deepEqual(parseKpComposedAlgebraSourceV2(JSON.stringify(raw)), source);
    assert.ok(Object.isFrozen(source) && Object.isFrozen(source.states) && source.states.every(Object.isFrozen));
    assert.equal(normalizeKpComposedAlgebraEndpointsV2(source).length, count);
    assert.throws(() => readKpComposedAlgebraSource(raw), KpComposedAlgebraRepair);
  }
  assert.equal(readKpComposedAlgebraSource(legacy).states.length, 3);
  assert.throws(() => readKpComposedAlgebraSourceV2(legacy), KpComposedAlgebraRepair);
  // The source contract itself excludes arbitrary-length or legacy sequences.
  // @ts-expect-error v1 is not an extended authored sequence
  const unsupported: KpComposedAlgebraSourceV2 = readKpComposedAlgebraSource(legacy);
  void unsupported;
});

test("extended source rejects count drift, duplicate ids and hidden authority", () => {
  for (const states of [[], primary.states.slice(0, 3), [...primary.states, primary.states[0]],
    primary.states.map((state, i) => i === 4 ? { ...state, id: primary.states[0]!.id } : state)])
    assert.throws(() => readKpComposedAlgebraSourceV2({ ...primary, states }), KpComposedAlgebraRepair);
  for (const extra of [{ proof: {} }, { timing: [] }, { operations: ["distribute"] }])
    assert.throws(() => readKpComposedAlgebraSourceV2({ ...primary, ...extra }), KpComposedAlgebraRepair);
  let invoked = false;
  const states = [...primary.states];
  Object.defineProperty(states, "3", { get() { invoked = true; return primary.states[3]; } });
  assert.throws(() => readKpComposedAlgebraSourceV2({ ...primary, states }), KpComposedAlgebraRepair);
  assert.equal(invoked, false);
  assert.throws(() => parseKpComposedAlgebraSourceV2("{"), KpComposedAlgebraRepair);
  assert.throws(() => parseKpComposedAlgebraSourceV2(" ".repeat(20_001)), KpComposedAlgebraRepair);
});

test("extended normalization retains located scalar syntax repairs at later states", () => {
  for (const i of [3, 4]) {
    const raw = { ...primary, states: primary.states.map((state, index) => index === i ? { ...state, latex: "5x+z" } : state) };
    assert.throws(() => normalizeKpComposedAlgebraEndpointsV2(readKpComposedAlgebraSourceV2(raw)),
      (error: unknown) => error instanceof KpComposedAlgebraRepair && error.path === `$.states[${i}].latex` && error.code === "undeclared-symbol");
  }
});
