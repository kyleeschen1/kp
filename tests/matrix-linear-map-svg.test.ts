import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame
} from "../src/animation/matrix-linear-map-frame.ts";
import {
  kpMatrixLinearMapGraphPresentationProfile,
  renderKpMatrixLinearMapRuntimeContent
} from "../src/rendering/matrix-linear-map-svg.ts";

const animation = createKpAnimationAssets().find((candidate) =>
  candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const plan = createKpMatrixLinearMapPlan(animation);
const viewport = {
  width: 520,
  height: 360,
  xDomain: [-2, 16] as const,
  yDomain: [-2, 16] as const
};

test("matrix map SVG uses the shared dimensional-continuity language", () => {
  assert.equal(
    kpMatrixLinearMapGraphPresentationProfile.languageId,
    "kp.graph.dimensional-continuity.v1"
  );
  const html = renderKpMatrixLinearMapRuntimeContent({
    frame: sampleKpMatrixLinearMapFrame({
      plan,
      progress: 0.52,
      direction: "forward",
      accessibilityMode: "full-motion"
    }),
    viewport
  });
  assert.match(html, /data-kp-matrix-linear-map-view/);
  assert.match(html, /data-kp-matrix-linear-map-grid-progress="0"/);
  assert.match(html, /data-kp-matrix-linear-map-nonvisual-summary/);
  assert.match(html, /data-kp-matrix-linear-map-plot-top="72"/);
  assert.match(html, /data-kp-matrix-linear-map-reference-grid="x\.0"[^>]+y1="72"/);
  assert.equal((html.match(/data-kp-matrix-linear-map-grid-line=/g) ?? []).length, 12);
  assert.doesNotMatch(html, /katex-display/);
});

test("settled SVG paints exact mapped bases and output without deriving values", () => {
  const html = renderKpMatrixLinearMapRuntimeContent({
    frame: sampleKpMatrixLinearMapFrame({
      plan,
      progress: 1,
      direction: "forward",
      accessibilityMode: "full-motion"
    }),
    viewport
  });
  assert.match(html, /data-kp-matrix-linear-map-output-coordinates="13,15"/);
  assert.match(html, /data-kp-matrix-linear-map-current-coordinates="13,15"/);
  assert.match(html, /data-kp-matrix-linear-map-basis="0"/);
  assert.match(html, /data-kp-matrix-linear-map-basis="1"/);
  assert.match(html, /T_A/);
  assert.match(html, /A\\mathbf v/);
});
