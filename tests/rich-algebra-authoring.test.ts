import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { probeRichAlgebraAuthoring, richAlgebraTrialRequests, runRichAlgebraAuthoringTrial } from "../scripts/check-rich-algebra-authoring.ts";

test("rich lesson distinguishes source-only explanation selection from new mathematics", () => {
  const report = runRichAlgebraAuthoringTrial();
  assert.equal(report.sourceOnlyThresholdMet, false);
  const [baseline, short, math, order] = report.results;
  assert.equal(baseline!.status, "matched-intent");
  assert.equal(short!.status, "matched-intent");
  if (!short?.compiled) throw new Error("Short explanation failed to compile.");
  assert.deepEqual(short.observed.readerCheckpoints, ["factored", "products-evaluated", "collected"]);
  assert.equal(short.observed.narrationApplied, true);
  assert.equal(short.observed.operationCount, 7);
  assert.equal(short.observed.nativeSceneCount, 5);
  assert.equal(short.observed.animationUnchanged, true);
  assert.equal(short.observed.hostAgrees, true);
  assert.equal(math!.status, "repair-gap");
  assert.deepEqual(math!.gaps.map(gap => [gap.code, gap.path]), [
    ["fixture-bound-mathematics", "$.expression"], ["fixture-bound-mathematics", "$.result"]]);
  assert.equal(order!.status, "repair-gap");
  assert.ok(order!.gaps.some(gap => gap.code === "fixture-bound-operation-order" || gap.code === "compiler-rejected"));
});

test("prose containing a correct new answer cannot masquerade as compiled mathematical reuse", () => {
  const markdown = readFileSync(new URL("../content/lessons/foldable-distribution.md", import.meta.url), "utf8");
  const request = richAlgebraTrialRequests[2]!;
  const result = probeRichAlgebraAuthoring(markdown, request);
  assert.ok(result.authoredMarkdown.includes(request.expression));
  assert.ok(result.authoredMarkdown.includes(request.result));
  assert.equal(result.compiled, true);
  assert.equal(result.status, "repair-gap");
  if (!result.compiled) throw new Error("Expected the actual pinned-asset source to compile.");
  assert.equal(result.observed.result, "5x + 4");
  assert.equal(result.observed.nativeResult.replace(/\s/g, ""), "5x+4");
  assert.equal(result.observed.nativeExpression.replace(/\s/g, ""), "3(x+2)+2(x-1)");
  const equivalent = probeRichAlgebraAuthoring(markdown, { ...richAlgebraTrialRequests[0]!, expression: "5x+4" });
  assert.equal(equivalent.status, "repair-gap");
  assert.equal(equivalent.gaps[0]!.path, "$.expression");
});
