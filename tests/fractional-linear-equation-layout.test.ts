import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpFractionalLinearTypography
} from "../src/reader/renderers/fractional-linear-equation-layout.ts";

const states = [
  { stateId: "initial", widthPx: 142, heightPx: 47 },
  { stateId: "after-subtract", widthPx: 235, heightPx: 47 },
  { stateId: "additive-cancelled", widthPx: 142, heightPx: 47 },
  { stateId: "right-simplified", widthPx: 96, heightPx: 47 },
  { stateId: "multiplied", widthPx: 286, heightPx: 58 },
  { stateId: "denominator-cancelled", widthPx: 132, heightPx: 30 },
  { stateId: "solved", widthPx: 69, heightPx: 30 }
] as const;

test("the widest fractional state chooses one font for the full timeline", () => {
  const wide = planKpFractionalLinearTypography({ measurements: states, viewportWidthPx: 509 });
  assert.equal(wide.status, "native");
  assert.equal(wide.fontSizePx, 23.232);
  assert.equal(wide.widestStateId, "multiplied");
  assert.equal(wide.wrapAllowed, false);

  const narrow = planKpFractionalLinearTypography({ measurements: states, viewportWidthPx: 260 });
  assert.equal(narrow.status, "scaled");
  assert.equal(narrow.fontSizePx, 23.232 * narrow.scale);
  assert.equal(narrow.widestStateId, "multiplied");
});

test("typography plan reports rather than hiding an impossible fit", () => {
  const plan = planKpFractionalLinearTypography({
    measurements: states,
    viewportWidthPx: 190,
    minScale: 0.72
  });
  assert.equal(plan.status, "overflow");
  assert.equal(plan.scale, 0.72);
  assert.throws(() => planKpFractionalLinearTypography({
    measurements: [],
    viewportWidthPx: 509
  }), /requires measured states/);
});
