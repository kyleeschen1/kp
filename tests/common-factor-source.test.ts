import assert from "node:assert/strict";
import test from "node:test";
import { readKpCommonFactorSource, parseKpCommonFactorSource, KpCommonFactorRepair } from "../src/authoring/common-factor-source.ts";

export function commonFactorSource() {
  return { schemaVersion: "kp.common-factor-source.v1", id: "lesson.common-factor.primary", domain: "real-scalars",
    symbols: ["a", "b", "c"], states: [
      { id: "state.expanded", latex: "ab+ac", narration: "The same factor appears in both products." },
      { id: "state.factored", latex: "a(b+c)", narration: "One shared factor multiplies the sum." }
    ], editorial: { title: "Find the shared factor", setup: "Read both products before changing their grouping.", summary: "Factoring uses the distributive law in the opposite direction." } };
}

test("bounded source round-trips without caller-owned mutable data", () => {
  const input = commonFactorSource(), source = readKpCommonFactorSource(input);
  assert.deepEqual(parseKpCommonFactorSource(JSON.stringify(source)), source);
  input.symbols[0] = "z";
  assert.equal(source.symbols[0], "a");
  assert.ok(Object.isFrozen(source.states[0]));
});

test("source rejects proof, geometry, shape, symbol and transport forgery at exact paths", () => {
  for (const [value, path] of [
    [{ ...commonFactorSource(), verified: true }, "$.verified"],
    [{ ...commonFactorSource(), symbols: ["ab"] }, "$.symbols[0]"],
    [{ ...commonFactorSource(), symbols: ["a", "a"] }, "$.symbols"],
    [{ ...commonFactorSource(), states: [] }, "$.states"],
    [{ ...commonFactorSource(), editorial: { ...commonFactorSource().editorial, durationMs: 500 } }, "$.editorial.durationMs"],
    [JSON.parse('{"__proto__":{},"schemaVersion":"kp.common-factor-source.v1"}'), "$.__proto__"]
  ] as const) assert.throws(() => readKpCommonFactorSource(value), (e: unknown) => e instanceof KpCommonFactorRepair && e.path === path);
  assert.throws(() => parseKpCommonFactorSource(" ".repeat(20_001)), KpCommonFactorRepair);
});
