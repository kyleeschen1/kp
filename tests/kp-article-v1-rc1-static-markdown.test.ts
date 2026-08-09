import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { compileKpArticleStaticMarkdown } from "../src/article/kp-article-static-markdown.ts";
import { kpArticleVignetteRegistry } from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("static Markdown removes KP syntax while retaining all prose in semantic order", () => {
  const artifact = compileStatic();
  const { markdown } = artifact;

  assert.doesNotMatch(markdown, /^---$|:::kp-|::after/mu);
  const order = [
    "### When demand changes",
    "Initial supply and demand equilibrium",
    "Read the [price axis]",
    "Before anything moves",
    "Buyers now want four hundred more boxes",
    "At the same price",
    "New market equilibrium",
    "The new intersection occurs",
    "The equations verify"
  ].map((phrase) => markdown.indexOf(phrase));
  assert.ok(order.every((offset) => offset >= 0));
  assert.deepEqual([...order].sort((left, right) => left - right), order);
  assert.equal(count(markdown, "At the same price"), 1);
  assert.equal(count(markdown, "The new intersection occurs"), 1);
});

test("vignette-owned initial and settled figures become portable asset requests", () => {
  const artifact = compileStatic();

  assert.deepEqual(artifact.assets.map(({ checkpointId, assetPath, vignetteVersion }) => ({
    checkpointId,
    assetPath,
    vignetteVersion
  })), [
    {
      checkpointId: "initial",
      assetPath: "./kp-static/economics-demand-shift-initial.svg",
      vignetteVersion: "1.1.0"
    },
    {
      checkpointId: "settled",
      assetPath: "./kp-static/economics-demand-shift-settled.svg",
      vignetteVersion: "1.1.0"
    }
  ]);
  assert.equal(count(artifact.markdown, "!["), 2);
  assert.match(artifact.markdown, /Supply and initial demand intersect/u);
  assert.match(artifact.markdown, /Supply and shifted demand intersect/u);
});

test("semantic links become real stable fragments with static anchors", () => {
  const { markdown } = compileStatic();

  assert.match(markdown, /\[price axis\]\(#kp-ref:market\/price-axis\)/u);
  assert.match(markdown, /\[demand schedule\]\(#kp-ref:market\/demand\)/u);
  assert.match(markdown, /<a id="kp-ref:market\/price-axis"><\/a>/u);
  assert.match(markdown, /<a id="kp-ref:market\/demand"><\/a>/u);
  assert.doesNotMatch(markdown, /\]\(kp-ref:/u);
});

test("static Markdown stays layout-free and JavaScript-free", () => {
  const artifact = compileStatic();

  assert.doesNotMatch(artifact.markdown, /<script|on[a-z]+=|viewport|sticky|split|deck|scroll/iu);
  assert.ok(Object.isFrozen(artifact));
  assert.ok(Object.isFrozen(artifact.assets));
});

function compileStatic() {
  const source = createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
  const lock = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
  return compileKpArticleStaticMarkdown(compileKpArticleDocument({
    source,
    registry: kpArticleVignetteRegistry,
    lock
  }).document);
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
