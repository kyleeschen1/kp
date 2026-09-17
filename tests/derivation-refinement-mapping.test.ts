import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource } from "../domains/public-api.ts";
import { createEnergyDerivationPlan, unfoldDerivationInspection } from "../src/semantic/momentum-energy-derivation-plan.ts";
import { createDerivationRefinementMapping } from "../src/animation/derivation-inspection-composition.ts";
import { compileCheckedDerivation } from "../src/authoring/momentum-energy-derivation-authoring.ts";

function fixture() {
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  if (checked.status !== "checked") throw new Error(checked.code);
  return createEnergyDerivationPlan(checked.model);
}

test("nonterminal refinement preserves downstream identity and maps the issued child clock", () => {
  const coarse = fixture(), fine = unfoldDerivationInspection(coarse, "scale-magnitude");
  const mapping = createDerivationRefinementMapping(coarse, fine);
  assert.deepEqual(fine.moves.map(move => move.id), ["substitute", "extract-norm-scale", "square-quotient", "cancel-mass"]);
  assert.equal(fine.moves[3], coarse.moves[2]);
  assert.deepEqual(mapping.rows, [{ coarse: 0, fine: 0 }, { coarse: 1, fine: 1 }, { coarse: 2, fine: 3 }, { coarse: 3, fine: 4 }]);
  assert.deepEqual(mapping.mapAlgebra(0), { transition: "extract-norm-scale", progress: 0 });
  assert.deepEqual(mapping.mapAlgebra(.25), { transition: "extract-norm-scale", progress: .5 });
  assert.deepEqual(mapping.mapAlgebra(.5), { transition: "square-quotient", progress: 0 });
  assert.deepEqual(mapping.mapAlgebra(.75), { transition: "square-quotient", progress: .5 });
  assert.deepEqual(mapping.mapAlgebra(1), { transition: "square-quotient", progress: 1 });
  assert.equal(compileCheckedDerivation(fine).moves.length, 4);
  for (const invalid of [NaN, Infinity, -.01, 1.01]) assert.throws(() => mapping.mapAlgebra(invalid));
});

test("shared endpoints alone never grant an interior percentage mapping", () => {
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  if (checked.status !== "checked") throw new Error(checked.code);
  const coarse = createEnergyDerivationPlan(checked.model), fine = createEnergyDerivationPlan(checked.model, "mass-refinement");
  const mapping = createDerivationRefinementMapping(coarse, fine);
  assert.equal(mapping.mapAlgebra(.5), undefined);
  assert.equal(mapping.mapAlgebra(0)?.progress, 0);
  assert.equal(mapping.mapAlgebra(1)?.progress, 1);
});

test("copied plans, wrong parents, other models and recursive disclosure cannot issue correspondence", () => {
  const coarse = fixture(), fine = unfoldDerivationInspection(coarse, "scale-magnitude");
  assert.throws(() => unfoldDerivationInspection({ ...coarse }, "scale-magnitude"));
  assert.throws(() => unfoldDerivationInspection(coarse, "substitute"));
  assert.throws(() => unfoldDerivationInspection(fine, "scale-magnitude"));
  assert.throws(() => createDerivationRefinementMapping(fixture(), fine));
  assert.throws(() => createDerivationRefinementMapping(coarse, { ...fine, view: { ...fine.view, states: ["false endpoint"] } }));
});
