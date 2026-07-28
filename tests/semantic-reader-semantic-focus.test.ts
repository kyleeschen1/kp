import assert from "node:assert/strict";
import test from "node:test";

import { createKpReaderSemanticFocusService } from "../src/reader/runtime/public-api.ts";

const allowed = ["equation.x", "equation.left", "equation.right"];

test("temporary pointer and keyboard focus restore underlying story focus", () => {
  const focus = createKpReaderSemanticFocusService(allowed);
  focus.set("story", ["equation.left", "equation.right"]);
  focus.set("pointer", ["equation.x"]);
  assert.deepEqual(focus.getSnapshot(), {
    activeSource: "pointer",
    objectRefs: ["equation.x"],
    revision: 2
  });
  focus.set("keyboard", ["equation.right"]);
  assert.equal(focus.getSnapshot().activeSource, "keyboard");
  focus.clear("keyboard");
  assert.equal(focus.getSnapshot().activeSource, "pointer");
  focus.clear("pointer");
  assert.deepEqual(focus.getSnapshot().objectRefs, ["equation.left", "equation.right"]);
});

test("URL focus overrides story but yields to direct affordance discovery", () => {
  const focus = createKpReaderSemanticFocusService(allowed);
  focus.set("story", ["equation.left"]);
  focus.set("url", ["equation.right"]);
  assert.equal(focus.getSnapshot().activeSource, "url");
  focus.set("pointer", ["equation.x"]);
  assert.equal(focus.getSnapshot().activeSource, "pointer");
  focus.clear("pointer");
  assert.equal(focus.getSnapshot().activeSource, "url");
});

test("focus refs are catalog-closed copied and deduplicated", () => {
  const focus = createKpReaderSemanticFocusService(allowed);
  const refs = ["equation.x", "equation.x"];
  focus.set("story", refs);
  refs.push("equation.left");
  assert.deepEqual(focus.getSnapshot().objectRefs, ["equation.x"]);
  assert.throws(() => focus.set("pointer", ["equation.missing"]), /unknown semantic focus ref/);
});

test("subscribers receive renderer-neutral snapshots and disposal closes service", () => {
  const focus = createKpReaderSemanticFocusService(allowed);
  const revisions: number[] = [];
  const unsubscribe = focus.subscribe((snapshot) => revisions.push(snapshot.revision));
  focus.set("story", ["equation.x"]);
  focus.clear("story");
  unsubscribe();
  focus.set("url", ["equation.left"]);
  assert.deepEqual(revisions, [1, 2]);
  focus.dispose();
  assert.throws(() => focus.set("story", ["equation.x"]), /is disposed/);
});

test("unchanged or hidden layers do not republish visible focus", () => {
  const focus = createKpReaderSemanticFocusService(allowed);
  const revisions: number[] = [];
  focus.subscribe((snapshot) => revisions.push(snapshot.revision));

  focus.set("story", ["equation.left"]);
  focus.set("story", ["equation.left", "equation.left"]);
  focus.set("pointer", ["equation.right"]);
  focus.set("story", ["equation.right"]);
  focus.clear("url");

  assert.deepEqual(revisions, [1, 2]);
  assert.deepEqual(focus.getSnapshot(), {
    activeSource: "pointer",
    objectRefs: ["equation.right"],
    revision: 2
  });
});
