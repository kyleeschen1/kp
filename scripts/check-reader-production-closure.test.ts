import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpReaderProductionClosure,
  type KpReaderProductionArtifact
} from "./check-reader-production-closure.ts";
import type { KpReaderRoutePath } from "../src/reader/compiler/reader-route-descriptor.ts";

const routes = [
  { route: "/reader/solve-x/" as KpReaderRoutePath },
  { route: "/reader/distribution-area/" as KpReaderRoutePath }
];

test("reader production closure accepts the exact declared route set", () => {
  assert.deepEqual(checkKpReaderProductionClosure({
    routes,
    artifacts: [
      artifact("reader/solve-x/index.html"),
      artifact("reader/distribution-area/index.html"),
      artifact("assets/reader-runtime.js", "const runtime = true;")
    ]
  }), []);
});

test("reader production closure reports missing and undeclared pages", () => {
  const issues = checkKpReaderProductionClosure({
    routes,
    artifacts: [
      artifact("reader/solve-x/index.html"),
      artifact("reader/unregistered/index.html")
    ]
  });
  assert.deepEqual(issues.map((issue) => issue.code), [
    "reader-production.missing-route",
    "reader-production.undeclared-route"
  ]);
});

test("reader production closure rejects build-only compiler markers", () => {
  const issues = checkKpReaderProductionClosure({
    routes: [{ route: "/reader/solve-x/" as KpReaderRoutePath }],
    artifacts: [
      artifact("reader/solve-x/index.html"),
      artifact("assets/reader-runtime.js", "compileKpReaderPageShell()")
    ]
  });
  assert.deepEqual(issues.map((issue) => issue.code), [
    "reader-production.compiler-leak"
  ]);
});

function artifact(path: string, source = ""): KpReaderProductionArtifact {
  return { path, source };
}
