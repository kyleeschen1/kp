import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-animation-renderer-integration-readiness-report.md";

test("KP animation renderer integration readiness report records closeout sections", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Animation Renderer Integration Readiness Report",
    "## What Is Now Ready",
    "## What Is Still Contract-Level",
    "## Verification",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("KP animation renderer integration readiness report names delivered renderer-integration capabilities", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "visual-frame adapters",
    "KaTeX selector token refs",
    "DOM geometry visual frame adapter",
    "persistent token rewind law",
    "visual frame diagnostics panel",
    "equation to graph",
    "equation to matrix",
    "generated calculus",
    "generated linear algebra",
    "flashcard preview renderer data",
    "cloze visual mask",
    "predict-next answer state",
    "lossy algebra trace fixture",
    "programming callstack",
    "LLM paused-frame decomposition"
  ].forEach((capability) =>
    assert.match(report, new RegExp(escapeRegExp(capability), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
