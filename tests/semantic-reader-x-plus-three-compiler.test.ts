import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpXPlusThreeLesson } from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(new URL("../content/lessons/solve-x.md", import.meta.url), "utf8");

test("canonical Markdown compiles through the current semantic asset into one static artifact", () => {
  const artifact = compileKpXPlusThreeLesson(markdown);

  assert.equal(artifact.kind, "compiled-lesson");
  assert.equal(artifact.document.id, "lesson.solve-x.x-plus-3");
  assert.match(artifact.html, /^<!doctype html>/);
  assert.match(artifact.html, /An equation is a promise/);
  assert.match(artifact.html, /<math xmlns="http:\/\/www.w3.org\/1998\/Math\/MathML"/);
  assert.match(artifact.html, /application\/x-tex">x \+ 3 = 7/);
  assert.match(artifact.html, /application\/x-tex">x = 4/);
  assert.match(artifact.html, /data-kp-static-state data-kp-progress="333" hidden/);
  assert.match(artifact.html, /data-kp-reader-equation-anchor-id="anchor\.equation\.linear-solve\.initial\.lhs\.x"/);
  assert.match(artifact.html, /data-kp-reader-exemplar-template/);
  assert.match(artifact.html, /src="\/src\/reader\/app\/exemplar-entry\.ts"/);
  assert.match(artifact.html, /<script type="application\/json" data-kp-hydration>/);
  assert.match(artifact.html, /data-kp-reader-focus-stepper aria-label="Explanation controls"/);
  assert.match(artifact.html, /data-kp-reader-attention-scrubber aria-label="Scrub explanation"/);
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 4);
  assert.equal(artifact.hydration.blocks[0]?.asset.id, "animation.linear-solve.solve-x");
  assert.equal(artifact.hydration.blocks[0]?.adapterId, "renderer.equation-dom");
});

test("compiled x-plus-3 HTML retains searchable prose and no trusted author HTML", () => {
  const artifact = compileKpXPlusThreeLesson(markdown);
  assert.match(artifact.html, /Make the same move twice/);
  assert.match(artifact.html, /Let opposites cancel/);
  assert.match(artifact.html, /Read the solution/);
  assert.match(artifact.html, /data-kp-beat="beat\.cancel"[^>]+data-kp-focus="equation\.linear-solve\.left-simplified\.lhs\.x"/);
  assert.equal(artifact.html.includes("kp-animation-story\n{"), false);
  assert.equal(artifact.html.includes("renderEditorDocument"), false);
});
