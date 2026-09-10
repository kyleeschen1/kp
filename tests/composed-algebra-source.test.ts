import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import legacy from "../src/authoring/examples/common-factor-primary.json" with { type: "json" };
import { readKpComposedAlgebraSource, parseKpComposedAlgebraSource, KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { readKpCommonFactorSource } from "../src/authoring/common-factor-source.ts";

test("three-state source round-trips frozen data and stays distinct from M1a", () => {
  const source = readKpComposedAlgebraSource(primary);
  assert.deepEqual(source, primary);
  assert.deepEqual(parseKpComposedAlgebraSource(JSON.stringify(source)), source);
  assert.ok(Object.isFrozen(source.states) && source.states.every(Object.isFrozen));
  assert.ok(Object.isFrozen(source.symbols) && Object.isFrozen(source.editorial));
  assert.throws(() => readKpCommonFactorSource(source));
  assert.throws(() => readKpComposedAlgebraSource(legacy), KpComposedAlgebraRepair);
});

test("chain syntax rejects count drift, duplicate identities and invented authority", () => {
  for (const value of [
    { ...primary, states: primary.states.slice(0, 2) },
    { ...primary, states: [...primary.states, primary.states[2]] },
    { ...primary, states: [primary.states[0], primary.states[0], primary.states[2]] },
    { ...primary, proof: true }, { ...primary, geometry: {} },
    { ...primary, symbols: ["x", "x"] }, { ...primary, symbols: ["foo"] },
    { ...primary, states: primary.states.map(s => ({ ...s, timing: 10 })) },
    Object.create(primary), { ...primary, domain: "complex" }
  ]) assert.throws(() => readKpComposedAlgebraSource(value), KpComposedAlgebraRepair);
  assert.throws(() => parseKpComposedAlgebraSource("{"), KpComposedAlgebraRepair);
  assert.throws(() => parseKpComposedAlgebraSource(" ".repeat(20_001)), KpComposedAlgebraRepair);
  const access = { ...primary };
  Object.defineProperty(access, "id", { get() { throw new Error("getter executed"); }, enumerable: true });
  assert.throws(() => readKpComposedAlgebraSource(access), KpComposedAlgebraRepair);
});
