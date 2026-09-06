import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { createKpAuthoringMarketRevisionReceiver, type KpAuthoringMarketBuildRevision } from "../src/experiments/authoring-market/authoring-market-preview-protocol.ts";

const data = buildKpAuthoringMarketPreview();
const revision = (sequence: number): KpAuthoringMarketBuildRevision => ({
  schemaVersion: "kp.authoring-market-build.v1", sequence, sourceRevision: `source.${sequence}`,
  sourcePaths: ["local-model.ts", "local-article.ts"], status: "valid", preview: data
});

test("data-only build reconstructs exact local capabilities and rejects mixed model authority", () => {
  const copy = JSON.parse(JSON.stringify(data));
  const prepared = prepareKpAuthoringMarketPreview(copy);
  assert.equal(prepared.facts.text("after.revenue"), "12");
  assert.equal(prepared.companion.modelRevisionId, data.article.modelRevisionId);
  copy.parameters.taxAmount.numerator = "2";
  assert.throws(() => prepareKpAuthoringMarketPreview(copy), /one explicit revision/);
  delete copy.parameters;
  assert.throws(() => prepareKpAuthoringMarketPreview(copy), /requires explicit demand and tax/);
});

test("out-of-order preparation cannot replace newer preview or revive after disposal", async () => {
  const pending: ((value: number) => void)[] = [];
  const committed: number[] = [];
  const reports: KpAuthoringMarketBuildRevision[] = [];
  const receiver = createKpAuthoringMarketRevisionReceiver({
    prepare: () => new Promise<number>(resolve => pending.push(resolve)),
    commit: value => { committed.push(value); }, report: value => { reports.push(value); }
  });
  const first = receiver.receive(revision(1));
  const second = receiver.receive(revision(2));
  pending[1]!(2); await second;
  pending[0]!(1); await first;
  assert.deepEqual(committed, [2]);
  await receiver.receive({ ...revision(3), status: "invalid", diagnostic: { code: "kp.authoring.market-build-gap", message: "bad source" } });
  await receiver.receive(revision(2));
  assert.deepEqual(committed, [2]);
  assert.equal(reports.at(-1)!.status, "invalid");
  const fourth = receiver.receive(revision(4));
  receiver.dispose(); pending[2]!(4); await fourth;
  assert.deepEqual(committed, [2]);
});

test("preparation and mounting failures report the source revision without retiring valid preview", async () => {
  let active = 0;
  const reports: KpAuthoringMarketBuildRevision[] = [];
  const receiver = createKpAuthoringMarketRevisionReceiver({
    prepare: prepareKpAuthoringMarketPreview,
    commit: (_value, event) => { if (event.sequence === 3) throw new Error("mount failed"); active = event.sequence; },
    report: value => { reports.push(value); }
  });
  await receiver.receive(revision(1));
  await receiver.receive({ ...revision(2), preview: { ...data, article: { ...data.article, text: "invalid" } } });
  assert.equal(active, 1);
  assert.equal(reports.at(-1)!.sourceRevision, "source.2");
  assert.equal(reports.at(-1)!.status, "invalid");
  await receiver.receive(revision(3));
  assert.equal(active, 1);
  assert.match(reports.at(-1)!.diagnostic!.message, /mount failed/);
});

test("browser entry consumes revision data without importing trusted author-source modules", () => {
  for (const path of ["authoring-market-page", "authoring-market-host", "authoring-market-preview-prepare"]) {
    const source = readFileSync(new URL(`../src/experiments/authoring-market/${path}.ts`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /from ["']\.\/authoring-market-(?:model-source|article-source|preview-build)/);
    assert.doesNotMatch(source, /eval\(|new Function|writeFile/);
  }
});
