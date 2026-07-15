import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-editor-concrete-animation-library-loop-closeout.md";

test("editor concrete animation library closeout records required outcomes", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Editor Concrete Animation Library Loop Closeout",
    "## Loop Fit In Hindsight",
    "## What Structurally Improved",
    "## Concrete Family-Backed Animations",
    "## Product Behavior And Future Work Unlocked",
    "## Completed Commits",
    "## Verification",
    "## Residual Risks",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("editor concrete animation library closeout records delivered coverage honestly", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "24 catalog assets",
    "17 family-backed selections",
    "41 stable descriptors",
    "16 distinct concrete assets",
    "nine algebra selections",
    "four calculus selections",
    "four linear-algebra selections",
    "17 concrete runtime samples",
    "six planned runtime samples",
    "solve-x is the only family sample",
    "matrix-vector multiplication",
    "matrix-matrix multiplication",
    "No focused-slice or full-suite failures remain"
  ].forEach((evidence) =>
    assert.match(report, new RegExp(escapeRegExp(evidence), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
