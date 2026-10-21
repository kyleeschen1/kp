import assert from "node:assert/strict";
import test from "node:test";
import { measureCalculusEditions, checkCalculusCosts } from "../scripts/measure-calculus-editions.ts";

test("complete independent calculus consumers retain bounded costs and reader authority", async () => {
  const report = await measureCalculusEditions(); checkCalculusCosts(report);
  assert.deepEqual(report.consumers.map(c => c.mode), ["edition", "editor"]);
  assert.equal(report.editions.length, 2);
  const reader = report.consumers[0]!, editor = report.consumers[1]!;
  assert.ok(editor.modules.some(path => path.includes("node_modules/katex")));
  assert.ok(!reader.modules.some(path => path.includes("node_modules/katex") || path.endsWith("change-propagation/view.ts")));
  assert.ok(editor.chunks.length > 1, "Editing remains a measured lazy capability");
  assert.throws(() => checkCalculusCosts({ ...report, consumers: report.consumers.map(c => ({ ...c, gzip: 200000 })) }), /exceeds budget/);
  assert.throws(() => checkCalculusCosts({ ...report, editions: report.editions.map(e => ({ ...e, raw: 2000000 })) }), /exceeds budget/);
});
