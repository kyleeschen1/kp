import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentLifecycles } from "../src/animation/log-exponent-lifecycle.ts";

test("every visible log-exponent entity receives one causal lifecycle", () => {
  assert.equal(kpCanonicalLogExponentLifecycles.length, 3);
  for (const plan of kpCanonicalLogExponentLifecycles) {
    const sourceIds = plan.lifecycle.records.flatMap(({ sourceEntityIds }) => sourceEntityIds);
    const targetIds = plan.lifecycle.records.flatMap(({ targetEntityIds }) => targetEntityIds);
    assert.deepEqual([...sourceIds].sort(), [...plan.sourceEntityIds].sort());
    assert.deepEqual([...targetIds].sort(), [...plan.targetEntityIds].sort());
    assert.equal(new Set(sourceIds).size, sourceIds.length);
    assert.equal(new Set(targetIds).size, targetIds.length);
  }
});

test("canonical lifecycle distinguishes continuants from causal structure changes", () => {
  assert.deepEqual(
    kpCanonicalLogExponentLifecycles.map(({ lifecycle }) =>
      lifecycle.records.map(({ kind }) => kind)
    ),
    [
      ["continuant", "continuant", "continuant", "continuant", "continuant", "introduction"],
      ["continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "elimination", "elimination", "introduction"],
      ["continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "continuant", "elimination", "introduction"]
    ]
  );
  const extractionIntroduction = kpCanonicalLogExponentLifecycles[1]!
    .lifecycle.records.at(-1)!;
  assert.equal(extractionIntroduction.kind, "introduction");
  if (extractionIntroduction.kind === "introduction") {
    assert.equal(extractionIntroduction.cause.kind, "structural-realization");
  }
});
