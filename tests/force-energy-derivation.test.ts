import { test } from "node:test";
import assert from "node:assert/strict";
import { checkForceEnergy, forceEnergySource, forceEnergyStates, assertForceEnergy } from "../domains/physics/force-energy-derivation.ts";
import { createForceEnergyPlan, type EnergyDerivationMove } from "../src/semantic/momentum-energy-derivation-plan.ts";
import { assertDerivationLocalRewrite, DerivationLocalRewriteGap } from "../src/semantic/derivation-local-rewrite.ts";
import { compileCheckedDerivation } from "../src/authoring/momentum-energy-derivation-authoring.ts";
import { createDerivationInspectionComposition } from "../src/animation/derivation-inspection-composition.ts";
import { renderForceEnergyPassage } from "../src/tutorial/mechanics-relations/momentum-energy-derivation-publication.ts";

function model() {
  const result = checkForceEnergy(forceEnergySource);
  assert.equal(result.status, "checked");
  return result.model;
}
const chain = (states: readonly string[]) => String.raw`$$\begin{aligned}${states.join(String.raw`\\`)}\end{aligned}$$`;
test("power authority requires all calculus and physics assumptions and rejects forged proofs", () => {
  for (const key of Object.keys(forceEnergySource)) {
    assert.equal(checkForceEnergy({ ...forceEnergySource, [key]: "unsupported" }).status, "repair-required");
    const partial = { ...forceEnergySource } as Record<string, unknown>; delete partial[key];
    assert.equal(checkForceEnergy(partial).status, "repair-required");
  }
  const checked = model();
  assert.throws(() => assertForceEnergy({ ...checked }), /original fixed-mass/);
  assert.equal(checkForceEnergy({ ...forceEnergySource, state: "claimed-proof" }).status, "repair-required");
});
test("coarse inspection composes the same exact checked product-rule children", () => {
  const checked = model(), coarse = createForceEnergyPlan(checked), fine = createForceEnergyPlan(checked, "mass-refinement");
  const composition = createDerivationInspectionComposition(coarse, fine, 0);
  assert.deepEqual(composition.indices, [0, 1, 2, 3, 4]);
  assert.equal(coarse.view.states[0], fine.view.states[0]);
  assert.equal(coarse.view.states.at(-1), fine.view.states.at(-1));
  assert.throws(() => createDerivationInspectionComposition(coarse, createForceEnergyPlan(model(), "mass-refinement"), 0), /same checked/);
  const compiled = compileCheckedDerivation(fine);
  const product = compiled.moves[0]!;
  assert.ok(product.transformation.correspondenceMap);
  assert.equal(product.transformation.correspondenceMap.records.filter(record => record.relation === "fan-out").length, 2);
  assert.equal(new Set(product.sourceRoles).size, product.sourceRoles.length);
  assert.equal(new Set(product.targetRoles).size, product.targetRoles.length);
  assert.match(product.annotated[1]!, /derivative-first/);
  assert.match(product.annotated[1]!, /derivative-second/);
  assert.equal(compiled.moves.length, 5);
});

test("local rewrites require precise roles and cannot replace surviving factors", () => {
  const plan = createForceEnergyPlan(model(), "mass-refinement");
  const collect = plan.moves[2]!, cancel = plan.moves[3]!, associate = plan.moves[4]!;
  assert.equal(collect.rewrite?.kind, "equal-term-collection");
  assert.equal(cancel.rewrite?.kind, "matched-factor-cancellation");
  assert.equal(associate.rewrite?.kind, "scalar-reassociation");
  for (const move of [collect, cancel, associate]) {
    assert.ok(move.rewrite);
    assert.doesNotThrow(() => assertDerivationLocalRewrite(move.rewrite!, move));
    assert.throws(() => assertDerivationLocalRewrite(move.rewrite!, { ...move, persist: [] }), DerivationLocalRewriteGap);
  }
  assert.deepEqual(cancel.exits, ["denominator-two", "two"]);
  assert.ok(cancel.persist.includes("mass"));
  assert.throws(() => assertDerivationLocalRewrite(cancel.rewrite!, { ...cancel, exits: [...cancel.exits, "mass"] }), /both surviving/);
  const compiled = compileCheckedDerivation(plan);
  assert.equal(compiled.moves[2]!.transformation.correspondenceMap!.records.filter(record => record.relation === "fan-in").length, 1);
  assert.equal(compiled.moves[3]!.transformation.correspondenceMap!.records.filter(record => record.relation === "cancelation").length, 1);
  assert.match(compiled.moves[3]!.annotated[1]!, /cancel-two\.1\.mass/);
  // @ts-expect-error A cancellation cannot be constructed with just lifecycle lists.
  const unbound: EnergyDerivationMove = { id: "bad", operationKind: "cancel-two", split: false, persist: [], exits: [], entries: [] };
  void unbound;
  // @ts-expect-error Collection cannot silently select the cancellation contract.
  const mismatched: EnergyDerivationMove = { ...cancel, operationKind: "collect-terms", rewrite: { kind: "matched-factor-cancellation", pair: ["a", "b"], survivors: ["m"] } };
  void mismatched;
});
test("static power publication preserves reasoning and rejects stale endpoints", () => {
  const endpoints = [forceEnergyStates[0]!, forceEnergyStates.at(-1)!];
  const result = renderForceEnergyPassage("Constant mass.\n\n" + chain(endpoints) + "\n\nNewton's law is a physical premise.", "power-test");
  assert.match(result, /Smaller product-rule steps/);
  assert.match(result, /Differentiate each factor once/);
  assert.match(result, /Newton/);
  assert.match(result, /data-derivation-namespace="power"/);
  assert.throws(() => renderForceEnergyPassage(chain([endpoints[0]!, "P=0"]), "wrong"), /source changed/);
});
