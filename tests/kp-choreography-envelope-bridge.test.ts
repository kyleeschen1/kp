import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpBridgedChoreographySequence,
  sampleKpBridgedChoreographySequence
} from "../src/animation/choreography-envelope-bridge.ts";

const sequence = compileKpBridgedChoreographySequence({
  id: "sequence.solve-x",
  steps: [
    { transformationId: "subtract", weight: 1 },
    { transformationId: "cancel", weight: 1 },
    { transformationId: "derive", weight: 1 }
  ],
  bridges: [
    {
      id: "bridge.subtract-cancel",
      fromTransformationId: "subtract",
      toTransformationId: "cancel",
      preserveMaterialContinuantIds: ["continuant.x", "continuant.equals"],
      attention: "transfer",
      velocity: "settle-before-next"
    },
    {
      id: "bridge.cancel-derive",
      fromTransformationId: "cancel",
      toTransformationId: "derive",
      preserveMaterialContinuantIds: ["continuant.x", "continuant.equals"],
      attention: "hold",
      velocity: "continuous"
    }
  ],
  bridgeSpan: 0.06
});

test("bridged choreography exposes one overlap around each operation boundary", () => {
  const first = sampleKpBridgedChoreographySequence({
    sequence,
    progress: sequence.boundaries[0]!
  });
  assert.equal(first.activeBridge?.bridge.id, "bridge.subtract-cancel");
  assert.equal(first.activeBridge?.progress, 0.5);

  const second = sampleKpBridgedChoreographySequence({
    sequence,
    progress: sequence.boundaries[1]!
  });
  assert.equal(second.activeBridge?.bridge.id, "bridge.cancel-derive");
  assert.equal(second.activeBridge?.progress, 0.5);
});

test("bridge attention suppresses redundant local release and orient beats", () => {
  const before = sampleKpBridgedChoreographySequence({
    sequence,
    progress: 0.325
  });
  assert.equal(before.transformationId, "subtract");
  assert.equal(before.suppressStepRelease, true);

  const after = sampleKpBridgedChoreographySequence({
    sequence,
    progress: 0.34
  });
  assert.equal(after.transformationId, "cancel");
  assert.equal(after.suppressStepOrient, true);
});

test("bridged choreography rewind samples the same semantic frame", () => {
  const forward = sampleKpBridgedChoreographySequence({
    sequence,
    progress: 0.34,
    direction: "forward"
  });
  const rewind = sampleKpBridgedChoreographySequence({
    sequence,
    progress: 0.66,
    direction: "rewind"
  });
  assert.deepEqual(rewind, forward);
});
