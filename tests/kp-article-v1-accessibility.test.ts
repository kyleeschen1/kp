import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpArticleAccessibilityManifest,
  KpArticleAccessibilityError
} from "../src/article/kp-article-accessibility.ts";
import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import {
  economicsDemandShiftVignetteRelease,
  kpArticleVignetteRegistry
} from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("the economics vignette publishes a reusable accessible stage contract", () => {
  const manifest = compileAccessibility();
  const stage = manifest.stages[0]!;

  assert.equal(manifest.schemaVersion, "kp.article-accessibility.v1");
  assert.equal(stage.accessibleName, "Supply and demand equilibrium graph");
  assert.match(stage.semanticSummary, /supply curve stays fixed while demand shifts right/u);
  assert.deepEqual(stage.checkpoints.map(({ id, alt }) => ({ id, alt })), [
    {
      id: "initial",
      alt: "Supply and initial demand intersect at the initial market equilibrium."
    },
    {
      id: "settled",
      alt: "Supply and shifted demand intersect at a higher price and quantity."
    }
  ]);
  assert.ok(Object.isFrozen(manifest));
  assert.ok(Object.isFrozen(stage.checkpoints));
});

test("reduced motion seeks directly between named semantic checkpoints", () => {
  const seek = compileAccessibility().stages[0]!.reducedMotionSeeks[0]!;

  assert.deepEqual(seek, {
    transitionId: "shift-demand",
    fromCheckpointId: "lesson.economics.demand-shift#market/initial",
    toCheckpointId: "lesson.economics.demand-shift#market/settled",
    behavior: "direct-checkpoint-seek"
  });
});

test("article labels may add context without replacing the vignette summary", () => {
  const source = goldenSource();
  const labeled = createKpArticleSource(
    source.sourceId,
    source.text.replace("use=demandShift}", 'use=demandShift label="Strawberry market graph"}')
  );
  const stage = compileKpArticleAccessibilityManifest(compileDocument(labeled)).stages[0]!;

  assert.equal(stage.accessibleName, "Strawberry market graph");
  assert.match(stage.semanticSummary, /higher price and quantity/u);
});

test("public accessibility compilation fails when a release lacks required fallbacks", () => {
  const document = compileKpArticleDocument({
    source: goldenSource(),
    registry: [economicsDemandShiftVignetteRelease],
    lock: {
      schemaVersion: "kp.article-import-lock.v1",
      documentId: "lesson.economics.demand-shift",
      entries: [{
        alias: "demandShift",
        request: "vignette.economics.demand-shift@1",
        vignetteId: economicsDemandShiftVignetteRelease.id,
        requestedMajor: 1,
        version: economicsDemandShiftVignetteRelease.version,
        integrity: economicsDemandShiftVignetteRelease.integrity,
        moduleSpecifier: economicsDemandShiftVignetteRelease.moduleSpecifier
      }]
    }
  }).document;

  assert.throws(
    () => compileKpArticleAccessibilityManifest(document),
    (error: unknown) => error instanceof KpArticleAccessibilityError &&
      error.code === "accessibility-metadata-missing"
  );
});

function compileAccessibility() {
  return compileKpArticleAccessibilityManifest(compileDocument(goldenSource()));
}

function compileDocument(source = goldenSource()) {
  const lock = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
  return compileKpArticleDocument({ source, registry: kpArticleVignetteRegistry, lock }).document;
}

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}
