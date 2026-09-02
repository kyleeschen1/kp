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
import {
  createKpAdditiveCommutativeGroup,
  createKpScalarSystem,
  createKpVectorSpace,
  sumKpValues
} from "../src/math/algebra/algebraic-structures.ts";

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

test("bounded algebra dictionaries are explicit, immutable, and composable", () => {
  type Vec2 = readonly [number, number];
  const scalarEquality = createKpEquality<number>({
    id: "kp.equality.scalar.fixture",
    mode: "exact",
    equals: Object.is
  });
  const vectorEquality = createKpEquality<Vec2>({
    id: "kp.equality.vec2.fixture",
    mode: "exact",
    equals: (left, right) =>
      Object.is(left[0], right[0]) && Object.is(left[1], right[1])
  });
  const vectorSpaceDescriptor = defineKpSemanticSpace<Vec2>()({
    id: "kp.space.vec2.fixture",
    dimension: 2
  });
  const vectors = createKpAdditiveCommutativeGroup<Vec2>({
    id: "kp.structure.vec2.additive",
    carrierId: vectorSpaceDescriptor.id,
    equality: vectorEquality,
    zero: [0, 0],
    add: (left, right) => [left[0] + right[0], left[1] + right[1]],
    negate: (value) => [-value[0], -value[1]],
    laws: [createKpLawClaim({
      name: "associative",
      carrierId: vectorSpaceDescriptor.id,
      operationIds: ["kp.operation.vec2.add"],
      equalityId: vectorEquality.id,
      evidence: {
        kind: "tested",
        suiteId: "kp.test.vec2-additive-laws",
        equalityId: vectorEquality.id
      }
    })]
  });
  const scalars = createKpScalarSystem({
    id: "kp.structure.scalar.fixture",
    carrierId: "kp.carrier.number.fixture",
    equality: scalarEquality,
    zero: 0,
    one: 1,
    add: (left, right) => left + right,
    multiply: (left, right) => left * right,
    negate: (value) => -value
  });
  const space = createKpVectorSpace({
    id: "kp.vector-space.vec2.fixture",
    space: vectorSpaceDescriptor,
    vectors,
    scalars,
    scale: (scalar, value): Vec2 => [scalar * value[0], scalar * value[1]]
  });

  assert.deepEqual(sumKpValues(vectors, [[1, 2], [3, 4], [-1, 1]]), [3, 7]);
  assert.deepEqual(space.scale(2, [3, -1]), [6, -2]);
  assert.equal(Object.isFrozen(space), true);
  assert.equal(Object.isFrozen(vectors.laws), true);
  assert.equal(vectors.laws[0]?.evidence.kind, "tested");
  assert.equal(scalars.laws.length, 0);
});

test("algebra dictionaries reject law and carrier mismatches", () => {
  const equality = createKpEquality<number>({
    id: "kp.equality.fixture",
    mode: "exact",
    equals: Object.is
  });
  const wrongLaw = createKpLawClaim({
    name: "identity",
    carrierId: "kp.carrier.other",
    operationIds: ["kp.operation.add"],
    equalityId: equality.id,
    evidence: {
      kind: "tested",
      suiteId: "kp.test.identity",
      equalityId: equality.id
    }
  });

  assert.throws(
    () => createKpAdditiveCommutativeGroup({
      id: "kp.structure.invalid",
      carrierId: "kp.carrier.expected",
      equality,
      zero: 0,
      add: (left, right) => left + right,
      negate: (value) => -value,
      laws: [wrongLaw]
    }),
    /must use carrier kp.carrier.expected/
  );
});
