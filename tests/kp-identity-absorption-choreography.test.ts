import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpIdentityAbsorptionChoreography,
  sampleKpIdentityAbsorptionChoreography
} from "../src/animation/identity-absorption-choreography.ts";

const plan = () => compileKpIdentityAbsorptionChoreography({
  id: "identity.add-zero",
  operationKind: "absorb-additive-zero",
  continuantRecordIds: ["x", "equals", "four"],
  operatorRecordId: "plus",
  identityRecordId: "zero",
  anchorRecordId: "x"
});

test("identity absorption previews the identity bundle before it changes", () => {
  const preview = sampleKpIdentityAbsorptionChoreography({ plan: plan(), progress: 0.12 });
  assert.ok(preview.focusStrength > 0.8);
  assert.ok(preview.reflowProgress > 0);
  assert.equal(preview.operatorFoldProgress, 0);
  assert.equal(preview.identityAbsorptionProgress, 0);
});

test("operator folding leads identity absorption and native settlement", () => {
  const folding = sampleKpIdentityAbsorptionChoreography({ plan: plan(), progress: 0.5 });
  assert.ok(folding.operatorFoldProgress > folding.identityAbsorptionProgress);
  assert.equal(folding.settlementProgress, 0);

  const absorbed = sampleKpIdentityAbsorptionChoreography({ plan: plan(), progress: 0.82 });
  assert.equal(absorbed.operatorFoldProgress, 1);
  assert.equal(absorbed.identityAbsorptionProgress, 1);
  assert.ok(absorbed.settlementProgress > 0);
});

test("identity absorption releases focus only after semantic absorption", () => {
  const release = sampleKpIdentityAbsorptionChoreography({ plan: plan(), progress: 0.9 });
  assert.equal(release.identityAbsorptionProgress, 1);
  assert.ok(release.settlementProgress > 0.5);
  assert.ok(release.focusStrength < 0.5);
});

test("identity absorption rejects ambiguous or nonpersistent anchors", () => {
  assert.throws(() => compileKpIdentityAbsorptionChoreography({
    id: "bad.identity",
    operationKind: "absorb-multiplicative-one",
    continuantRecordIds: ["x"],
    operatorRecordId: "one",
    identityRecordId: "one",
    anchorRecordId: "missing"
  }), /distinct operator and identity/);
  assert.throws(() => compileKpIdentityAbsorptionChoreography({
    id: "bad.anchor",
    operationKind: "absorb-multiplicative-one",
    continuantRecordIds: ["x"],
    operatorRecordId: "times",
    identityRecordId: "one",
    anchorRecordId: "missing"
  }), /persistent continuant/);
});
