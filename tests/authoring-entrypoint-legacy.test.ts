import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkReasoningText, runReasoningAuthoringCli } from "../scripts/author-reasoning.ts";
import { runBayesAuthoringCli } from "../scripts/author-bayesian-reasoning.ts";
import { checkEquationReasoningSource } from "../src/experiments/reusable-reasoning/equation-author-check.ts";
import { checkCodeReasoningSource } from "../src/experiments/reusable-reasoning/code-author-check.ts";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";

test("legacy reasoning delegates complete valid and failure payloads, including size diagnostics", () => {
  for (const [domain, owner] of [["equation", checkEquationReasoningSource], ["code", checkCodeReasoningSource]] as const) {
    const example = JSON.stringify(runReasoningAuthoringCli(["--domain", domain, "--example"]));
    for (const json of [example, "{", "{}", "x".repeat(100_001)])
      assert.deepEqual(checkReasoningText(domain, json), owner(json));
  }
});

test("legacy Bayes delegates its checker and retains named examples and invocation repairs", () => {
  const path = "content/authoring/r4a-urn-prior.bayes.json";
  assert.deepEqual(runBayesAuthoringCli(["--request", path]), checkBayesAuthorSource(readFileSync(path, "utf8")));
  for (const args of [["--example"], ["--example", "urn"]])
    assert.equal(checkBayesAuthorSource(JSON.stringify(runBayesAuthoringCli(args))).status, "compiled");
  for (const args of [[], ["--request"], ["--request", "content/authoring/does-not-exist.json"]]) {
    const result = runBayesAuthoringCli(args);
    assert.ok("status" in result);
    assert.equal(result.status, "repair-gap");
  }
});

test("compatibility CLIs contain invocation mechanics, not copied domain compilation", () => {
  const reasoning = readFileSync("scripts/author-reasoning.ts", "utf8");
  assert.doesNotMatch(reasoning, /JSON\.parse|compileReasoningDraft|bindCodeReasoningEvidence|json\.length/);
  const bayes = readFileSync("scripts/author-bayesian-reasoning.ts", "utf8");
  assert.doesNotMatch(bayes, /JSON\.parse|checkBayesDraft\(|compileBinaryProbabilityTrace/);
});
