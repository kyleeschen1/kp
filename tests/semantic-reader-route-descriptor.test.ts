import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpReaderRoute,
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

test("reader route descriptors preserve inferred declarations and derive build names", () => {
  const descriptor = defineKpReaderRoute({
    route: "/reader/solve-x/teacher-zero/",
    sourcePath: "content/lessons/solve-x-teacher-zero.md",
    compile
  });

  assert.equal(descriptor.compile("lesson").html, "lesson");
  assert.equal(kpReaderRouteEntryName(descriptor.route), "reader-solve-x-teacher-zero");
  assert.equal(kpReaderRouteHtmlPath(descriptor.route), "reader/solve-x/teacher-zero/index.html");
});

test("reader route descriptors reject paths outside shared reader conventions", () => {
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/missing-trailing-slash" as "/reader/missing-trailing-slash/",
    sourcePath: "content/lessons/test.md",
    compile
  }), /end with/);
  assert.throws(() => defineKpReaderRoute({
    route: "/reader/test/",
    sourcePath: "content/test.txt" as "content/lessons/test.md",
    compile
  }), /lesson Markdown/);
});
