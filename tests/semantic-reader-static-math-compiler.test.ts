import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpStaticMathStates,
  parseKpLessonMarkdown,
  type KpStaticMathProjectionInput
} from "../src/reader/compiler/public-api.ts";

test("checkpoint projections compile to visual KaTeX plus accessible MathML", () => {
  const calls: KpStaticMathProjectionInput[] = [];
  const blocks = compileKpStaticMathStates(document(), (input) => {
    calls.push(input);
    return input.progressPermille === 0
      ? { latex: "x + 3 = 7", label: "x plus three equals seven" }
      : { latex: "x = 4", label: "x equals four" };
  });

  assert.deepEqual(calls.map((call) => call.progressPermille), [0, 1_000]);
  assert.equal(blocks[0]?.states[0]?.checkpointId, "checkpoint.beat.read");
  const html = blocks[0]?.states[0]?.html ?? "";
  assert.match(html, /class="katex-display"/);
  assert.match(html, /class="katex-mathml"/);
  assert.match(html, /<math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"/);
  assert.match(html, /<annotation encoding="application\/x-tex">x \+ 3 = 7<\/annotation>/);
  assert.match(html, /class="katex-html" aria-hidden="true"/);
});

test("math projection rejects empty semantics and unsafe KaTeX commands", () => {
  assert.throws(
    () => compileKpStaticMathStates(document(), () => ({ latex: " ", label: "empty" })),
    /projected an empty LaTeX state/
  );
  assert.throws(
    () => compileKpStaticMathStates(document(), () => ({
      latex: "x",
      label: " "
    })),
    /projected an empty accessible label/
  );
  assert.throws(
    () => compileKpStaticMathStates(document(), () => ({
      latex: "\\htmlClass{unsafe}{x}",
      label: "x"
    })),
    /HTML extension is disabled on strict mode/
  );
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
            title: "Read the equation",
            content: "Start with the equation.",
            progressPermille: 0
          },
          {
            id: "beat.solve",
            title: "Read the solution",
            content: "Now x is alone.",
            progressPermille: 1_000
          }
        ]
      }),
      "```"
    ].join("\n")
  });
}
