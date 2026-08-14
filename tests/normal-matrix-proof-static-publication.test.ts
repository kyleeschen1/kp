import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpNormalMatrixProofArticle
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-article-compiler.ts";
import {
  renderKpNormalMatrixProofStaticPublication
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-static-publication.ts";

const text = readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

function compile() {
  return compileKpNormalMatrixProofArticle({ text, lock });
}

test("normal-proof publication compiles searchable HTML and build-time math", () => {
  const compilation = compile();
  const searchable = compilation.staticHtml.articleHtml
    .replace(/<[^>]*>/gu, " ")
    .replace(/\s+/gu, " ");

  assert.equal(compilation.staticHtml.math.renderer, "katex-build-time");
  assert.equal(compilation.staticHtml.math.clientRuntimeRequired, false);
  assert.ok(compilation.staticHtml.math.inlineCount > 20);
  assert.equal(compilation.staticHtml.math.displayCount, 7);
  assert.match(compilation.staticHtml.articleHtml, /class="katex-mathml"/u);
  assert.match(compilation.staticHtml.articleHtml, /<math/u);
  assert.match(searchable, /Force /u);
  assert.match(searchable, / leaving /u);
  assert.match(searchable, /Read the lower-right block equation/u);
});

test("TOC, semantic anchors, and stage manifest derive from one Article", () => {
  const compilation = compile();

  assert.match(compilation.staticHtml.tocHtml, /aria-label="Table of contents"/u);
  assert.match(compilation.staticHtml.tocHtml, /href="#compare-the-decisive-entries"/u);
  assert.match(compilation.staticHtml.articleHtml, /id="kp-ref:normal-proof\/matrix\/row-remainder"/u);
  assert.equal(compilation.stageManifests.length, 1);
  assert.equal(compilation.stageManifests[0]?.stageId, "normal-proof");
  assert.equal(compilation.accessibility.stages.length, 1);
});

test("static publication resolves every checkpoint as native KaTeX", () => {
  const publication = renderKpNormalMatrixProofStaticPublication(compile());

  // One resolved checkpoint appears twice because two consecutive proof beats
  // deliberately inspect the same row/column-norm endpoint.
  assert.equal(
    publication.split("data-kp-normal-proof-static-checkpoint=").length - 1,
    7
  );
  assert.equal(
    publication.split('class="katex-mathml"').length - 1 >= 6,
    true
  );
  assert.match(publication, /data-kp-normal-proof-stage-fallback/u);
  assert.match(publication, /data-kp-normal-proof-static-checkpoint="recursion"/u);
  assert.doesNotMatch(publication, /\.\/kp-static\//u);
  assert.doesNotMatch(publication, /<script|type="module"|katex\.render/iu);
  assert.doesNotMatch(publication, /:::kp-/u);
});
