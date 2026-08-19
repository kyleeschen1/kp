import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateKpFractionDenominatorGenerationCorpus,
  kpFractionDenominatorGenerationCorpus
} from "../src/authoring/fraction-denominator-generation-corpus.ts";

test("fixed corpus covers direct composition alias and repair cases", () => {
  assert.deepEqual(
    kpFractionDenominatorGenerationCorpus.fixtures.map(({ scenario }) =>
      scenario
    ),
    [
      "align-common-denominator",
      "align-then-evaluate",
      "combine-like-denominators",
      "normalize-source-alias",
      "reject-mismatched-denominator",
      "reject-hidden-reduction"
    ]
  );
  assert.ok(kpFractionDenominatorGenerationCorpus.fixtures.every(
    ({ naturalLanguageIntent, request }) =>
      naturalLanguageIntent.length > 0 && request.states.every(
        ({ latex }) => latex.length > 0
      )
  ));
});

test("corpus produces exact deterministic typed outcomes", () => {
  const report = evaluateKpFractionDenominatorGenerationCorpus();
  assert.equal(report.status, "passed", JSON.stringify(report, null, 2));
  assert.deepEqual(report.cases.map(({ actualStatus }) => actualStatus), [
    "compiled",
    "compiled",
    "compiled",
    "compiled",
    "repair-required",
    "repair-required"
  ]);
  assert.deepEqual(report.cases[3]?.operationNormalizations, [{
    requestedOperationId:
      "definition.symbolic.algebra.create-common-denominator",
    canonicalOperationId: "kp.algebra.align-common-denominator"
  }]);
  assert.deepEqual(
    report,
    evaluateKpFractionDenominatorGenerationCorpus()
  );
  assert.equal(Object.isFrozen(report), true);
});

test("corpus is model-neutral and carries no presentation authority", () => {
  assert.equal(kpFractionDenominatorGenerationCorpus.liveModelEvidence, false);
  const source = readFileSync(new URL(
    "../src/authoring/fraction-denominator-generation-corpus.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:OpenAI|Anthropic|Gemini|fetch\(|providerResponse|modelOutput)/u);
  assert.doesNotMatch(source,
    /(?:src\/editor|src\/rendering|HTMLElement|SVGElement|requestAnimationFrame|durationMs|motionPath|renderer)/u);
});
