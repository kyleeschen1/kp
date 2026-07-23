import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";

const fractionModules = [
  "src/semantic/fraction-fan-out-fixture.ts",
  "src/semantic/fraction-numerator-normalization.ts",
  "src/semantic/fraction-distributed-sum-composition.ts",
  "src/semantic/fraction-reverse-factoring.ts",
  "src/semantic/fraction-solve-macro.ts"
] as const;

test("fraction composition remains renderer-neutral and route-independent", async () => {
  const macro = createKpLawfulFractionSolveMacro();
  const forbiddenSemanticKeys = new Set([
    "css",
    "dom",
    "durationMs",
    "keyframes",
    "latex",
    "pixels",
    "route",
    "selectorId",
    "style"
  ]);

  assert.deepEqual(
    [...collectKeys(macro)].filter((key) => forbiddenSemanticKeys.has(key)),
    []
  );

  for (const path of fractionModules) {
    const source = await readFile(path, "utf8");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]!);
    assert.ok(imports.every((specifier) =>
      specifier.startsWith("./") || specifier === "../animation/indexed-progress-schedule.ts"
    ), `${path} crosses the semantic or schedule boundary through ${imports.join(", ")}`);
  }
});

test("fraction pressure test reuses one semantic result across schedule policies", () => {
  const macro = createKpLawfulFractionSolveMacro();
  const normalization = macro.composition.normalization;

  assert.deepEqual(normalization.schedules.parallel.ids, normalization.schedules.sequential.ids);
  assert.deepEqual(normalization.schedules.parallel.sample(1),
    normalization.schedules.sequential.sample(1));
  assert.equal(macro.reverseFactoring.reverseLawId, "kp.algebra.distribute.v1");
  assert.deepEqual(macro.solution, { numerator: "9", denominator: "1" });
});

function collectKeys(value: unknown, keys = new Set<string>()): ReadonlySet<string> {
  if (value === null || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeys(entry, keys));
    return keys;
  }
  Object.entries(value).forEach(([key, entry]) => {
    keys.add(key);
    collectKeys(entry, keys);
  });
  return keys;
}
