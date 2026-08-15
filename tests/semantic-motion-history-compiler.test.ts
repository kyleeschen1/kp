import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSemanticMotionHistory,
  encodeKpSemanticMotionCheckpointCursor,
  isKpVerifiedSemanticMotionHistory,
  projectKpSemanticMotionHistory,
  resolveKpSemanticMotionHistoryCursor,
  restoreKpSemanticMotionCheckpointCursor,
  type KpSemanticMotionHistoryStepInput
} from "../src/domain-ir/public-api.ts";
import { createSequentialSemanticMotionFixture } from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("composed semantic history preserves stable addresses and authored order across arbitrary chain lengths", () => {
  for (const transitionCount of [1, 2, 3, 5, 8]) {
    const fixture = createSequentialSemanticMotionFixture(transitionCount);
    const result = compileKpSemanticMotionHistory({
      id: `history.sequence.${transitionCount}`,
      steps: fixture.steps
    });
    assert.equal(result.status, "verified", `chain ${transitionCount}`);
    if (result.status !== "verified") continue;
    const { history } = result;
    assert.equal(isKpVerifiedSemanticMotionHistory(history), true);
    assert.equal(history.transitions.length, transitionCount);
    assert.equal(history.checkpoints.length, transitionCount + 1);
    assert.deepEqual(history.transitions.map(({ id }) => id), fixture.steps.map(({ request }) => request.operation.transformationId));
    assert.deepEqual(
      history.checkpoints.flatMap(({ entityAddresses }) => entityAddresses.map(({ semanticIdentityId }) => semanticIdentityId)),
      Array.from({ length: transitionCount + 1 }, () => "identity.sequence")
    );
    history.checkpoints.forEach((checkpoint, index) => {
      const resolved = resolveKpSemanticMotionHistoryCursor(history, {
        kind: "checkpoint",
        historyId: history.id,
        checkpointId: checkpoint.id
      });
      assert.equal(resolved?.kind, "checkpoint");
      if (resolved?.kind === "checkpoint") assert.strictEqual(resolved.checkpoint, history.checkpoints[index]);
    });
  }
});

test("rewind direct seek event interruption and URL restoration reuse exact semantic history objects", () => {
  const fixture = createSequentialSemanticMotionFixture(4);
  const result = compileKpSemanticMotionHistory({ id: "history.navigation", steps: fixture.steps });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  const { history } = result;
  const forward = projectKpSemanticMotionHistory(history, "forward");
  const rewind = projectKpSemanticMotionHistory(history, "rewind");
  assert.strictEqual(forward.transitions[0], rewind.transitions.at(-1));
  assert.strictEqual(forward.checkpoints[0], rewind.checkpoints.at(-1));

  const transition = history.transitions[2]!;
  const event = transition.precedence.events[1]!;
  const interrupted = resolveKpSemanticMotionHistoryCursor(history, {
    kind: "semantic-event",
    historyId: history.id,
    transitionId: transition.id,
    eventId: event.id
  });
  assert.equal(interrupted?.kind, "semantic-event");
  if (interrupted?.kind === "semantic-event") {
    assert.strictEqual(interrupted.transition, transition);
    assert.strictEqual(interrupted.event, event);
  }

  const checkpoint = history.checkpoints[3]!;
  const encoded = encodeKpSemanticMotionCheckpointCursor({
    kind: "checkpoint",
    historyId: history.id,
    checkpointId: checkpoint.id
  });
  const restored = restoreKpSemanticMotionCheckpointCursor(history, encoded);
  assert.equal(restored?.kind, "checkpoint");
  if (restored?.kind === "checkpoint") assert.strictEqual(restored.checkpoint, checkpoint);
  assert.equal(restoreKpSemanticMotionCheckpointCursor(history, encoded.replace("v1", "v2")), undefined);
});

test("incompatible endpoints identity drift duplicate stages and forged history authority fail closed", () => {
  const fixture = createSequentialSemanticMotionFixture(3);
  const brokenSeam: readonly KpSemanticMotionHistoryStepInput[] = [
    fixture.steps[0]!,
    {
      ...fixture.steps[1]!,
      request: {
        ...fixture.steps[1]!.request,
        sourceState: { ...fixture.steps[1]!.request.sourceState, id: "state.foreign" }
      }
    }
  ];
  const seamResult = compileKpSemanticMotionHistory({ id: "history.bad-seam", steps: brokenSeam });
  assert.equal(seamResult.status, "repair-required");
  if (seamResult.status === "repair-required") {
    assert.equal(seamResult.issues.some(({ code }) => code === "semantic-motion.history.endpoint-seam"), true);
  }

  const duplicateStageResult = compileKpSemanticMotionHistory({
    id: "history.bad-stage",
    steps: [fixture.steps[0]!, {
      ...fixture.steps[1]!,
      request: { ...fixture.steps[1]!.request, assetId: "animation.second-stage" }
    }]
  });
  assert.equal(duplicateStageResult.status, "repair-required");
  if (duplicateStageResult.status === "repair-required") {
    assert.equal(duplicateStageResult.issues.some(({ code }) => code === "semantic-motion.history.duplicate-stage"), true);
  }

  const alternateIdentity = createSequentialSemanticMotionFixture(3, "identity.alternate");
  const identityResult = compileKpSemanticMotionHistory({
    id: "history.bad-identity",
    steps: [fixture.steps[0]!, alternateIdentity.steps[1]!]
  });
  assert.equal(identityResult.status, "repair-required");
  if (identityResult.status === "repair-required") {
    assert.equal(identityResult.issues.some(({ code }) => code === "semantic-motion.history.identity-seam"), true);
  }

  const valid = compileKpSemanticMotionHistory({ id: "history.valid", steps: fixture.steps });
  assert.equal(valid.status, "verified");
  if (valid.status !== "verified") return;
  const forgedRequest = {
    ...fixture.steps[0]!,
    request: { ...fixture.steps[0]!.request }
  };
  const forgedResult = compileKpSemanticMotionHistory({ id: "history.forged", steps: [forgedRequest] });
  assert.equal(forgedResult.status, "repair-required");
  if (forgedResult.status === "repair-required") {
    assert.equal(forgedResult.issues.some(({ code }) => code === "semantic-motion.history.source-authority"), true);
  }
  assert.throws(
    () => projectKpSemanticMotionHistory({ ...valid.history }, "forward"),
    /original composition authority/
  );
});
