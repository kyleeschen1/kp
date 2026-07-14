import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import test from "node:test";

const reportPath =
  "docs/project/reviews/2026-07-14-kp-animation-library-expansion-readiness-report.md";

test("KP animation library expansion readiness report records closeout sections", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "# KP Animation Library Expansion Readiness Report",
    "## Loop Fit In Hindsight",
    "## What Structurally Improved",
    "## What Is Now Ready",
    "## What Is Still Contract-Level",
    "## Verification",
    "## Residual Risks",
    "## Recommended Next Tranche",
    "## Resume Commands"
  ].forEach((heading) => assert.match(report, new RegExp(escapeRegExp(heading))));
});

test("KP animation library expansion readiness report names delivered assets", () => {
  const report = readFileSync(reportPath, "utf8");

  [
    "live equation card runtime frames",
    "KaTeX visual frames",
    "cancellation motif",
    "fraction transforms",
    "exponent and radical transforms",
    "Jacobian and Hessian",
    "Fundamental Theorem of Calculus",
    "Fourier Transform",
    "generated problem registry",
    "calculus fixtures",
    "linear algebra fixtures",
    "graph vector runtime consumer",
    "graph rewind law",
    "flashcard renderer sample",
    "paused-frame drill-down",
    "dashboard progress rows"
  ].forEach((capability) =>
    assert.match(report, new RegExp(escapeRegExp(capability), "i"))
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
