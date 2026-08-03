import assert from "node:assert/strict";
import test from "node:test";

import {
  applyKpTutorialNavigationTransaction
} from "../src/tutorial/kp-tutorial-navigation.ts";
import {
  parseKpTutorialDestinationHash,
  serializeKpTutorialDestinationHash
} from "../src/tutorial/kp-tutorial-url.ts";

test("navigation restores semantics before TOC state and viewport movement", () => {
  const order: string[] = [];
  applyKpTutorialNavigationTransaction({
    target: { frame: "settled" },
    destination: { kind: "checkpoint", id: "result-settled" },
    source: "push",
    scroll: true,
    writeHistory: () => order.push("history"),
    restore: () => order.push("restore"),
    setActive: () => order.push("active"),
    onApplied: () => order.push("announce"),
    moveViewport: () => order.push("scroll")
  });
  assert.deepEqual(order, ["history", "restore", "active", "announce", "scroll"]);
});

test("history restoration neither pushes nor moves when scrolling is disabled", () => {
  const order: string[] = [];
  applyKpTutorialNavigationTransaction({
    target: {},
    destination: { kind: "section", id: "context" },
    source: "history",
    scroll: false,
    writeHistory: () => order.push("history"),
    restore: () => order.push("restore"),
    setActive: () => order.push("active"),
    onApplied: () => order.push("announce"),
    moveViewport: () => order.push("scroll")
  });
  assert.deepEqual(order, ["restore", "active", "announce"]);
});

test("the shared transaction uses semantic hashes without progress", () => {
  const hash = serializeKpTutorialDestinationHash({
    kind: "block",
    id: "evaluate-and-gather"
  });
  assert.deepEqual(parseKpTutorialDestinationHash(hash), {
    kind: "block",
    id: "evaluate-and-gather"
  });
  assert.doesNotMatch(hash, /progress|time|frame/);
});
