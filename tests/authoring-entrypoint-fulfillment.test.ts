import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assessRetainedAuthorTask } from "../scripts/assess-authoring-task.ts";
import { authorTaskExample, checkAuthorTask } from "../scripts/author-check-owner-dispatch.ts";

test("compilable untouched starters fail changed-task intent while retained sources fulfill it", async () => {
  for (const [task, owner, path] of [
    ["urn-prior-third", "bayes.binary", "content/authoring/r4a-urn-prior.bayes.json"],
    ["log-base-three", "equation.logarithm-base", "content/authoring/r4a-logarithm-base.json"]
  ] as const) {
    const starter = JSON.stringify(await authorTaskExample(owner));
    assert.equal((await checkAuthorTask(owner, starter)).status, "checked");
    assert.equal(assessRetainedAuthorTask(task, starter).status, "intent-gap");
    const selected = readFileSync(path, "utf8");
    const assessment = assessRetainedAuthorTask(task, selected);
    assert.equal(assessment.status, "fulfilled");
    assert.equal(assessment.editorialQuality, "not-assessed");
    assert.equal(assessRetainedAuthorTask(task, "{").compilation, "rejected");
  }
});

test("equivalent held-out joint representation fulfills urn intent; wrong teaching or model does not", async () => {
  const source = JSON.parse(readFileSync("content/authoring/r4a-urn-prior.bayes.json", "utf8"));
  const { events, sourceId } = source.model;
  const joint = { ...source, model: { kind: "joint-masses", sourceId, events, masses: ["2/24", "3/12", "2/4", "2/12"] } };
  assert.equal(assessRetainedAuthorTask("urn-prior-third", JSON.stringify(joint)).status, "fulfilled");
  for (const changed of [
    { ...source, teaching: { ...source.teaching, firstEventId: "urn-a" } },
    { ...source, model: { ...source.model, prior: "2/3" } },
    // Same posterior 1/7, different prior and likelihoods: wrong task.
    { ...joint, model: { ...joint.model, masses: ["1/14", "3/7", "3/7", "1/14"] } }
  ]) {
    assert.equal((await checkAuthorTask("bayes.binary", JSON.stringify(changed))).status, "checked");
    assert.equal(assessRetainedAuthorTask("urn-prior-third", JSON.stringify(changed)).status, "intent-gap");
  }
  const impossible = { ...joint, model: { ...joint.model, masses: ["0/1", "1/2", "0/1", "1/2"] } };
  assert.equal(assessRetainedAuthorTask("urn-prior-third", JSON.stringify(impossible)).status, "repair-gap");
});

test("held-out valid numeric edit is not mistaken for requested operands; reversed quotient is rejected", async () => {
  const source = JSON.parse(readFileSync("content/authoring/r4a-logarithm-base.json", "utf8"));
  source.states[0].latex = "\\log_{10}(1000)";
  source.states[1].latex = "\\frac{\\ln(1000)}{\\ln(10)}";
  assert.equal((await checkAuthorTask("equation.logarithm-base", JSON.stringify(source))).status, "checked");
  assert.equal(assessRetainedAuthorTask("log-base-three", JSON.stringify(source)).status, "intent-gap");
  source.states[1].latex = "\\frac{\\ln(10)}{\\ln(1000)}";
  assert.equal(assessRetainedAuthorTask("log-base-three", JSON.stringify(source)).status, "repair-gap");
});
