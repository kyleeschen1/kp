import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { loadKpAnimationAsset } from "../src/animation/catalog-loader.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpVerifiedGeneratedLinearSolveReaderCompanion
} from "../src/editor/verified-generated-linear-solve-reader.ts";
import {
  compileKpVerifiedGeneratedLinearSolveLesson
} from "../src/reader/compiler/verified-generated-linear-solve-lesson.ts";
import { kpReaderRouteManifest } from
  "../src/reader/compiler/reader-route-manifest.ts";
import {
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../src/rendering/generated-linear-solve-selector-annotated-latex.ts";
import {
  createKpVerifiedGeneratedLinearSolveSession,
  kpVerifiedGeneratedLinearSolveAnimationId
} from "../src/tutorial/verified-generated-linear-solve-session.ts";

test("generated solve is one searchable native catalogue artifact", async () => {
  const projection = createKpAnimationCatalogueProjection();
  const entry = projection.entries.find(
    ({ animationId }) => animationId ===
      kpVerifiedGeneratedLinearSolveAnimationId
  );
  assert.ok(entry);
  assert.equal(entry.packId, "algebra");
  assert.equal(entry.title, "Solve 2x+3=8");
  assert.ok(entry.searchTerms.includes("verified"));
  assert.ok(entry.searchTerms.includes("linear-solve"));
  assert.deepEqual(entry.relatedContexts.map(({ href }) => href), [
    "/?animation=editor-animation.animation.generated.linear-solve.linear-68c15d41&view=editor",
    "/reader/generated-solve-x/"
  ]);

  const loaded = await loadKpAnimationAsset(
    kpVerifiedGeneratedLinearSolveAnimationId
  );
  assert.equal(loaded.packId, "algebra");
  assert.equal(loaded.animation.id, kpVerifiedGeneratedLinearSolveAnimationId);
  assert.equal(loaded.catalog.filter(({ id }) => id === loaded.animation.id).length, 1);
});

test("catalogue explanation uses inline KaTeX and hides static machinery", () => {
  const companion = createKpVerifiedGeneratedLinearSolveReaderCompanion();
  assert.equal(companion.label, "Explanation");
  assert.match(companion.html, /<h3>Orient<\/h3>/);
  assert.match(companion.html, /class="katex"/);
  assert.doesNotMatch(companion.html, /katex-display/);
  assert.match(companion.html, /<details data-kp-generated-static-output>/);
  assert.equal(
    (companion.html.match(/data-kp-generated-explanation-cue=/g) ?? []).length,
    8
  );
  assert.equal(
    (companion.html.match(/data-kp-generated-static-state=/g) ?? []).length,
    6
  );
});

test("generated reader route compiles searchable static math without an iframe", async () => {
  const markdown = await readFile(
    new URL("../content/lessons/generated-solve-x.md", import.meta.url),
    "utf8"
  );
  const artifact = compileKpVerifiedGeneratedLinearSolveLesson(markdown);
  assert.equal(artifact.document.id,
    "lesson.generated-solve-x.linear-68c15d41");
  assert.match(artifact.html, /class="katex"/);
  assert.match(artifact.html, /The verified solution is five halves/);
  assert.doesNotMatch(artifact.html, /<iframe/i);
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 6);

  const route = kpReaderRouteManifest.find(
    ({ route }) => route === "/reader/generated-solve-x/"
  );
  assert.ok(route);
  assert.equal(route.conformance.rendererAdapterId, "renderer.equation-dom");
  assert.equal(route.presentation.genericFallback, "forbidden");
});

test("all generated equation states use native selector-annotated KaTeX", () => {
  const objects = createKpVerifiedGeneratedLinearSolveSession()
    .animation.animation.bundle.objects;
  for (const object of objects) {
    const annotated = createKpGeneratedLinearSolveSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    });
    assert.ok(annotated, object.id);
    assert.match(annotated.annotatedLatex, /\\htmlData/);
  }
});

test("production hosts consume the generated asset without provider or compiler imports", async () => {
  const sources = await Promise.all([
    "../src/animation/verified-generated-linear-solve-runtime-asset.ts",
    "../src/animation/catalog-packs/algebra.ts",
    "../src/reader/app/equation-lesson-descriptors/generated-linear-solve.ts"
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(source, /providers\/linear-problems/);
    assert.doesNotMatch(source, /verified-linear-problem-animation-compiler/);
    assert.doesNotMatch(source, /verified-generated-linear-solve-session/);
  }
});
