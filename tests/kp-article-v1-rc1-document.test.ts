import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpArticleDocument
} from "../src/article/kp-article-document.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import {
  economicsDemandShiftVignetteRelease
} from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("golden source compiles to one ordered framework-neutral article document", () => {
  const compiled = compileGolden();
  const { document } = compiled;

  assert.equal(document.kind, "kp-article-document");
  assert.equal(document.schemaVersion, "kp.article-document.v1-rc1");
  assert.equal(document.id, "lesson.economics.demand-shift");
  assert.deepEqual(document.blocks.map((block) => block.kind), [
    "markdown",
    "stage",
    "focus",
    "markdown",
    "passage",
    "motion",
    "markdown"
  ]);
  const opening = document.blocks[0]!;
  const distinctions = document.blocks[3]!;
  const equations = document.blocks[6]!;
  assert.match(opening.kind === "markdown" ? opening.markdown : "", /### When demand changes/u);
  assert.match(distinctions.kind === "markdown" ? distinctions.markdown : "", /three distinctions/u);
  assert.match(equations.kind === "markdown" ? equations.markdown : "", /The equations verify/u);
  assert.ok(document.blocks.every((block) => !("layout" in block)));
});

test("stage, focus, passage, and motion retain typed source meaning", () => {
  const { document } = compileGolden();
  const stage = document.blocks.find((block) => block.kind === "stage")!;
  const focus = document.blocks.find((block) => block.kind === "focus")!;
  const passage = document.blocks.find((block) => block.kind === "passage")!;
  const motion = document.blocks.find((block) => block.kind === "motion")!;

  assert.equal(stage.vignette.version, "1.0.0");
  assert.equal(stage.vignette.integrity, goldenLock().entries[0]!.integrity);
  assert.deepEqual(focus.targets, [
    "lesson.economics.demand-shift#market/demand",
    "lesson.economics.demand-shift#market/supply"
  ]);
  assert.deepEqual(focus.context, ["lesson.economics.demand-shift#market/axes"]);
  assert.deepEqual(passage.claims, ["econ.demand.ceteris-paribus"]);
  assert.deepEqual(motion.transition, {
    kind: "run",
    path: "lesson.economics.demand-shift#market/shift-demand"
  });
  assert.match(motion.beforeMarkdown, /At the same price/u);
  assert.match(motion.afterMarkdown ?? "", /new intersection/u);
});

test("semantic references remain separately addressable and never own time", () => {
  const { document } = compileGolden();

  assert.equal(document.references.length, 6);
  assert.ok(document.references.every(({ timelineAuthority }) => timelineAuthority === "none"));
  assert.deepEqual(document.references.filter(({ origin }) => origin === "inline-link").map(({ label }) => label), [
    "price axis",
    "demand schedule"
  ]);
  const focus = document.blocks.find((block) => block.kind === "focus")!;
  const motion = document.blocks.find((block) => block.kind === "motion")!;
  assert.equal(focus.referenceIds.length, 1);
  assert.equal(motion.referenceIds.length, 1);
});

test("source map returns exact author text for every mapped role", () => {
  const source = goldenSource();
  const { document, sourceMap } = compileGolden();

  assert.equal(sourceMap.documentId, document.id);
  assert.equal(sourceMap.sourceId, source.sourceId);
  assert.ok(Object.isFrozen(sourceMap.entries));
  assert.ok(sourceMap.entries.every(({ span }) => (
    span.sourceId === source.sourceId
    && source.text.slice(span.start.offset, span.end.offset).length === span.end.offset - span.start.offset
  )));
  const after = sourceMap.entries.find(({ key }) => key === "block:raise-demand:after")!;
  assert.match(source.text.slice(after.span.start.offset, after.span.end.offset), /new intersection/u);
  const referenceEntries = sourceMap.entries.filter(({ role }) => role === "reference");
  assert.equal(referenceEntries.length, document.references.length);
});

test("compiled authority and nested collections are immutable data", () => {
  const { document, sourceMap } = compileGolden();

  assert.ok(Object.isFrozen(document));
  assert.ok(Object.isFrozen(document.blocks));
  assert.ok(Object.isFrozen(document.references));
  assert.ok(Object.isFrozen(document.importLock));
  assert.ok(Object.isFrozen(sourceMap));
  assert.doesNotMatch(JSON.stringify(document), /mdast|viewport|sticky|split|deck/u);
});

function compileGolden() {
  return compileKpArticleDocument({
    source: goldenSource(),
    registry: [economicsDemandShiftVignetteRelease],
    lock: goldenLock()
  });
}

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function goldenLock(): KpArticleImportLock {
  return JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
}
