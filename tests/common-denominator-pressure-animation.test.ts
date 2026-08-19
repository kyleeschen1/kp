import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpCommonDenominatorPressureAnimationAsset,
  kpCommonDenominatorPressureAnimationId,
  kpCommonDenominatorPressureTimeline,
  sampleKpCommonDenominatorPressureTimeline
} from "../src/animation/common-denominator-pressure-exemplar.ts";
import {
  kpCanonicalCommonDenominatorPressureNativeEndpoints
} from "../src/rendering/common-denominator-pressure-native-endpoints.ts";
import {
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";

test("pressure caller is one stable native equation catalogue asset", () => {
  const asset = createKpCommonDenominatorPressureAnimationAsset();
  const catalogueMatches = createKpAnimationAssets().filter(({ id }) =>
    id === kpCommonDenominatorPressureAnimationId
  );

  assert.equal(catalogueMatches.length, 1);
  assert.equal(asset.renderTargets.length, 1);
  assert.equal(asset.renderTargets[0]?.kind, "equation");
  assert.equal(asset.timeline?.durationMs,
    kpCommonDenominatorPressureTimeline.durationMs);
  assert.deepEqual(asset.transformations.map(({ transformType }) =>
    transformType
  ), [
    "introduceUnitFactor",
    "alignCommonDenominator",
    "simplifyConstantProduct"
  ]);
  assert.equal(asset.metadata?.["settledEndpointAuthority"],
    "native-katex");
});

test("all four full-expression endpoints are native KaTeX with unique paint owners", () => {
  const endpoints = kpCanonicalCommonDenominatorPressureNativeEndpoints;

  assert.deepEqual(endpoints.map(({ kind, annotated }) => [
    kind,
    annotated.rawLatex
  ]), [
    ["problem", "\\frac{1}{3}+\\frac{1}{6}"],
    ["equivalence-source",
      "\\frac{2}{2}\\cdot\\frac{1}{3}+\\frac{1}{6}"],
    ["product", "\\frac{2\\cdot1}{2\\cdot3}+\\frac{1}{6}"],
    ["evaluated", "\\frac{2}{6}+\\frac{1}{6}"]
  ]);
  endpoints.forEach((endpoint) => {
    assert.match(endpoint.nativeHtmlAndMathml, /class="katex"/u);
    assert.equal(new Set(endpoint.nodes.map(({ occurrenceId }) =>
      occurrenceId
    )).size, endpoint.nodes.length);
    assert.equal(endpoint.nodes.filter(({ kind }) =>
      kind === "fraction-bar"
    ).length, endpoint.kind === "equivalence-source" ? 3 : 2);
  });
});

test("one reversible clock covers every segment without temporal padding", () => {
  assert.equal(kpCommonDenominatorPressureTimeline.segmentWeights.reduce(
    (sum, weight) => sum + weight,
    0
  ), 1);
  assert.deepEqual(sampleKpCommonDenominatorPressureTimeline(0), {
    segment: "stage-unit-factor",
    localProgress: 0
  });
  assert.deepEqual(sampleKpCommonDenominatorPressureTimeline(1), {
    segment: "evaluate-products",
    localProgress: 1
  });
  const samples = [0, 0.09, 0.23, 0.5, 0.74, 1];
  samples.forEach((visualProgress) => {
    const forward = sampleKpCommonDenominatorPressureTimeline(visualProgress);
    const rewind = sampleKpCommonDenominatorPressureTimeline(
      1 - (1 - visualProgress)
    );
    assert.equal(forward.segment, rewind.segment);
    assert.ok(Math.abs(forward.localProgress - rewind.localProgress) < 1e-12);
  });
});

test("the pressure caller resolves through its narrow native adapter", () => {
  const projection = projectKpEquationSurfaceFamily(
    kpCommonDenominatorPressureAnimationId
  );
  const capability =
    kpEditorSelectedSurfaceCapabilityDeclarationSet.find(
      "fraction-equivalence"
    );

  assert.equal(projection.rendererAdapterId,
    "editor-animation-surface.fraction-equivalence.common-denominator-pressure");
  assert.equal(projection.presentationRoute,
    "specialized-native-adapter");
  assert.equal(projection.genericLayerTransition, "forbidden");
  assert.ok(capability.adapterIds.includes(projection.rendererAdapterId));
});

test("the pressure adapter composes existing paint authorities", async () => {
  const source = await readFile(
    "src/editor/common-denominator-pressure-surface-adapter.ts",
    "utf8"
  );

  assert.match(source, /createKpFractionEquivalenceTransitSession/u);
  assert.match(source, /createKpCanonicalNativeKatexSceneSession/u);
  assert.match(source, /KpEditorAnimationPlayerState/u);
  assert.doesNotMatch(source,
    /requestAnimationFrame|setInterval|setTimeout|\.animate\(/u);
});
