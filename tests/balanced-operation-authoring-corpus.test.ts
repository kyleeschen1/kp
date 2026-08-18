import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateKpBalancedOperationAuthoringCorpus,
  kpBalancedOperationAuthoringCorpus
} from "../src/authoring/balanced-operation-authoring-corpus.ts";

test("the fixed corpus spans all governed operations and adversarial repairs", () => {
  assert.deepEqual(
    kpBalancedOperationAuthoringCorpus.fixtures.map(({ scenario }) => scenario),
    [
      "add",
      "subtract",
      "multiply",
      "divide",
      "apply-log",
      "divide-by-log-base",
      "division-by-zero",
      "log-domain",
      "ambiguous-operation",
      "compound-operation"
    ]
  );
  assert.equal(new Set(
    kpBalancedOperationAuthoringCorpus.fixtures.slice(0, 6).map(
      ({ operandShape }) => operandShape
    )
  ).size, 6);
});

test("valid cases compile and every invalid case has one exact repair", () => {
  const report = evaluateKpBalancedOperationAuthoringCorpus();
  assert.equal(report.status, "passed");
  assert.ok(report.cases.every(({ passed }) => passed));
  assert.ok(report.cases.slice(0, 6).every((entry) =>
    entry.actualStatus === "compiled" && entry.operationId !== undefined
  ));
  assert.deepEqual(report.cases.slice(6).map(({ repairKinds }) => repairKinds), [
    ["assumption-evidence"],
    ["assumption-evidence"],
    ["ambiguous-jump"],
    ["compound-jump"]
  ]);
  assert.ok(report.cases.slice(6).every(({ activeCandidatePresent }) =>
    activeCandidatePresent === false
  ));
});

test("evaluation is deterministic immutable and uses no presentation input", () => {
  assert.deepEqual(
    evaluateKpBalancedOperationAuthoringCorpus(),
    evaluateKpBalancedOperationAuthoringCorpus()
  );
  assert.equal(Object.isFrozen(kpBalancedOperationAuthoringCorpus), true);
  assert.equal(Object.isFrozen(kpBalancedOperationAuthoringCorpus.fixtures),
    true);
  const source = readFileSync(new URL(
    "../src/authoring/balanced-operation-authoring-corpus.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:src\/editor|src\/rendering|HTMLElement|SVGElement|WebGL|requestAnimationFrame|durationMs|motionPath|renderer)/u);
});
