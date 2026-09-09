import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesLessonViews } from "../src/experiments/bayesian-reasoning/lesson-views.ts";
import { compileBayesPublication, verifyBayesPublication } from "./build-bayesian-edition.ts";
import { checkAuthorTask } from "./author-check-owner-dispatch.ts";

/** Deterministic replay, not independent generation, browser Apply or a prose grader. */
export async function checkAuthoredBayesWorkflows() {
  const results = [];
  for (const [file, posterior, changedPosterior] of [
    ["r4b-spam-filter.bayes.json", "2/13", "18/19"],
    ["r4b-urn-explanation.bayes.json", "1/7", "1/4"]
  ] as const) {
    const path = `content/authoring/${file}`, bytes = readFileSync(path, "utf8");
    const checked = checkBayesDraft(bytes); assert.equal(checked.status, "compiled");
    const original = checked.draft, views = projectBayesLessonViews(original);
    assert.equal(views.full.facts.posterior, posterior);
    assert.equal((await checkAuthorTask("bayes.binary", bytes)).status, "checked");
    const raw = JSON.parse(bytes);
    const prose = JSON.stringify({ ...raw, editorial: { ...raw.editorial, title: `Revised: ${raw.editorial.title}` } });
    const proseResult = checkBayesDraft(prose); assert.equal(proseResult.status, "compiled");
    assert.notEqual(proseResult.draft.revisionId, original.revisionId);
    assert.equal(proseResult.draft.authority.revisionId, original.authority.revisionId);
    const parameter = JSON.stringify({ ...raw, model: { ...raw.model, prior: "1/2" } });
    const parameterResult = checkBayesDraft(parameter); assert.equal(parameterResult.status, "compiled");
    const changed = projectBayesLessonViews(parameterResult.draft);
    for (const reading of [changed.full, changed.compact]) assert.equal(reading.facts.posterior, changedPosterior);
    assert.equal(changed.context.posterior, changedPosterior);
    assert.notEqual(parameterResult.draft.authority.revisionId, original.authority.revisionId);
    const injected = JSON.stringify({ ...raw, editorial: { ...raw.editorial, setup: [{ fact: "unknown.posterior" }] } });
    const invalid = checkBayesDraft(injected); assert.equal(invalid.status, "repair-gap");
    assert.equal(invalid.diagnostic.path, "$.editorial.setup[0].fact");
    assert.equal(checkBayesDraft(bytes).status, "compiled");
    for (const text of [bytes, prose, parameter]) {
      const artifact = compileBayesPublication(text, file);
      verifyBayesPublication(artifact, text, file);
      const payload = artifact.payload;
      for (const view of [payload.full, payload.compact, payload.context, ...payload.prompts]) assert.equal(view.revisionId, payload.revisionId);
      assert.doesNotMatch(payload.reading.html, /<script\b/);
    }
    results.push({ source: path, bytes: Buffer.byteLength(bytes), sourceFiles: 1,
      sha256: createHash("sha256").update(bytes).digest("hex"), revisionId: original.revisionId,
      posterior, changedPrior: "1/2", changedPosterior,
      injectedFaults: 1, injectedRepairAttempts: 1, publishedVariantsVerified: 3 });
  }
  return { status: "passed", provenance: "local-deterministic-replay", externalModelCalls: 0,
    humanAuthorTime: "not-measured", comprehension: "not-measured", editorialQuality: "not-graded", results } as const;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  process.stdout.write(`${JSON.stringify(await checkAuthoredBayesWorkflows(), null, 2)}\n`);
