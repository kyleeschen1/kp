import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpFiniteSumExpansionExemplarAsset,
  kpFiniteSumExpansionExemplarId
} from "../src/animation/finite-sum-expansion-exemplar.ts";
import {
  kpCanonicalFiniteSumExpansionOperation
} from "../src/semantic/canonical-finite-sum-expansion.ts";

test("finite sum packages one framework-neutral semantic asset", () => {
  const asset = createKpFiniteSumExpansionExemplarAsset();
  assert.equal(asset.id, kpFiniteSumExpansionExemplarId);
  assert.equal(asset.bundle.objects.length, 2);
  assert.deepEqual(asset.bundle.objects.map(({ value }) => value), [{
    latex: "\\sum_{i=1}^{3} a_i",
    stateKind: "source"
  }, {
    latex: "a_1+a_2+a_3",
    stateKind: "target"
  }]);
  assert.equal(asset.timeline?.durationMs, 6_000);
  assert.equal(asset.metadata?.["presentationPlanId"],
    "presentation.finite-sum-expansion.canonical.v1");
  assert.equal(asset.metadata?.["maturity"], "candidate-local-exemplar");
});

test("asset correspondence preserves derivation without cloning identity", () => {
  const asset = createKpFiniteSumExpansionExemplarAsset();
  const records = asset.transformations[0]!.correspondenceMap!.records;
  const operation = kpCanonicalFiniteSumExpansionOperation;
  assert.deepEqual(records.map(({ relation }) => relation), [
    "fan-out", "fan-out", "fan-out"
  ]);
  assert.deepEqual(records[0]!.targetSelectorIds,
    operation.target.instances.map(({ id }) => id));
  assert.equal(asset.transformations[0]!.correspondence.some(
    ({ preserves }) => preserves.includes("identity")
  ), false);
});

test("narrow adapter delegates clocks paint and settlement", async () => {
  const [adapter, transit] = await Promise.all([
    readFile("src/editor/finite-sum-surface-adapter.ts", "utf8"),
    readFile("src/rendering/finite-sum-transit-session.ts", "utf8")
  ]);
  assert.match(adapter, /settleAndObserveKpFiniteSumNativeEndpoint/u);
  assert.match(adapter, /createKpFiniteSumTransitSession/u);
  assert.match(transit, /compileKpCanonicalNativeKatexScenePlan/u);
  assert.match(transit, /sampleKpFiniteSumExpansionMotion/u);
  assert.doesNotMatch(`${adapter}\n${transit}`,
    /requestAnimationFrame|setInterval|setTimeout|\.animate\(/u);
  assert.doesNotMatch(`${adapter}\n${transit}`,
    /from\s+["']svelte|\.svelte["']/u);
});
