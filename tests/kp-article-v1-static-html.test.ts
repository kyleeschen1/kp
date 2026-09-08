import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import { compileKpArticleStaticHtml } from "../src/article/kp-article-static-html.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { kpArticleVignetteRegistry } from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("embedded Articles namespace generated headings and forward links without changing legacy or semantic anchors", () => {
  const source = createKpArticleSource("embedded.md", "---\nkp:\n  schema: kp.article.v1\n  id: lesson.embedded\n  imports:\n---\n\n[Forward](#shared-heading)\n\n# Shared heading\n\n# Shared heading\n");
  const document = compileKpArticleDocument({ source, registry: [], lock: { schemaVersion: "kp.article-import-lock.v1", documentId: "lesson.embedded", entries: [] } }).document;
  const legacy = compileKpArticleStaticHtml(document);
  assert.match(legacy.articleHtml, /id="shared-heading"/);
  for (const prefix of ["reading.full", "reading.compact"]) {
    const embedded = compileKpArticleStaticHtml(document, { headingIdPrefix: prefix });
    assert.ok(embedded.articleHtml.includes(`id="${prefix}.shared-heading"`));
    assert.ok(embedded.articleHtml.includes(`id="${prefix}.shared-heading-2"`));
    assert.ok(embedded.articleHtml.includes(`href="#${prefix}.shared-heading"`));
    assert.ok(embedded.tocHtml.includes(`href="#${prefix}.shared-heading-2"`));
  }
  assert.throws(() => compileKpArticleStaticHtml(document, { headingIdPrefix: 'bad"namespace' }), /safe identity/);
});

test("static HTML is semantic and keeps the complete economics explanation searchable", () => {
  const artifact = compileStatic();
  const text = artifact.articleHtml.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");

  assert.match(artifact.articleHtml, /^<article data-kp-article="lesson\.economics\.demand-shift">/u);
  assert.match(artifact.articleHtml, /<h3 id="when-demand-changes">When demand changes<\/h3>/u);
  assert.match(artifact.articleHtml, /<ul><li><p>A curve collects possible price/u);
  assert.match(artifact.articleHtml, /<figure>\s*<img[^>]+alt="Supply and initial demand intersect/u);
  assert.match(artifact.articleHtml, /<figcaption>Initial supply and demand equilibrium/u);
  for (const phrase of [
    "Imagine a weekly market",
    "Before anything moves",
    "Buyers now want four hundred more boxes",
    "At the same price",
    "The new intersection occurs",
    "The graph does not explain why demand changed"
  ]) assert.match(text, new RegExp(phrase, "u"));
});

test("math is compiled once to accessible KaTeX HTML and MathML", () => {
  const artifact = compileStatic();

  assert.deepEqual(artifact.math, {
    renderer: "katex-build-time",
    inlineCount: 4,
    displayCount: 1,
    clientRuntimeRequired: false
  });
  assert.equal(count(artifact.articleHtml, 'class="katex-mathml"'), 5);
  assert.equal(count(artifact.articleHtml, 'class="katex-html"'), 5);
  assert.match(artifact.articleHtml, /<math/u);
  assert.doesNotMatch(artifact.articleHtml, /<script|katex\.render|type="module"/iu);
});

test("static HTML retains real semantic links, anchors, TOC, and immutable asset requests", () => {
  const artifact = compileStatic();

  assert.match(artifact.articleHtml, /href="#kp-ref:market\/price-axis"/u);
  assert.match(artifact.articleHtml, /id="kp-ref:market\/price-axis"/u);
  assert.match(artifact.articleHtml, /id="kp-ref:market\/demand"/u);
  assert.match(artifact.tocHtml, /aria-label="Table of contents"/u);
  assert.match(artifact.tocHtml, /href="#when-demand-changes"/u);
  assert.deepEqual(artifact.assets.map(({ checkpointId }) => checkpointId), ["initial", "settled"]);
  assert.ok(Object.isFrozen(artifact));
  assert.ok(Object.isFrozen(artifact.assets));
});

test("the build compiler fails closed on arbitrary HTML and unsafe URLs", () => {
  assert.throws(() => compileSource("Unsafe <button>markup</button>."), /valid v1 source/u);
  assert.throws(() => compileSource("[unsafe](javascript:alert(1))"), /unsafe link URL/u);
});

function compileStatic() {
  const source = createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
  const lock = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
  return compileKpArticleStaticHtml(compileKpArticleDocument({
    source,
    registry: kpArticleVignetteRegistry,
    lock
  }).document);
}

function compileSource(markdown: string) {
  const original = readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
    "utf8"
  );
  const lock = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
  const source = createKpArticleSource("variant.md", `${original}\n${markdown}\n`);
  return compileKpArticleStaticHtml(compileKpArticleDocument({
    source,
    registry: kpArticleVignetteRegistry,
    lock
  }).document);
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
