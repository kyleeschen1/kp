import assert from "node:assert/strict";
import test from "node:test";

import {
  addKpEconomicsLessonDraftPassageAfter,
  createKpEconomicsLessonDraft,
  deleteKpEconomicsLessonDraftPassage,
  duplicateKpEconomicsLessonDraftPassage,
  moveKpEconomicsLessonDraftPassage,
  readKpEconomicsLessonDraft,
  serializeKpEconomicsLessonDraft,
  updateKpEconomicsLessonDraftSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-draft.ts";
import {
  compileKpEconomicsLessonDraftPassages
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-draft-compiler.ts";
import {
  kpEconomicsTwoColumnParagraphs
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-scroll.ts";

const publicationIds = new Set(
  kpEconomicsTwoColumnParagraphs.map(({ id }) => id)
);

test("lesson drafts compile edited Markdown without changing passage identity", () => {
  const initial = createKpEconomicsLessonDraft(
    kpEconomicsTwoColumnParagraphs
  );
  const edited = updateKpEconomicsLessonDraftSource({
    draft: initial,
    passageId: "graph-at-rest",
    sourceText:
      "Read [$P$](kp-ref:price-axis-inline), then compare $D_0$ with $S$."
  });
  const compiled = compileKpEconomicsLessonDraftPassages(edited);
  const passage = compiled.find(({ id }) => id === "graph-at-rest")!;

  assert.equal(passage.role, "regular");
  assert.equal(passage.motionBlockId, undefined);
  assert.match(
    passage.paragraphs[0]!.html,
    /data-kp-tutorial-text-reference="price-axis-inline"/
  );
  assert.match(passage.paragraphs[0]!.html, /katex/);
});

test("new draft cards can be added duplicated moved and deleted", () => {
  const initial = createKpEconomicsLessonDraft(
    kpEconomicsTwoColumnParagraphs
  );
  const added = addKpEconomicsLessonDraftPassageAfter(
    initial,
    "graph-at-rest"
  );
  assert.match(added.selectedPassageId, /^draft-passage-/);
  assert.equal(added.passages.length, initial.passages.length + 1);

  const duplicated = duplicateKpEconomicsLessonDraftPassage(
    added,
    added.selectedPassageId
  );
  assert.equal(duplicated.passages.length, initial.passages.length + 2);
  assert.notEqual(duplicated.selectedPassageId, added.selectedPassageId);

  const moved = moveKpEconomicsLessonDraftPassage({
    draft: duplicated,
    passageId: duplicated.selectedPassageId,
    direction: 1,
    publicationPassageIds: publicationIds
  });
  assert.equal(moved.selectedPassageId, duplicated.selectedPassageId);

  const deleted = deleteKpEconomicsLessonDraftPassage({
    draft: moved,
    passageId: moved.selectedPassageId,
    publicationPassageIds: publicationIds
  });
  assert.equal(deleted.passages.length, initial.passages.length + 1);
  assert.equal(
    deleted.passages.some(({ id }) => id === moved.selectedPassageId),
    false
  );
});

test("published cards retain structural and motion authority", () => {
  const draft = createKpEconomicsLessonDraft(kpEconomicsTwoColumnParagraphs);
  assert.throws(() => deleteKpEconomicsLessonDraftPassage({
    draft,
    passageId: "follow-shift",
    publicationPassageIds: publicationIds
  }), /protected/);
  assert.throws(() => moveKpEconomicsLessonDraftPassage({
    draft,
    passageId: "follow-shift",
    direction: 1,
    publicationPassageIds: publicationIds
  }), /protected/);

  const serialized = JSON.parse(serializeKpEconomicsLessonDraft(draft)) as {
    passages: Array<Record<string, unknown>>;
  };
  serialized.passages.find(({ id }) => id === "follow-shift")![
    "motionBlockId"
  ] = "supply-movement";
  assert.equal(readKpEconomicsLessonDraft({
    serialized: JSON.stringify(serialized),
    publicationPassages: kpEconomicsTwoColumnParagraphs
  }), undefined);
});

test("invalid Markdown stays serializable while the last valid preview can remain", () => {
  const initial = createKpEconomicsLessonDraft(
    kpEconomicsTwoColumnParagraphs
  );
  const invalid = updateKpEconomicsLessonDraftSource({
    draft: initial,
    passageId: "graph-at-rest",
    sourceText: "An unfinished $expression"
  });
  assert.throws(
    () => compileKpEconomicsLessonDraftPassages(invalid),
    /Unclosed inline math delimiter/
  );
  assert.equal(
    readKpEconomicsLessonDraft({
      serialized: serializeKpEconomicsLessonDraft(invalid),
      publicationPassages: kpEconomicsTwoColumnParagraphs
    })?.passages[0]?.sourceText,
    "An unfinished $expression"
  );
});
