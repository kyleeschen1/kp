import assert from "node:assert/strict";
import test from "node:test";

import {
  applyKpEigenvectorMatrix,
  isInKpLambdaThreeEigenspace,
  isKpEigenvectorFor,
  kpEigenvectorAttentionalFixture,
  scaleKpEigenvectorPoint
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-math.ts";

const fixture = kpEigenvectorAttentionalFixture;

test("the fixture preserves the approved eigenvector identity and equation", () => {
  assert.deepEqual(fixture.transformation.matrix, [[2, 1], [1, 2]]);
  assert.equal(fixture.persistentVector.id, "eigenvector-demo/vector/v");
  assert.deepEqual(fixture.persistentVector.coordinates, [1, 1]);
  assert.deepEqual(fixture.persistentVector.image, [3, 3]);
  assert.deepEqual(
    fixture.persistentVector.image,
    scaleKpEigenvectorPoint(
      fixture.persistentVector.coordinates,
      fixture.persistentVector.eigenvalue
    )
  );
});

test("the fan contains direction-changing context around one survivor", () => {
  const survivors = fixture.fan.filter(({ coordinates }) =>
    isKpEigenvectorFor(
      fixture.transformation.matrix,
      coordinates,
      fixture.persistentVector.eigenvalue
    )
  );

  assert.equal(fixture.fan.length, 7);
  assert.deepEqual(survivors.map(({ id }) => id), [fixture.persistentVector.id]);
  assert.ok(fixture.fan.some(({ coordinates, image }) =>
    coordinates[0] * image[1] !== coordinates[1] * image[0]
  ));
});

test("the prediction follows linearity instead of a second animation rule", () => {
  const { scalar, source, image } = fixture.prediction;

  assert.equal(scalar, 2);
  assert.deepEqual(source, [2, 2]);
  assert.deepEqual(image, [6, 6]);
  assert.deepEqual(
    applyKpEigenvectorMatrix(fixture.transformation.matrix, source),
    image
  );
});

test("the eigenspace includes zero although an eigenvector cannot be zero", () => {
  const zero = [0, 0] as const;

  assert.equal(isInKpLambdaThreeEigenspace(zero), true);
  assert.equal(
    isKpEigenvectorFor(fixture.transformation.matrix, zero, 3),
    false
  );
  assert.equal(isInKpLambdaThreeEigenspace([4, 4]), true);
  assert.equal(
    isKpEigenvectorFor(fixture.transformation.matrix, [4, 4], 3),
    true
  );
  assert.equal(isInKpLambdaThreeEigenspace([1, -1]), false);
});
