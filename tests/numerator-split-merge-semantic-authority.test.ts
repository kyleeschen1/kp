import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpFractionMergeClozeProjection,
  createKpFractionSplitClozeProjection
} from "../src/animation/semantic-glyph-reconciliation-cloze.ts";
import { compileKpCanonicalAnimationConstruction } from "../src/authoring/canonical-animation-construction-compiler.ts";
import { compileKpNumeratorSplitMergeEquationLesson } from "../src/reader/compiler/numerator-split-merge-equation-lesson.ts";
import { createNumeratorSplitMergeEquationAnimationAsset } from "../src/animation/numerator-split-merge-equation-adapter.ts";

const markdown = readFileSync(
  "content/lessons/numerator-split-merge.md",
  "utf8"
);

test("native reader HTML retains searchable MathML and hydration authority", () => {
  const artifact = compileKpNumeratorSplitMergeEquationLesson(markdown);

  assert.equal((artifact.html.match(/<math\b/g) ?? []).length, 3);
  assert.equal((artifact.html.match(/class="katex-mathml"/g) ?? []).length, 3);
  assert.match(artifact.html, /One denominator can govern every term/);
  assert.match(artifact.html, /data-kp-reader-attention-scrubber/);
  assert.match(artifact.html, /data-kp-reader-equation-stage/);
  assert.equal(artifact.hydration.blocks[0]?.adapterId, "renderer.equation-dom");
});

test("Cloze and construction projections carry semantics but no DOM authority", () => {
  const cloze = [
    createKpFractionMergeClozeProjection(),
    createKpFractionSplitClozeProjection()
  ];
  assert.ok(cloze.every(({ diagnostics }) => diagnostics.length === 0));
  assert.ok(cloze.every(({ hiddenSelectorIds }) => hiddenSelectorIds.length > 0));

  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const construction = compileKpCanonicalAnimationConstruction({
    animation,
    sourceId: "trace.algebra-canonical-numerator-split-merge",
    revisionId: "1",
    operationPacks: [{ packId: "kp.algebra", version: "0.1.0" }]
  });
  const serialized = JSON.stringify(construction);
  for (const forbidden of [
    "aria-hidden",
    "inert",
    "MathML",
    "tabindex",
    "keyboard",
    "html"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test("moving canonical paint is inert and cannot acquire reader semantics", () => {
  const session = readFileSync(
    "src/reader/app/reader-canonical-equation-session.ts",
    "utf8"
  );
  assert.match(session, /layer\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(session, /layer\.setAttribute\("inert", ""\)/);
  assert.doesNotMatch(session, /addEventListener\(("click"|"keydown"|"focus")/);
});
