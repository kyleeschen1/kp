import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { deriveKpArticleDeck } from "../src/article/kp-article-deck.ts";
import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { kpArticleVignetteRegistry } from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("deck derives reading and motion scenes without slide syntax", () => {
  const deck = deriveKpArticleDeck(compileDocument());

  assert.deepEqual(deck.scenes.map(({ kind, id }) => ({ kind, id })), [
    { kind: "reading", id: "section-when-demand-changes" },
    { kind: "motion", id: "raise-demand" },
    { kind: "reading", id: "after-raise-demand" }
  ]);
  assert.deepEqual(deck.scenes.map(({ kind }) => kind), ["reading", "motion", "reading"]);
  assert.ok(Object.isFrozen(deck));
  assert.ok(Object.isFrozen(deck.scenes));
});

test("a motion directive remains one indivisible scene with both prose slots", () => {
  const scene = deriveKpArticleDeck(compileDocument()).scenes[1]!;

  assert.equal(scene.kind, "motion");
  if (scene.kind !== "motion") return;
  assert.equal(scene.stageId, "market");
  assert.deepEqual(scene.transition, { kind: "run", path: "lesson.economics.demand-shift#market/shift-demand" });
  assert.match(scene.beforeMarkdown, /^At the same price/u);
  assert.match(scene.afterMarkdown!.trim(), /^The new intersection occurs/u);
  assert.deepEqual(scene.sourceBlockKeys, ["raise-demand"]);
});

test("all explanatory prose appears exactly once across derived scenes", () => {
  const deck = deriveKpArticleDeck(compileDocument());
  const projected = deck.scenes.map((scene) => scene.kind === "reading"
    ? scene.markdown
    : `${scene.beforeMarkdown}\n${scene.afterMarkdown ?? ""}`).join("\n");

  for (const phrase of [
    "Imagine a weekly market",
    "Read the [price axis]",
    "Before anything moves",
    "Buyers now want four hundred more boxes",
    "At the same price",
    "The new intersection occurs",
    "The equations verify",
    "The graph does not explain why demand changed"
  ]) assert.equal(count(projected, phrase), 1, phrase);
  assert.doesNotMatch(projected, /:::kp-|::after/u);
});

test("reading scenes retain cumulative stage and focus meaning", () => {
  const first = deriveKpArticleDeck(compileDocument()).scenes[0]!;

  assert.equal(first.kind, "reading");
  if (first.kind !== "reading") return;
  assert.deepEqual(first.stageIds, ["market"]);
  assert.deepEqual(first.focusCues, [{
    blockId: "read-curves",
    stageId: "market",
    targets: [
      "lesson.economics.demand-shift#market/demand",
      "lesson.economics.demand-shift#market/supply"
    ],
    context: ["lesson.economics.demand-shift#market/axes"]
  }]);
});

function compileDocument() {
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
  return compileKpArticleDocument({ source, registry: kpArticleVignetteRegistry, lock }).document;
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
