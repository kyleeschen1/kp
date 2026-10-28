import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileFractionalCaptionShell } from "../src/reader/compiler/fractional-caption-shell.ts";

import {
  compileKpFractionalLinearEquationLesson
} from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/solve-fractional-linear.md", import.meta.url),
  "utf8"
);

test("caption shell rejects partial or nested compiler output", () => {
  const flat = '<html><head></head><body><main><article class="kp-lesson"><h1>Intro</h1><section class="story"><div class="kp-animation-static">Equation</div><ol class="kp-animation-beats"><li data-kp-beat="one"><div class="kp-beat-copy">Text</div></li></ol></section></article></main></body></html>';
  assert.doesNotThrow(() => compileFractionalCaptionShell(flat, 1));
  assert.throws(() => compileFractionalCaptionShell(flat, 2), /complete flat beat sequence/);
  assert.throws(() => compileFractionalCaptionShell(flat.replace('Text', '<div data-kp-attention-phase="nested">Text</div>'), 1), /complete flat beat sequence/);
  assert.throws(() => compileFractionalCaptionShell('<html></html>', 1), /compiled article and story/);
});

test("fractional lesson compiles into the shared searchable equation card", () => {
  const artifact = compileKpFractionalLinearEquationLesson(markdown);

  assert.equal(artifact.kind, "compiled-lesson");
  assert.equal(artifact.document.id, "lesson.solve-x.fractional-linear");
  assert.match(artifact.html, /^<!doctype html>/);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="fractional-linear"/);
  assert.match(artifact.html, /data-kp-reader-palette="nocturne"/);
  assert.match(artifact.html, /data-kp-reader-layout="rising-passages"/);
  assert.match(artifact.html, /class="kp-caption-frame"/);
  assert.match(artifact.html, /<noscript><style data-kp-static-document>/);
  assert.equal((artifact.html.match(/data-kp-rising-beat=/g) ?? []).length, 7);
  assert.equal((artifact.html.match(/class="kp-caption-copy"/g) ?? []).length, 7);
  assert.doesNotMatch(artifact.html, /data-kp-caption-slot=|hidden="until-found"|kp-caption-preview/);
  assert.equal((artifact.html.match(/<h2 hidden/g) ?? []).length, 7);
  assert.match(artifact.html, /class="kp-caption-document-after">\s*<p[^>]*>We can check/);
  assert.match(artifact.html, /Start with <button[^>]*class="kp-semantic-link"/);
  assert.doesNotMatch(artifact.html, /Start with \[x\]/);
  assert.match(artifact.html, /data-kp-reader-equation-profile-default="standard"/);
  assert.match(artifact.html, /data-kp-reader-equation-profiles="explain,standard,fluent"/);
  assert.match(artifact.html, /data-kp-reader-exemplar-template/);
  assert.match(artifact.html, /The fraction is not a detour/);
  assert.match(artifact.html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{x\}\{2\} \+ 3 = 7/);
  assert.match(artifact.html, /application\/x-tex">x = 8/);
  assert.match(
    artifact.html,
    /anchor\.equation\.fractional-linear\.initial\.fraction\.numerator\.x/
  );
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 7);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.fractional-linear.solve-x-over-2"
  );
  assert.deepEqual(artifact.hydration.blocks[0]?.equationPresentation, {
    defaultProfileId: "standard",
    profileIds: ["explain", "standard", "fluent"]
  });
});

test("shared page extraction preserves the canonical solve-x compiler", async () => {
  const { compileKpXPlusThreeLesson } = await import(
    "../src/reader/compiler/public-api.ts"
  );
  const solveX = readFileSync(
    new URL("../content/lessons/solve-x.md", import.meta.url),
    "utf8"
  );
  const artifact = compileKpXPlusThreeLesson(solveX);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="streamlined"/);
  assert.doesNotMatch(artifact.html, /data-kp-reader-palette=/);
  assert.match(artifact.html, /anchor\.equation\.linear-solve\.initial\.lhs\.x/);
});
