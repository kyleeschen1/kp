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
import {
  composeKpLinearMaps,
  createKpLinearMap,
  identityKpLinearMap
} from "../src/math/algebra/linear-map.ts";
import {
  createKpCartesianSpace,
  createKpFloatingPointScalars,
  createKpStandardScalarSpace
} from "../src/math/algebra/standard-spaces.ts";
import {
  createKpFiniteBasis,
  sameKpFiniteBasis
} from "../src/math/algebra/finite-basis.ts";
import {
  applyKpMatrixRepresentation,
  representKpLinearMap
} from "../src/math/algebra/matrix-representation.ts";
import {
  createKpDifferentiableMap,
  createKpDifferentiableMapRequiredGap
} from "../src/math/algebra/differentiable-map.ts";
import {
  createKpSecondDerivativeMap,
  createKpSecondDerivativeRequiredGap
} from "../src/math/algebra/second-derivative-map.ts";

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

test("linear maps compose by semantic source and target space", () => {
  const scalarEquality = createKpEquality<number>({
    id: "kp.equality.linear-map.scalar",
    mode: "exact",
    equals: Object.is
  });
  const scalars = createKpScalarSystem({
    id: "kp.scalars.linear-map.fixture",
    carrierId: "kp.carrier.linear-map.scalar",
    equality: scalarEquality,
    zero: 0,
    one: 1,
    add: (left, right) => left + right,
    multiply: (left, right) => left * right,
    negate: (value) => -value
  });
  const vectorSpace = <const Id extends string>(id: Id) => {
    const descriptor = defineKpSemanticSpace<number>()({ id, dimension: 1 });
    const equality = createKpEquality<number>({
      id: `${id}.equality`,
      mode: "exact",
      equals: Object.is
    });
    return createKpVectorSpace({
      id: `${id}.vector-space`,
      space: descriptor,
      vectors: createKpAdditiveCommutativeGroup({
        id: `${id}.additive`,
        carrierId: id,
        equality,
        zero: 0,
        add: (left, right) => left + right,
        negate: (value) => -value
      }),
      scalars,
      scale: (scalar, value) => scalar * value
    });
  };
  const quantity = vectorSpace("kp.space.linear-map.quantity");
  const price = vectorSpace("kp.space.linear-map.price");
  const revenue = vectorSpace("kp.space.linear-map.revenue");
  const quantityToPrice = createKpLinearMap({
    id: "kp.map.quantity-to-price",
    domain: quantity,
    codomain: price,
    apply: (value) => 2 * value,
    linearity: {
      kind: "tested",
      suiteId: "kp.test.quantity-to-price-linearity",
      equalityId: price.vectors.equality.id
    }
  });
  const priceToRevenue = createKpLinearMap({
    id: "kp.map.price-to-revenue",
    domain: price,
    codomain: revenue,
    apply: (value) => 3 * value,
    linearity: {
      kind: "tested",
      suiteId: "kp.test.price-to-revenue-linearity",
      equalityId: revenue.vectors.equality.id
    }
  });
  const quantityToRevenue = createKpLinearMap({
    id: "kp.map.quantity-to-revenue.direct",
    domain: quantity,
    codomain: revenue,
    apply: (value) => 6 * value,
    linearity: {
      kind: "tested",
      suiteId: "kp.test.quantity-to-revenue-linearity",
      equalityId: revenue.vectors.equality.id
    }
  });
  const composed = composeKpLinearMaps({
    id: "kp.map.quantity-to-revenue",
    inner: quantityToPrice,
    outer: priceToRevenue
  });
  const identity = identityKpLinearMap({
    id: "kp.map.quantity.identity",
    space: quantity
  });

  assert.equal(composed.apply(4), 24);
  assert.deepEqual(composed.sourceMapIds, [
    "kp.map.quantity-to-price",
    "kp.map.price-to-revenue"
  ]);
  assert.equal(identity.apply(7), 7);
  assert.equal(composed.linearity.kind, "proved");
  assert.equal(Object.isFrozen(composed.sourceMapIds), true);
  assert.throws(
    () => composeKpLinearMaps({
      id: "kp.map.invalid-runtime-composition",
      inner: quantityToPrice,
      outer: quantityToRevenue as unknown as typeof priceToRevenue
    }),
    /cannot compose kp.space.linear-map.price with kp.space.linear-map.quantity/
  );
});

test("standard scalar and Cartesian spaces are deterministic local defaults", () => {
  const firstScalars = createKpFloatingPointScalars();
  const secondScalars = createKpFloatingPointScalars();
  const scalar = createKpStandardScalarSpace({
    id: "kp.space.standard.scalar",
    label: "Scalar"
  });
  const plane = createKpCartesianSpace({
    id: "kp.space.standard.plane",
    label: "Plane",
    dimension: 2
  });

  assert.equal(firstScalars.id, secondScalars.id);
  assert.equal(firstScalars.equality.id, secondScalars.equality.id);
  assert.equal(firstScalars.equality.mode, "approximate");
  assert.equal(scalar.scale(3, 4), 12);
  assert.deepEqual(plane.vectors.add([1, 2], [3, -1]), [4, 1]);
  assert.deepEqual(plane.scale(2, [3, -1]), [6, -2]);
  assert.equal(plane.space.dimension, 2);
  assert.equal(Object.isFrozen(plane.vectors.zero), true);
});

test("Cartesian defaults allow explicit scalar authority and reject bad shape", () => {
  const exact = createKpEquality<number>({
    id: "kp.equality.standard.exact-fixture",
    mode: "exact",
    equals: Object.is
  });
  const exactScalars = createKpScalarSystem({
    id: "kp.scalars.standard.exact-fixture",
    carrierId: "kp.carrier.standard.exact-fixture",
    equality: exact,
    zero: 0,
    one: 1,
    add: (left, right) => left + right,
    multiply: (left, right) => left * right,
    negate: (value) => -value
  });
  const plane = createKpCartesianSpace({
    id: "kp.space.standard.custom-plane",
    dimension: 2,
    scalars: exactScalars
  });

  assert.equal(plane.scalars, exactScalars);
  assert.equal(plane.vectors.equality.mode, "exact");
  assert.throws(
    () => plane.scale(2, [1] as unknown as readonly [number, number]),
    /requires 2 coordinates/
  );
  assert.throws(
    () => createKpFloatingPointScalars({ tolerance: 0 }),
    /tolerance must be positive/
  );
});

test("finite bases validate ordering and coordinate round trips", () => {
  type Vec2 = readonly [number, number];
  const plane = createKpCartesianSpace({
    id: "kp.space.basis.plane",
    dimension: 2
  });
  const basis = createKpFiniteBasis({
    id: "kp.basis.plane.standard",
    space: plane,
    vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested",
      suiteId: "kp.test.basis.plane.standard",
      equalityId: plane.vectors.equality.id
    }
  });
  const reconstructed = createKpFiniteBasis({
    id: "kp.basis.plane.standard",
    space: plane,
    vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested",
      suiteId: "kp.test.basis.plane.standard",
      equalityId: plane.vectors.equality.id
    }
  });

  assert.deepEqual(basis.coordinates([3, -2]), [3, -2]);
  assert.deepEqual(basis.fromCoordinates([4, 5]), [4, 5]);
  assert.equal(sameKpFiniteBasis(basis, reconstructed), true);
  assert.equal(Object.isFrozen(basis.vectors), true);
});

test("finite bases reject duplicates and invalid coordinate ordering", () => {
  type Vec2 = readonly [number, number];
  const plane = createKpCartesianSpace({
    id: "kp.space.basis.invalid-plane",
    dimension: 2
  });
  const evidence = {
    kind: "tested" as const,
    suiteId: "kp.test.basis.invalid",
    equalityId: plane.vectors.equality.id
  };

  assert.throws(
    () => createKpFiniteBasis({
      id: "kp.basis.plane.duplicate",
      space: plane,
      vectors: [[1, 0] as Vec2, [1, 0] as Vec2] as const,
      coordinates: (value) => value,
      fromCoordinates: (coordinates) => coordinates,
      coordinateIsomorphism: evidence
    }),
    /repeats a basis vector/
  );
  assert.throws(
    () => createKpFiniteBasis({
      id: "kp.basis.plane.swapped",
      space: plane,
      vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
      coordinates: (value) => [value[1]!, value[0]!] as const,
      fromCoordinates: (coordinates) => [
        coordinates[1]!,
        coordinates[0]!
      ] as const,
      coordinateIsomorphism: evidence
    }),
    /vector 0 has invalid coordinates/
  );
});

test("matrix representations carry bases and agree with their source map", () => {
  type Vec2 = readonly [number, number];
  const domain = createKpCartesianSpace({
    id: "kp.space.matrix.domain",
    dimension: 2
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.matrix.codomain",
    dimension: 2
  });
  const standardBasis = <const Id extends string>(
    id: string,
    space: ReturnType<typeof createKpCartesianSpace<Id, 2>>
  ) => createKpFiniteBasis({
    id,
    space,
    vectors: [[1, 0] as Vec2, [0, 1] as Vec2] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: `${id}.round-trip-test`,
      equalityId: space.vectors.equality.id
    }
  });
  const map = createKpLinearMap({
    id: "kp.map.matrix.fixture",
    domain,
    codomain,
    apply: (value): Vec2 => [
      2 * value[0]! + value[1]!,
      3 * value[1]!
    ],
    linearity: {
      kind: "tested",
      suiteId: "kp.test.map.matrix.fixture",
      equalityId: codomain.vectors.equality.id
    }
  });
  const representation = representKpLinearMap({
    id: "kp.matrix-representation.fixture",
    map,
    domainBasis: standardBasis("kp.basis.matrix.domain", domain),
    codomainBasis: standardBasis("kp.basis.matrix.codomain", codomain)
  });

  assert.deepEqual(representation.rows, [[2, 1], [0, 3]]);
  assert.deepEqual(applyKpMatrixRepresentation(representation, [4, -2]), [6, -6]);
  assert.deepEqual(map.apply([4, -2]), [6, -6]);
  assert.equal(representation.sourceMapId, map.id);
  assert.equal(Object.isFrozen(representation.rows[0]), true);
});

test("matrix representations reject a basis from another semantic space", () => {
  type Vec1 = readonly [number];
  const domain = createKpCartesianSpace({
    id: "kp.space.matrix.expected-domain",
    dimension: 1
  });
  const wrongDomain = createKpCartesianSpace({
    id: "kp.space.matrix.wrong-domain",
    dimension: 1
  });
  const codomain = createKpCartesianSpace({
    id: "kp.space.matrix.expected-codomain",
    dimension: 1
  });
  const basis = <const Id extends string>(
    id: string,
    space: ReturnType<typeof createKpCartesianSpace<Id, 1>>
  ) => createKpFiniteBasis({
    id,
    space,
    vectors: [[1] as Vec1] as const,
    coordinates: (value) => value,
    fromCoordinates: (coordinates) => coordinates,
    coordinateIsomorphism: {
      kind: "tested" as const,
      suiteId: `${id}.test`,
      equalityId: space.vectors.equality.id
    }
  });
  const map = createKpLinearMap({
    id: "kp.map.matrix.invalid-basis",
    domain,
    codomain,
    apply: (value) => value,
    linearity: {
      kind: "tested",
      suiteId: "kp.test.map.matrix.invalid-basis",
      equalityId: codomain.vectors.equality.id
    }
  });

  assert.throws(
    () => representKpLinearMap({
      id: "kp.matrix-representation.invalid-basis",
      map,
      domainBasis: basis(
        "kp.basis.matrix.wrong-domain",
        wrongDomain
      ) as unknown as ReturnType<typeof basis<"kp.space.matrix.expected-domain">>,
      codomainBasis: basis("kp.basis.matrix.codomain", codomain)
    }),
    /domain basis must belong to kp.space.matrix.expected-domain/
  );
});

test("differentiable maps return coordinate-free linear derivatives", () => {
  const domain = createKpStandardScalarSpace({
    id: "kp.space.differentiable.domain"
  });
  const codomain = createKpStandardScalarSpace({
    id: "kp.space.differentiable.codomain"
  });
  const square = createKpDifferentiableMap({
    id: "kp.function.differentiable.square",
    domain,
    codomain,
    evaluate: (value) => value ** 2,
    derivativeAt: (at) => createKpLinearMap({
      id: `kp.derivative.differentiable.square.at.${at}`,
      domain,
      codomain,
      apply: (tangent) => 2 * at * tangent,
      linearity: {
        kind: "proved",
        authorityId: "kp.math.derivative.square-linearity.v1"
      }
    })
  });

  assert.equal(square.evaluate(3), 9);
  assert.equal(square.derivativeAt(3).apply(4), 24);
  assert.equal(square.derivativeAt(3).domain.space.id, domain.space.id);
  assert.equal(square.derivativeAt(3).codomain.space.id, codomain.space.id);
  assert.equal(square.derivativeAt(3).linearity.kind, "proved");
  assert.equal(Object.isFrozen(square), true);
});

test("differentiable maps reject false derivative authority and expose gaps", () => {
  const domain = createKpStandardScalarSpace({
    id: "kp.space.differentiable.expected-domain"
  });
  const wrongDomain = createKpStandardScalarSpace({
    id: "kp.space.differentiable.wrong-domain"
  });
  const codomain = createKpStandardScalarSpace({
    id: "kp.space.differentiable.expected-codomain"
  });
  const invalid = createKpDifferentiableMap({
    id: "kp.function.differentiable.invalid",
    domain,
    codomain,
    evaluate: (value) => value,
    derivativeAt: () => createKpLinearMap({
      id: "kp.derivative.differentiable.invalid",
      domain: wrongDomain,
      codomain,
      apply: (value) => value,
      linearity: {
        kind: "tested",
        suiteId: "kp.test.derivative.differentiable.invalid",
        equalityId: codomain.vectors.equality.id
      }
    }) as unknown as ReturnType<typeof createKpLinearMap<
      number,
      number,
      number,
      "kp.space.differentiable.expected-domain",
      "kp.space.differentiable.expected-codomain"
    >>
  });

  assert.throws(
    () => invalid.derivativeAt(2),
    /derivative domain must be kp.space.differentiable.expected-domain/
  );
  assert.deepEqual(createKpDifferentiableMapRequiredGap({
    sourceId: "kp.function.opaque"
  }), {
    status: "repair-required",
    code: "kp.calculus.differentiable-map-required",
    sourceId: "kp.function.opaque",
    requirement: "derivativeAt",
    message: "Source kp.function.opaque has no declared coordinate-free derivative.",
    repair: "Supply a differentiable-map adapter with an explicit derivativeAt map."
  });
});

test("scalar second derivatives are bounded bilinear maps", () => {
  const domain = createKpStandardScalarSpace({
    id: "kp.space.second-derivative.domain"
  });
  const codomain = createKpStandardScalarSpace({
    id: "kp.space.second-derivative.codomain"
  });
  const evidence = {
    kind: "tested" as const,
    suiteId: "kp.test.second-derivative.quadratic-bilinearity",
    equalityId: codomain.vectors.equality.id
  };
  const secondDerivative = createKpSecondDerivativeMap({
    id: "kp.second-derivative.quadratic.at-3",
    domain,
    codomain,
    apply: (left, right) => 2 * left * right,
    leftLinearity: evidence,
    rightLinearity: evidence,
    sourceFunctionIds: ["kp.function.quadratic"]
  });
  const scalars = domain.scalars;

  assert.equal(secondDerivative.apply(4, 5), 40);
  assert.equal(
    secondDerivative.apply(domain.vectors.add(2, 3), 7),
    codomain.vectors.add(
      secondDerivative.apply(2, 7),
      secondDerivative.apply(3, 7)
    )
  );
  assert.equal(
    secondDerivative.apply(4, domain.scale(3, 2)),
    codomain.scale(scalars.multiply(3, scalars.one),
      secondDerivative.apply(4, 2))
  );
  assert.equal(secondDerivative.leftLinearity.kind, "tested");
  assert.deepEqual(secondDerivative.sourceFunctionIds, ["kp.function.quadratic"]);
  assert.equal(Object.isFrozen(secondDerivative), true);
});

test("second derivative evidence is explicit and missing capability is a gap", () => {
  const domain = createKpStandardScalarSpace({
    id: "kp.space.second-derivative.validation-domain"
  });
  const codomain = createKpStandardScalarSpace({
    id: "kp.space.second-derivative.validation-codomain"
  });

  assert.throws(
    () => createKpSecondDerivativeMap({
      id: "kp.second-derivative.invalid-evidence",
      domain,
      codomain,
      apply: (left, right) => left * right,
      leftLinearity: {
        kind: "tested",
        suiteId: "kp.test.second-derivative.invalid",
        equalityId: "kp.equality.unrelated"
      },
      rightLinearity: {
        kind: "proved",
        authorityId: "kp.math.second-derivative.right-linearity.v1"
      }
    }),
    /left linearity must use equality/
  );
  assert.deepEqual(createKpSecondDerivativeRequiredGap({
    sourceId: "kp.function.once-differentiable"
  }), {
    status: "repair-required",
    code: "kp.calculus.second-derivative-required",
    sourceId: "kp.function.once-differentiable",
    requirement: "secondDerivativeAt",
    message: "Source kp.function.once-differentiable has no declared second derivative.",
    repair: "Supply a scalar-function adapter with an explicit second derivative."
  });
});
