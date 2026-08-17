import assert from "node:assert/strict";
import test from "node:test";

import {
  kpProductionDevelopmentExactModules,
  kpProductionDevelopmentPathPrefixes
} from "../src/architecture/kp-production-development-erasure.ts";
import {
  findKpRenderedProductionDevelopmentModules
} from "./vite-production-development-erasure.ts";

const root = "/workspace/kp";

test("production development policy is immutable and explicit", () => {
  assert.ok(Object.isFrozen(kpProductionDevelopmentPathPrefixes));
  assert.ok(Object.isFrozen(kpProductionDevelopmentExactModules));
  assert.ok(kpProductionDevelopmentPathPrefixes.includes("src/dev-review/"));
  assert.ok(kpProductionDevelopmentPathPrefixes.includes("src/dev-toolbar/"));
  assert.ok(kpProductionDevelopmentExactModules.includes(
    "src/article/kp-article-source-save.ts"
  ));
});

test("rendered-module inspection survives query suffixes merging and duplicates", () => {
  assert.deepEqual(findKpRenderedProductionDevelopmentModules([
    `${root}/src/kernel/public-api.ts`,
    `${root}/src/dev-review/review-shell.ts?commonjs-proxy`,
    `${root}/src/dev-review/review-shell.ts`,
    `${root}/src/article/kp-article-source-save.ts`,
    "/workspace/other/src/dev-toolbar/not-ours.ts",
    `${root}/node_modules/example/index.js`
  ], root), [
    "src/article/kp-article-source-save.ts",
    "src/dev-review/review-shell.ts"
  ]);
});

test("neutral review protocols are not mistaken for development implementations", () => {
  assert.deepEqual(findKpRenderedProductionDevelopmentModules([
    `${root}/src/protocols/dev-review-operations-v2.ts`,
    `${root}/src/article/kp-article-source.ts`
  ], root), []);
});
