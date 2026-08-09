import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpArticleDocument
} from "../src/article/kp-article-document.ts";
import {
  indexKpArticleIdentities
} from "../src/article/kp-article-identity.ts";
import {
  resolveKpArticleImports,
  type KpArticleImportLock
} from "../src/article/kp-article-import-lock.ts";
import {
  createKpArticleSource
} from "../src/article/kp-article-source.ts";
import {
  resolveKpArticleSemanticReferences
} from "../src/article/kp-article-semantic-references.ts";
import {
  validateKpArticle
} from "../src/article/kp-article-validation.ts";
import {
  kpFractionCompositionArticleVignetteRegistry
} from "../src/article/vignettes/fraction-composition-vignette.ts";

const source = createKpArticleSource(
  "content/lessons/algebra-fraction-composition.kp.md",
  readFileSync("content/lessons/algebra-fraction-composition.kp.md", "utf8")
);
const lock = JSON.parse(
  readFileSync("content/lessons/algebra-fraction-composition.kp.lock.json", "utf8")
) as KpArticleImportLock;

test("canonical fraction composition article uses the frozen v1 grammar", () => {
  const validation = validateKpArticle(source);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.diagnostics, []);
  assert.deepEqual(
    validation.directives.map(({ kind, id }) => ({ kind, id })),
    [
      { kind: "stage", id: "solve" },
      { kind: "focus", id: "read-scope" },
      { kind: "motion", id: "distribute" },
      { kind: "motion", id: "evaluate-constant" },
      { kind: "motion", id: "subtract-four" },
      { kind: "motion", id: "clear-denominator" },
      { kind: "motion", id: "divide-by-two" },
      { kind: "passage", id: "verify-solution" }
    ]
  );
});

test("fraction composition article resolves one exact vignette lock", () => {
  const resolved = resolveKpArticleImports(
    source,
    kpFractionCompositionArticleVignetteRegistry,
    lock
  );

  assert.deepEqual(resolved.lock, lock);
  assert.equal(resolved.releases.length, 1);
  assert.equal(resolved.stages[0]?.stageId, "solve");
  assert.equal(
    resolved.releases[0]?.animationId,
    "animation.fraction-composition.two-thirds-solve"
  );
});

test("fraction composition prose addresses five motion ranges and canonical objects", () => {
  const semantic = resolveKpArticleSemanticReferences(source);

  assert.equal(semantic.valid, true);
  assert.deepEqual(
    semantic.references
      .filter(({ origin }) => origin === "motion-run")
      .map(({ objectPath }) => objectPath),
    [
      "distribute-and-normalize",
      "evaluate-constant",
      "subtract-and-simplify",
      "clear-denominator",
      "divide-and-solve"
    ]
  );
  assert.ok(
    semantic.references.filter(({ origin }) => origin === "inline-link").length >= 10
  );
  assert.ok(semantic.references.every(({ timelineAuthority }) => timelineAuthority === "none"));
});

test("fraction composition identities and source map remain stable and exact", () => {
  const identities = indexKpArticleIdentities(source);
  const compiled = compileKpArticleDocument({
    source,
    registry: kpFractionCompositionArticleVignetteRegistry,
    lock
  });

  assert.deepEqual(
    identities.map(({ localId }) => localId),
    [
      "solve",
      "read-scope",
      "distribute",
      "evaluate-constant",
      "subtract-four",
      "clear-denominator",
      "divide-by-two",
      "verify-solution"
    ]
  );
  assert.ok(identities.every(
    ({ fullId }) => fullId.startsWith("lesson.algebra.fraction-composition.article#")
  ));
  assert.equal(compiled.document.sourceId, source.sourceId);
  assert.ok(compiled.sourceMap.entries.some(
    ({ key, role }) => key === "block:divide-by-two" && role === "block"
  ));
  assert.ok(compiled.sourceMap.entries.every(
    ({ span }) => span.sourceId === source.sourceId
  ));
});
