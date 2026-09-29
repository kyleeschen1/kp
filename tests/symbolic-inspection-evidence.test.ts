import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { projectKpSymbolicInspectionEvidence } from "../src/semantic/symbolic-inspection-evidence.ts";

function input() {
  const asset = createKpFractionCompositionEquationAsset();
  return { assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "before.1", targetRevision: "after.1" };
}
test("inspection exposes real fan-out without turning declared laws into proofs", () => {
  const source = input(), evidence = projectKpSymbolicInspectionEvidence(source);
  assert.equal(evidence.transformationId, "fraction-solve.step.distribute");
  assert.ok(evidence.correspondence.some(record => record.relation === "fan-out"));
  assert.equal(evidence.checks.filter(check => check.status === "checked").length, 1);
  assert.deepEqual(evidence.checks.filter(check => check.status === "declared").map(check => check.law), source.transformation.lawRefs);
  assert.ok(Object.isFrozen(evidence.correspondence[0]!.targetSelectorIds));
  assert.notEqual(evidence.correspondence[0], source.transformation.correspondenceMap!.records[0]);
});
test("inspection rejects missing and wrong-endpoint references", () => {
  const source = input(), transformation = source.transformation;
  assert.throws(() => projectKpSymbolicInspectionEvidence({ ...source, transformation: { ...transformation, sourceObjectIds: ["missing"] } }), /missing/);
  const record = transformation.correspondenceMap!.records[0]!;
  assert.throws(() => projectKpSymbolicInspectionEvidence({ ...source, transformation: { ...transformation,
    correspondenceMap: { id: "bad", records: [{ ...record, sourceSelectorIds: record.targetSelectorIds.slice(0, 1) }] }
  } }), /outside this transformation endpoint/);
});
test("inspection requires explicit revision provenance", () => {
  const source = input();
  assert.throws(() => projectKpSymbolicInspectionEvidence({ ...source, sourceRevision: "" }), /reference is required/);
  assert.throws(() => projectKpSymbolicInspectionEvidence({ ...source, targetRevision: source.sourceRevision }), /distinct/);
});
