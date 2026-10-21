import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import { buildCalculusReader } from "../scripts/calculus-reader-build.ts";

test("the production calculus reader has a reproducible complete local closure", async () => {
  const first = await buildCalculusReader(), second = await buildCalculusReader();
  assert.deepEqual(first.files, second.files);
  const entry = first.chunks.find(c => c.entry)!;
  assert.equal(entry.file, "reader.js");
  assert.ok(entry.modules.some(path => path.includes("change-propagation/edition-reader.ts")));
  assert.ok(first.chunks.every(c => c.modules.every(path => !path.includes("/experiments/authoring-market/") && !path.includes("/svelte-catalogue/"))));
  assert.ok(first.chunks.every(c => c.modules.every(path => !path.includes("node_modules/katex") && !path.endsWith("change-propagation/view.ts") && !path.includes("staged-preview"))), "Edition reading must not acquire editor capabilities");
  const total = [...first.files.values()].reduce((sum, bytes) => sum + gzipSync(bytes).length, 0);
  assert.ok(total <= 14000, `Unexpected edition reader closure: ${total} gzip bytes`);
});
