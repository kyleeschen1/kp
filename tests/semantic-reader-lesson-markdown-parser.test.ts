import assert from "node:assert/strict";
import test from "node:test";

import {
  KpLessonMarkdownError,
  parseKpLessonMarkdown
} from "../src/reader/compiler/public-api.ts";

const story = JSON.stringify({
  id: "story.solve-x",
  asset: { id: "animation.solve-x", version: "1" },
  beats: [
    {
      id: "beat.read",
      title: "Read the equality",
      content: "Start with the whole equation.",
      progressPermille: 0,
      focusRefs: ["equation.whole"]
    },
    {
      id: "beat.subtract",
      title: "Subtract three",
      content: "Make the same move on both sides.",
      progressPermille: 500,
      focusRefs: ["equation.left", "equation.right"]
    }
  ]
}, null, 2);

test("minimal KP Markdown becomes a source-located LessonDocument", () => {
  const document = parseKpLessonMarkdown({
    sourceId: "content/solve-x.md",
    id: "lesson.solve-x",
    version: "1",
    title: "Solve x + 3 = 7",
    markdown: [
      "# Solve for x",
      "",
      "Watch [the unknown](kp:focus/equation.x \"x in the equation\") stay visible.",
      "",
      "```kp-animation-story",
      story,
      "```"
    ].join("\n")
  });

  assert.equal(document.blocks[0]?.id, "heading.solve-for-x");
  assert.equal(document.blocks[0]?.source?.start.offset, 0);
  const paragraph = document.blocks[1];
  assert.equal(paragraph?.kind, "paragraph");
  if (paragraph?.kind !== "paragraph") return;
  assert.deepEqual(paragraph.content[1], {
    kind: "semantic-link",
    text: "the unknown",
    objectRefs: ["equation.x"],
    tooltip: "x in the equation",
    source: {
      sourceId: "content/solve-x.md",
      start: { line: 3, column: 7, offset: 21 },
      end: { line: 3, column: 61, offset: 75 }
    }
  });
  const animation = document.blocks[2];
  assert.equal(animation?.kind, "animation-story");
  if (animation?.kind !== "animation-story") return;
  assert.deepEqual(animation.beats.map((beat) => beat.checkpoint.progressPermille), [0, 500]);
  assert.deepEqual(animation.beats[1]?.focusRefs, ["equation.left", "equation.right"]);
});

test("duplicate heading slugs receive deterministic suffixes", () => {
  const document = parseKpLessonMarkdown({
    sourceId: "content/repeated.md",
    id: "lesson.repeated",
    version: "1",
    title: "Repeated",
    markdown: "## Look again\n\n## Look again\n"
  });
  assert.deepEqual(document.blocks.map((block) => block.id), [
    "heading.look-again",
    "heading.look-again.2"
  ]);
});

test("unsupported and unsafe Markdown fails with source diagnostics", () => {
  assert.throws(
    () => parseKpLessonMarkdown({
      sourceId: "content/unsafe.md",
      id: "lesson.unsafe",
      version: "1",
      title: "Unsafe",
      markdown: "# Safe heading\n\n<script>alert('no')</script>\n"
    }),
    (error: unknown) => {
      assert.ok(error instanceof KpLessonMarkdownError);
      assert.equal(error.line, 3);
      assert.equal(error.column, 1);
      assert.match(error.message, /raw HTML is not accepted/);
      return true;
    }
  );
});

test("ordinary external links are not silently treated as semantic focus", () => {
  assert.throws(
    () => parseKpLessonMarkdown({
      sourceId: "content/link.md",
      id: "lesson.link",
      version: "1",
      title: "Link",
      markdown: "Read [another site](https://example.com).\n"
    }),
    /only kp:focus semantic links are supported/
  );
});
