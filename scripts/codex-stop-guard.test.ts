import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { codexStopGuardDecision } from "./codex-stop-guard.ts";

const projectRoot = "/workspace/kp";
const stopInput = { cwd: "/workspace/kp/apps/reader", hook_event_name: "Stop" };

test("reminds Codex when an approved Theseus slice remains", () => {
  assert.deepEqual(codexStopGuardDecision(stopInput, {
    items: [{
      project: { id: "kp" },
      currentRun: {
        title: "Reliability loop",
        completedSlices: 15,
        remainingSlices: 5,
        nextSlice: { title: "Install continuity hook" }
      }
    }]
  }, projectRoot), {
    continue: true,
    systemMessage: "KP · Reliability loop · slice 16/20. 5 approved slices remain; next: Install continuity hook. Continue unless a named contract stop condition fired. Before finalizing, report one explicit stop outcome and the exact resume command."
  });
});

test("stays silent for a completed contract", () => {
  assert.equal(codexStopGuardDecision(stopInput, {
    items: [{ currentRun: { completedSlices: 20, remainingSlices: 0 } }]
  }, projectRoot), undefined);
});

test("stays silent when there is no active contract", () => {
  assert.equal(codexStopGuardDecision(stopInput, { items: [{}] }, projectRoot), undefined);
});

test("stays silent outside the trusted project", () => {
  assert.equal(codexStopGuardDecision({ cwd: "/workspace/elsewhere", hook_event_name: "Stop" }, {
    items: [{ currentRun: { completedSlices: 1, remainingSlices: 2 } }]
  }, projectRoot), undefined);
});

test("stays silent for malformed or non-Stop input", () => {
  assert.equal(codexStopGuardDecision({}, {}, projectRoot), undefined);
  assert.equal(codexStopGuardDecision({ cwd: projectRoot, hook_event_name: "PostToolUse" }, {
    items: [{ currentRun: { completedSlices: 1, remainingSlices: 2 } }]
  }, projectRoot), undefined);
});

test("project hook invokes the committed fail-open guard from the Git root", () => {
  const config = JSON.parse(readFileSync(new URL("../.codex/hooks.json", import.meta.url), "utf8")) as {
    hooks?: { Stop?: Array<{ hooks?: Array<{ command?: string; timeout?: number }> }> };
  };
  const hook = config.hooks?.Stop?.[0]?.hooks?.[0];
  assert.equal(hook?.command, "/usr/bin/env node --disable-warning=ExperimentalWarning \"$(git rev-parse --show-toplevel)/scripts/codex-stop-guard.ts\"");
  assert.equal(hook?.timeout, 10);
});
