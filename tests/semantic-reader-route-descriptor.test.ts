import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpReaderRoute,
  defineKpReaderRouteManifest,
  kpReaderRouteEntryName,
  kpReaderRouteHtmlPath
} from "../src/reader/compiler/reader-route-descriptor.ts";

const compile = (markdown: string) => ({
  kind: "compiled-lesson" as const,
  id: "compiled.test",
  version: "1",
  document: { kind: "lesson-document" as const, id: "lesson.test", version: "1" },
  html: markdown,
  tocHtml: "",
  hydration: {}
});
const conformance = {
  readerId: "test-reader",
  documentId: "lesson.test",
  version: "1",
  progressPermille: 500,
  beatId: "beat.test",
  query: {},
  stageSelector: "[data-stage]",
  rendererAdapterId: "renderer.test",
  shareSelector: "[data-share]",
  fontReadyEvidence: "document-fonts",
  progressEvidence: {
    kind: "attribute",
    selector: "body",
    name: "data-progress"
  },
  searchableText: "test lesson"
} as const;
const review = {
  id: "test",
  title: "Test review",
  capture: "viewport",
  columns: 2,
  imageFit: "cover",
  checkpoints: [{
    id: "canonical",
    label: "Canonical",
    progressPermille: 500,
    viewport: "desktop"
  }]
} as const;

test("reader route manifests reject duplicate public and build identities", () => {
  const descriptor = defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    review
  });
  assert.throws(
    () => defineKpReaderRouteManifest([descriptor, descriptor]),
    /declared more than once/
  );
});

test("reader route descriptors preserve inferred declarations and derive build names", () => {
  const descriptor = defineKpReaderRoute({
    route: "/reader/solve-x/teacher-zero/",
    sourcePath: "content/lessons/solve-x-teacher-zero.md",
    compile,
    conformance,
    review
  });

  assert.equal(descriptor.compile("lesson").html, "lesson");
  assert.equal(kpReaderRouteEntryName(descriptor.route), "reader-solve-x-teacher-zero");
  assert.equal(kpReaderRouteHtmlPath(descriptor.route), "reader/solve-x/teacher-zero/index.html");
});

test("reader route descriptors reject paths outside shared reader conventions", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/missing-trailing-slash" as "/reader/missing-trailing-slash/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    review
  }), /end with/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/test.txt" as "content/lessons/test.md",
    compile,
    conformance,
    review
  }), /lesson Markdown/);
});

test("reader route descriptors reject ambiguous conformance moments", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance: { ...conformance, progressPermille: 1_001 },
    review
  }), /bounded conformance progress/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance: { ...conformance, query: { kpProgress: "500" } },
    review
  }), /must not fix kpProgress/);
});

test("reader route descriptors require deterministic visual review moments", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    review: { ...review, checkpoints: [] }
  }), /requires a visual review checkpoint/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    review: {
      ...review,
      checkpoints: [review.checkpoints[0], review.checkpoints[0]]
    }
  }), /repeats visual review checkpoint canonical/);
});
