import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorBeatIds } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";
import { renderKpEigenvectorSettledEndpointHtml } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-settled-html.ts";

test("all nine endpoints render native SVG and accessible settled truth", () => {
  for (const beatId of kpEigenvectorBeatIds) {
    const html = renderKpEigenvectorSettledEndpointHtml(beatId);
    assert.match(html, /<svg/);
    assert.match(html, /role="img"/);
    assert.match(html, new RegExp(`data-kp-eigenvector-endpoint="${beatId}"`));
    assert.doesNotMatch(html, /<canvas|<iframe/);
  }
});

test("the same semantic v is present in SVG and native KaTeX", () => {
  const html = renderKpEigenvectorSettledEndpointHtml(
    "geometry-becomes-equation"
  );
  const occurrences = html.match(
    /data-kp-semantic-object="eigenvector-demo\/vector\/v"/g
  ) ?? [];

  assert.ok(occurrences.length >= 3);
  assert.match(html, /class="katex"/);
  assert.match(html, /data-kp-equation-token="equation\.Av3v\.v-input"/);
});

test("the eigenspace endpoint uses semantic SVG and annotated equation paint", () => {
  const html = renderKpEigenvectorSettledEndpointHtml("reveal-the-eigenspace");

  assert.match(html, /kp-eigenvector-stage__invariant-line/);
  assert.match(html, /data-kp-equation-form="E3=span-v"/);
  assert.match(html, /data-kp-equation-token="equation\.E3spanv\.v"/);
});

test("all authored prose and attributes pass through the standard escaper", () => {
  const html = renderKpEigenvectorSettledEndpointHtml("compressed-recall");

  assert.doesNotMatch(html, /<script|javascript:/i);
  assert.match(html, /The line survives/);
});
