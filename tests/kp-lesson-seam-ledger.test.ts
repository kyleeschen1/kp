import assert from "node:assert/strict";
import test from "node:test";
import {
  kpLessonDocumentFieldLedger,
  kpLessonSeamLedger,
  validateKpLessonSeamLedger
} from "../src/tutorial/kp-lesson-seam-ledger.ts";

test("the seam ledger is internally consistent", () => {
  assert.deepEqual(validateKpLessonSeamLedger(), []);
});

test("every extracted seam has economics and Lisp evidence", () => {
  const extracted = kpLessonSeamLedger.filter(
    ({ disposition }) => disposition === "extract-shared"
  );
  assert.ok(extracted.length >= 6);
  for (const seam of extracted) {
    assert.deepEqual(
      [...new Set(seam.evidence.map(({ caller }) => caller))].sort(),
      ["economics", "lisp"]
    );
    assert.match(seam.extractionSlice ?? "", /^s2[2-5]$/);
  }
});

test("the existing lesson document is adapted instead of duplicated", () => {
  const publication = kpLessonSeamLedger.find(
    ({ id }) => id === "lesson-publication-document"
  );
  assert.equal(publication?.disposition, "adapt-document");
  assert.deepEqual(
    publication?.evidence.map(({ caller }) => caller).sort(),
    ["economics", "lisp", "reader-document"]
  );
  assert.equal(publication?.extractionSlice, "s21");
});

test("the KpLessonDocument comparison covers root and nested semantics", () => {
  const paths = new Set(kpLessonDocumentFieldLedger.map(({ path }) => path));
  for (const required of [
    "kind",
    "id",
    "version",
    "title",
    "blocks",
    "source",
    "language",
    "heading.content",
    "paragraph.content",
    "animation-story.asset",
    "animation-story.presentation",
    "animation-story.beats",
    "beat.checkpoint",
    "beat.focusRefs",
    "attention.kind",
    "attention.phases",
    "attention.phase.progress",
    "attention.phase.focusRefs"
  ]) assert.ok(paths.has(required), `missing ${required}`);
});

test("domain projections have no shared extraction target", () => {
  const local = kpLessonSeamLedger.filter(
    ({ disposition }) => disposition === "domain-local"
  );
  assert.deepEqual(
    local.map(({ id }) => id),
    ["inline-content-rendering", "semantic-stage-projection", "domain-runtime-and-parameters"]
  );
  assert.ok(local.every(({ extractionSlice }) => extractionSlice === undefined));
});
