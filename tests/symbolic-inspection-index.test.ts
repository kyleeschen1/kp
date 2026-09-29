import assert from "node:assert/strict";
import test from "node:test";
import { createKpFractionCompositionEquationAsset } from "../src/semantic/fraction-composition-equation-asset.ts";
import { createKpSymbolicInspectionIndex } from "../src/semantic/symbolic-inspection-index.ts";

function index() {
  const asset = createKpFractionCompositionEquationAsset();
  return createKpSymbolicInspectionIndex({ assetId: asset.bundle.id, bundle: asset.bundle, transformation: asset.transformations[0]!, sourceRevision: "a", targetRevision: "b" });
}
test("both factor descendants lead back to one source without rewriting fan-out", () => {
  const lookup = index();
  const source = lookup.lookup("source", "fraction-fan-out.source.factor.numerator");
  assert.equal(source.counterparts.length, 2);
  for (const target of source.counterparts) {
    const reverse = lookup.lookup("target", target.selectorId);
    assert.deepEqual(reverse.counterparts, [source.occurrence]);
    assert.equal(reverse.records[0]!.relation, "fan-out");
  }
});
test("retired grouping has no fabricated destination; introductions have no fabricated source", () => {
  const lookup = index();
  const grouping = lookup.lookup("source", "fraction-fan-out.source.grouped-sum.left-parenthesis");
  assert.equal(grouping.counterparts.length, 0);
  assert.equal(grouping.records[0]!.relation, "removal");
  const punctuation = lookup.lookup("target", "fraction-fan-out.target.term.x.operator.1");
  assert.equal(punctuation.counterparts.length, 0);
  assert.equal(punctuation.records[0]!.relation, "introduction");
  assert.throws(() => lookup.lookup("source", punctuation.occurrence.selectorId), /Unknown source occurrence/);
});
