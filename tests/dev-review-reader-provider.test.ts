import assert from "node:assert/strict";
import test from "node:test";

import { createKpReaderDevReviewCaptureProvider, KpReaderDevReviewFrameStore } from "../src/dev-review/reader-capture-provider.ts";

test("reader provider captures the exact latest semantic and render frame plus recent trace", async () => {
  const frames = new KpReaderDevReviewFrameStore();
  const provider = createKpReaderDevReviewCaptureProvider(frames);
  assert.equal(provider.matches({
    route: new URL("http://localhost/reader/solve-x/"), capturedAtMs: 900, eventTarget: null
  }), false);

  frames.record({
    atMs: 900,
    documentId: "lesson.solve-x.x-plus-3",
    documentVersion: "1",
    assetId: "animation.linear-solve",
    checkpointId: "story.cancel",
    progressPermille: 420,
    projectionId: "equation.symbolic",
    activeTransformationIds: ["linear-solve.cancel"],
    activePhase: "act",
    focusSource: "pointer",
    focusRefs: ["linear-solve.lhs.plus3"],
    motionPreference: "full",
    motionMode: "full",
    playbackDirection: "forward",
    rendererId: "reader.equation.material-layer",
    motionAuthority: "semantic-material",
    fitStatus: "native",
    fitScale: 1,
    layoutRevision: 2,
    layoutReadCount: 3,
    fontRevision: 1,
    fontReady: true,
    ownerIds: ["linear-solve.lhs.plus3"],
    frameIntervalMs: 16.7,
    scrollDeltaY: 8
  });

  const evidence = await provider.capture({
    route: new URL("http://localhost/reader/solve-x/"), capturedAtMs: 1_000, eventTarget: null
  });
  assert.equal(evidence.semantic.progressPermille, 420);
  assert.equal(evidence.semantic.activePhase, "act");
  assert.deepEqual(evidence.semantic.focusRefs, ["linear-solve.lhs.plus3"]);
  assert.equal(evidence.render.layoutRevision, 2);
  assert.deepEqual(evidence.render.ownerIds, ["linear-solve.lhs.plus3"]);
  assert.deepEqual(evidence.temporalTrace, [{
    offsetMs: -100,
    progressPermille: 420,
    frameIntervalMs: 16.7,
    scrollDeltaY: 8,
    transitionId: "linear-solve.cancel",
    phase: "act",
    layoutRevision: 2
  }]);
});
