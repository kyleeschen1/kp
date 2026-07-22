import assert from "node:assert/strict";
import test from "node:test";

import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";
import {
  kpReaderRouteEntryName,
  kpReaderRouteHtmlPath
} from "../src/reader/compiler/reader-route-descriptor.ts";

test("build manifest declares every accepted reader route exactly once", () => {
  assert.deepEqual(kpReaderRouteManifest.map((descriptor) => descriptor.route), [
    "/reader/solve-x/",
    "/reader/solve-x/teacher-zero/",
    "/reader/solve-fractional-linear/",
    "/reader/divide-both-sides/",
    "/reader/split-merge-fractions/",
    "/reader/fractional-transfer/",
    "/reader/distribution-area/"
  ]);
  assert.equal(new Set(kpReaderRouteManifest.map(({ sourcePath }) => sourcePath)).size, 7);
  assert.deepEqual(
    kpReaderRouteManifest.map(({ route }) => ({
      entry: kpReaderRouteEntryName(route),
      html: kpReaderRouteHtmlPath(route)
    })),
    [
      { entry: "reader-solve-x", html: "reader/solve-x/index.html" },
      { entry: "reader-solve-x-teacher-zero", html: "reader/solve-x/teacher-zero/index.html" },
      { entry: "reader-solve-fractional-linear", html: "reader/solve-fractional-linear/index.html" },
      { entry: "reader-divide-both-sides", html: "reader/divide-both-sides/index.html" },
      { entry: "reader-split-merge-fractions", html: "reader/split-merge-fractions/index.html" },
      { entry: "reader-fractional-transfer", html: "reader/fractional-transfer/index.html" },
      { entry: "reader-distribution-area", html: "reader/distribution-area/index.html" }
    ]
  );
  assert.deepEqual(
    kpReaderRouteManifest.map(({ route, conformance }) => ({
      route,
      documentId: conformance.documentId,
      progressPermille: conformance.progressPermille,
      rendererAdapterId: conformance.rendererAdapterId
    })),
    [
      {
        route: "/reader/solve-x/",
        documentId: "lesson.solve-x.x-plus-3",
        progressPermille: 517,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/solve-x/teacher-zero/",
        documentId: "lesson.solve-x.x-plus-3.teacher-zero",
        progressPermille: 500,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/solve-fractional-linear/",
        documentId: "lesson.solve-x.fractional-linear",
        progressPermille: 500,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/divide-both-sides/",
        documentId: "lesson.solve-x.divide-both-sides",
        progressPermille: 667,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/split-merge-fractions/",
        documentId: "lesson.fractions.numerator-split-merge",
        progressPermille: 500,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/fractional-transfer/",
        documentId: "lesson.solve-x.fractional-transfer-comparison",
        progressPermille: 667,
        rendererAdapterId: "renderer.equation-dom"
      },
      {
        route: "/reader/distribution-area/",
        documentId: "lesson.algebra.distribution-area",
        progressPermille: 720,
        rendererAdapterId: "renderer.distribution-composite"
      }
    ]
  );
  assert.deepEqual(
    kpReaderRouteManifest.map(({ review }) => review.id),
    [
      "solve-x",
      "teacher-zero",
      "fractional-linear",
      "divide-both-sides",
      "split-merge-fractions",
      "fractional-transfer",
      "distribution-area"
    ]
  );
  assert.deepEqual(
    kpReaderRouteManifest.map(({ review }) => review.checkpoints.length),
    [6, 1, 1, 1, 1, 1, 36]
  );
});
