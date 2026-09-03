import assert from "node:assert/strict";
import test from "node:test";

import {
  areSameKpSemanticStateId,
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";

test("semantic state identities are deterministic without reference identity", () => {
  const first = createKpSemanticStateIdentityScope("economics.supply-tax");
  const second = createKpSemanticStateIdentityScope("economics.supply-tax");

  const firstEntity = first.entity("market");
  const reconstructedEntity = second.entity("market");

  assert.notEqual(first, second);
  assert.equal(firstEntity, reconstructedEntity);
  assert.equal(
    first.initialVersion(firstEntity),
    second.initialVersion(reconstructedEntity)
  );
  assert.equal(first.initialSnapshot(), second.initialSnapshot());
  assert.equal(Object.isFrozen(first), true);
  assert.equal(areSameKpSemanticStateId(firstEntity, reconstructedEntity), true);
});

test("identity kinds remain distinct even when their author token matches", () => {
  const ids = createKpSemanticStateIdentityScope("lesson.market");
  const token = "primary";
  const values = [
    ids.entity(token),
    ids.initialSnapshot(),
    ids.slot(token),
    ids.occurrence(token),
    ids.alias(token),
    ids.displayLabel(token),
    ids.representation(token),
    ids.transformation(token),
    ids.appliedTransformation(ids.transformation(token), "first")
  ];

  assert.equal(new Set(values).size, values.length);
  assert.notEqual(ids.entity(token), ids.slot(token));
  assert.notEqual(ids.alias(token), ids.displayLabel(token));
  assert.notEqual(ids.occurrence(token), ids.representation(token));
});

test("versions belong to entities while snapshots remain aggregate identities", () => {
  const ids = createKpSemanticStateIdentityScope("lesson.market");
  const market = ids.entity("market");
  const supply = ids.entity("supply");

  const applied = ids.appliedTransformation(
    ids.transformation("add-tax"),
    "first"
  );
  assert.equal(
    ids.successorVersion(market, applied, "market-price"),
    "kp-state/lesson.market/entity/market/version/from/add-tax/application/first/revision/market-price"
  );
  assert.notEqual(
    ids.successorVersion(market, applied, "market-price"),
    ids.successorVersion(supply, applied, "market-price")
  );
  assert.notEqual(
    ids.successorVersion(market, applied, "market-price"),
    ids.successorSnapshot(applied)
  );
});

test("scope ownership and identifier inputs fail locally", () => {
  const left = createKpSemanticStateIdentityScope("lesson.left");
  const right = createKpSemanticStateIdentityScope("lesson.right");

  assert.throws(
    () => right.initialVersion(left.entity("market")),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => right.appliedTransformation(left.transformation("add-tax"), "first"),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => createKpSemanticStateIdentityScope("Not Scoped"),
    /Invalid semantic state namespace/u
  );
  assert.throws(() => left.entity(""), /Invalid semantic state entity id/u);
  assert.throws(
    () => left.appliedTransformation(left.transformation("add-tax"), "Not Valid"),
    /transformation application id/u
  );
});
