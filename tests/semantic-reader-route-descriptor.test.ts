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
const presentation = {
  kind: "certified-custom-renderer",
  certificationId: "certification.reader.test",
  operationCertificateIds: ["certificate.reader.test"],
  genericFallback: "forbidden",
  browserPhaseGates: ["reflow", "act", "native-settlement"]
} as const;
const budget = {
  compiledHtmlRawBytes: 10_000,
  compiledHtmlGzipBytes: 2_000,
  runtimeCodeGzipBytes: 40_000
} as const;

test("reader route manifests reject duplicate public and build identities", () => {
  const descriptor = defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation,
    review,
    budget
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
    presentation,
    review,
    budget
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
    presentation,
    review,
    budget
  }), /end with/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/test.txt" as "content/lessons/test.md",
    compile,
    conformance,
    presentation,
    review,
    budget
  }), /lesson Markdown/);
});

test("reader route descriptors reject ambiguous conformance moments", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance: { ...conformance, progressPermille: 1_001 },
    presentation,
    review,
    budget
  }), /bounded conformance progress/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance: { ...conformance, query: { kpProgress: "500" } },
    presentation,
    review,
    budget
  }), /must not fix kpProgress/);
});

test("reader route descriptors require deterministic visual review moments", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation,
    review: { ...review, checkpoints: [] },
    budget
  }), /requires a visual review checkpoint/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation,
    review: {
      ...review,
      checkpoints: [review.checkpoints[0], review.checkpoints[0]]
    },
    budget
  }), /repeats visual review checkpoint canonical/);
});

test("reader route descriptors require positive byte baselines", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation,
    review,
    budget: { ...budget, runtimeCodeGzipBytes: 0 }
  }), /positive byte baseline/);
});

test("reader routes reject generic fallback and uncertified custom renderers", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation: {
      ...presentation,
      genericFallback: "allowed" as "forbidden"
    },
    review,
    budget
  }), /forbid generic fallback/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/lessons/test.md",
    compile,
    conformance,
    presentation: {
      ...presentation,
      operationCertificateIds: []
    },
    review,
    budget
  }), /requires explicit operation-presentation certificate ids/);
});
