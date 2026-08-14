import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpArticleDocument } from
  "../src/article/kp-article-document.ts";
import {
  resolveKpArticleImports,
  type KpArticleImportLock
} from "../src/article/kp-article-import-lock.ts";
import { resolveKpArticleSemanticReferences } from
  "../src/article/kp-article-semantic-references.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { validateKpArticle } from "../src/article/kp-article-validation.ts";
import { kpNormalMatrixProofVignetteRegistry } from
  "../src/article/vignettes/normal-matrix-proof-vignette.ts";
import { kpNormalMatrixProofTransformationPaths } from
  "../src/semantic/normal-matrix-proof-operations.ts";

const sourceText = readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.md",
  "utf8"
);
const source = createKpArticleSource(
  "content/lessons/linear-algebra-normal-matrices.kp.md",
  sourceText
);
const lock = JSON.parse(readFileSync(
  "content/lessons/linear-algebra-normal-matrices.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("normal-matrix proof uses the frozen Article v1 grammar", () => {
  const validation = validateKpArticle(source);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.diagnostics, []);
  assert.deepEqual(
    validation.directives.map(({ kind, id }) => ({ kind, id })),
    [
      { kind: "stage", id: "normal-proof" },
      { kind: "focus", id: "orient-products" },
      { kind: "motion", id: "read-left-entry" },
      { kind: "motion", id: "read-right-entry" },
      { kind: "motion", id: "choose-eigenbasis" },
      { kind: "motion", id: "compare-first-entries" },
      { kind: "motion", id: "force-remainder-zero" },
      { kind: "motion", id: "restrict-to-lower-block" },
      { kind: "passage", id: "proof-map" }
    ]
  );
});

test("article resolves the exact normal-proof vignette lock", () => {
  const resolved = resolveKpArticleImports(
    source,
    kpNormalMatrixProofVignetteRegistry,
    lock
  );

  assert.deepEqual(resolved.lock, lock);
  assert.equal(resolved.stages[0]?.stageId, "normal-proof");
  assert.equal(
    resolved.releases[0]?.animationId,
    "animation.linear-algebra.normal-matrix-proof"
  );
});

test("article addresses all transformations and stable proof objects", () => {
  const semantic = resolveKpArticleSemanticReferences(source);

  assert.equal(semantic.valid, true);
  assert.deepEqual(
    semantic.references
      .filter(({ origin }) => origin === "motion-run")
      .map(({ objectPath }) => objectPath),
    kpNormalMatrixProofTransformationPaths
  );
  assert.ok(
    semantic.references.filter(({ origin }) => origin === "inline-link").length >= 15
  );
  assert.ok(semantic.references.every(({ timelineAuthority }) => timelineAuthority === "none"));
});

test("compiled proof remains complete static prose with one stage", () => {
  const compiled = compileKpArticleDocument({
    source,
    registry: kpNormalMatrixProofVignetteRegistry,
    lock
  });

  assert.equal(compiled.document.sourceId, source.sourceId);
  assert.equal(compiled.document.blocks.filter(({ kind }) => kind === "stage").length, 1);
  for (const requiredText of [
    "characteristic polynomial",
    "squared norm of row",
    "positive-definiteness",
    "lower-right block equation",
    "diagonal-only trap"
  ]) {
    assert.match(sourceText.toLowerCase(), new RegExp(requiredText));
  }
  assert.doesNotMatch(sourceText, /cognitivemedium|Michael Nielsen/i);
});
