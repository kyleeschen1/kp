import assert from "node:assert/strict";
import test from "node:test";

import {
  formatTheseusLoopStatus,
  formatStoredContractStatus,
  requiresUnscopedRunLookup
} from "./theseus-loop-status.ts";

test("explicit stored progress survives an absent global snapshot without inventing blockers or completion", () => {
  const contract = { id: "run-contract.kp.test", kind: "run-contract", title: "Selected run", status: "active", slices: [
    { id: "one", title: "Finished", status: "complete" },
    { id: "two", title: "Remaining", status: "in-progress" },
    { id: "three", title: "Deferred", status: "deferred" }
  ] };
  const status = formatStoredContractStatus(contract, contract.id);
  assert.equal(status.headline, "KP · Selected run · 1/3 complete");
  assert.match(status.detail, /next: Remaining · global blockers not queried/);
  assert.equal(status.active, true);
  assert.equal(formatStoredContractStatus({ ...contract, status: "resolved" }, contract.id).active, false);
  for (const value of [null, {}, { ...contract, id: "different" }, { ...contract, slices: [contract.slices[0], contract.slices[0]] },
    { ...contract, slices: [{ id: "missing-status", title: "Incomplete" }] }]) {
    assert.throws(() => formatStoredContractStatus(value, contract.id), /Invalid/);
  }
});

test("prints exact logical slice progress from the active Theseus contract", () => {
  assert.deepEqual(formatTheseusLoopStatus({
    items: [{
      project: { id: "kp" },
      currentRun: {
        id: "run-contract.kp.reliability-v0",
        title: "Codex reliability v0",
        completedSlices: 7,
        remainingSlices: 13,
        nextSlice: { id: "s08", title: "Validate policy" }
      },
      blockers: []
    }]
  }), {
    active: true,
    headline: "KP · Codex reliability v0 · slice 8/20",
    detail: "7 complete · 13 remaining · 0 blockers · next: Validate policy"
  });
});

test("prints the completed ordinal during closeout", () => {
  const status = formatTheseusLoopStatus({
    items: [{
      project: { id: "kp" },
      currentRun: {
        title: "Complete run",
        completedSlices: 20,
        remainingSlices: 0
      },
      blockers: ["Awaiting transition"]
    }]
  });
  assert.equal(status.headline, "KP · Complete run · slice 20/20");
  assert.match(status.detail, /1 blocker · next: closeout/);
});

test("reports an absent active contract without inventing progress", () => {
  assert.deepEqual(formatTheseusLoopStatus({ items: [{ project: { id: "kp" } }] }), {
    active: false,
    headline: "KP · no active loop",
    detail: "Run `theseus plan run` to select or inspect the next approved contract."
  });
});

test("falls back when scoped health sees a run but omits its contract", () => {
  assert.equal(requiresUnscopedRunLookup({
    items: [{
      project: { id: "kp" },
      health: { activeRunContracts: 1 }
    }]
  }), true);
  assert.equal(requiresUnscopedRunLookup({
    items: [{
      project: { id: "kp" },
      health: { activeRunContracts: 0 }
    }]
  }), false);
});
