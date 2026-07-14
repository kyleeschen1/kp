import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-animation-asset-loop-readiness-report.md";

test("KP animation asset loop readiness report records outcomes and next tranche", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Animation Asset Loop Readiness Report",
    "## What Is Ready",
    "## What Is Still Contract-Level",
    "## Verification",
    "## Autonomy Gates",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("KP animation asset loop readiness report names the next implementation priorities", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "renderer-neutral runtime sampler",
    "dashboard sample cards",
    "external symbolic port",
    "program trace port",
    "flashcard projection",
    "quality gates"
  ].forEach((priority) =>
    assert.match(report, new RegExp(escapeRegExp(priority), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
