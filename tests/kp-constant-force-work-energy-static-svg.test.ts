import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpConstantForceWorkEnergyFrame
} from "../domains/physics/constant-force-work-energy-frame.ts";
import {
  createKpConstantForceWorkEnergyModel
} from "../domains/physics/constant-force-work-energy-model.ts";
import {
  createConstantForceWorkEnergyAnimationAsset
} from "../src/animation/constant-force-work-energy-adapter.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../src/animation/constant-force-work-energy-runtime-frame.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport.ts";
import {
  kpPhysicsGraphPresentationProfile,
  renderKpConstantForceWorkEnergyRuntimeContent,
  renderKpConstantForceWorkEnergyStaticContent
} from "../src/rendering/constant-force-work-energy-svg.ts";

test("static physics SVG paints one exact graph-diagram composition", () => {
  const model = createKpConstantForceWorkEnergyModel();
  const animation = createConstantForceWorkEnergyAnimationAsset(model);
  const frame = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: { numerator: "0", denominator: "1" }
  });
  const viewport = createKpEditorGraphSvgViewportModel(animation);
  const html = renderKpConstantForceWorkEnergyStaticContent({
    frame,
    viewport
  });

  assert.deepEqual(viewport, {
    width: 720,
    height: 420,
    xDomain: [0, 5],
    yDomain: [0, 6],
    xAxisY: 392,
    yAxisX: 36
  });
  assert.equal(
    kpPhysicsGraphPresentationProfile.id,
    "kp.graph.dimensional-continuity.physics.v1"
  );
  assert.match(html, /data-kp-physics-work-energy-view/);
  assert.match(html, /data-kp-physics-constant-force-line/);
  assert.match(html, /data-kp-physics-work-area="0"/);
  assert.match(html, /data-kp-physics-object-position="0"/);
  assert.match(html, /data-kp-physics-net-force-arrow="3"/);
  assert.match(html, /data-kp-physics-energy-total="4"/);
  assert.match(html, /data-kp-physics-math-label="axis-position"/);
  assert.match(html, /data-kp-physics-math-label="axis-force"/);
  assert.match(html, /data-kp-latex="F_x = 3\\,\\mathrm\{N\}"/);
  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /<text\b/);
});

test("runtime physics SVG synchronizes area, object, energy, and KaTeX", () => {
  const animation = createConstantForceWorkEnergyAnimationAsset();
  const frame = sampleKpConstantForceWorkEnergyRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.46
    })
  });
  const html = renderKpConstantForceWorkEnergyRuntimeContent({
    frame,
    viewport: createKpEditorGraphSvgViewportModel(animation)
  });

  assert.match(html, /data-kp-physics-choreography-stage="accumulate"/);
  assert.match(html, /data-kp-physics-work-area="6"/);
  assert.match(html, /data-kp-physics-object-position="2"/);
  assert.match(html, /data-kp-physics-energy-total="10"/);
  assert.match(html, /data-kp-physics-synchronized-view/);
  assert.match(html, /data-kp-physics-equation-role="work"/);
  assert.match(html, /data-kp-latex="W_\{\\mathrm\{net\}\} = F_x\\Delta x \\approx 6\.00\\,\\mathrm\{J\}"/);
  assert.match(html, /data-kp-physics-nonvisual-summary/);
  assert.match(html, /data-kp-physics-narrative-id="narrative\.physics\.accumulate-work"/);
});

test("physics SVG output is deterministic for the same exact frame", () => {
  const model = createKpConstantForceWorkEnergyModel();
  const frame = sampleKpConstantForceWorkEnergyFrame({
    model,
    progress: { numerator: "1", denominator: "2" }
  });
  const viewport = {
    width: 720,
    height: 420,
    xDomain: [0, 5] as const,
    yDomain: [0, 6] as const
  };

  assert.equal(
    renderKpConstantForceWorkEnergyStaticContent({ frame, viewport }),
    renderKpConstantForceWorkEnergyStaticContent({ frame, viewport })
  );
});
