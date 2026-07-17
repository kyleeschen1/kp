import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEpistemicBranch,
  resolveKpEpistemicBranch,
  sampleKpEpistemicBranch
} from "../src/semantic/epistemic-branch.ts";
import { createKpEpistemicAnnotation } from "../src/semantic/epistemic-status.ts";

const proposal = annotation("hypothesis", "Awaiting validation.");

test("student proposals branch provisionally from the last trusted state", () => {
  const branch = provisional();
  const end = sampleKpEpistemicBranch({ branch, progress: 1 });
  assert.equal(branch.status, "provisional");
  assert.equal(branch.trustedStateId, "state.trusted");
  assert.equal(end.settlesAsValid, false);
  assert.ok(end.trustedStateOpacity > 0);
  assert.ok(end.proposedStateOpacity < 1);
  assert.equal(end.cueVisible, true);
});

test("validation commits valid evidence or marks the proposal without changing motion grammar", () => {
  const accepted = resolveKpEpistemicBranch({
    branch: provisional(),
    resolution: {
      kind: "accept",
      annotation: annotation("valid", "Both sides remain equal."),
      evidenceIds: ["law.equality-both-sides"]
    }
  });
  assert.equal(accepted.status, "committed");
  assert.equal(sampleKpEpistemicBranch({ branch: accepted, progress: 1 }).settlesAsValid, true);

  const rejected = resolveKpEpistemicBranch({
    branch: provisional(),
    resolution: {
      kind: "reject",
      rationale: "Only one side was changed.",
      evidenceIds: ["law.equality-both-sides"]
    }
  });
  const marked = sampleKpEpistemicBranch({ branch: rejected, progress: 1 });
  assert.equal(rejected.status, "marked-invalid");
  assert.equal(rejected.annotation.status, "invalid");
  assert.equal(marked.settlesAsValid, false);
  assert.ok(marked.cueStrength > 0);
});

test("retraction restores the trusted state and removes proposed settlement", () => {
  const retracted = resolveKpEpistemicBranch({
    branch: provisional(),
    resolution: { kind: "retract", rationale: "The learner withdrew this step." }
  });
  const end = sampleKpEpistemicBranch({ branch: retracted, progress: 1 });
  assert.equal(end.trustedStateOpacity, 1);
  assert.equal(end.proposedStateOpacity, 0);
  assert.equal(end.targetSettlementProgress, 0);
});

test("uploaded incorrect derivations require explicit historical replay", () => {
  const invalid = annotation("invalid", "Recorded algebra changes only one side.");
  assert.throws(() => createKpEpistemicBranch({
    id: "branch.uploaded",
    origin: "uploaded-material",
    trustedStateId: "state.trusted",
    proposedStateId: "state.proposed",
    transitionId: "transition.proposed",
    annotation: invalid
  }), /explicit historical replay/);
  const replay = createKpEpistemicBranch({
    id: "branch.uploaded",
    origin: "uploaded-material",
    trustedStateId: "state.trusted",
    proposedStateId: "state.proposed",
    transitionId: "transition.proposed",
    annotation: invalid,
    historicalReplayRequested: true
  });
  assert.equal(replay.status, "historical-invalid");
  assert.equal(sampleKpEpistemicBranch({ branch: replay, progress: 1 }).settlesAsValid, false);
});

test("a branch cannot commit without valid target evidence", () => {
  assert.throws(() => resolveKpEpistemicBranch({
    branch: provisional(),
    resolution: {
      kind: "accept",
      annotation: proposal,
      evidenceIds: []
    }
  }), /requires valid target evidence/);
});

function provisional() {
  return createKpEpistemicBranch({
    id: "branch.student-proposal",
    origin: "student-prompt",
    trustedStateId: "state.trusted",
    proposedStateId: "state.proposed",
    transitionId: "transition.proposed",
    annotation: proposal
  });
}

function annotation(status: "hypothesis" | "valid" | "invalid", rationale: string) {
  return createKpEpistemicAnnotation({
    subject: { kind: "state", id: "state.proposed" },
    status,
    rationale,
    disclosure: { trigger: { kind: "immediate" }, announce: true }
  });
}
