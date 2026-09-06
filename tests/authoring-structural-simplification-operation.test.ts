import assert from "node:assert/strict";
import test from "node:test";
import { prepareKpAuthoredSimplificationOperation, readKpAuthoredSimplificationOperation, KpAuthoredSimplificationOperationError } from "../src/experiments/authoring-structural/simplification-operation.ts";
import { createKpTwoTimesOneCarrierEvidenceCandidate, createKpTwoTimesOneCarrierExemplar } from "../src/semantic/carrier-preserving-simplification-exemplar.ts";

test("simplification receipt retains explicit carrier lineage and both removals", () => {
  const operation = readKpAuthoredSimplificationOperation(prepareKpAuthoredSimplificationOperation());
  assert.notEqual(operation.recipe.carrier.sourceSelectorRef, operation.recipe.carrier.targetSelectorRef);
  assert.equal(operation.recipe.removedSyntaxCohort.selectorRefs.length, 2);
  assert.equal(operation.transformation.correspondenceMap!.records.filter(record => record.relation === "identity").length, 1);
  assert.deepEqual(operation.source.value, { latex: "2 \\times 1" });
  assert.deepEqual(operation.target.value, { latex: "2" });
});

test("equal glyphs, forged target values and receipt copies cannot grant simplification authority", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const changed = { ...exemplar, bundle: { ...exemplar.bundle, objects: exemplar.bundle.objects.map((object, i) =>
    i === 1 ? { ...object, value: { latex: "3" } } : object) } };
  assert.throws(() => prepareKpAuthoredSimplificationOperation({ exemplar: changed }),
    error => error instanceof KpAuthoredSimplificationOperationError && error.code === "kp.authoring.simplification-source-gap");
  const candidate = createKpTwoTimesOneCarrierEvidenceCandidate();
  assert.throws(() => prepareKpAuthoredSimplificationOperation({ candidate: { ...candidate,
    carrier: { ...candidate.carrier, sourceSelectorId: candidate.identityLawWitness.sourceSelectorId } } }),
    error => error instanceof KpAuthoredSimplificationOperationError && error.code === "kp.authoring.simplification-evidence-gap");
  const receipt = prepareKpAuthoredSimplificationOperation();
  for (const forged of [{ ...receipt }, JSON.parse(JSON.stringify(receipt))]) {
    assert.throws(() => readKpAuthoredSimplificationOperation(forged),
      error => error instanceof KpAuthoredSimplificationOperationError && error.code === "kp.authoring.simplification-receipt-gap");
  }
});
