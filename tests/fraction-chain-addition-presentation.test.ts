import test from "node:test";
import assert from "node:assert/strict";
import source from "../examples/algebra/fraction-chain.json" with { type: "json" };
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";
import { resolveFractionAdditionPresentation, assertFractionAdditionPresentation } from "../src/authoring/fraction-addition-presentation.ts";
import { createKpNumeratorSplitMergeSelectorAnnotatedLatex } from "../src/rendering/numerator-split-merge-selector-annotated-latex.ts";

test("checked positive addition reuses structural merging before certified numerator arithmetic", () => {
  const result = compileFractionChain(source);
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const presentation = resolveFractionAdditionPresentation(result.compilation, 1);
  assertFractionAdditionPresentation(presentation);
  assert.throws(() => assertFractionAdditionPresentation({ ...presentation }));
  assert.throws(() => resolveFractionAdditionPresentation(result.compilation, 0));
  const merge = presentation.merge.transformations[0]!;
  assert.equal(merge.transformType, "mergeFractions");
  const merged = presentation.merge.bundle.objects.find(object => object.id === merge.targetObjectIds[0])!;
  assert.deepEqual(merged.value, { latex: "\\frac{2 + 1}{6}" });
  assert.ok(createKpNumeratorSplitMergeSelectorAnnotatedLatex(merged));
  assert.deepEqual(presentation.evaluation.bundle.objects[1]!.value, { latex: "\\frac{3}{6}" });
  const records = presentation.evaluation.transformations[0]!.correspondenceMap!.records;
  assert.equal(records.filter(record => record.relation === "identity").length, 2);
  assert.equal(records.find(record => record.relation === "fan-in")!.sourceSelectorIds.length, 3);
});
