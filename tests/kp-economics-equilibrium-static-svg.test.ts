import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpSupplyDemandEquilibriumFrame
} from "../domains/economics/supply-demand-equilibrium-frame.ts";
import {
  createKpSupplyDemandEquilibriumModel
} from "../domains/economics/supply-demand-equilibrium-model.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "../src/animation/economics-equilibrium-adapter.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport.ts";
import {
  kpEconomicsGraphPresentationProfile,
  renderKpEconomicsEquilibriumStaticContent
} from "../src/rendering/economics-equilibrium-svg.ts";

test("static economics SVG paints exact curves and initial equilibrium", () => {
  const model = createKpSupplyDemandEquilibriumModel();
  const frame = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: { numerator: "0", denominator: "1" }
  });
  const viewport = createKpEditorGraphSvgViewportModel(
    createEconomicsEquilibriumAnimationAsset(model)
  );
  const html = renderKpEconomicsEquilibriumStaticContent({ frame, viewport });

  assert.deepEqual(viewport, {
    width: 640,
    height: 420,
    xDomain: [0, 12],
    yDomain: [0, 20],
    xAxisY: 392,
    yAxisX: 36
  });
  assert.match(html, /data-kp-economics-supply-line/);
  assert.match(html, /data-kp-economics-demand-line/);
  assert.match(html, /data-kp-economics-equation="P=2\+Q"/);
  assert.match(html, /data-kp-economics-equation="P=14-Q"/);
  assert.match(html, /data-kp-economics-equilibrium-quantity="6"/);
  assert.match(html, /data-kp-economics-equilibrium-price="8"/);
  assert.equal(
    kpEconomicsGraphPresentationProfile.id,
    "kp.graph.dimensional-continuity.economics.v1"
  );
  assert.match(html, /data-kp-economics-math-label="axis-quantity"/);
  assert.match(html, /data-kp-economics-math-label="axis-price"/);
  assert.match(html, /data-kp-economics-math-label="curve-supply"/);
  assert.match(html, /data-kp-economics-math-label="curve-demand-current"/);
  assert.match(html, /data-kp-economics-math-label="equilibrium-current"/);
  assert.match(html, /data-kp-latex="D_0"/);
  assert.match(html, /data-kp-latex="E_0 = \(6\.00, 8\.00\)"/);
  assert.match(html, /data-kp-economics-display-precision="2"/);
  assert.match(html, /data-kp-economics-equilibrium-point[^>]*r="3"/);
  assert.match(
    html,
    /data-kp-economics-initial-equilibrium-reference[^>]*r="2\.75"/
  );
  assert.match(html, /data-kp-economics-grid-axis="quantity"/);
  assert.match(html, /data-kp-economics-grid-axis="price"/);
  assert.match(html, /data-kp-economics-tick-axis="quantity"/);
  assert.match(html, /data-kp-economics-tick-axis="price"/);
  assert.doesNotMatch(html, /<text\b/);
});

test("static economics SVG is deterministic for the same exact frame", () => {
  const model = createKpSupplyDemandEquilibriumModel();
  const frame = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: { numerator: "0", denominator: "1" }
  });
  const viewport = {
    width: 640,
    height: 420,
    xDomain: [0, 12] as const,
    yDomain: [0, 20] as const
  };

  assert.equal(
    renderKpEconomicsEquilibriumStaticContent({ frame, viewport }),
    renderKpEconomicsEquilibriumStaticContent({ frame, viewport })
  );
});
