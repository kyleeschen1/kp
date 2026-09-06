import assert from "node:assert/strict";
import test from "node:test";
import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { fractionCompositionCanonicalHostProvenance } from "../src/reader/app/equation-lesson-descriptors/fraction-composition-host-provenance.ts";
import { kpFractionCompositionPreservationManifest } from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";
import { createKpTwoTimesOneCarrierExemplar, createKpTwoTimesOneCarrierEvidenceCandidate } from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import { kpVerifiedCarrierPreservingSimplificationReleaseApproval } from "../src/architecture/carrier-preserving-simplification-release-approval.ts";

test("structural authoring pins the reviewed fraction distribution, not a different distribution demo", () => {
  const macro = createKpLawfulFractionSolveMacro();
  const asset = createKpFractionCompositionEquationAsset();
  const step = macro.steps[0]!;
  const transformation = asset.transformations[0]!;
  assert.equal(step.id, "fraction-solve.step.distribute");
  assert.equal(step.transformType, "distributeMultiplication");
  assert.deepEqual([step.sourceStateId, step.targetStateId], [
    "fraction-solve.state.factored", "fraction-solve.state.distributed"
  ]);
  assert.equal(asset.sourceTraceId, macro.id);
  assert.deepEqual(transformation.sourceObjectIds, [macro.states[0]!.id]);
  assert.deepEqual(transformation.targetObjectIds, [macro.states[1]!.id]);
  assert.deepEqual(transformation.lawRefs?.map(law => law.id), step.authorityIds);
  assert.equal(fractionCompositionCanonicalHostProvenance.representation.href, "/reader/fraction-composition/");
  assert.equal(fractionCompositionCanonicalHostProvenance.animationId,
    kpFractionCompositionPreservationManifest.libraryEntryId);
});

test("distribution reference includes authored fan-out and removal rather than glyph-inferred identity", () => {
  const transformation = createKpFractionCompositionEquationAsset().transformations[0]!;
  const records = transformation.correspondenceMap!.records;
  const copies = records.filter(record => record.relation === "fan-out");
  assert.equal(copies.length, 3);
  for (const copy of copies) {
    assert.equal(copy.sourceSelectorIds.length, 1);
    assert.equal(copy.targetSelectorIds.length, 2);
  }
  assert.equal(records.filter(record => record.relation === "removal").length, 2);
  assert.equal(kpFractionCompositionPreservationManifest.motifContract.transformTypes.distributeMultiplication,
    "copy-fan-out");
  assert.equal(kpFractionCompositionPreservationManifest.paintContract.canonicalPaintPolicy, "exclusive-when-active");
});

test("second structural reference preserves the carrier and removes only declared identity syntax", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const evidence = createKpTwoTimesOneCarrierEvidenceCandidate();
  assert.equal(exemplar.id, "operation-evaluation.two-times-one-carrier");
  assert.equal(evidence.transformationId, exemplar.transformation.id);
  assert.equal(exemplar.transformation.transformType, "simplifyMultiplicativeIdentity");
  const records = exemplar.transformation.correspondenceMap!.records;
  assert.deepEqual(records.map(record => record.relation), ["identity", "removal", "removal"]);
  assert.notEqual(evidence.carrier.sourceSelectorId, evidence.carrier.targetSelectorId);
  assert.equal(evidence.removedSyntaxCohort.selectorIds.length, 2);
  assert.equal(kpVerifiedCarrierPreservingSimplificationReleaseApproval.reviewDecision,
    "approved-after-two-caller-and-ink-conformance");
});
