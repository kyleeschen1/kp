import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationRepresentationTransformLaw
} from "../src/animation/representation-transform.ts";
import {
  createEquationToGraphRepresentationSample,
  createEquationToMatrixRepresentationSample
} from "../src/animation/representation-transform-samples.ts";

test("createEquationToGraphRepresentationSample derives a graph render target without changing semantic identity", () => {
  const sample = createEquationToGraphRepresentationSample();
  const source = sample.sourceAnimation;
  const target = sample.result.targetAnimation;
  const targetRenderTarget = target.renderTargets[0];

  assert.equal(
    sample.transform.id,
    "representation.equation-to-graph.explicit-2d"
  );
  assert.equal(sample.result.sourceAnimationId, source.id);
  assert.equal(targetRenderTarget?.kind, "graph");
  assert.deepEqual(
    target.bundle.objects.map((object) => object.id),
    source.bundle.objects.map((object) => object.id)
  );
  assert.deepEqual(
    target.transformations.map((transformation) => transformation.id),
    source.transformations.map((transformation) => transformation.id)
  );
  assert.deepEqual(sample.graphSceneObjectIds, [
    "representation.parabola-graph",
    "representation.parabola-x-axis",
    "representation.parabola-y-axis",
    "representation.parabola-curve"
  ]);
  assert.deepEqual(targetRenderTarget?.metadata, {
    representation: "graph",
    sourceRepresentation: "equation",
    targetRepresentation: "graph",
    sourceLatex: "y = x^2",
    graphDerivationCapability: "equation.graph2d",
    graphDerivationStatus: "exact",
    graphSceneObjectIds:
      "representation.parabola-graph representation.parabola-x-axis representation.parabola-y-axis representation.parabola-curve",
    graphObjectId: "representation.parabola-graph",
    graphPrimaryObjectId: "representation.parabola-curve"
  });
  assert.deepEqual(sample.result.diagnostics, []);
  assert.deepEqual(
    checkKpAnimationRepresentationTransformLaw(sample.transform, source),
    {
      lawId: "animation-representation.preservation",
      passed: true,
      failures: []
    }
  );
});

test("createEquationToMatrixRepresentationSample derives matrix render metadata without changing semantic identity", () => {
  const sample = createEquationToMatrixRepresentationSample();
  const source = sample.sourceAnimation;
  const target = sample.result.targetAnimation;
  const targetRenderTarget = target.renderTargets[0];

  assert.equal(
    sample.transform.id,
    "representation.equation-to-matrix.linear-map"
  );
  assert.equal(sample.result.sourceAnimationId, source.id);
  assert.equal(targetRenderTarget?.kind, "matrix");
  assert.deepEqual(
    target.bundle.objects.map((object) => object.id),
    source.bundle.objects.map((object) => object.id)
  );
  assert.deepEqual(
    target.transformations.map((transformation) => transformation.id),
    source.transformations.map((transformation) => transformation.id)
  );
  assert.deepEqual(sample.matrixRows, [
    [2, 0],
    [0, 3]
  ]);
  assert.deepEqual(targetRenderTarget?.metadata, {
    representation: "matrix",
    sourceRepresentation: "equation",
    targetRepresentation: "matrix",
    sourceLatex: "T(x, y) = (2x, 3y)",
    matrixDerivationCapability: "equation.matrix",
    matrixDerivationStatus: "exact-fixture",
    matrixObjectId: "matrix.representation.scale",
    matrixRows: "2 0; 0 3",
    matrixLatex: String.raw`S = \begin{bmatrix}2 & 0 \\ 0 & 3\end{bmatrix}`,
    domainDimension: 2,
    codomainDimension: 2
  });
  assert.deepEqual(sample.result.diagnostics, []);
  assert.deepEqual(
    checkKpAnimationRepresentationTransformLaw(sample.transform, source),
    {
      lawId: "animation-representation.preservation",
      passed: true,
      failures: []
    }
  );
});
