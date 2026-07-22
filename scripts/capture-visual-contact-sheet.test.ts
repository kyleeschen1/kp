import assert from "node:assert/strict";
import test from "node:test";

import {
  buildKpVisualContactSheetHtml,
  createKpVisualReviewUrl,
  kpDistributionAreaContactSheetCheckpoints,
  kpSolveXContactSheetCheckpoints,
  kpVisualContactSheetExemplars
} from "./capture-visual-contact-sheet.ts";

test("route descriptors expose every reader to visual review", () => {
  assert.deepEqual(kpVisualContactSheetExemplars, [
    "solve-x",
    "teacher-zero",
    "fractional-linear",
    "divide-both-sides",
    "split-merge-fractions",
    "fractional-transfer",
    "distribution-area"
  ]);
});

test("canonical contact-sheet checkpoints have fixed unique ordering", () => {
  assert.deepEqual(
    kpSolveXContactSheetCheckpoints.map((checkpoint) => checkpoint.id),
    [
      "read-equality",
      "subtract-settled",
      "cancel-motion",
      "cancel-settled",
      "solution-settled",
      "cancel-motion-phone"
    ]
  );
  assert.equal(new Set(kpSolveXContactSheetCheckpoints.map((checkpoint) => checkpoint.id)).size, 6);
});

test("distribution contact sheet pairs the same visual moments forward and backward", () => {
  assert.equal(kpDistributionAreaContactSheetCheckpoints.length, 36);
  assert.equal(new Set(kpDistributionAreaContactSheetCheckpoints.map(({ id }) => id)).size, 36);
  for (const profile of ["desktop", "tablet", "phone"]) {
    const profileFrames = kpDistributionAreaContactSheetCheckpoints.filter(({ id }) => id.startsWith(profile));
    assert.equal(profileFrames.length, 12);
    for (const visualProgress of [0, 360, 500, 650, 820, 1_000]) {
      const pair = profileFrames.filter((checkpoint) => checkpoint.visualProgress === visualProgress);
      assert.equal(pair.length, 2);
      assert.equal(pair[0]!.progress + pair[1]!.progress, 1_000);
    }
  }
});

test("contact-sheet URLs derive route and query authority from descriptors", () => {
  const solve = createKpVisualReviewUrl(
    "solve-x",
    "https://kinetic.press",
    kpSolveXContactSheetCheckpoints[2]!
  );
  assert.equal(solve.pathname, "/reader/solve-x/");
  assert.equal(solve.searchParams.get("kpLesson"), "lesson.solve-x.x-plus-3");
  assert.equal(solve.searchParams.get("kpVersion"), "1");
  assert.equal(solve.searchParams.get("kpProgress"), "500");

  const inverse = kpDistributionAreaContactSheetCheckpoints.find(
    ({ direction, visualProgress }) => direction === "inverse" && visualProgress === 360
  )!;
  const distribution = createKpVisualReviewUrl(
    "distribution-area",
    "https://kinetic.press",
    inverse
  );
  assert.equal(distribution.pathname, "/reader/distribution-area/");
  assert.equal(distribution.searchParams.get("kpDirection"), "inverse");
  assert.equal(distribution.searchParams.get("kpProgress"), "640");
});

test("contact-sheet HTML is deterministic and escapes review labels", () => {
  const item = {
    id: "one",
    label: "A < B & C",
    progress: 500,
    viewport: { width: 1280, height: 900 },
    file: "one.png",
    dataUrl: "data:image/png;base64,abc"
  };
  const first = buildKpVisualContactSheetHtml([item]);
  const second = buildKpVisualContactSheetHtml([item]);
  assert.equal(first, second);
  assert.match(first, /A &lt; B &amp; C/);
  assert.match(first, /data:image\/png;base64,abc/);
  assert.doesNotMatch(first, /capturedAt|Date\(/);
});

test("contact-sheet HTML supports a deterministic exemplar-specific layout", () => {
  const html = buildKpVisualContactSheetHtml([], {
    title: "Distribution < area",
    columns: 3,
    imageFit: "contain"
  });
  assert.match(html, /Distribution &lt; area/);
  assert.match(html, /repeat\(3, minmax/);
  assert.match(html, /object-fit: contain/);
});
