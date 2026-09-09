import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { renderBayesCardRevision } from "../src/experiments/bayesian-reasoning/page.ts";
import { projectBayesLessonViews } from "../src/experiments/bayesian-reasoning/lesson-views.ts";
import { compileBayesPublication } from "../scripts/build-bayesian-edition.ts";

test("shared lesson assembly preserves both pre-cleanup authored card and edition bytes", () => {
  const cases = [
    ["r4b-spam-filter.bayes.json", "5ad4b178ead736b5be4e7c6fd6535099b06b9537af87651e2bb1484e1c0fe165", "89ba4b7e2ce8a0f4bbad1c447ad08edb831aa809d53bb66bcd443fd9cccbf76d"],
    ["r4b-urn-explanation.bayes.json", "25a9538bb50bf7c29f4e034d46250983ba6dd66521f37b193ff11c1aa9e445b4", "6c93490371786a3780b8eba6a5789178378df2e29714fa9aabd0d4bdaaf1c6c4"]
  ] as const;
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  for (const [file, cardHash, publicationHash] of cases) {
    const json = readFileSync(`content/authoring/${file}`, "utf8"), result = checkBayesDraft(json);
    assert.equal(result.status, "compiled");
    assert.equal(hash(renderBayesCardRevision(result.draft)), cardHash);
    assert.equal(hash(JSON.stringify(compileBayesPublication(json, file))), publicationHash);
    const views = projectBayesLessonViews(result.draft);
    for (const view of [views.full, views.compact, views.context, ...views.prompts]) assert.equal(view.revisionId, result.draft.revisionId);
    assert.throws(() => projectBayesLessonViews({ ...result.draft }), /Compile the source/);
  }
});

test("editorial fact ownership does not import SVG paint", () => {
  for (const file of ["editorial-binding.ts", "context-facts.ts", "display-units.ts"])
    assert.doesNotMatch(readFileSync(`src/experiments/bayesian-reasoning/${file}`, "utf8"), /from ["']\.\/tree-(?:svg|frame)\.ts/);
});
