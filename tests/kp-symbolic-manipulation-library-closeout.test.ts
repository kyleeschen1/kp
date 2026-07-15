import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-symbolic-manipulation-library-loop-closeout.md";

test("symbolic manipulation library closeout records required outcomes", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Symbolic Manipulation Library Loop Closeout",
    "## Loop Fit In Hindsight",
    "## What Structurally Improved",
    "## Product Behavior And Future Work Unlocked",
    "## Completed Commits",
    "## Verification",
    "## Residual Risks",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("symbolic manipulation library closeout records delivered coverage", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "18 promoted families",
    "71 semantic transformation definitions",
    "20 runtime samples",
    "93 transformation and graph law references",
    "22 graphical equivalents",
    "18 generated-problem hooks",
    "18 flashcard hooks",
    "Forty-seven definitions",
    "paused-frame drill-down",
    "focus-relationship",
    "matrix multiplication",
    "No focused-slice or full-suite failures remain"
  ].forEach((evidence) =>
    assert.match(report, new RegExp(escapeRegExp(evidence), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
