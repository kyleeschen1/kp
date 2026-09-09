import assert from "node:assert/strict";
import test from "node:test";
import { checkBayesDraft, createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { renderBayesCardRevision } from "../src/experiments/bayesian-reasoning/page.ts";
import { createBayesScore } from "../src/experiments/bayesian-reasoning/score.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

test("authored score preserves all stop and motion authority while rendering literal prose", () => {
  const raw = editorialFixture();
  raw.editorial.setup = ["<script>alert(1)</script> $notMath$ **literal**"];
  raw.editorial.passages[0]!.title = "<img src=x>";
  raw.editorial.passages[0]!.body = ["<script>bad</script> ", { fact: "posterior" }];
  const result = checkBayesDraft(JSON.stringify(raw)), baseline = checkBayesDraft(JSON.stringify(createBayesDraft()));
  assert.equal(result.status, "compiled"); assert.equal(baseline.status, "compiled");
  if (result.status !== "compiled" || baseline.status !== "compiled") return;
  assert.deepEqual(result.draft.score.map(({ id, slug, progress }) => ({ id, slug, progress })),
    baseline.draft.score.map(({ id, slug, progress }) => ({ id, slug, progress })));
  assert.deepEqual(result.draft.notation, baseline.draft.notation);
  const html = renderBayesCardRevision(result.draft);
  assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  assert.ok(html.includes("$notMath$ **literal**"));
  assert.equal(html.includes("<script>"), false);
  assert.ok(html.includes("no independence assumption is made"));
  assert.ok(html.includes("positive"));
  assert.throws(() => renderBayesCardRevision({ ...result.draft }), /Compile the source/);
  const editorial = result.draft.editorial!;
  assert.throws(() => createBayesScore(result.draft.trace, { ...editorial, passages: editorial.passages.slice(1) }), /exact trace/);
});
