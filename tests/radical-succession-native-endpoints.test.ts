import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpRadicalSuccessionEquationLesson
} from "../src/reader/compiler/radical-succession-equation-lesson.ts";
import {
  kpRadicalSuccessionPreservationManifest as manifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";

const markdown = readFileSync(
  new URL("../content/lessons/radical-succession.md", import.meta.url),
  "utf8"
);

test("radical lesson compiles exact native KaTeX source and target endpoints", () => {
  const artifact = compileKpRadicalSuccessionEquationLesson(markdown);

  assert.equal(artifact.document.id, manifest.document.id);
  assert.match(
    artifact.html,
    /data-kp-reader-lesson-variant="radical-succession"/
  );
  for (const stateId of manifest.animation.stateIds) {
    assert.ok(
      artifact.html.includes(`data-kp-reader-equation-state="${stateId}"`),
      stateId
    );
  }
  for (const latex of manifest.animation.latex) {
    assert.ok(
      artifact.html.includes(`application/x-tex">${latex}`),
      latex
    );
  }
  assert.match(artifact.html, /class="[^"]*\bfrac-line\b[^"]*"/);
  assert.match(artifact.html, /class="[^"]*\bhide-tail\b[^"]*"/);
});

test("radical static and hydration forms retain native semantics", () => {
  const artifact = compileKpRadicalSuccessionEquationLesson(markdown);
  const block = artifact.hydration.blocks[0]!;

  assert.equal((artifact.html.match(/<math\b/g) ?? []).length, 3);
  assert.equal(
    (artifact.html.match(/class="katex-mathml"/g) ?? []).length,
    3
  );
  assert.match(artifact.html, /A half power and a square root name the same value/);
  assert.deepEqual(
    block.checkpoints.map(({ beatId, progressPermille }) => ({
      beatId,
      progressPermille
    })),
    manifest.checkpoints
  );
  assert.equal(block.asset.id, manifest.animation.id);
  assert.equal(block.adapterId, "renderer.equation-dom");
});
