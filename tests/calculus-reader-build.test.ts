import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import { buildCalculusReader } from "../scripts/calculus-reader-build.ts";

test("the production calculus reader has a reproducible complete local closure", async () => {
  const first = await buildCalculusReader(), second = await buildCalculusReader();
  assert.deepEqual(first.files, second.files);
  const entry = first.chunks.find(c => c.entry)!;
  assert.equal(entry.file, "reader.js");
  assert.ok(entry.modules.some(path => path.includes("change-propagation/reader.ts")));
  assert.ok(first.chunks.every(c => c.modules.every(path => !path.includes("/experiments/authoring-market/") && !path.includes("/svelte-catalogue/"))));
  assert.ok(entry.modules.every(path => !path.includes("node_modules/katex")), "KaTeX editing must remain lazy");
  const total = [...first.files.values()].reduce((sum, bytes) => sum + gzipSync(bytes).length, 0);
  assert.ok(total < 150000, `Unexpected reader plus editing closure: ${total} gzip bytes`);
});
