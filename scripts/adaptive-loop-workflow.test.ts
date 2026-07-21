import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpTheseusLoopEnvelope,
  selectKpTheseusLoopMode
} from "./theseus-loop-policy.ts";
import { selectKpVerificationImpact } from "./verification-impact.ts";

test("a focused visual-feedback fix composes iteration mode with targeted proof", () => {
  const selection = selectKpTheseusLoopMode({
    estimatedSlices: 2,
    estimatedMinutes: 35,
    subsystems: ["dev-review-shell"],
    risk: "medium",
    migration: false,
    visualScope: "exemplar",
    approvedMode: "iteration"
  });
  const verification = selectKpVerificationImpact([
    "src/dev-review/review-inbox.ts",
    "tests/dev-review-shell.browser.spec.ts"
  ]);

  assert.equal(selection.selectedMode, "iteration");
  assert.equal(selection.approvalRequired, false);
  assert.ok(verification.checks.some((check) => check.id === "dev-review-browser"));
  assert.ok(verification.checks.some((check) => check.id === "dev-review-production-closure"));
  assert.ok(!verification.checks.some((check) => check.id === "build"));
});

test("a protocol migration and visual generalization compose long mode with release proof", () => {
  const selection = selectKpTheseusLoopMode({
    estimatedSlices: 24,
    estimatedMinutes: 360,
    subsystems: ["protocol", "server", "client", "visual-runtime"],
    risk: "high",
    migration: true,
    visualScope: "generalization",
    approvedMode: "long"
  });
  const verification = selectKpVerificationImpact([
    "protocols/dev-review-v2.ts",
    "src/semantic-reader/runtime.ts"
  ], { release: true });

  assert.equal(selection.selectedMode, "long");
  assert.equal(selection.approvalRequired, false);
  assert.ok(selection.reasons.some((reason) => reason.includes("Migration")));
  assert.ok(verification.checks.some((check) => check.id === "test"));
  assert.ok(verification.checks.some((check) => check.id === "build"));
  assert.ok(verification.checks.some((check) => check.id === "theseus-validate"));
});

test("an iteration override is honored and then stops on discovered scope growth", () => {
  const selection = selectKpTheseusLoopMode({
    estimatedSlices: 5,
    estimatedMinutes: 90,
    subsystems: ["review-shell", "review-server"],
    risk: "medium",
    migration: false,
    visualScope: "exemplar",
    override: "iteration",
    approvedMode: "iteration"
  });
  const observed = evaluateKpTheseusLoopEnvelope(selection, {
    estimatedSlices: 4,
    estimatedMinutes: 60,
    subsystems: ["review-shell", "review-server"],
    risk: "medium",
    migration: false,
    visualScope: "exemplar"
  });

  assert.equal(selection.recommendedMode, "long");
  assert.equal(selection.selectedMode, "iteration");
  assert.equal(observed.status, "approval-required");
  assert.equal(observed.proposedMode, "long");
});
