import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticSpace,
  defineKpSemanticSpace,
  sameKpSemanticSpace
} from "../src/math/algebra/semantic-space.ts";
import {
  createKpEquality,
  createKpLawClaim,
  createKpLawEvidence
} from "../src/math/algebra/law-evidence.ts";

test("semantic spaces retain deterministic nominal identity and dimensions", () => {
  const quantity = defineKpSemanticSpace<number>()({
    id: "kp.space.quantity",
    label: "Quantity",
    dimension: 1
  });
  const reconstructed = defineKpSemanticSpace<number>()({
    id: "kp.space.quantity",
    label: "Quantity in another process",
    dimension: 1
  });
  const price = defineKpSemanticSpace<number>()({
    id: "kp.space.price",
    label: "Price",
    dimension: 1
  });

  assert.deepEqual(quantity, {
    kind: "semantic-space",
    id: "kp.space.quantity",
    label: "Quantity",
    dimension: 1
  });
  assert.equal(Object.isFrozen(quantity), true);
  assert.equal(sameKpSemanticSpace(quantity, reconstructed), true);
  assert.equal(sameKpSemanticSpace(quantity, price), false);
});

test("semantic spaces reject identities or dimensions that cannot be authority", () => {
  assert.throws(
    () => createKpSemanticSpace({ id: "", dimension: 1 }),
    /id must not be empty/
  );
  assert.throws(
    () => createKpSemanticSpace({ id: "kp.space.invalid", dimension: 0 }),
    /positive integer dimension/
  );
  assert.throws(
    () => createKpSemanticSpace({
      id: "kp.space.invalid-label",
      label: " ",
      dimension: 1
    }),
    /label must not be empty/
  );
});

test("law claims retain their operations, equality, and evidence authority", () => {
  const exact = createKpEquality<number>({
    id: "kp.equality.number.exact",
    mode: "exact",
    equals: Object.is
  });
  const approximate = createKpEquality<number>({
    id: "kp.equality.number.tolerance-1e-9",
    mode: "approximate",
    equals: (left, right) => Math.abs(left - right) <= 1e-9
  });
  const associative = createKpLawClaim({
    name: "associative",
    carrierId: "kp.carrier.exact-rational",
    operationIds: ["kp.operation.rational.add"],
    equalityId: exact.id,
    evidence: {
      kind: "proved",
      authorityId: "kp.proof.rational-add-associative.v1"
    }
  });

  assert.equal(exact.equals(1, 1), true);
  assert.equal(approximate.equals(0.1 + 0.2, 0.3), true);
  assert.equal(approximate.mode, "approximate");
  assert.deepEqual(associative, {
    kind: "law-claim",
    name: "associative",
    carrierId: "kp.carrier.exact-rational",
    operationIds: ["kp.operation.rational.add"],
    equalityId: "kp.equality.number.exact",
    evidence: {
      kind: "proved",
      authorityId: "kp.proof.rational-add-associative.v1"
    }
  });
  assert.equal(Object.isFrozen(associative.operationIds), true);
});

test("law evidence rejects missing or mismatched authority", () => {
  assert.throws(
    () => createKpLawEvidence({
      kind: "assumed",
      assumptionId: "",
      rationale: "Temporary numerical model."
    }),
    /assumption id must not be empty/
  );
  assert.throws(
    () => createKpLawClaim({
      name: "identity",
      carrierId: "kp.carrier.sample",
      operationIds: ["kp.operation.sample"],
      equalityId: "kp.equality.expected",
      evidence: {
        kind: "tested",
        suiteId: "kp.test.sample-law",
        equalityId: "kp.equality.other"
      }
    }),
    /must use equality kp.equality.expected/
  );
  assert.throws(
    () => createKpLawClaim({
      name: "identity",
      carrierId: "kp.carrier.sample",
      operationIds: ["kp.operation.sample", "kp.operation.sample"],
      equalityId: "kp.equality.sample",
      evidence: {
        kind: "tested",
        suiteId: "kp.test.sample-law",
        equalityId: "kp.equality.sample"
      }
    }),
    /repeats an operation id/
  );
});
