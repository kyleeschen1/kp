import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { prepareKpAuthoringMarketPreview as prepare } from "../src/experiments/authoring-market/authoring-market-preview-prepare.ts";
import { projectKpAuthoringMarketRevisionReview as review } from "../src/experiments/authoring-market/authoring-market-revision-review.ts";

test("parameter review names changed declared outputs without claiming free-prose verification", () => {
  const before = prepare(buildKpAuthoringMarketPreview("reference"));
  const after = prepare(buildKpAuthoringMarketPreview("variation"));
  const result = review(before, after)!;
  assert.equal(result.beforeRevision, before.facts.modelRevisionId);
  assert.equal(result.afterRevision, after.facts.modelRevisionId);
  assert.ok(result.changedFacts.includes("after.revenue"));
  assert.ok(result.changedFacts.includes("after.tax"));
  assert.ok(!result.changedFacts.includes("initial.quantity"));
  assert.ok(result.changedClaims.includes("government-revenue"));
  assert.equal(before.facts.text("after.revenue"), "12");
  assert.equal(after.facts.text("after.revenue"), "10");
  assert.match(result.editorialReview, /do not verify editorial claims/);
  assert.deepEqual(review(after, before)?.changedFacts, result.changedFacts);
});

test("initial and wording-only builds do not pretend to change model assertions", () => {
  const source = buildKpAuthoringMarketPreview("reference");
  const before = prepare(source);
  const after = prepare({ ...source, article: { ...source.article,
    text: source.article.text.replace("How does a tax reshape a market?", "An editorial revision") } });
  assert.equal(review(undefined, before), undefined);
  assert.equal(review(before, after), undefined);
  assert.match(after.boundArticle.text, /An editorial revision/);
  assert.throws(() => prepare({ ...buildKpAuthoringMarketPreview("variation"), article: source.article }), /revision/);
});
