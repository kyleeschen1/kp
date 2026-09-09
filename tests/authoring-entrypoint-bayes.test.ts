import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkBayesAuthorSource } from "../src/experiments/bayesian-reasoning/author-check.ts";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";
import { runBayesAuthoringCli } from "../scripts/author-bayesian-reasoning.ts";

test("both authored lessons retain owner delegation and report editorial scope without issuing authority", async () => {
  for (const [name, file] of [["spam-explanation", "r4b-spam-filter.bayes.json"], ["urn-explanation", "r4b-urn-explanation.bayes.json"]]) {
    const json = readFileSync(`content/authoring/${file}`, "utf8");
    assert.deepEqual(runBayesAuthoringCli(["--example", name!]), JSON.parse(json));
    const summary = checkBayesAuthorSource(json);
    assert.equal(summary.status, "compiled");
    assert.equal(summary.editorial?.status, "editorial-not-proof");
    assert.equal(summary.editorial?.passageCount, 7);
    const report = await checkAuthorTask("bayes.binary", json);
    assert.deepEqual(report.result, summary);
    assert.equal(report.handoff.execution, "not-performed");
    assert.equal(report.authority, "report-only");
    assert.deepEqual(runBayesAuthoringCli(["--request", `content/authoring/${file}`]), summary);
  }
});

test("joint masses and prior-likelihood sources retain old CLI results and compiler revisions", async () => {
  for (const json of [JSON.stringify(createBayesDraft()), readFileSync("content/authoring/r4a-urn-prior.bayes.json", "utf8")]) {
    const domain = checkBayesDraft(json), summary = checkBayesAuthorSource(json);
    assert.equal(domain.status, "compiled");
    assert.equal(summary.status, "compiled");
    if (domain.status !== "compiled" || summary.status !== "compiled") return;
    assert.equal(summary.revisionId, domain.draft.revisionId);
    assert.equal(summary.evidenceRevisionId, domain.draft.authority.revisionId);
    assert.equal(summary.checkpointCount, 7);
    const routed = await checkAuthorTask("bayes.binary", json);
    assert.deepEqual(routed.result, summary);
    const legacy = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/author-bayesian-reasoning.ts", "--request", "-"],
      { input: json, encoding: "utf8", timeout: 30_000 });
    assert.equal(legacy.status, 0, legacy.stderr);
    assert.deepEqual(JSON.parse(legacy.stdout), summary);
  }
});

test("Bayes routing preserves exact failure payloads without rescaling or forged authority", async () => {
  const source = createBayesDraft();
  for (const json of ["{", "{}", JSON.stringify({ ...source, evidenceRevisionId: "forged" }),
    JSON.stringify({ ...source, model: { ...source.model, masses: ["1", "1", "0", "0"] } }),
    JSON.stringify({ ...source, model: { ...source.model, masses: ["0", "0", "0", "1"] } })]) {
    const expected = checkBayesDraft(json);
    assert.equal(expected.status, "repair-gap");
    const routed = await checkAuthorTask("bayes.binary", json);
    assert.equal(routed.status, "repair-gap");
    assert.deepEqual(routed.result, expected);
  }
});
