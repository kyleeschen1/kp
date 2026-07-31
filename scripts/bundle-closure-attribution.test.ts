import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";

import {
  kpBundleBudgetDeltaBytes,
  measureKpBundleClosureAttribution
} from "./bundle-closure-attribution.ts";

test("bundle closure attribution is de-duplicated and path-stable", async () => {
  await mkdir(resolve("tmp/codex"), { recursive: true });
  const root = await mkdtemp(resolve("tmp/codex/closure-attribution-"));
  try {
    await writeFile(resolve(root, "z.js"), "export const z = 1;\n");
    await writeFile(resolve(root, "a.css"), ".a { color: red; }\n");

    const result = await measureKpBundleClosureAttribution(root, [
      "z.js",
      "a.css",
      "z.js"
    ]);

    assert.deepEqual(result.files.map(({ file }) => file), ["a.css", "z.js"]);
    assert.equal(result.gzipBytes, [
      ".a { color: red; }\n",
      "export const z = 1;\n"
    ].reduce((total, source) => total + gzipSync(source).byteLength, 0));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bundle deltas distinguish excess from headroom", () => {
  assert.equal(kpBundleBudgetDeltaBytes(105, 100), 5);
  assert.equal(kpBundleBudgetDeltaBytes(95, 100), -5);
});
