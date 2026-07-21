import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpStaticLessonProse,
  parseKpLessonMarkdown
} from "../src/reader/compiler/public-api.ts";

test("static compilation keeps prose beats and navigation meaningful without JavaScript", () => {
  const output = compileKpStaticLessonProse(document());

  assert.match(output.articleHtml, /^<article class="kp-lesson"/);
  assert.match(output.articleHtml, /<h1 id="heading.solve-for-x"/);
  assert.match(output.articleHtml, /<button type="button" class="kp-semantic-link" data-kp-focus="equation.x"/);
  assert.match(output.articleHtml, /<section id="story.solve-x" class="kp-animation-story"/);
  assert.match(output.articleHtml, /See this concept move/);
  assert.match(output.articleHtml, /<li id="beat.subtract"/);
  assert.match(output.articleHtml, /Make the same move on both sides/);
  assert.match(output.tocHtml, /<nav class="kp-lesson-toc" aria-label="On this page">/);
  assert.match(output.tocHtml, /href="#heading.solve-for-x"/);
  assert.match(output.tocHtml, /href="#beat.subtract"/);
});

test("static compilation escapes all author-controlled HTML and attributes", () => {
  const documentWithMarkup = parseKpLessonMarkdown({
    sourceId: "content/escape.md",
    id: "lesson.escape",
    version: "1",
    title: "Escape",
    markdown: "# Less < more\n"
  });
  const output = compileKpStaticLessonProse({
    ...documentWithMarkup,
    blocks: [{
      kind: "paragraph",
      id: 'paragraph.\"unsafe',
      content: [{
        kind: "semantic-link",
        text: "<script>alert(1)</script>",
        objectRefs: ['equation.\"x'],
        tooltip: '\" onmouseover=\"alert(1)'
      }]
    }]
  });

  assert.equal(output.articleHtml.includes("<script>"), false);
  assert.equal(output.articleHtml.includes('onmouseover="alert(1)'), false);
  assert.match(output.articleHtml, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(output.articleHtml, /paragraph.&quot;unsafe/);
});

test("table of contents is deterministic and empty lessons remain valid landmarks", () => {
  const output = compileKpStaticLessonProse({
    kind: "lesson-document",
    id: "lesson.empty",
    version: "1",
    title: "Empty",
    blocks: []
  });
  assert.equal(output.tocHtml, [
    `<nav class="kp-lesson-toc" aria-label="On this page">`,
    "<ol>",
    "</ol>",
    "</nav>"
  ].join("\n"));
});

test("optional attention cues compile as searchable static phase landmarks", () => {
  const source = document();
  const story = source.blocks.find((block) => block.kind === "animation-story");
  assert.ok(story?.kind === "animation-story");
  const output = compileKpStaticLessonProse({
    ...source,
    blocks: source.blocks.map((block) => block !== story ? block : {
      ...block,
      attention: {
        kind: "phased-attention-v1",
        phases: [
          {
            id: "attention.subtract.orient",
            kind: "orient",
            beatId: "beat.subtract",
            checkpointId: "checkpoint.beat.subtract",
            startProgressPermille: 0,
            endProgressPermille: 1_000,
            cue: "Find the same move on both sides.",
            focusRefs: ["equation.left", "equation.right"]
          }
        ]
      }
    })
  });

  assert.match(output.articleHtml, /class="kp-attention-phases"/);
  assert.match(output.articleHtml, /data-kp-attention="phased-attention-v1"/);
  assert.match(output.articleHtml, /class="kp-beat-copy"/);
  assert.match(output.articleHtml, /data-kp-attention-phase="attention\.subtract\.orient"/);
  assert.match(output.articleHtml, /data-kp-attention-start="0" data-kp-attention-end="1000"/);
  assert.match(output.articleHtml, /Find the same move on both sides\./);
});

function document() {
  return parseKpLessonMarkdown({
    sourceId: "content/solve-x.md",
    id: "lesson.solve-x",
    version: "1",
    title: "Solve x + 3 = 7",
    language: "en",
    markdown: [
      "# Solve for x",
      "",
      "Watch [the unknown](kp:focus/equation.x \"The unknown\").",
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
