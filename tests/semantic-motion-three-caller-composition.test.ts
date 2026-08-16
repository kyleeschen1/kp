import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionStageHistory,
  sampleKpSemanticMotionStageHistory
} from "../src/domain-ir/public-api.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion
} from "../src/semantic/cancellation-pressure-semantic-motion.ts";
import {
  kpCanonicalCompiledDistributionPressureSemanticMotion
} from "../src/semantic/distribution-pressure-semantic-motion.ts";
import {
  kpCanonicalCompiledLogQuotientSemanticMotion
} from "../src/semantic/log-quotient-semantic-motion.ts";

const callers = Object.freeze([{
  id: "stage.log-quotient",
  choreography: kpCanonicalCompiledLogQuotientSemanticMotion
}, {
  id: "stage.distribution",
  choreography: kpCanonicalCompiledDistributionPressureSemanticMotion
}, {
  id: "stage.cancellation",
  choreography: kpCanonicalCompiledCancellationPressureSemanticMotion
}]);

test("three contrasting real callers compose without bridge states or copied authority", () => {
  const history = historyFixture();

  assert.equal(history.clockCoupling, "external-shared-progress");
  assert.deepEqual(history.entries.map(({ id }) => id), callers.map(({ id }) => id));
  history.entries.forEach((entry, index) => {
    assert.strictEqual(entry.choreography, callers[index]!.choreography);
  });
  assert.deepEqual(history.handoffs.map((handoff) => ({
    kind: handoff.kind,
    outgoing: handoff.outgoingTargetStateId,
    incoming: handoff.incomingSourceStateId
  })), [{
    kind: "native-endpoint-cut",
    outgoing: history.entries[0]!.targetStateId,
    incoming: history.entries[1]!.sourceStateId
  }, {
    kind: "native-endpoint-cut",
    outgoing: history.entries[1]!.targetStateId,
    incoming: history.entries[2]!.sourceStateId
  }]);
});

test("one global clock gives deterministic direct seek and exact reverse projection", () => {
  const history = historyFixture();
  for (const progress of [0, 0.07, 1 / 3, 0.5, 2 / 3, 0.91, 1]) {
    const forward = sampleKpSemanticMotionStageHistory({
      history,
      progress,
      direction: "forward"
    });
    const repeated = sampleKpSemanticMotionStageHistory({
      history,
      progress,
      direction: "forward"
    });
    const mirrored = sampleKpSemanticMotionStageHistory({
      history,
      progress: 1 - progress,
      direction: "rewind"
    });

    assert.deepEqual(repeated, forward);
    assert.equal(forward.activeOwnerCount, 1);
    assert.equal(mirrored.activeOwnerCount, 1);
    assert.equal(mirrored.semanticProgress, forward.semanticProgress);
    if (forward.handoff === undefined) {
      assert.equal(mirrored.activeEntryId, forward.activeEntryId);
      assert.equal(
        mirrored.localSemanticProgress,
        forward.localSemanticProgress
      );
      assert.equal(
        mirrored.choreography.semanticProgress,
        forward.choreography.semanticProgress
      );
    } else {
      // The two directions deliberately own opposite native sides of an exact
      // cut; no bridge frame or simultaneous owner is introduced.
      assert.strictEqual(mirrored.handoff, forward.handoff);
      assert.equal(forward.localSemanticProgress, 0);
      assert.equal(mirrored.localSemanticProgress, 1);
    }
  }
});

test("native endpoint boundaries interrupt atomically with one active owner", () => {
  const history = historyFixture();
  const epsilon = 1e-6;
  const before = sampleKpSemanticMotionStageHistory({
    history,
    progress: 1 / 3 - epsilon,
    direction: "forward"
  });
  const boundary = sampleKpSemanticMotionStageHistory({
    history,
    progress: 1 / 3,
    direction: "forward"
  });
  const after = sampleKpSemanticMotionStageHistory({
    history,
    progress: 1 / 3 + epsilon,
    direction: "forward"
  });
  const reverseBoundary = sampleKpSemanticMotionStageHistory({
    history,
    progress: 2 / 3,
    direction: "rewind"
  });

  assert.equal(before.activeEntryId, "stage.log-quotient");
  assert.ok(before.localSemanticProgress > 0.999);
  assert.equal(boundary.activeEntryId, "stage.distribution");
  assert.equal(boundary.localSemanticProgress, 0);
  assert.equal(boundary.handoff?.outgoingEntryId, "stage.log-quotient");
  assert.equal(boundary.handoff?.incomingEntryId, "stage.distribution");
  assert.equal(after.activeEntryId, "stage.distribution");
  assert.equal(reverseBoundary.activeEntryId, "stage.log-quotient");
  assert.equal(reverseBoundary.localSemanticProgress, 1);
  assert.equal(reverseBoundary.activeOwnerCount, 1);
});

test("dense sampling retains one active choreography and bounded ownership", () => {
  const history = historyFixture();
  for (const direction of ["forward", "rewind"] as const) {
    for (let index = 0; index <= 300; index += 1) {
      const frame = sampleKpSemanticMotionStageHistory({
        history,
        progress: index / 300,
        direction
      });
      const active = history.entries[frame.activeEntryIndex]!;
      assert.equal(frame.activeOwnerCount, 1);
      assert.equal(frame.activeEntryId, active.id);
      assert.equal(frame.activeAnimationId, active.animationId);
      assert.equal(frame.choreography.choreographyId, active.choreography.id);
      assert.ok(frame.localSemanticProgress >= 0);
      assert.ok(frame.localSemanticProgress <= 1);
      assert.ok(frame.choreography.semanticProgress >= 0);
      assert.ok(frame.choreography.semanticProgress <= 1);
    }
  }
});

test("composition rejects copied authority and repeated executable callers", () => {
  assert.throws(() => compileKpSemanticMotionStageHistory({
    id: "history.copied",
    entries: [{
      id: "stage.copied",
      choreography: {
        ...kpCanonicalCompiledLogQuotientSemanticMotion
      }
    }]
  }), /original compiler authority/);
  assert.throws(() => compileKpSemanticMotionStageHistory({
    id: "history.repeated",
    entries: [callers[0]!, {
      id: "stage.repeated",
      choreography: callers[0]!.choreography
    }]
  }), /repeats choreography/);
});

function historyFixture() {
  return compileKpSemanticMotionStageHistory({
    id: "history.semantic-motion.three-pressure-callers",
    entries: callers
  });
}
