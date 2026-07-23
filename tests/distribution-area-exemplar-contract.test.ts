import assert from "node:assert/strict";
import test from "node:test";
import { kpDistributionAreaExemplarContract as contract } from "../src/semantic/distribution-area-exemplar-contract.ts";

test("area exemplar freezes the exact reversible algebra and geometry", () => {
  assert.deepEqual(
    Object.values(contract.algebra.expressions).map(({ root }) => [root.id, root.kind]),
    [
      ["distribution.factored.root", "product"],
      ["distribution.distributed.root", "sum"],
      ["distribution.expanded.root", "sum"]
    ]
  );
  assert.equal(contract.algebra.distributionNormalFormPlan.rewriteLawId, "kp.algebra.distribute.v1");
  assert.equal("factoredLatex" in contract.algebra, false);
  assert.equal("expandedLatex" in contract.algebra, false);
  assert.deepEqual(
    contract.algebra.distributionNormalFormPlan.lineage[0]?.sourceSubtreeIds,
    ["distribution.factored.factor.3"]
  );
  assert.deepEqual(contract.geometry.dimensions.widths.map(({ latex }) => latex), ["x", "2"]);
  assert.deepEqual(contract.geometry.regions.map(({ areaLatex }) => areaLatex), ["3x", "6"]);
  assert.deepEqual(contract.surfaces, ["katex-algebra", "svg-area"]);
  assert.deepEqual(contract.promotion, {
    scope: "exact-exemplar-only",
    requiresHumanVisualApproval: true
  });
});

test("area exemplar contract is deeply immutable", () => {
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.algebra), true);
  assert.equal(Object.isFrozen(contract.algebra.expressions), true);
  assert.equal(Object.isFrozen(contract.algebra.distributionBindings), true);
  assert.equal(Object.isFrozen(contract.algebra.distributionNormalFormIntent), true);
  assert.equal(Object.isFrozen(contract.algebra.distributionNormalFormPlan), true);
  assert.equal(Object.isFrozen(contract.geometry), true);
  assert.equal(Object.isFrozen(contract.geometry.dimensions), true);
  assert.equal(Object.isFrozen(contract.geometry.dimensions.widths), true);
  assert.equal(Object.isFrozen(contract.geometry.regions), true);
  assert.equal(Object.isFrozen(contract.surfaces), true);
  assert.equal(Object.isFrozen(contract.promotion), true);
});
