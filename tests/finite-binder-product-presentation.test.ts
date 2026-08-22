import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpFiniteProductExpansionExemplarAsset,
  kpFiniteProductExpansionExemplarId
} from "../src/animation/finite-product-expansion-exemplar.ts";
import {
  kpCanonicalFiniteProductExpansionPresentationPlan
} from "../src/animation/finite-product-expansion-presentation-plan.ts";
import { sampleKpFiniteProductExpansionMotion } from
  "../src/animation/finite-product-expansion-motion.ts";
import {
  isKpVerifiedFiniteProductEquivalenceFrame,
  kpFiniteProductEquivalenceFrame,
  kpFiniteProductEquivalenceFrameOccurrenceIds
} from "../src/semantic/finite-product-equivalence-frame.ts";
import { kpCanonicalFiniteProductNativeEndpoints } from
  "../src/rendering/finite-product-native-endpoints.ts";

test("product presentation retains source and equality around a distinct target", () => {
  const frame = kpFiniteProductEquivalenceFrame;
  assert.equal(isKpVerifiedFiniteProductEquivalenceFrame(frame), true);
  assert.equal(frame.projection.policy, "equivalence-frame");
  const [transition, settled] = frame.projection.paintFrames.slice(1);
  for (const paintFrame of [transition, settled]) {
    assert.ok(paintFrame?.claims.some(({ representationOccurrenceId }) =>
      representationOccurrenceId ===
        kpFiniteProductEquivalenceFrameOccurrenceIds.source
    ));
    assert.ok(paintFrame?.claims.some(({ representationOccurrenceId }) =>
      representationOccurrenceId ===
        kpFiniteProductEquivalenceFrameOccurrenceIds.relation
    ));
  }
});

test("product plan generates ordered adjacent factors without connector paint", () => {
  const plan = kpCanonicalFiniteProductExpansionPresentationPlan;
  assert.equal(plan.topology, "ordered-adjacent-factor-generation");
  assert.deepEqual(plan.factors.map(({ ordinal, valueSource }) => ({
    ordinal,
    valueSource
  })), [
    { ordinal: 0, valueSource: "lower-bound" },
    { ordinal: 1, valueSource: "range-successor" },
    { ordinal: 2, valueSource: "upper-bound" }
  ]);
  assert.ok(plan.factors.every((factor, ordinal) =>
    ordinal === 0 || factor.factorTransitWindow.start >
      plan.factors[ordinal - 1]!.factorTransitWindow.end
  ));
  assert.doesNotMatch(JSON.stringify(plan), /additive|plus|connectorId/u);
});

test("product motion is exact, reversible, and externally sampled", () => {
  const source = sampleKpFiniteProductExpansionMotion(0);
  const midpoint = sampleKpFiniteProductExpansionMotion(0.5);
  const target = sampleKpFiniteProductExpansionMotion(1);
  assert.equal(source.endpoint, "source");
  assert.equal(target.endpoint, "target");
  assert.ok(midpoint.factors[0]!.factorTransitProgress === 1);
  assert.ok(midpoint.factors[1]!.factorTransitProgress > 0);
  assert.ok(midpoint.factors[2]!.factorTransitProgress === 0);
  assert.deepEqual(sampleKpFiniteProductExpansionMotion(0.5), midpoint);
  assert.deepEqual(
    sampleKpFiniteProductExpansionMotion(0.49).factors.map(
      ({ factorTransitProgress }) => factorTransitProgress
    ),
    sampleKpFiniteProductExpansionMotion(0.49).factors.map(
      ({ factorTransitProgress }) => factorTransitProgress
    )
  );
});

test("native endpoints own product ink but not implicit adjacency paint", () => {
  const [source, target] = kpCanonicalFiniteProductNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\prod_{k=0}^{2} x_k");
  assert.equal(target.annotated.rawLatex, "x_0x_1x_2");
  assert.deepEqual(source.nodes.map(({ role }) => role), [
    "operator",
    "binder-declaration",
    "lower-bound",
    "upper-bound",
    "bound-reference",
    "body-template"
  ]);
  assert.deepEqual(target.nodes.map(({ role }) => role), [
    "instantiated-reference",
    "body-instance",
    "instantiated-reference",
    "body-instance",
    "instantiated-reference",
    "body-instance"
  ]);
  assert.doesNotMatch(target.annotated.annotatedLatex, /\\cdot|\\times/u);
});

test("product packages a framework-neutral asset with a distinct plan", () => {
  const asset = createKpFiniteProductExpansionExemplarAsset();
  assert.equal(asset.id, kpFiniteProductExpansionExemplarId);
  assert.deepEqual(asset.bundle.objects.map(({ value }) => value), [{
    latex: "\\prod_{k=0}^{2} x_k",
    stateKind: "source"
  }, {
    latex: "x_0x_1x_2",
    stateKind: "target"
  }]);
  assert.equal(asset.metadata?.["presentationPlanId"],
    "presentation.finite-product-expansion.canonical.v1");
  assert.equal(asset.metadata?.["maturity"], "product-pressure-candidate");
});

test("product presentation owns no sum choreography or private scheduler", async () => {
  const sources = await Promise.all([
    "src/animation/finite-product-expansion-presentation-plan.ts",
    "src/animation/finite-product-expansion-motion.ts",
    "src/rendering/finite-product-transit-session.ts",
    "src/editor/finite-product-surface-adapter.ts"
  ].map((path) => readFile(path, "utf8")));
  const joined = sources.join("\n");
  assert.doesNotMatch(joined, /from\s+["'][^"']*finite-sum/u);
  assert.doesNotMatch(joined,
    /requestAnimationFrame|setInterval|setTimeout|\.animate\(/u);
  assert.doesNotMatch(joined, /from\s+["']svelte|\.svelte["']/u);
});
