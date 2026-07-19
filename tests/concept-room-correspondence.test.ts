import assert from "node:assert/strict";
import test from "node:test";

import {
  correspondenceTargetsFor,
  createConceptRoomCorrespondenceIndex,
  projectConceptRoomFocus
} from "../src/projections/public-api.ts";

const index = createConceptRoomCorrespondenceIndex([
  { id: "prose.add-three", semanticId: "term.add-three", surface: "prose" },
  { id: "symbolic.add-three", semanticId: "term.add-three", surface: "symbolic" },
  { id: "balance.add-three", semanticId: "term.add-three", surface: "balance" },
  { id: "prose.two-x", semanticId: "term.two-x", surface: "prose" },
  { id: "symbolic.two-x", semanticId: "term.two-x", surface: "symbolic" }
]);

test("correspondence index resolves explicit semantic targets across surfaces", () => {
  assert.deepEqual(
    correspondenceTargetsFor(index, "term.add-three").map((target) => target.surface),
    ["prose", "symbolic", "balance"]
  );
  assert.equal(Object.isFrozen(index), true);
  assert.equal(Object.isFrozen(index.targets), true);
});

test("hover, keyboard, and pinned focus remain distinct channels", () => {
  const projection = projectConceptRoomFocus(index, {
    hoveredSemanticId: "term.add-three",
    keyboardSemanticId: "term.two-x",
    pinnedSemanticIds: ["term.add-three"]
  });
  assert.deepEqual(projection.activeSemanticIds, ["term.add-three", "term.two-x"]);
  assert.deepEqual(
    projection.targets.find((target) => target.id === "symbolic.add-three")?.channels,
    ["hover", "pinned"]
  );
  assert.deepEqual(
    projection.targets.find((target) => target.id === "symbolic.two-x")?.channels,
    ["keyboard"]
  );
});

test("ephemeral focus does not mutate the durable pinned input", () => {
  const pinned = Object.freeze(["term.two-x"]);
  projectConceptRoomFocus(index, { hoveredSemanticId: "term.add-three", pinnedSemanticIds: pinned });
  assert.deepEqual(pinned, ["term.two-x"]);
});

test("correspondence rejects duplicate or glyph-derived identities", () => {
  assert.throws(() => createConceptRoomCorrespondenceIndex([
    { id: "target.one", semanticId: "term.one", surface: "prose" },
    { id: "target.one", semanticId: "term.two", surface: "symbolic" }
  ]), /Duplicate correspondence target/);
  assert.throws(() => createConceptRoomCorrespondenceIndex([
    { id: "glyph:+3", semanticId: "term.one", surface: "symbolic" }
  ]), /Invalid target identity/);
});
