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
  assert.match(html, />E · Q=6, P=8<\/text>/);
  assert.match(html, /data-kp-economics-quantity-axis-label[^>]*>Q<\/text>/);
  assert.match(html, /data-kp-economics-price-axis-label[^>]*>P<\/text>/);
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

