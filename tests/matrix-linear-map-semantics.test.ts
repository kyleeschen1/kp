import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  deriveKpMatrixLinearMapSemantics
} from "../src/animation/matrix-linear-map-semantics.ts";

const animation = createKpAnimationAssets().find((candidate) =>
  candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const semantics = deriveKpMatrixLinearMapSemantics(animation);

test("canonical matrix derives one strict LinearMap with basis provenance", () => {
  assert.deepEqual(semantics.matrix.rows, [[2, 1], [0, 3]]);
  assert.equal(semantics.linearMap.sourceMatrixId, semantics.matrix.id);
  assert.equal(semantics.linearMap.domainBasisId, semantics.domainBasis.id);
  assert.equal(semantics.linearMap.codomainBasisId, semantics.codomainBasis.id);
  assert.equal(semantics.derivation.relation, "same-linear-map");
  assert.equal(semantics.derivation.provenance.capabilityId, "matrix.linear-map");
  assert.deepEqual(semantics.domainBasis.vectors, [[1, 0], [0, 1]]);
  assert.deepEqual(semantics.codomainBasis.vectors, [[1, 0], [0, 1]]);
});

test("rows and columns retain distinct mathematical meanings", () => {
  assert.equal(semantics.rowMeaning, "output-coordinate-functionals");
  assert.equal(semantics.columnMeaning, "mapped-domain-basis-vectors");
  assert.deepEqual(
    semantics.mappedBasisVectors.map((vector) => vector.targetCoordinates),
    [[2, 0], [1, 3]]
  );
  assert.deepEqual(
    semantics.mappedBasisVectors.map((vector) => vector.sourceMatrixColumnIndex),
    [0, 1]
  );
});

test("basis images reconstruct the exact mapped vector", () => {
  const reconstructed = semantics.mappedBasisVectors[0]!.targetCoordinates.map(
    (_coordinate, coordinateIndex) =>
      semantics.mappedBasisVectors.reduce((sum, image, basisIndex) =>
        sum +
          semantics.inputCoordinates[basisIndex]! *
          image.targetCoordinates[coordinateIndex]!, 0)
  );
  assert.deepEqual(semantics.inputCoordinates, [4, 5]);
  assert.deepEqual(reconstructed, [13, 15]);
  assert.deepEqual(reconstructed, semantics.outputCoordinates);
});

test("canonical catalogue asset is enriched in place with graph semantics", () => {
  assert.equal(animation.id,
    "animation.generated.linear-algebra.matrix-vector.two-by-two");
  assert.equal(animation.metadata?.["matrixLinearMapEnriched"], true);
  const enriched = animation.bundle.objects.filter((object) =>
    object.provenance?.kind === "derived"
  );
  assert.deepEqual(enriched.map((object) => object.objectType), [
    "matrix",
    "linear-map",
    "basis",
    "basis",
    "mapped-basis-vector",
    "mapped-basis-vector",
    "graph-2d",
    "vector",
    "vector"
  ]);
  assert.deepEqual(
    enriched.filter((object) => object.objectType === "vector")
      .map((object) => object.value),
    [
      {
        id: `${semantics.linearMap.id}.vector.input`,
        type: "vector",
        label: "v",
        coordinates: [4, 5],
        coordinateRole: "input"
      },
      {
        id: `${semantics.linearMap.id}.vector.output`,
        type: "vector",
        label: "T_A(v)",
        coordinates: [13, 15],
        coordinateRole: "output"
      }
    ]
  );
  assert.equal(
    enriched.find((object) => object.objectType === "graph-2d")
      ?.selectors[0]?.kind,
    "viewport"
  );
});
