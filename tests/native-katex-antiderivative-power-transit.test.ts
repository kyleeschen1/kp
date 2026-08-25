import assert from "node:assert/strict";
import test from "node:test";

import { createGeneratedProblemAnimationAssets } from
  "../src/animation/catalog.ts";
import {
  createKpAntiderivativePowerNativeKatexTransitPlan,
  kpAntiderivativePowerNativeKatexTransitMechanismId
} from "../src/rendering/native-katex-antiderivative-power-transit.ts";
import {
  kpAntiderivativeTemplateInstantiationProfileId
} from "../src/rendering/native-katex-antiderivative-template-instantiation.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";

function plan() {
  const animation = createGeneratedProblemAnimationAssets().find(({ id }) =>
    id === "animation.generated.calculus.integral.power-rule-quadratic"
  );
  assert.ok(animation);
  return createKpAntiderivativePowerNativeKatexTransitPlan(animation);
}

test("integration transit binds persistence and fan-out without minting paint policy", () => {
  const transit = plan();
  assert.equal(
    transit.mechanismId,
    kpAntiderivativePowerNativeKatexTransitMechanismId
  );
  assert.equal(
    transit.templateInstantiationProfileId,
    kpAntiderivativeTemplateInstantiationProfileId
  );
  assert.deepEqual(transit.semanticPaintRelations.map((relation) =>
    relation.relation), ["persist", "split"]);
  assert.deepEqual(transit.semanticPaintRelations[0]?.sourceEntityIds.map(
    (id) => id.split(".").at(-1)
  ), ["base"]);
  assert.deepEqual(transit.semanticPaintRelations[1]?.targetEntityIds.map(
    (id) => id.split(".").at(-1)
  ), ["numerator-exponent", "denominator-exponent"]);
  assert.doesNotMatch(
    JSON.stringify(transit),
    /"(?:left|top|width|height|translate|duration|easing)"/u
  );
});

test("integration transit requires both introduced successors fraction and plus C", () => {
  const transit = plan();
  assert.deepEqual(transit.introducedTargetSemanticEntityIds.map((id) =>
    id.split(".").at(-1)), [
    "numerator-successor-operator",
    "numerator-increment",
    "denominator-successor-operator",
    "denominator-increment",
    "connector",
    "constant",
    "exact-quotient"
  ]);
  assert.equal(new Set(transit.requiredTargetSemanticEntityIds).size, 10);
  assert.equal(transit.requiredSourceSemanticEntityIds.length, 5);
});

test("prospective template presence outranks copy-fan-out introduction defaults", () => {
  const rect = Object.freeze({ left: 20, top: 10, width: 8, height: 12 });
  const [frame] = sampleKpNativeKatexSceneTrackFrames([{
    id: "track.template.fixed-syntax",
    componentId: "component.template.fixed-syntax",
    lifecycle: "introduce" as const,
    targetAtomId: "atom.template.fixed-syntax",
    visualAtomId: "atom.template.fixed-syntax",
    paintKind: "glyph" as const,
    sizingMode: "rect" as const,
    startRect: Object.freeze({ ...rect, left: 44 }),
    endRect: rect,
    startPaintRect: Object.freeze({ ...rect, left: 44 }),
    endPaintRect: rect,
    startOpacity: 0 as const,
    endOpacity: 1 as const,
    opacityScheduleAuthority: "semantic-choreography" as const,
    sampleProgress: () => 0,
    sampleOpacityProgress: () => 0.76,
    samplePaintPresence: () => 1
  }], 0.25, true);
  assert.ok(frame);
  assert.equal(frame.opacity, 0.76);
  assert.equal(frame.rect.left, 44);
});
