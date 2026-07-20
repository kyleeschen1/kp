import assert from "node:assert/strict";
import test from "node:test";

import {
  KpLessonReferenceError,
  defineKpReaderAssetCatalog,
  parseKpLessonMarkdown,
  resolveKpLessonReferences
} from "../src/reader/compiler/public-api.ts";

const catalog = defineKpReaderAssetCatalog({ entries: [{
  id: "animation.solve-x",
  version: "1",
  rendererId: "renderer.equation-dom",
  objectRefs: ["equation.x", "equation.left", "equation.right"]
}] });

test("catalog inference and resolution bind assets and focus without runtime lookup", () => {
  const exactAssetId: "animation.solve-x" = catalog.entries[0].id;
  const exactRendererId: "renderer.equation-dom" = catalog.entries[0].rendererId;
  const resolved = resolveKpLessonReferences(document(), catalog);

  assert.equal(exactAssetId, "animation.solve-x");
  assert.equal(exactRendererId, "renderer.equation-dom");
  assert.deepEqual(resolved.assets, [{
    blockId: "story.solve-x",
    asset: { kind: "animation-asset", id: "animation.solve-x", version: "1" },
    rendererId: "renderer.equation-dom",
    objectRefs: ["equation.x", "equation.left", "equation.right"]
  }]);
  assert.ok(resolved.focus.some((binding) =>
    binding.ownerId === "paragraph.1"
      && binding.objectRef === "equation.x"
      && binding.assetBlockIds[0] === "story.solve-x"
  ));
});

test("unknown asset versions and focus objects fail with source diagnostics", () => {
  const original = document();
  const story = original.blocks[2];
  assert.equal(story?.kind, "animation-story");
  if (story?.kind !== "animation-story") return;
  const invalid = {
    ...original,
    blocks: [
      original.blocks[0]!,
      original.blocks[1]!,
      {
        ...story,
        asset: { ...story.asset, version: "2" },
        beats: [{ ...story.beats[0]!, focusRefs: ["equation.missing"] }]
      }
    ]
  };

  assert.throws(
    () => resolveKpLessonReferences(invalid, catalog),
    (error: unknown) => {
      assert.ok(error instanceof KpLessonReferenceError);
      assert.ok(error.issues.some((issue) => issue.message.includes("unknown animation asset")));
      assert.ok(error.issues.some((issue) => issue.message.includes("does not expose equation.missing")));
      assert.match(error.message, /content\/solve-x.md:/);
      return true;
    }
  );
});

test("catalog rejects duplicate asset versions and semantic object refs", () => {
  assert.throws(() => defineKpReaderAssetCatalog({ entries: [
    catalog.entries[0],
    catalog.entries[0]
  ] }), /duplicate reader asset catalog entry/);
  assert.throws(() => defineKpReaderAssetCatalog({ entries: [{
    id: "animation.bad",
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs: ["equation.x", "equation.x"]
  }] }), /repeats semantic object ref/);
});

function document() {
  return parseKpLessonMarkdown({
    sourceId: "content/solve-x.md",
    id: "lesson.solve-x",
    version: "1",
    title: "Solve x + 3 = 7",
    markdown: [
      "# Solve for x",
      "",
      "Watch [the unknown](kp:focus/equation.x).",
      "",
      "```kp-animation-story",
      JSON.stringify({
        id: "story.solve-x",
        asset: { id: "animation.solve-x", version: "1" },
        beats: [{
          id: "beat.subtract",
          title: "Subtract three",
          content: "Make the same move on both sides.",
          progressPermille: 500,
          focusRefs: ["equation.left", "equation.right"]
        }]
      }),
      "```"
    ].join("\n")
  });
}
