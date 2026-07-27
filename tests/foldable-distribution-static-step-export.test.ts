import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../src/animation/foldable-distribution-equation-adapter.ts";
import {
  createKpFoldableDistributionEndpointSpecs
} from "../src/semantic/foldable-distribution-endpoint-spec.ts";
import {
  createKpFoldableDistributionStaticStepExport
} from "../src/tutorial/foldable-distribution-static-step-export.ts";

test("foldable distribution exports the five canonical endpoint truths", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const endpoints = createKpFoldableDistributionEndpointSpecs();
  const sequence = createKpFoldableDistributionStaticStepExport();

  assert.deepEqual(sequence.diagnostics, []);
  assert.equal(
    sequence.artifact.id,
    animation.exportTargets[0]?.artifactId
  );
  assert.deepEqual(
    sequence.steps.map(({ progress }) => progress),
    [0, 0.25, 0.5, 0.75, 1]
  );
  assert.deepEqual(
    sequence.steps.map(({ frame }) => frame.state),
    endpoints.map((endpoint) => ({
      objectId: endpoint.objectId,
      latex: endpoint.tokens.map(([, latex]) => latex).join(" "),
      accessibilityLabel: endpoint.label
    }))
  );
});

test("static export retains all operations independent of fold presentation", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const sequence = createKpFoldableDistributionStaticStepExport();
  const operationIds = animation.transformations.map(({ id }) => id);

  assert.deepEqual(
    sequence.steps.map(({ frame }) => frame.completedOperationIds.length),
    [0, 2, 4, 5, 6]
  );
  for (const { frame } of sequence.steps) {
    assert.deepEqual(frame.semanticTruth.operationIds, operationIds);
    assert.equal("foldMode" in frame, false);
    assert.equal(JSON.stringify(frame).includes("fade"), false);
  }
  assert.deepEqual(
    sequence.steps.at(-1)?.frame.completedOperationIds,
    operationIds
  );
});
