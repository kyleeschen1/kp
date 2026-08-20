import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogarithmChangeOfBaseExemplarAsset,
  kpLogarithmChangeOfBaseExemplarId
} from "../src/animation/logarithm-change-of-base-exemplar.ts";
import {
  loadKpAnimationAsset,
  kpAnimationCatalogPackId
} from "../src/animation/catalog-loader.ts";
import {
  kpCanonicalLogarithmChangeOfBasePresentationPlan
} from "../src/animation/logarithm-change-of-base-presentation-plan.ts";
import {
  createKpLogarithmChangeOfBaseNativeEndpoints,
  kpCanonicalLogarithmChangeOfBaseNativeEndpoints
} from "../src/rendering/logarithm-change-of-base-native-endpoints.ts";
import {
  kpLogarithmChangeOfBaseCorpus
} from "../src/semantic/logarithm-change-of-base-corpus.ts";
import {
  verifyKpLogarithmChangeOfBase
} from "../src/semantic/logarithm-change-of-base.ts";
import {
  kpLogarithmChangeOfBaseExemplarTiming
} from "../src/rendering/logarithm-change-of-base-transit-session.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";
import {
  readKpAnimationCatalogueRoute,
  writeKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";

test("change-of-base exemplar binds exact semantic and presentation authority", () => {
  const asset = createKpLogarithmChangeOfBaseExemplarAsset();
  const transformation = asset.transformations[0]!;
  assert.equal(asset.id, kpLogarithmChangeOfBaseExemplarId);
  assert.equal(
    asset.metadata?.["presentationPlanId"],
    kpCanonicalLogarithmChangeOfBasePresentationPlan.id
  );
  assert.deepEqual(transformation.sourceObjectIds,
    ["state.logarithm.change-base.source"]);
  assert.deepEqual(transformation.targetObjectIds,
    ["state.logarithm.change-base.target"]);
  assert.deepEqual(
    transformation.correspondenceMap?.records.map(({ id, relation }) => ({
      id,
      relation
    })),
    [{
      id: "correspondence.change-of-base.argument",
      relation: "identity"
    }, {
      id: "correspondence.change-of-base.base",
      relation: "identity"
    }, {
      id: "correspondence.change-of-base.operators",
      relation: "fan-out"
    }, {
      id: "correspondence.change-of-base.division",
      relation: "introduction"
    }]
  );
});

test("native endpoints preserve argument and base while owning target syntax", () => {
  const [source, target] = kpCanonicalLogarithmChangeOfBaseNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\log_{2} 7");
  assert.equal(target.annotated.rawLatex, "\\frac{\\ln 7}{\\ln 2}");
  assert.equal(source.nodes.some(({ occurrenceId }) =>
    occurrenceId === "source.log-base-two.argument-seven"), true);
  assert.equal(target.nodes.some(({ occurrenceId }) =>
    occurrenceId === "target.numerator.argument-seven"), true);
  assert.equal(target.nodes.some(({ occurrenceId }) =>
    occurrenceId === "target.denominator.argument-two"), true);
  assert.equal(target.nodes.filter(({ kind }) => kind === "operator").length, 2);
  assert.equal(source.nodes.filter(({ kind }) => kind === "delimiter").length, 0);
  assert.equal(target.nodes.filter(({ kind }) => kind === "delimiter").length, 0);
  assert.equal(target.nodes.filter(({ kind }) => kind === "fraction-bar").length, 1);
  assert.match(target.nativeHtmlAndMathml, /frac-line/);
});

test("native endpoint factory preserves multi-glyph scalar identity", () => {
  const fixture = kpLogarithmChangeOfBaseCorpus.cases.find(({ id }) =>
    id.endsWith("ten-hundred"));
  assert.ok(fixture);
  const [source, target] = createKpLogarithmChangeOfBaseNativeEndpoints(
    verifyKpLogarithmChangeOfBase(fixture.draft)
  );
  assert.equal(source.annotated.rawLatex, "\\log_{10} 100");
  assert.equal(target.annotated.rawLatex, "\\frac{\\ln 100}{\\ln 10}");
  assert.equal(source.nodes.find(({ kind }) => kind === "base")?.semanticId,
    target.nodes.find(({ kind }) => kind === "base")?.semanticId);
});

test("exemplar timing orders continuants fraction and function reception", () => {
  assert.ok(kpLogarithmChangeOfBaseExemplarTiming.sourceOperatorRelease.end <=
    kpLogarithmChangeOfBaseExemplarTiming.argumentReflow.start);
  assert.ok(kpLogarithmChangeOfBaseExemplarTiming.argumentReflow.start <
    kpLogarithmChangeOfBaseExemplarTiming.fractionRuleEntry.start);
  assert.ok(kpLogarithmChangeOfBaseExemplarTiming.fractionRuleEntry.start <
    kpLogarithmChangeOfBaseExemplarTiming.wrapperEntry.start);
  assert.equal(kpLogarithmChangeOfBaseExemplarTiming.argumentReflow.end,
    kpLogarithmChangeOfBaseExemplarTiming.fractionRuleEntry.end);
  assert.equal(kpLogarithmChangeOfBaseExemplarTiming.fractionRuleEntry.end,
    kpLogarithmChangeOfBaseExemplarTiming.wrapperEntry.end);
});

test("catalogue route and lazy pack resolve the exact exemplar", async () => {
  const loaded = await loadKpAnimationAsset(kpLogarithmChangeOfBaseExemplarId);
  assert.equal(kpAnimationCatalogPackId(kpLogarithmChangeOfBaseExemplarId),
    "algebra");
  assert.equal(loaded.animation.id, kpLogarithmChangeOfBaseExemplarId);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: kpLogarithmChangeOfBaseExemplarId,
    slotKinds: ["equation"]
  }), ["logarithm-change-of-base"]);
  const search = writeKpAnimationCatalogueRoute("", {
    artifactId: kpLogarithmChangeOfBaseExemplarId,
    playhead: 0.625
  });
  assert.deepEqual(readKpAnimationCatalogueRoute(search), {
    active: true,
    source: "default",
    artifactId: kpLogarithmChangeOfBaseExemplarId,
    playhead: 0.63
  });
});
