import assert from "node:assert/strict";
import test from "node:test";
import { renderKpHermeneuticLearnerShell } from "../src/tutorial/hermeneutic-learner-shell.ts";

test("learner shell is graph-led and exposes one semantic transport", () => {
  const html = renderKpHermeneuticLearnerShell({
    module: {
      id: "tutorial.ftc",
      version: 1,
      title: "Accumulation becomes local change",
      clockId: "clock.ftc.shared",
      canonicalSceneIds: [],
      views: [],
      scenes: [],
      checkpoints: []
    },
    frame: {
      timelineId: "timeline.ftc",
      clockId: "clock.ftc.shared",
      progress: 0.5,
      beat: 25,
      elapsedMs: 2500,
      activeClaimId: "claim.ftc.strip",
      activeCheckpointId: "checkpoint.ftc.strip",
      localProgress: 0
    },
    graphHtml: "<svg data-test-graph></svg>",
    equationHtml: "<span>A'(x)=f(x)</span>",
    claimText: "The added strip controls the local change.",
    narrationText: "Finite evidence first.",
    branchActive: true
  });

  assert.match(html, /data-kp-hermeneutic-tutorial="tutorial\.ftc"/);
  assert.match(html, /data-kp-tutorial-clock="clock\.ftc\.shared"/);
  assert.match(html, /data-kp-tutorial-view="graph"/);
  assert.match(html, /data-kp-tutorial-view="claim-rail"/);
  assert.match(html, /data-kp-tutorial-action="scrub"/);
  assert.match(html, /data-kp-tutorial-action="inspect-part"/);
  assert.match(html, /data-kp-tutorial-action="inspect-whole"/);
  assert.match(html, /data-kp-tutorial-action="rejoin"/);
  assert.doesNotMatch(html, /overflow:\s*(auto|scroll)/);
});
