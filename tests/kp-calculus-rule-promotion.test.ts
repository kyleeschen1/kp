import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  auditKpCalculusRulePromotion,
  kpPromotedCalculusRuleAnimationIds
} from "../src/animation/calculus-rule-promotion.ts";
import {
  createKpCalculusRuleChoreography
} from "../src/animation/calculus-rule-choreography.ts";
import {
  createKpEditorAnimationGestaltInspection
} from "../src/editor/animation-gestalt-inspector.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import { createKpEditorAnimationPlayerState } from "../src/editor/animation-player-state.ts";

const catalog = createKpAnimationAssets();

test("calculus rule cohort reports unpromoted semantic reduction steps", () => {
  assert.deepEqual(auditKpCalculusRulePromotion(catalog), {
    kind: "calculus-rule-promotion-report",
    status: "blocked",
    animationIds: [...kpPromotedCalculusRuleAnimationIds],
    transformationCount: 6,
    gaps: [
      "Transformation transform.generated.calculus.derivative.power-rule-x-cubed.evaluate-exponent-decrement is not a promoted calculus rule step."
    ]
  });
});

test("every multi-step calculus rule exposes its choreography inspector contract", () => {
  const library = createKpEditorAnimationLibrary();
  for (const animationId of kpPromotedCalculusRuleAnimationIds.slice(1)) {
    const animation = catalog.find((candidate) => candidate.id === animationId)!;
    const descriptor = library.find((candidate) => candidate.animationId === animationId)!;
    for (const progress of [0.25, 0.75]) {
      const state = createKpEditorAnimationPlayerState({
        descriptor,
        animation,
        catalog,
        progress,
        playbackStatus: "paused"
      });
      const transformationId = state.runtimeFrame.activeTransformationIds[0]!;
      const choreography = createKpCalculusRuleChoreography({
        animation,
        transformationId
      });
      const inspection = createKpEditorAnimationGestaltInspection({
        animation,
        state
      });
      assert.match(choreography.plan.id, /^choreography\./);
      assert.notEqual(inspection.envelopePhaseLabel, "unavailable");
      assert.notEqual(inspection.salienceLabel, "unavailable");
      assert.notEqual(inspection.traversalLabel, "unavailable");
      assert.ok(!inspection.warnings.some((warning) =>
        warning.includes("not yet been migrated")
      ));
    }
  }
});
