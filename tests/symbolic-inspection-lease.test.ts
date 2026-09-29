import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { createKpSymbolicInspectionLease } from "../src/semantic/symbolic-inspection-lease.ts";

function input() {
  const asset = createKpFractionCompositionEquationAsset();
  return { assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "a", targetRevision: "b" };
}
const selector = "fraction-fan-out.source.factor.numerator";
test("replaced, foreign and disposed evidence cannot satisfy a pending inspection", () => {
  const source = input(), lease = createKpSymbolicInspectionLease(source), first = lease.capture();
  lease.replace(source);
  assert.throws(() => lease.read(first, "source", selector), /stale or foreign/);
  const foreign = createKpSymbolicInspectionLease(source).capture();
  assert.throws(() => lease.read(foreign, "source", selector), /stale or foreign/);
  const current = lease.capture();
  assert.equal(lease.read(current, "source", selector).counterparts.length, 2);
  lease.dispose(); lease.dispose();
  assert.throws(() => lease.read(current, "source", selector), /disposed/);
  assert.throws(() => lease.replace(source), /disposed/);
});
test("rejected replacement and later input edits cannot corrupt captured evidence", () => {
  const source = structuredClone(input()), lease = createKpSymbolicInspectionLease(source), snapshot = lease.capture();
  assert.throws(() => lease.replace({ ...source, targetRevision: "" }), /required/);
  assert.equal(lease.capture(), snapshot);
  const before = JSON.stringify(snapshot.evidence);
  Reflect.set(source.transformation, "title", "untrusted new title");
  assert.equal(JSON.stringify(snapshot.evidence), before);
  assert.equal(lease.read(snapshot, "source", selector).counterparts.length, 2);
});
