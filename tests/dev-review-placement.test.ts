import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH,
  resolveKpDevReviewPlacement
} from "../src/dev-review/review-placement.ts";

test("ordinary review consumers keep the existing bottom-right placement", () => {
  assert.equal(resolveKpDevReviewPlacement({
    surface: "default",
    viewportWidth: 1_280
  }), "bottom-right");
});

test("semantic readers dock left only while their two-column layout is active", () => {
  assert.equal(resolveKpDevReviewPlacement({
    surface: "semantic-reader",
    viewportWidth: KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
  }), "left-prose-rail");
  assert.equal(resolveKpDevReviewPlacement({
    surface: "semantic-reader",
    viewportWidth: KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH - 1
  }), "captured-moment-sheet");
});

test("review placement rejects unusable viewport evidence", () => {
  assert.throws(() => resolveKpDevReviewPlacement({
    surface: "semantic-reader",
    viewportWidth: 0
  }), /positive and finite/);
});
