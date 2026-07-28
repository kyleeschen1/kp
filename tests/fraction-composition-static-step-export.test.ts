import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createKpFractionCompositionEndpointSpecs
} from "../src/semantic/fraction-composition-endpoint-spec.ts";
import {
  createKpFractionCompositionStaticStepExport
} from "../src/tutorial/fraction-composition-static-step-export.ts";

test("fraction composition exports all fourteen canonical endpoint truths", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const endpoints = createKpFractionCompositionEndpointSpecs();
  const sequence = createKpFractionCompositionStaticStepExport();

  assert.deepEqual(sequence.diagnostics, []);
  assert.equal(sequence.artifact.id, animation.exportTargets[0]?.artifactId);
  assert.equal(sequence.steps.length, 14);
  assert.deepEqual(
    sequence.steps.map(({ frame }) => frame.state),
    endpoints.map((endpoint) => ({
      objectId: endpoint.stateId,
      latex: endpoint.segments.map(({ latex }) => latex).join(""),
      accessibilityLabel: endpoint.accessibleText
    }))
  );
});

test("fraction export retains operations and annotations without fold state", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const sequence = createKpFractionCompositionStaticStepExport();
  const operationIds = animation.transformations.map(({ id }) => id);

  assert.deepEqual(
    sequence.steps.map(({ frame }) => frame.completedOperationIds.length),
    Array.from({ length: 14 }, (_value, index) => index)
  );
  assert.equal(
    sequence.steps.flatMap(({ markers }) => markers ?? []).length,
    2
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
