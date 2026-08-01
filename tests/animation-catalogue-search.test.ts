import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  searchKpAnimationCatalogueEntries
} from "../src/editor/animation-catalogue-search.ts";
import {
  KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
} from "../src/editor/animation-catalogue-selection.ts";

const entries = createKpAnimationCatalogueProjection().entries;

test("blank catalogue search keeps one row per asset with selection first", () => {
  const results = searchKpAnimationCatalogueEntries({
    entries,
    query: "",
    selectedAnimationId: KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
  });

  assert.equal(results.length, 33);
  assert.equal(new Set(results.map(({ animationId }) => animationId)).size, 33);
  assert.equal(results[0]?.animationId, KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
});

test("catalogue search supports direct, tokenized, and fuzzy cross-domain terms", () => {
  const search = (query: string) => searchKpAnimationCatalogueEntries({
    entries,
    query,
    selectedAnimationId: KP_ANIMATION_CATALOGUE_EXEMPLAR_ID
  });

  assert.equal(search("solve x")[0]?.animationId,
    KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
  assert.equal(search("slvx")[0]?.animationId,
    KP_ANIMATION_CATALOGUE_EXEMPLAR_ID);
  assert.equal(search("tangent")[0]?.animationId,
    "animation.derivative-rules.tangent-graph");
  assert.ok(search("matrix").some(
    ({ animationId }) => animationId.includes("matrix")
  ));
  assert.ok(search("programming").some(
    ({ animationId }) => animationId ===
      "animation.programming.add.execution-trace"
  ));
  assert.equal(search("unreviewed").length, 33);
});

test("catalogue search returns assets rather than related context rows", () => {
  const results = searchKpAnimationCatalogueEntries({
    entries,
    query: "sample.animation.solve-x.both-sides"
  });

  assert.deepEqual(
    results.map(({ animationId }) => animationId),
    [KP_ANIMATION_CATALOGUE_EXEMPLAR_ID]
  );
});
