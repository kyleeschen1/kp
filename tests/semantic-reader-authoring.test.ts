import assert from "node:assert/strict";
import test from "node:test";

import {
  KpLessonAuthoringError,
  defineKpLessonDocument,
  kpLesson
} from "../src/reader/document/public-api.ts";

test("lesson helpers preserve literal identity without explicit generic arguments", () => {
  const document = defineKpLessonDocument({
    id: "lesson.solve-x",
    version: "1",
    title: "Solve x + 3 = 7",
    blocks: [
      kpLesson.heading({ id: "heading.solve-x", level: 1, content: ["Solve for x"] }),
      kpLesson.animationStory({
        id: "story.solve-x",
        asset: { id: "animation.solve-x", version: "1" },
        beats: [kpLesson.beat({
          id: "beat.subtract",
          title: "Subtract three",
          content: ["Make the same move on both sides"],
          checkpoint: { id: "checkpoint.subtract", progressPermille: 333 },
          focusRefs: ["equation.left", "equation.right"]
        })]
      })
    ],
    source: { id: "content/solve-x.md", version: "1" }
  });

  const documentId: "lesson.solve-x" = document.id;
  const headingId: "heading.solve-x" = document.blocks[0].id;
  const headingKind: "heading" = document.blocks[0].kind;
  const storyKind: "animation-story" = document.blocks[1].kind;
  const beatId: "beat.subtract" = document.blocks[1].beats[0].id;
  assert.deepEqual(
    { documentId, headingId, headingKind, storyKind, beatId },
    {
      documentId: "lesson.solve-x",
      headingId: "heading.solve-x",
      headingKind: "heading",
      storyKind: "animation-story",
      beatId: "beat.subtract"
    }
  );
  assert.equal(document.blocks[0].content[0].kind, "text");
  assert.equal(document.blocks[1].presentation, "scroll-scrub");
  assert.equal(document.source?.kind, "lesson-source");
});

test("semantic links are explicit and mutable author inputs are copied", () => {
  const objectRefs = ["equation.x"];
  const content = [kpLesson.link({ text: "x", objectRefs })];
  const paragraph = kpLesson.paragraph({ id: "paragraph.x", content });
  objectRefs.push("equation.other");
  content.push(content[0]!);

  assert.deepEqual(paragraph.content, [{
    kind: "semantic-link",
    text: "x",
    objectRefs: ["equation.x"]
  }]);
});

test("document definition fails at the authoring boundary with structured issues", () => {
  assert.throws(
    () => defineKpLessonDocument({
      id: "lesson.invalid",
      version: "1",
      title: "Invalid",
      blocks: [kpLesson.paragraph({ id: "paragraph.empty", content: [] })]
    }),
    (error: unknown) => {
      assert.ok(error instanceof KpLessonAuthoringError);
      assert.equal(error.issues[0]?.path, "blocks[0].content");
      assert.match(error.message, /content must not be empty/);
      return true;
    }
  );
});
