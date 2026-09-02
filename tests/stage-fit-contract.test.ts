import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpStageFitObservation,
  createKpStageFitContract
} from "../src/rendering/stage-fit-contract.ts";

const contract = createKpStageFitContract({
  id: "fit-contract.test.v1",
  geometryPolicy: "swept-contain",
  cropPolicy: "forbid",
  passageOverflowPolicy: "typed-repair",
  safeInsets: { top: 10, right: 10, bottom: 10, left: 10 },
  readability: { minimumPassageTextPx: 15, minimumMathTextPx: 10 }
});

test("stage fit accepts contained geometry and readable passages", () => {
  assert.deepEqual(checkKpStageFitObservation({
    contract,
    observation: {
      stageRect: { left: 0, top: 0, width: 320, height: 240 },
      requiredGeometryBounds: { left: 20, top: 20, width: 280, height: 200 },
      passages: [{
        id: "passage.fit",
        viewportHeight: 120,
        contentHeight: 118,
        textPx: 16
      }],
      math: [{ id: "label.x", textPx: 12 }]
    }
  }), []);
});

test("stage fit returns typed repair gaps instead of shrinking overflowing prose", () => {
  const gaps = checkKpStageFitObservation({
    contract,
    observation: {
      stageRect: { left: 0, top: 0, width: 320, height: 240 },
      requiredGeometryBounds: { left: 4, top: 20, width: 296, height: 200 },
      passages: [{
        id: "passage.too-long",
        viewportHeight: 120,
        contentHeight: 154,
        textPx: 14
      }],
      math: [{ id: "label.too-small", textPx: 9 }]
    }
  });

  assert.deepEqual(gaps.map(({ code }) => code), [
    "stage-fit.geometry-outside-safe-frame",
    "stage-fit.passage-overflow",
    "stage-fit.passage-readability-floor",
    "stage-fit.math-readability-floor"
  ]);
  assert.ok(gaps.every(({ preservationBoundary }) =>
    preservationBoundary === "semantic-content-and-playhead"));
});
