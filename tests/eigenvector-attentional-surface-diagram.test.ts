import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorAttentionalFixture } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-math.ts";
import { projectKpEigenvectorDiagramEndpoint } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-diagram.ts";

test("the initial endpoint preserves the untouched fan", () => {
  const diagram = projectKpEigenvectorDiagramEndpoint("most-vectors-turn");

  assert.deepEqual(
    diagram.vectors.map(({ displayed }) => displayed),
    kpEigenvectorAttentionalFixture.fan.map(({ coordinates }) => coordinates)
  );
});

test("the fan endpoint shows exact images under A", () => {
  const diagram = projectKpEigenvectorDiagramEndpoint("watch-the-fan");

  assert.deepEqual(
    diagram.vectors.map(({ displayed }) => displayed),
    kpEigenvectorAttentionalFixture.fan.map(({ image }) => image)
  );
  assert.equal(
    diagram.vectors.filter(({ directionChanged }) => directionChanged).length,
    diagram.vectors.length - 1
  );
});

test("the persistent vector is the only fan member that keeps direction", () => {
  const diagram = projectKpEigenvectorDiagramEndpoint(
    "one-direction-survives"
  );
  const survivors = diagram.vectors.filter(({ directionChanged }) =>
    !directionChanged
  );

  assert.equal(survivors.length, 1);
  assert.equal(
    survivors[0]?.semanticObjectId,
    kpEigenvectorAttentionalFixture.persistentVector.id
  );
  assert.deepEqual(survivors[0]?.displayed, [3, 3]);
});

test("later scalar and eigenspace endpoints remain exact", () => {
  const scalar = projectKpEigenvectorDiagramEndpoint("verify-the-multiple");
  const eigenspace = projectKpEigenvectorDiagramEndpoint("reveal-the-eigenspace");

  assert.deepEqual(scalar.vectors[0]?.source, [2, 2]);
  assert.deepEqual(scalar.vectors[0]?.displayed, [6, 6]);
  assert.equal(eigenspace.invariantLine.visible, true);
  assert.deepEqual(eigenspace.invariantLine.from, [-3.4, -3.4]);
});
