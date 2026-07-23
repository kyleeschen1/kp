import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpAnimationWorkbenchReviewPanel
} from "../src/editor/semantic-animation-workbench-review.ts";
import type {
  KpAnimationReviewProjection
} from "../src/editor/semantic-animation-workbench-review-adapter.ts";

test("review panel separates current and historical item evidence", () => {
  const html = renderKpAnimationWorkbenchReviewPanel({
    animationId: "animation.radical",
    state: "available",
    projection: projection()
  });

  assert.match(
    html,
    /data-kp-animation-workbench-review-group="current"[\s\S]*note\.current/
  );
  assert.match(
    html,
    /data-kp-animation-workbench-review-group="historical"[\s\S]*note\.historical/
  );
  assert.match(html, /Checkpoint <code>checkpoint\.radical/);
  assert.match(html, /Open captured route/);
  assert.doesNotMatch(html, /animation\.derivative/);
});

test("review panel reports local inbox unavailability without fabricating notes", () => {
  const html = renderKpAnimationWorkbenchReviewPanel({
    animationId: "animation.radical",
    state: "unavailable"
  });

  assert.match(html, /available only from the local development inbox/);
  assert.doesNotMatch(html, /data-kp-animation-workbench-review-note/);
});

function projection(): KpAnimationReviewProjection {
  return {
    animationId: "animation.radical",
    state: "changes-requested",
    current: [
      {
        captureIdentity: "round.current:note.current:2:build.current",
        animationId: "animation.radical",
        noteId: "note.current",
        sequence: 2,
        roundId: "round.current",
        current: true,
        status: "new",
        comment: "Check the radical settlement.",
        sessionId: "session.current",
        capturedAt: "2026-07-23T12:00:00.000Z",
        route: "/?animation=animation.radical",
        buildFingerprint: "build.current",
        checkpointId: "checkpoint.radical",
        progressPermille: 500,
        activePhase: "animation.radical.forward.form"
      }
    ],
    historical: [
      {
        captureIdentity: "round.old:note.historical:1:build.old",
        animationId: "animation.radical",
        noteId: "note.historical",
        sequence: 1,
        roundId: "round.old",
        current: false,
        status: "verified",
        comment: "Earlier radical review passed.",
        sessionId: "session.old",
        capturedAt: "2026-07-22T12:00:00.000Z",
        route: "/?animation=animation.radical",
        buildFingerprint: "build.old"
      }
    ]
  };
}
