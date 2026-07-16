import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyKpAnimationOverflowSamples
} from "../src/editor/animation-viewport-overflow.ts";

test("animation viewport overflow distinguishes scrollbars from visible spill", () => {
  const report = classifyKpAnimationOverflowSamples([
    {
      elementRef: "[data-kp-editor-animation-stage]",
      axis: "x",
      overflowMode: "visible",
      clientExtent: 320,
      scrollExtent: 344
    },
    {
      elementRef: ".editor-equation-stage__object",
      axis: "x",
      overflowMode: "auto",
      clientExtent: 280,
      scrollExtent: 312
    },
    {
      elementRef: "[data-kp-editor-equation-stage]",
      axis: "y",
      overflowMode: "hidden",
      clientExtent: 160,
      scrollExtent: 160
    }
  ]);

  assert.equal(report.nestedScrollbarCount, 1);
  assert.equal(report.contentOverflowCount, 2);
  assert.deepEqual(
    report.issues.map((issue) => [
      issue.elementRef,
      issue.kind,
      issue.overflowExtent
    ]),
    [
      [
        "[data-kp-editor-animation-stage]",
        "content-overflow",
        24
      ],
      [
        ".editor-equation-stage__object",
        "nested-scrollbar",
        32
      ],
      [
        ".editor-equation-stage__object",
        "content-overflow",
        32
      ]
    ]
  );
});

test("animation viewport overflow honors subpixel tolerance and forced scrollbars", () => {
  const report = classifyKpAnimationOverflowSamples([
    {
      elementRef: "subpixel",
      axis: "x",
      overflowMode: "auto",
      clientExtent: 200,
      scrollExtent: 200.75
    },
    {
      elementRef: "forced",
      axis: "y",
      overflowMode: "scroll",
      clientExtent: 100,
      scrollExtent: 100
    }
  ]);

  assert.equal(report.nestedScrollbarCount, 1);
  assert.equal(report.contentOverflowCount, 0);
  assert.equal(report.issues[0]?.elementRef, "forced");
  assert.equal(report.issues[0]?.kind, "nested-scrollbar");
});

test("animation viewport overflow rejects invalid tolerances", () => {
  assert.throws(
    () => classifyKpAnimationOverflowSamples([], -1),
    /finite non-negative/
  );
});
