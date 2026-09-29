import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { createKpSymbolicInspectionLease } from "../src/semantic/symbolic-inspection-lease.ts";
import { createKpInspectionSelection } from "../src/experiments/authoring-distribution-focus-card/inspection-selection.ts";

test("inspection uses reader focus precedence and clears back to pointer context", () => {
  const asset = createKpFractionCompositionEquationAsset();
  const lease = createKpSymbolicInspectionLease({ assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "a", targetRevision: "b" });
  const selection = createKpInspectionSelection(lease);
  const a = "fraction-fan-out.source.factor.numerator", b = "fraction-fan-out.target.factor.x.numerator";
  selection.select("source", a, "pointer");
  selection.select("target", b, "keyboard");
  assert.equal(selection.read()!.occurrence.selectorId, b);
  assert.deepEqual(selection.paintFocus().objectRefs, [b]);
  selection.clear("keyboard");
  assert.equal(selection.read()!.occurrence.selectorId, a);
  assert.throws(() => selection.select("source", b, "keyboard"), /Unknown/);
  assert.equal(selection.read()!.occurrence.selectorId, a);
  lease.dispose();
  assert.throws(() => selection.paintFocus(), /disposed/);
  selection.dispose();
  assert.throws(() => selection.select("source", a, "pointer"), /disposed/);
});
