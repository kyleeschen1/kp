import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpReaderArtifactRef,
  type KpLessonDocument,
  validateKpLessonDocument
} from "../src/reader/document/public-api.ts";

test("minimal lesson IR represents prose, semantic links, and one animation story", () => {
  const document = xPlusThreeDocument();
  assert.deepEqual(validateKpLessonDocument(document), []);
  assert.equal(document.blocks[0]?.kind, "heading");
  const story = document.blocks[1];
  assert.equal(story?.kind, "animation-story");
  if (story?.kind !== "animation-story") return;
  assert.equal(story.asset.id, "animation.linear-solve.solve-x");
  assert.deepEqual(story.beats.map((beat) => beat.checkpoint.progressPermille), [
    0,
    333,
    667,
    1_000
  ]);
});

test("lesson IR preserves source locations without mixing them into identity", () => {
  const document = xPlusThreeDocument();
  const heading = document.blocks[0];
  assert.equal(heading?.source?.sourceId, "content/solve-x.md");
  assert.deepEqual(heading?.source?.start, { line: 1, column: 1, offset: 0 });
  assert.equal(heading?.id, "solve-x-heading");
});

test("lesson validation reports duplicate identity and unordered checkpoints", () => {
  const original = xPlusThreeDocument();
  const story = original.blocks[1];
  assert.equal(story?.kind, "animation-story");
  if (story?.kind !== "animation-story") return;
  const document: KpLessonDocument = {
    ...original,
    blocks: [
      original.blocks[0]!,
      {
        ...story,
        id: "solve-x-heading",
        beats: story.beats.map((beat, index) => index === 2
          ? { ...beat, checkpoint: { ...beat.checkpoint, progressPermille: 200 } }
          : beat)
      }
    ]
  };
  const issues = validateKpLessonDocument(document);
  assert.ok(issues.some((issue) => issue.message.includes("duplicate id solve-x-heading")));
  assert.ok(issues.some((issue) => issue.message.includes("ordered by progress")));
});

test("lesson validation keeps semantic references explicit and unique", () => {
  const original = xPlusThreeDocument();
  const story = original.blocks[1];
  assert.equal(story?.kind, "animation-story");
  if (story?.kind !== "animation-story") return;
  const document: KpLessonDocument = {
    ...original,
    blocks: [{
      ...story,
      beats: [{
        ...story.beats[0]!,
        focusRefs: ["equation.x", "equation.x", " "],
        content: [{ kind: "semantic-link", text: "x", objectRefs: [] }]
      }]
    }]
  };
  const issues = validateKpLessonDocument(document);
  assert.ok(issues.some((issue) => issue.message === "duplicate value equation.x"));
  assert.ok(issues.some((issue) => issue.message === "value must not be empty"));
  assert.ok(issues.some((issue) => issue.message === "semantic link needs an object ref"));
});

function xPlusThreeDocument(): KpLessonDocument {
  const source = {
    sourceId: "content/solve-x.md",
    start: { line: 1, column: 1, offset: 0 },
    end: { line: 1, column: 18, offset: 17 }
  } as const;
  return {
    kind: "lesson-document",
    id: "lesson.solve-x.x-plus-3",
    version: "1",
    title: "Solve x + 3 = 7",
    language: "en",
    blocks: [
      {
        kind: "heading",
        id: "solve-x-heading",
        level: 1,
        content: [{ kind: "text", value: "Solve x + 3 = 7" }],
        source
      },
      {
        kind: "animation-story",
        id: "solve-x-story",
        asset: createKpReaderArtifactRef({
          kind: "animation-asset",
          id: "animation.linear-solve.solve-x",
          version: "1"
        }),
        presentation: "scroll-scrub",
        beats: [
          beat("read-equality", "Read the equality", 0, ["equation.x"]),
          beat("subtract-both-sides", "Make the same move twice", 333, ["operation.subtract-three"]),
          beat("cancel-opposites", "Let opposites cancel", 667, ["operation.cancel-opposites"]),
          beat("read-solution", "Read the solution", 1_000, ["equation.solved"])
        ]
      }
    ],
    source: createKpReaderArtifactRef({
      kind: "lesson-source",
      id: "content/solve-x.md",
      version: "1"
    })
  };
}

function beat(
  id: string,
  title: string,
  progressPermille: number,
  focusRefs: readonly string[]
) {
  return {
    id,
    title,
    content: [{ kind: "text" as const, value: title }],
    checkpoint: { id: `checkpoint.${id}`, progressPermille },
    focusRefs
  };
}
