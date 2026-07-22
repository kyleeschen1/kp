import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpDistributionAreaLesson } from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/distribution-area.md", import.meta.url),
  "utf8"
);

test("distribution area lesson compiles searchable algebra, prose, and the exact SVG stage", () => {
  const artifact = compileKpDistributionAreaLesson(markdown);

  assert.equal(artifact.document.id, "lesson.algebra.distribution-area");
  assert.match(artifact.html, /The same multiplication can be read as symbols/);
  assert.match(artifact.html, /data-kp-distribution-stage/);
  assert.match(artifact.html, /data-kp-native="factored"/);
  assert.match(artifact.html, /data-kp-native="expanded"/);
  assert.match(artifact.html, /data-kp-area-divider/);
  assert.match(artifact.html, /data-kp-symbolic-transcript>Symbolic transcript: 3\(x\+2\) → 3x\+3·2 → 3x\+6/);
  assert.deepEqual(artifact.hydration.checkpoints.map(({ id }) => id), [
    "factored", "distributed", "expanded"
  ]);
});

test("distribution area stage keeps KaTeX labels outside SVG text", () => {
  const { html } = compileKpDistributionAreaLesson(markdown);

  assert.doesNotMatch(html, /<text[ >]/);
  assert.match(html, /data-kp-area-label="left-area"[\s\S]*class="katex"/);
  assert.match(html, /data-kp-concept="factor\.3 term\.2 product\.6"/);
});

test("distribution area compiles stable measurable algebra and geometry lineage", () => {
  const { html } = compileKpDistributionAreaLesson(markdown);

  assert.equal((html.match(/data-kp-distribution-state=/g) ?? []).length, 3);
  assert.equal((html.match(/data-kp-distribution-anchor=/g) ?? []).length, 16);
  assert.match(html, /data-kp-material-token="source-three" data-kp-lineage="factor\.3"/);
  assert.match(html, /data-kp-material-token="six" data-kp-lineage="product\.6"/);
  assert.match(html, /data-kp-area-label="combined-width" data-kp-lineage="sum\.x-plus-2"/);
  assert.match(html, /data-kp-area-label="right-area" data-kp-lineage="product\.6"/);
});
