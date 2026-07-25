import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { reportKpGlyphReconciliationBackendCapabilities } from "../src/animation/semantic-glyph-reconciliation-capabilities.ts";
import {
  createKpCrowdedQuadraticGlyphReconciliationCase,
  createKpFractionMergeGlyphReconciliationCase,
  createKpQuadraticPlusMinusGlyphReconciliationCase,
  createKpSolveXGlyphReconciliationCase
} from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("all four cases compile offline with explicit backend capability dispositions", async () => {
  const cases = [
    createKpSolveXGlyphReconciliationCase(),
    createKpFractionMergeGlyphReconciliationCase(),
    createKpQuadraticPlusMinusGlyphReconciliationCase(),
    createKpCrowdedQuadraticGlyphReconciliationCase("wide")
  ];
  const compiled = await Promise.all(cases.map(compileKpGlyphReconciliationCase));

  assert.equal(compiled.length, 4);
  cases.forEach((caseInput) => {
    for (const backendId of ["static-js", "headless"] as const) {
      const report = reportKpGlyphReconciliationBackendCapabilities({
        backendId,
        requiredCapabilities: caseInput.requiredCapabilities
      });
      assert.equal(report.runtimeDependencies, "none");
      assert.equal(report.capabilities.length, caseInput.requiredCapabilities.length);
      assert.equal(report.capabilities.some(({ disposition }) => disposition === "rejected"), false);
    }
  });
});

test("headless lowering is explicit while static JS preserves interaction", () => {
  const requiredCapabilities = createKpFractionMergeGlyphReconciliationCase()
    .requiredCapabilities;
  const headless = reportKpGlyphReconciliationBackendCapabilities({
    backendId: "headless",
    requiredCapabilities
  });
  const staticJs = reportKpGlyphReconciliationBackendCapabilities({
    backendId: "static-js",
    requiredCapabilities
  });

  assert.equal(
    headless.capabilities.find(({ capability }) => capability === "cloze")?.disposition,
    "lowered-static-evidence"
  );
  assert.ok(staticJs.capabilities.every(({ disposition }) => disposition === "preserved"));
});

test("experiment runtime sources contain no network or external authoring runtime", async () => {
  const files = [
    "canonical-operation-lineage-adapter.ts",
    "glyph-reconciliation-plan.ts",
    "lineage-constrained-glyph-matcher.ts",
    "native-notation-measurement.ts",
    "bounded-glyph-clearance-scheduler.ts",
    "headless-notation-measurement-backend.ts",
    "static-js-glyph-reconciliation-renderer.ts",
    "semantic-glyph-reconciliation-compiler.ts"
  ];
  const source = (await Promise.all(files.map((file) =>
    readFile(new URL(`../src/animation/${file}`, import.meta.url), "utf8")
  ))).join("\n");

  assert.doesNotMatch(source, /\bfetch\s*\(|WebSocket|EventSource|child_process/);
  assert.doesNotMatch(source, /\b(openai|manim|python|computer-algebra-system)\b/i);
});
