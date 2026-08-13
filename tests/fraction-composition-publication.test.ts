import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionPublicLesson,
  renderKpFractionCompositionPublicLesson
} from "../src/public-web/fraction-composition-publication.ts";
import {
  isKpFractionCompositionPublicRoute,
  kpFractionCompositionPublicPath
} from "../src/public-web/fraction-composition-public-route.ts";
import { kpDevelopmentBuildEntries } from
  "../src/dev-toolbar/development-page-build-entries.ts";
import { kpDevelopmentPages } from
  "../src/dev-toolbar/development-page-directory.ts";

const text = readFileSync(
  "content/lessons/algebra-fraction-composition.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/algebra-fraction-composition.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("public symbolic lesson keeps Article v1 and canonical KaTeX authority", () => {
  const lesson = compileKpFractionCompositionPublicLesson({ text, lock });
  const stage = lesson.compilation.article.document.blocks.find(
    (block) => block.kind === "stage"
  );

  assert.equal(lesson.schemaVersion, "kp.public-symbolic-lesson.v1");
  assert.equal(
    lesson.compilation.article.document.articleSchema,
    "kp.article.v1"
  );
  assert.equal(
    stage?.vignette.animationId,
    "animation.fraction-composition.two-thirds-solve"
  );
  assert.equal(
    lesson.compilation.staticHtml.math.clientRuntimeRequired,
    false
  );
});

test("static public lesson contains searchable prose, math, and one stage", () => {
  const html = renderKpFractionCompositionPublicLesson(
    compileKpFractionCompositionPublicLesson({ text, lock })
  );
  const searchable = html.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");

  assert.match(html, /data-kp-public-symbolic-lesson/u);
  assert.match(html, /data-kp-algebra-attention-stage/u);
  assert.match(html, /data-kp-algebra-attention-scrubber disabled/u);
  assert.match(html, /data-kp-reader-exemplar-template/u);
  assert.match(html, /class="katex"/u);
  assert.match(searchable, /The goal is x\s*=\s*9/u);
  assert.match(searchable, /Follow the factor as it distributes/u);
  assert.match(searchable, /Hold the variable fraction in place/u);
  assert.doesNotMatch(html, /CodeMirror|animation library/iu);
});

test("public symbolic lesson owns one route and development-directory entry", () => {
  assert.equal(
    kpFractionCompositionPublicPath,
    "/learn/math/fraction-composition/"
  );
  assert.equal(isKpFractionCompositionPublicRoute(
    "/learn/math/fraction-composition"), true);
  assert.equal(isKpFractionCompositionPublicRoute(
    "/tutorials/algebra/fraction-composition/"), false);
  assert.deepEqual(kpDevelopmentBuildEntries.find(
    ({ name }) => name === "publicFractionComposition"
  ), {
    name: "publicFractionComposition",
    htmlPath: "learn/math/fraction-composition/index.html"
  });
  assert.ok(kpDevelopmentPages.some(({ id, href }) =>
    id === "tutorial.public-fraction-composition" &&
    href === kpFractionCompositionPublicPath));
});
