import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateKpEquationTransformSeriesCorpus,
  kpEquationTransformSeriesCorpus
} from "../src/authoring/equation-transform-series-corpus.ts";

test("the fixed corpus covers the five approved outcomes in order", () => {
  assert.equal(
    kpEquationTransformSeriesCorpus.schemaVersion,
    "kp.equation-transform-series-corpus.v1"
  );
  assert.deepEqual(
    kpEquationTransformSeriesCorpus.fixtures.map(({ scenario }) => scenario),
    [
      "direct-success",
      "one-typed-repair",
      "invalid-algebra-authority",
      "unsupported-syntax",
      "unsupported-motif"
    ]
  );
  assert.ok(kpEquationTransformSeriesCorpus.fixtures.every(
    ({ evidenceKind }) => evidenceKind === "deterministic-fixture"
  ));
});

test("the corpus passes with exact typed outcomes and zero silent fallback", () => {
  const report = evaluateKpEquationTransformSeriesCorpus();
  assert.equal(report.status, "passed");
  assert.equal(report.cases.length, 5);
  assert.ok(report.cases.every(({ passed }) => passed));
  assert.deepEqual(
    report.cases.map(({ actualStatus }) => actualStatus),
    ["compiled", "repair-required", "repair-required", "repair-required", "repair-required"]
  );
  assert.deepEqual(
    report.cases.map(({ repairKinds }) => repairKinds),
    [
      [],
      ["unknown-operation"],
      ["invalid-request"],
      ["unsupported-syntax"],
      ["unsupported-motif"]
    ]
  );
  assert.ok(report.cases.slice(1).every(({ activeCandidatePresent }) =>
    activeCandidatePresent === false
  ));
});

test("corpus evaluation is deterministic and deeply immutable", () => {
  assert.deepEqual(
    evaluateKpEquationTransformSeriesCorpus(),
    evaluateKpEquationTransformSeriesCorpus()
  );
  assert.equal(Object.isFrozen(kpEquationTransformSeriesCorpus), true);
  assert.equal(Object.isFrozen(kpEquationTransformSeriesCorpus.fixtures), true);
  assert.equal(Object.isFrozen(evaluateKpEquationTransformSeriesCorpus()), true);
});

test("fixtures are explicitly not live-model reliability evidence", () => {
  assert.equal(kpEquationTransformSeriesCorpus.liveModelEvidence, false);
  const source = readFileSync(new URL(
    "../src/authoring/equation-transform-series-corpus.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /(?:OpenAI|Anthropic|Gemini|fetch\(|providerResponse|modelOutput)/u
  );
  assert.doesNotMatch(
    source,
    /(?:src\/editor|src\/rendering|HTMLElement|SVGElement|requestAnimationFrame)/u
  );
});
