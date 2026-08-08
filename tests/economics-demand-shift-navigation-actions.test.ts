import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpEconomicsNavigationActionDetail,
  resolveKpEconomicsNavigationAction
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-navigation-actions.ts";

test("motion-passage actions resolve stable semantic destinations", () => {
  assert.deepEqual(resolveKpEconomicsNavigationAction({
    action: "next-motion-passage",
    blockId: "demand-shift"
  }), { kind: "block", id: "supply-movement" });
  assert.deepEqual(resolveKpEconomicsNavigationAction({
    action: "previous-motion-passage",
    blockId: "supply-movement"
  }), { kind: "block", id: "demand-shift" });
  assert.deepEqual(resolveKpEconomicsNavigationAction({
    action: "settle-motion",
    blockId: "demand-shift"
  }), { kind: "checkpoint", id: "shift-settled" });
  assert.deepEqual(resolveKpEconomicsNavigationAction({
    action: "skip-motion",
    blockId: "supply-movement"
  }), { kind: "checkpoint", id: "movement-verified" });
  assert.deepEqual(resolveKpEconomicsNavigationAction({
    action: "exit-motion",
    blockId: "supply-movement"
  }), { kind: "section", id: "model-scope" });
  assert.equal(resolveKpEconomicsNavigationAction({
    action: "previous-motion-passage",
    blockId: "demand-shift"
  }), undefined);
});

test("navigation action details reject foreign commands and blocks", () => {
  assert.equal(isKpEconomicsNavigationActionDetail({
    action: "settle-motion",
    blockId: "demand-shift"
  }), true);
  assert.equal(isKpEconomicsNavigationActionDetail({ action: "teleport" }), false);
  assert.equal(isKpEconomicsNavigationActionDetail({
    action: "settle-motion",
    blockId: "foreign"
  }), false);
});
