import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationRepresentationTransformLaw
} from "../src/animation/representation-transform.ts";
import {
  createEquationToGraphRepresentationSample
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
