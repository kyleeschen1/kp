import assert from "node:assert/strict";
import test from "node:test";
import { kpDistributionAreaExemplarContract as contract } from "../src/semantic/distribution-area-exemplar-contract.ts";

test("area exemplar freezes the exact reversible algebra and geometry", () => {
  assert.equal(contract.algebra.factoredLatex, "3(x+2)");
  assert.equal(contract.algebra.expandedLatex, "3x+6");
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
  assert.equal(Object.isFrozen(contract.geometry), true);
  assert.equal(Object.isFrozen(contract.geometry.dimensions), true);
  assert.equal(Object.isFrozen(contract.geometry.dimensions.widths), true);
  assert.equal(Object.isFrozen(contract.geometry.regions), true);
  assert.equal(Object.isFrozen(contract.surfaces), true);
  assert.equal(Object.isFrozen(contract.promotion), true);
});
