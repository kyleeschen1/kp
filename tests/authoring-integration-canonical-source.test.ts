import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createKpCanonicalTaxReaderSource } from "../src/tutorial/kinetic-figure-supply-tax/canonical-tax-source.ts";
import { sampleKpEconomicsSupplyTaxAnimationFrame } from "../src/animation/economics-supply-tax-asset.ts";

test("canonical reader source owns one query session and matches exact domain sampling", () => {
  const reader = createKpCanonicalTaxReaderSource();
  assert.equal(reader.source.authority, reader.source.instruction.authority);
  assert.equal(reader.source.exactLabels, false);
  for (const progress of [0, .1, .371, .8, 1, .371, 0]) {
    const frame = reader.source.sampleFrame(progress);
    assert.deepEqual(frame, sampleKpEconomicsSupplyTaxAnimationFrame({ asset: reader.source.authority, progress: frame.modelProgress }));
  }
  const frame = reader.source.sampleFrame(.371);
  reader.frames.reset();
  assert.deepEqual(reader.source.sampleFrame(.371), frame);
  assert.equal(reader.frames.history.snapshots.length, 3);
  reader.dispose(); reader.dispose();
  assert.throws(() => reader.source.sampleFrame(.5), /disposed/);
});

test("canonical reader source does not call a second sampler or preview service", () => {
  const source = readFileSync(new URL("../src/tutorial/kinetic-figure-supply-tax/canonical-tax-source.ts", import.meta.url), "utf8");
  assert.equal(source.match(/createKpAuthoringMarketFrameSession\(/g)?.length, 1);
  assert.equal(source.match(/frames\.sample\(/g)?.length, 1);
  assert.doesNotMatch(source, /sampleKpEconomics|sampleKpPerUnitTax|fetch\(|preview-build|article-source|model-source|requestAnimationFrame/);
});
