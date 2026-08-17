import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpTypeScriptFreeShippingPublicLesson,
  renderKpTypeScriptFreeShippingPublicLesson
} from "../src/public-web/typescript-free-shipping-publication.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from
  "../src/public-web/typescript-free-shipping-runtime.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import {
  isKpTypeScriptFreeShippingPublicRoute,
  kpTypeScriptFreeShippingPublicPath
} from "../src/public-web/typescript-free-shipping-route.ts";
import { kpDevelopmentBuildEntries } from
  "../src/dev-toolbar/development-page-build-entries.ts";
import { kpDevelopmentPages } from
  "../src/dev-toolbar/development-page-directory.ts";

const text = readFileSync(
  "content/lessons/typescript-free-shipping.kp.md",
  "utf8"
);
const lock = JSON.parse(readFileSync(
  "content/lessons/typescript-free-shipping.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("public TypeScript lesson resolves the approved versioned vignette", () => {
  const compiled = compileKpTypeScriptFreeShippingPublicLesson({ text, lock });

  assert.equal(compiled.article.document.articleSchema, "kp.article.v1");
  assert.equal(compiled.article.document.importLock.entries.length, 1);
  assert.equal(
    compiled.article.document.importLock.entries[0]?.vignetteId,
    "vignette.programming.typescript-free-shipping"
  );
  assert.equal(
    compiled.article.document.blocks.find(
      (block) => block.kind === "stage"
    )?.vignette.animationId,
    "animation.programming.typescript-free-shipping-refactor"
  );
  assert.deepEqual(
    compiled.checkpoints.map(({ id }) => id),
    [
      "stage.orient",
      "stage.compare-duplicates",
      "stage.introduce-helper",
      "stage.move-shared-rule",
      "stage.replace-cost-call",
      "stage.replace-message-call",
      "stage.verify-parity"
    ]
  );
});

test("public runtime projection preserves the canonical playback inputs", () => {
  const canonical = createKpTypeScriptFreeShippingAnimationAsset();
  const runtime = createKpTypeScriptFreeShippingRuntimeProjection();

  assert.equal(runtime.id, canonical.id);
  assert.deepEqual(runtime.semantics, canonical.semantics);
  assert.deepEqual(runtime.score, canonical.score);
  assert.deepEqual(runtime.motionPlan, canonical.motionPlan);
});

test("static public lesson contains searchable prose, source, and a settled stage", () => {
  const html = renderKpTypeScriptFreeShippingPublicLesson(
    compileKpTypeScriptFreeShippingPublicLesson({ text, lock })
  );
  const searchable = html.replace(/<[^>]*>/gu, " ").replace(/\s+/gu, " ");

  assert.match(html, /data-kp-public-typescript-lesson/u);
  assert.match(html, /data-kp-typescript-refactor-stage="stage\.orient"/u);
  assert.match(html, /data-kp-public-typescript-stage/u);
  assert.match(html, /data-kp-typescript-syntax-kind="number">50<\/span>/u);
  assert.match(html, /data-kp-public-typescript-play disabled/u);
  assert.match(html, /data-kp-public-typescript-seek[^>]+disabled/u);
  assert.match(searchable, /A duplicated rule can quietly become two different rules/u);
  assert.match(searchable, /qualifiesForFreeShipping/u);
  assert.equal((html.match(/total &gt;= 50/gu) ?? []).length >= 2, true);
  assert.doesNotMatch(html, /animation library|review inbox|CodeMirror/iu);
});

test("checkpoint links carry semantic IDs and exact normalized progress", () => {
  const html = renderKpTypeScriptFreeShippingPublicLesson(
    compileKpTypeScriptFreeShippingPublicLesson({ text, lock })
  );

  assert.match(
    html,
    /href="\/learn\/code\/free-shipping\/\?checkpoint=stage\.compare-duplicates#refactor-stage"/u
  );
  assert.match(
    html,
    /data-kp-public-typescript-checkpoint="stage\.verify-parity" data-kp-progress="1"/u
  );
});

test("public lesson owns one dedicated route outside the shared dev build", () => {
  assert.equal(kpTypeScriptFreeShippingPublicPath,
    "/learn/code/free-shipping/");
  assert.equal(isKpTypeScriptFreeShippingPublicRoute(
    "/learn/code/free-shipping"), true);
  assert.equal(isKpTypeScriptFreeShippingPublicRoute(
    "/tutorials/programming/scheme-factorial/"), false);
  assert.equal(kpDevelopmentBuildEntries.find(
    ({ name }) => name === "publicTypeScriptFreeShipping"
  ), undefined);
  assert.ok(kpDevelopmentPages.some(({ id, href }) =>
    id === "tutorial.public-typescript-free-shipping" &&
    href === kpTypeScriptFreeShippingPublicPath));
});
