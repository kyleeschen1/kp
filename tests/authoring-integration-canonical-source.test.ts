import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createKpCanonicalTaxReaderSource } from "../src/tutorial/kinetic-figure-supply-tax/canonical-tax-source.ts";
import { sampleKpEconomicsSupplyTaxAnimationFrame } from "../src/animation/economics-supply-tax-asset.ts";
import { prepareKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketFrameSession } from "../src/tutorial/authoring-market/authoring-market-frame.ts";

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

test("canonical and preview share reference evaluation without sharing revision lifetimes", () => {
  const canonical = createKpCanonicalTaxReaderSource();
  const reference = prepareKpAuthoringMarketPreview(buildKpAuthoringMarketPreview("reference"));
  const preview = createKpAuthoringMarketFrameSession(reference.authored, { cacheCapacity: 1 });
  const variation = prepareKpAuthoringMarketPreview(buildKpAuthoringMarketPreview("variation"));
  const changed = createKpAuthoringMarketFrameSession(variation.authored, { cacheCapacity: 1 });
  try {
    assert.notEqual(reference.authored.source.authority, canonical.prepared.authored.source.authority);
    assert.equal(reference.facts.modelRevisionId, canonical.prepared.facts.modelRevisionId);
    assert.notEqual(variation.facts.modelRevisionId, canonical.prepared.facts.modelRevisionId);
    const retained = canonical.source.sampleFrame(.371);
    for (const progress of [0, .371, 1, .8, 0]) {
      assert.deepEqual(preview.sample(progress).frame, canonical.source.sampleFrame(progress));
      changed.sample(1 - progress);
    }
    preview.dispose();
    changed.reset();
    const invalid = buildKpAuthoringMarketPreview("reference");
    assert.throws(() => prepareKpAuthoringMarketPreview({ ...invalid,
      article: { ...invalid.article, text: invalid.article.text.replace("kp-ref:tax-market/tax", "kp-ref:tax-market/missing") } }));
    assert.deepEqual(canonical.source.sampleFrame(.371), retained);
    assert.equal(canonical.frames.history.snapshots.length, 3);
    assert.throws(() => preview.sample(.371), /disposed/);
  } finally { preview.dispose(); changed.dispose(); canonical.dispose(); }
});
