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

test("the animation Workbench keeps review capture visible without crowding narrow layouts", () => {
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-workbench",
    viewportWidth: KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
  }), "left-prose-rail");
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-workbench",
    viewportWidth: 390
  }), "captured-moment-sheet");
});

test("the Animation Library keeps its review launcher opposite the catalog rail", () => {
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-library",
    viewportWidth: KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
  }), "bottom-right");
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-library",
    viewportWidth: 390
  }), "captured-moment-sheet");
});

test("the animation catalogue opens Review beside its inspector", () => {
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-catalogue",
    viewportWidth: KP_DEV_REVIEW_READER_WIDE_MIN_WIDTH
  }), "catalogue-inspector-drawer");
  assert.equal(resolveKpDevReviewPlacement({
    surface: "animation-catalogue",
    viewportWidth: 390
  }), "captured-moment-sheet");
});

test("review placement rejects unusable viewport evidence", () => {
  assert.throws(() => resolveKpDevReviewPlacement({
    surface: "semantic-reader",
    viewportWidth: 0
  }), /positive and finite/);
});
