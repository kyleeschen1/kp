import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpTheseusLoopEnvelope,
  selectKpTheseusLoopMode,
  type KpTheseusLoopSignals
} from "./theseus-loop-policy.ts";

const small: KpTheseusLoopSignals = {
  estimatedSlices: 2,
  estimatedMinutes: 30,
  subsystems: ["review-shell"],
  risk: "medium",
  migration: false,
  visualScope: "exemplar"
};

test("small reversible work recommends iteration and awaits matching approval", () => {
  const selection = selectKpTheseusLoopMode(small);
  assert.equal(selection.recommendedMode, "iteration");
  assert.equal(selection.selectedMode, "iteration");
  assert.equal(selection.approvalRequired, true);
  assert.equal(selection.envelope.maxSlices, 3);
});

test("cross-boundary, migration, and generalization signals explain long mode", () => {
  const selection = selectKpTheseusLoopMode({
    ...small,
    estimatedSlices: 8,
    estimatedMinutes: 150,
    subsystems: ["protocol", "server", "client"],
    risk: "high",
    migration: true,
    visualScope: "generalization",
    approvedMode: "long"
  });
  assert.equal(selection.recommendedMode, "long");
  assert.equal(selection.approvalRequired, false);
  assert.ok(selection.reasons.length >= 5);
});

test("explicit overrides win but a narrow override narrows executable scope", () => {
  const selection = selectKpTheseusLoopMode({
    ...small,
    estimatedSlices: 7,
    subsystems: ["protocol", "client"],
    override: "iteration",
    approvedMode: "iteration"
  });
  assert.equal(selection.recommendedMode, "long");
  assert.equal(selection.selectedMode, "iteration");
  assert.equal(selection.overrideApplied, true);
  assert.equal(selection.approvalRequired, false);
  assert.match(selection.warnings[0] ?? "", /excluded scope/);
});

test("iteration scope growth stops for approval instead of silently escalating", () => {
  const selection = selectKpTheseusLoopMode({ ...small, approvedMode: "iteration" });
  const result = evaluateKpTheseusLoopEnvelope(selection, {
    ...small,
    estimatedSlices: 4,
    estimatedMinutes: 55,
    subsystems: ["review-shell", "server"]
  });
  assert.equal(result.status, "approval-required");
  assert.equal(result.proposedMode, "long");
  assert.equal(result.reasons.length, 3);
});

test("work inside the approved envelope can continue", () => {
  const selection = selectKpTheseusLoopMode({ ...small, approvedMode: "iteration" });
  assert.deepEqual(evaluateKpTheseusLoopEnvelope(selection, small), {
    status: "within-envelope",
    selectedMode: "iteration",
    reasons: ["Observed work remains inside the approved loop envelope."]
  });
});
