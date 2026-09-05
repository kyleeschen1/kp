import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredMarketSource, KpAuthoringMarketSourceError } from "../src/experiments/typed-linear-supply-demand/authoring-market-source.ts";
import { createKpEconomicsSupplyTaxAnimationAsset } from "../src/animation/economics-supply-tax-asset.ts";
import { kpSupplyTaxOperationRegistration, resolveKpSupplyTaxOperation } from "../src/experiments/typed-linear-supply-demand/economics-supply-tax-governed-source.ts";
import { verifyKpPerUnitTaxOperation, KpPerUnitTaxOperationError } from "../domains/economics/per-unit-tax-operation.ts";
import { validateCorrespondenceMap, checkCorrespondenceMapRewindLaw } from "../src/semantic/correspondence.ts";
import { compileKpGovernedCanonicalConstruction } from "../src/authoring/governed-canonical-construction-compiler.ts";

test("authored canonical tax lowers through exact domain laws and complete occurrence lineage", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const { source } = authored;
  assert.deepEqual(source.canonical, createKpEconomicsSupplyTaxAnimationAsset());
  assert.equal(source.compilation.kind, "verified-governed-canonical-construction");
  assert.equal(source.stateTransition.before.snapshotId, authored.application.commit.before.id);
  assert.equal(source.stateTransition.after.snapshotId, authored.application.commit.after.id);
  assert.equal(source.authority.animation.renderTargets.length, 0);
  const map = source.authority.animation.transformations[0]!.correspondenceMap!;
  assert.deepEqual(validateCorrespondenceMap(map, source.lifecycle), []);
  assert.deepEqual(checkCorrespondenceMapRewindLaw(map), []);
  const split = map.records.find(record => record.relation === "fan-out")!;
  assert.equal(split.sourceSelectorIds.length, 1);
  assert.equal(split.targetSelectorIds.length, 2);
  assert.equal(map.records.filter(record => record.relation === "identity").length, 3);
  assert.ok(map.records.filter(record => record.id.includes("parameter.economics"))
    .every(record => record.relation !== "identity"));
  assert.ok(Object.isFrozen(source.authority.animation.bundle.objects[0]!.value));
});

test("generic and copied state applications cannot acquire local lowering authority", () => {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  assert.throws(() => authored.lower({ ...authored.application }), KpAuthoringMarketSourceError);
  const other = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  assert.throws(() => authored.lower(other.application), KpAuthoringMarketSourceError);
  assert.throws(() => createKpAuthoredMarketSource({
    // @ts-expect-error State updates are not domain operation requests.
    kind: "update"
  }), KpAuthoringMarketSourceError);
  assert.deepEqual(authored.lower(authored.application), authored.source);
});

test("exact source revisions and economics operation pins fail closed", () => {
  const { source } = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const pin = source.authority.operationPacks[0]!;
  assert.equal(resolveKpSupplyTaxOperation(pin, source.stateTransition.operationId), kpSupplyTaxOperationRegistration.operation);
  assert.throws(() => resolveKpSupplyTaxOperation({ ...pin, version: "2.0.0" }, source.stateTransition.operationId), /exact registered/);
  assert.throws(() => resolveKpSupplyTaxOperation({ ...pin, packId: "kp.algebra" }, source.stateTransition.operationId), /exact registered/);
  assert.throws(() => compileKpGovernedCanonicalConstruction({ authority: source.authority,
    request: { ...source.request, source: { ...source.request.source, revisionId: "stale" } } }), /revision/);
  assert.throws(() => compileKpGovernedCanonicalConstruction({ authority: source.authority,
    request: { ...source.request, source: { ...source.request.source, operationPacks: [{ ...pin, version: "2.0.0" }] } } }), /pins/);
});

test("domain verification recomputes observed values instead of trusting truth flags", () => {
  const { source } = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const { model, accounting } = source.canonical.semantics;
  const evidence = { source: model.input,
    before: { market: model.states.untaxed, accounting: accounting.states.untaxed },
    after: { market: model.states.taxed, accounting: accounting.states.taxed } };
  assert.throws(() => verifyKpPerUnitTaxOperation({ ...evidence, after: { ...evidence.after,
    market: { ...evidence.after.market, quantity: { numerator: "99", denominator: "1" } } } }),
    error => error instanceof KpPerUnitTaxOperationError && error.path === "after.market");
});

test("different authored values cannot reuse a source revision through session-local pins", () => {
  const original = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax" });
  const variant = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: {
    demandPriceIntercept: { numerator: "14", denominator: "1" },
    taxAmount: { numerator: "2", denominator: "1" }
  } });
  assert.deepEqual(original.source.stateTransition.before, variant.source.stateTransition.before);
  assert.notEqual(original.source.authority.revisionId, variant.source.authority.revisionId);
  assert.throws(() => compileKpGovernedCanonicalConstruction({ authority: variant.source.authority,
    request: original.source.request }), /revision/);
});
