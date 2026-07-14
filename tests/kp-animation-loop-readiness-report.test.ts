import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-composable-animation-runtime-readiness-report.md";

test("KP composable animation runtime readiness report records outcomes and next tranche", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Composable Animation Runtime Readiness Report",
    "## What Is Ready",
    "## What Is Still Contract-Level",
    "## Verification",
    "## Autonomy Gates",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("KP composable animation runtime readiness report names delivered capabilities", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "renderer-neutral runtime sampler",
    "dashboard sample cards",
    "external deterministic ports",
    "program trace port",
    "flashcard projections",
    "generated problem imports",
    "runtime composition law",
    "representation transform",
    "transform-tree composition",
    "effectful combinators",
    "LLM decomposition",
    "quality gates"
  ].forEach((priority) =>
    assert.match(report, new RegExp(escapeRegExp(priority), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
