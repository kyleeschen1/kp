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
});
