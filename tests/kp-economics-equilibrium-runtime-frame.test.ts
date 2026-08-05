import assert from "node:assert/strict";
import test from "node:test";

import {
  createEconomicsEquilibriumAnimationAsset
} from "../src/animation/economics-equilibrium-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../src/animation/economics-equilibrium-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation
} from "../src/editor/economics-equilibrium-parameters.ts";
import {
  renderKpEconomicsEquilibriumRuntimeContent
} from "../src/rendering/economics-equilibrium-svg.ts";

test("economics runtime choreography holds, shifts, hands off, and settles", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const sample = (progress: number) => sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
  });
  const establish = sample(0.1);
  const shiftMidpoint = sample(0.44);
  const handoff = sample(0.8);
  const settle = sample(1);

  assert.deepEqual(
    [establish.stage, shiftMidpoint.stage, handoff.stage, settle.stage],
    ["establish", "shift", "handoff", "settle"]
  );
  assert.deepEqual(establish.semanticFrame.equilibrium.quantity, {
    numerator: "6",
    denominator: "1"
  });
  assert.equal(shiftMidpoint.modelProgress, 0.5);
  assert.deepEqual(shiftMidpoint.semanticFrame.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    quantity: { numerator: "7", denominator: "1" },
    price: { numerator: "9", denominator: "1" }
  });
  assert.deepEqual(handoff.semanticFrame.equilibrium, settle.semanticFrame.equilibrium);
  assert.ok(handoff.initialEquilibriumReferenceOpacity > settle.initialEquilibriumReferenceOpacity);
});

test("economics runtime choreography has forward and rewind visual symmetry", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();

  for (const progress of [0, 0.1, 0.44, 0.8, 1]) {
    const forward = sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        direction: "forward",
        progress
      })
    });
    const rewind = sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        direction: "rewind",
        progress: 1 - progress
      })
    });

    assert.equal(rewind.stage, forward.stage);
    assert.equal(rewind.modelProgress, forward.modelProgress);
    assert.deepEqual(rewind.semanticFrame.equilibrium, forward.semanticFrame.equilibrium);
    assert.equal(
      rewind.initialEquilibriumReferenceOpacity,
      forward.initialEquilibriumReferenceOpacity
    );
  }
});

test("bounded economics variants preserve dense direct-seek and rewind truth", () => {
  for (const demandIntercept of [15, 18, 20]) {
    const animation = createParameterizedEconomicsEquilibriumAnimation(
      createKpEconomicsEquilibriumParameterState(demandIntercept)
    ).animation;

    for (let index = 0; index <= 100; index += 1) {
      const progress = index / 100;
      const forward = sampleKpEconomicsEquilibriumRuntimeFrame({
        animation,
        runtimeFrame: sampleKpAnimationRuntimeFrame({
          animation,
          direction: "forward",
          progress
        })
      });
      const rewind = sampleKpEconomicsEquilibriumRuntimeFrame({
        animation,
        runtimeFrame: sampleKpAnimationRuntimeFrame({
          animation,
          direction: "rewind",
          progress: 1 - progress
        })
      });

      assert.equal(rewind.presentationProgress, forward.presentationProgress);
      assert.equal(rewind.stage, forward.stage);
      assert.equal(rewind.modelProgress, forward.modelProgress);
      assert.deepEqual(rewind.semanticFrame, forward.semanticFrame);
      assert.equal(
        rewind.initialDemandReferenceOpacity,
        forward.initialDemandReferenceOpacity
      );
      assert.equal(
        rewind.initialEquilibriumReferenceOpacity,
        forward.initialEquilibriumReferenceOpacity
      );
    }
  }
});

test("runtime SVG shows the moving demand and old-equilibrium handoff", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const frame = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.44 })
  });
  const html = renderKpEconomicsEquilibriumRuntimeContent({
    frame,
    viewport: createKpEditorGraphSvgViewportModel(animation)
  });

  assert.match(html, /data-kp-economics-choreography-stage="shift"/);
  assert.match(html, /data-kp-economics-demand-intercept="16"/);
  assert.match(html, /data-kp-economics-equilibrium-quantity="7"/);
  assert.match(html, /data-kp-economics-equilibrium-price="9"/);
  assert.match(html, /data-kp-economics-initial-demand-reference/);
  assert.match(html, /data-kp-economics-initial-equilibrium-reference/);
  assert.match(html, /data-kp-economics-initial-equilibrium-guides/);
  assert.match(html, /data-kp-economics-initial-equilibrium-quantity-guide/);
  assert.match(html, /data-kp-economics-initial-equilibrium-quantity-guide-core/);
  assert.match(html, /data-kp-economics-initial-equilibrium-price-guide/);
  assert.match(html, /data-kp-economics-initial-equilibrium-price-guide-core/);
  assert.match(
    html,
    /data-kp-economics-supply-movement[^>]*data-kp-economics-supply-equation="P=2\+Q"/
  );
  assert.match(html, /data-kp-economics-movement-from-quantity="6"/);
  assert.match(html, /data-kp-economics-movement-from-price="8"/);
  assert.match(html, /data-kp-economics-supply-movement-trace/);
  assert.match(
    html,
    /<desc id="kp-economics-graph-description" data-kp-economics-nonvisual-summary>/
  );
});
