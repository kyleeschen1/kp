import assert from "node:assert/strict";
import test from "node:test";
import { checkAlgebraEditionCosts, measureAlgebraEditions } from "../scripts/measure-algebra-editions.ts";

test("complete algebra edition and editor closures retain cost and authority limits", async () => {
  const report = await measureAlgebraEditions();
  checkAlgebraEditionCosts(report);
  assert.equal(report.editions.length, 4);
  assert.ok(report.consumers.every(c => c.chunks.length > 1));
  assert.ok(report.editions.every(e => e.files.some(f => f.path.endsWith(".woff2")) && e.files.some(f => f.path === "source.json")));
  const bloated = structuredClone(report); bloated.consumers[0]!.gzip = Infinity;
  assert.throws(() => checkAlgebraEditionCosts(bloated), /JavaScript exceeds/);
  const editor = structuredClone(report); editor.consumers[0]!.modules.push("src/authoring/algebra/session.ts");
  assert.throws(() => checkAlgebraEditionCosts(editor), /editor or fixture/);
  const assets = structuredClone(report); assets.editions[0]!.raw = Infinity;
  assert.throws(() => checkAlgebraEditionCosts(assets), /complete edition exceeds/);
});
