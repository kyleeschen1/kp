import { test } from "node:test";
import assert from "node:assert/strict";
import { buildBayesPage } from "../src/experiments/bayesian-reasoning/page.ts";

test("Bayes static host has seven stops and explicitly disables competing native snap", () => {
  const html = buildBayesPage();
  assert.equal((html.match(/data-kp-focus-deck-beat="/g) ?? []).length, 7);
  assert.match(html, /data-kp-focus-deck-snap-disabled="true"/);
  assert.match(html, /1 \/ 7/);
  assert.match(html, /Whole population/);
  assert.match(html, /<template data-kp-reader-exemplar-template/);
});
