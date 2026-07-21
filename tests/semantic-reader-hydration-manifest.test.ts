import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpStaticMathStates,
  defineKpReaderAssetCatalog,
  emitKpReaderHydrationManifest,
  parseKpLessonMarkdown,
  resolveKpLessonReferences,
  serializeKpReaderHydrationManifest
} from "../src/reader/compiler/public-api.ts";

test("versioned hydration manifest contains behavior and attention projection but no canonical prose or HTML", () => {
  const source = document();
  const resolved = resolveKpLessonReferences(source, defineKpReaderAssetCatalog({ entries: [{
    id: "animation.solve-x",
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs: ["equation.x"]
  }] }));
  const math = compileKpStaticMathStates(source, ({ progressPermille }) => ({
    latex: progressPermille === 0 ? "x + 3 = 7" : "x = 4",
    label: progressPermille === 0 ? "x plus three equals seven" : "x equals four"
  }));
  const manifest = emitKpReaderHydrationManifest(resolved, math);

  assert.equal(manifest.schemaVersion, "kp.reader-hydration.v1");
  assert.deepEqual(manifest.lesson, {
    kind: "lesson-document",
    id: "lesson.solve-x",
    version: "1"
  });
  assert.equal(manifest.blocks[0]?.adapterId, "renderer.equation-dom");
  assert.equal(manifest.blocks[0]?.checkpoints[1]?.staticStateId,
    "static.story.solve-x.checkpoint.beat.solve");
  assert.equal(manifest.blocks[0]?.attention?.kind, "phased-attention-v1");
  assert.equal(manifest.blocks[0]?.attention?.phases[1]?.cue, "Watch the equation change.");
  const serialized = serializeKpReaderHydrationManifest(manifest);
  assert.equal(serialized.includes("Start with the equation"), false);
  assert.equal(serialized.includes("<span"), false);
  assert.deepEqual(JSON.parse(serialized), manifest);
});

test("manifest emission requires a static state for every semantic checkpoint", () => {
  const source = document();
  const resolved = resolveKpLessonReferences(source, defineKpReaderAssetCatalog({ entries: [{
    id: "animation.solve-x",
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs: ["equation.x"]
  }] }));
  assert.throws(
    () => emitKpReaderHydrationManifest(resolved, [{
      blockId: "story.solve-x",
      states: []
    }]),
    /missing static state/
  );
});

test("manifest serialization cannot close its inert script element", () => {
  const serialized = serializeKpReaderHydrationManifest({
    schemaVersion: "kp.reader-hydration.v1",
    lesson: { kind: "lesson-document", id: "lesson.</script>", version: "1" },
    blocks: []
  });
  assert.equal(serialized.includes("</script>"), false);
  assert.match(serialized, /\\u003c\/script>/);
});

function document() {
  return parseKpLessonMarkdown({
    sourceId: "content/solve-x.md",
    id: "lesson.solve-x",
    version: "1",
    title: "Solve x + 3 = 7",
    markdown: [
      "```kp-animation-story",
      JSON.stringify({
        id: "story.solve-x",
        asset: { id: "animation.solve-x", version: "1" },
        beats: [
          {
            id: "beat.read",
            title: "Read",
            content: "Start with the equation.",
            progressPermille: 0
          },
          {
            id: "beat.solve",
            title: "Solve",
            content: "Read the solution.",
            progressPermille: 1_000
          }
        ],
        attention: {
          kind: "phased-attention-v1",
          phases: [
            attentionPhase("orient", "beat.read", 0, 100),
            attentionPhase("act", "beat.solve", 100, 700),
            attentionPhase("settle", "beat.solve", 700, 900),
            attentionPhase("inspect", "beat.solve", 900, 1_000)
          ]
        }
      }),
      "```"
    ].join("\n")
  });
}

function attentionPhase(
  kind: "orient" | "act" | "settle" | "inspect",
  beatId: "beat.read" | "beat.solve",
  startProgressPermille: number,
  endProgressPermille: number
) {
  return {
    id: `attention.${kind}`,
    kind,
    beatId,
    checkpointId: `checkpoint.${beatId}`,
    startProgressPermille,
    endProgressPermille,
    cue: kind === "act" ? "Watch the equation change." : `${kind} the equation.`,
    focusRefs: ["equation.x"]
  };
}
