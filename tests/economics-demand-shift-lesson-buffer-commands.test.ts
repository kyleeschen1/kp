import assert from "node:assert/strict";
import test from "node:test";

import {
  applyKpEconomicsLessonBufferCommand,
  KpEconomicsLessonBufferConfirmationError
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer-commands.ts";
import {
  createKpEconomicsLessonBuffer,
  parseKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer.ts";
import { kpEconomicsTwoColumnParagraphs } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-scroll.ts";
import { kpEconomicsTwoColumnSourceSchema } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

function currentSource(): string {
  return serializeKpEconomicsLessonBuffer(createKpEconomicsLessonBuffer({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: kpEconomicsTwoColumnParagraphs.map((passage) => ({
      id: passage.id,
      role: passage.role,
      ...(passage.motionBlockId === undefined
        ? {}
        : { motionBlockId: passage.motionBlockId }),
      sourceText: passage.paragraphs[0]!.sourceText
    }))
  }));
}

test("add duplicate and update return complete reversible source transactions", () => {
  const initial = currentSource();
  const added = applyKpEconomicsLessonBufferCommand({
    source: initial,
    command: {
      kind: "add-passage",
      afterPassageId: "initial-equilibrium",
      sourceText: "A new comparison."
    }
  });
  const duplicated = applyKpEconomicsLessonBufferCommand({
    source: added.source,
    command: { kind: "duplicate-passage", passageId: added.selectedPassageId }
  });
  const updated = applyKpEconomicsLessonBufferCommand({
    source: duplicated.source,
    command: {
      kind: "update-passage-source",
      passageId: duplicated.selectedPassageId,
      sourceText: "A revised comparison."
    }
  });
  const parsed = parseKpEconomicsLessonBuffer(updated.source);

  assert.equal(parsed.passages.length, 8);
  assert.match(added.selectedPassageId, /^draft-passage-/u);
  assert.notEqual(duplicated.selectedPassageId, added.selectedPassageId);
  assert.equal(
    parsed.passages.find(({ id }) => id === duplicated.selectedPassageId)!
      .sourceText,
    "A revised comparison."
  );
  // Undo and redo consume the same complete source values; no second model is needed.
  assert.deepEqual(parseKpEconomicsLessonBuffer(initial).passages.length, 6);
  assert.deepEqual(parseKpEconomicsLessonBuffer(updated.source).passages.length, 8);
});

test("duplicating a motion or reference owner cannot copy semantic authority", () => {
  const transition = applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: { kind: "duplicate-passage", passageId: "follow-shift" }
  });
  const transitionCopy = parseKpEconomicsLessonBuffer(transition.source)
    .passages.find(({ id }) => id === transition.selectedPassageId)!;
  assert.equal(transitionCopy.role, "regular");

  const reference = applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: { kind: "duplicate-passage", passageId: "graph-at-rest" }
  });
  const referenceCopy = parseKpEconomicsLessonBuffer(reference.source)
    .passages.find(({ id }) => id === reference.selectedPassageId)!;
  assert.doesNotMatch(referenceCopy.sourceText, /kp-ref:/u);
  assert.match(referenceCopy.sourceText, /\$P\$/u);
});

test("move preserves stable IDs and every typed relationship", () => {
  const initial = parseKpEconomicsLessonBuffer(currentSource());
  const moved = applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: {
      kind: "move-passage",
      passageId: "new-equilibrium",
      direction: -1
    }
  });
  const parsed = parseKpEconomicsLessonBuffer(moved.source);

  assert.deepEqual(new Set(parsed.passages.map(({ id }) => id)),
    new Set(initial.passages.map(({ id }) => id)));
  assert.deepEqual(parsed.motionBlocks, initial.motionBlocks);
  assert.deepEqual(parsed.semanticReferences, initial.semanticReferences);
  assert.ok(parsed.passages.findIndex(({ id }) => id === "new-equilibrium") <
    parsed.passages.findIndex(({ id }) => id === "follow-shift"));
});

test("delete requires confirmation and protects semantic owners", () => {
  assert.throws(() => applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: {
      kind: "delete-passage",
      passageId: "new-equilibrium",
      confirmed: false
    }
  }), KpEconomicsLessonBufferConfirmationError);
  assert.throws(() => applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: {
      kind: "delete-passage",
      passageId: "follow-shift",
      confirmed: true
    }
  }), /owns a motion block/u);
  assert.throws(() => applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: {
      kind: "delete-passage",
      passageId: "graph-at-rest",
      confirmed: true
    }
  }), /owns a semantic reference/u);

  const deleted = applyKpEconomicsLessonBufferCommand({
    source: currentSource(),
    command: {
      kind: "delete-passage",
      passageId: "new-equilibrium",
      confirmed: true
    }
  });
  assert.equal(parseKpEconomicsLessonBuffer(deleted.source).passages.some(
    ({ id }) => id === "new-equilibrium"
  ), false);
  assert.equal(deleted.selectedPassageId, "shift-versus-movement");
});
