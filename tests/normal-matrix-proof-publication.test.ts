import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpNormalMatrixProofPublicLesson,
  renderKpNormalMatrixProofPublicLesson
} from "../src/public-web/normal-matrix-proof-publication.ts";
import {
  isKpNormalMatrixProofPublicRoute,
  kpNormalMatrixProofPublicPath
} from "../src/public-web/normal-matrix-proof-public-route.ts";

const text = readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("public proof memory keeps Article and versioned asset authority", () => {
  const lesson = compileKpNormalMatrixProofPublicLesson({ text, lock });
  const stage = lesson.compilation.article.document.blocks.find(
    (block) => block.kind === "stage"
  );

  assert.equal(lesson.schemaVersion, "kp.public-proof-memory.v1");
  assert.equal(lesson.compilation.article.document.articleSchema, "kp.article.v1");
  assert.equal(
    stage?.vignette.animationId,
    "animation.linear-algebra.normal-matrix-proof"
  );
});

test("static route shell is complete before lazy enhancement", () => {
  const html = renderKpNormalMatrixProofPublicLesson(
    compileKpNormalMatrixProofPublicLesson({ text, lock })
  );
  const searchable = html.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");

  assert.match(html, /data-kp-public-proof-memory/u);
  assert.match(html, /data-kp-normal-proof-stage-fallback/u);
  assert.match(html, /class="katex-mathml"/u);
  assert.match(searchable, /normal matrix have an orthonormal eigenbasis/iu);
  assert.match(searchable, /The complex-number assumption enters/u);
  assert.doesNotMatch(html, /<script|CodeMirror|animation library/iu);
});

test("normal-matrix proof owns one canonical public route", () => {
  assert.equal(kpNormalMatrixProofPublicPath, "/learn/math/normal-matrices/");
  assert.equal(isKpNormalMatrixProofPublicRoute(
    "/learn/math/normal-matrices"
  ), true);
  assert.equal(isKpNormalMatrixProofPublicRoute(
    "/learn/math/fraction-composition/"
  ), false);
});

test("public entry keeps the stage capability behind a dynamic boundary", () => {
  const source = readFileSync(
    "src/public-web/normal-matrix-proof-public-entry.ts",
    "utf8"
  );

  assert.match(source, /IntersectionObserver/u);
  assert.match(source, /void import\(/u);
  assert.doesNotMatch(source, /CodeMirror|svelte|catalogue/iu);
});
