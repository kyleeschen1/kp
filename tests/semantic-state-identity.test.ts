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
  assert.equal(first.version(firstEntity, 0), second.version(reconstructedEntity, 0));
  assert.equal(first.snapshot(0), second.snapshot(0));
  assert.equal(Object.isFrozen(first), true);
  assert.equal(areSameKpSemanticStateId(firstEntity, reconstructedEntity), true);
});

test("identity kinds remain distinct even when their author token matches", () => {
  const ids = createKpSemanticStateIdentityScope("lesson.market");
  const token = "primary";
  const values = [
    ids.entity(token),
    ids.snapshot(0),
    ids.slot(token),
    ids.occurrence(token),
    ids.alias(token),
    ids.displayLabel(token),
    ids.representation(token),
    ids.transformation(token),
    ids.appliedTransformation(ids.transformation(token), 0)
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

  assert.equal(
    ids.version(market, 2),
    "kp-state/lesson.market/entity/market/version/2"
  );
  assert.notEqual(ids.version(market, 2), ids.version(supply, 2));
  assert.notEqual(ids.version(market, 2), ids.snapshot(2));
});

test("scope ownership and identifier inputs fail locally", () => {
  const left = createKpSemanticStateIdentityScope("lesson.left");
  const right = createKpSemanticStateIdentityScope("lesson.right");

  assert.throws(
    () => right.version(left.entity("market"), 0),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => right.appliedTransformation(left.transformation("add-tax"), 0),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => createKpSemanticStateIdentityScope("Not Scoped"),
    /Invalid semantic state namespace/u
  );
  assert.throws(() => left.entity(""), /Invalid semantic state entity id/u);
  assert.throws(() => left.snapshot(-1), /snapshot ordinal/u);
  assert.throws(
    () => left.version(left.entity("market"), 1.5),
    /version ordinal/u
  );
});
