import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  readKpEconomicsDemandShiftCompiledPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-compiled-publication.ts";
import {
  renderKpEconomicsDemandShiftStaticNarrative
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-static-publication.ts";

const publication = readKpEconomicsDemandShiftCompiledPublication();
const html = renderKpEconomicsDemandShiftStaticNarrative(publication);

test("economics route source reserves a compiled static narrative", () => {
  const route = readFileSync(
    "tutorials/economics/demand-shift/index.html",
    "utf8"
  );
  assert.match(route, /data-kp-economics-static-fallback/);
  assert.match(route, /kp:economics-static-narrative/);
});

test("static economics narrative preserves ordered searchable lesson truth", () => {
  assert.match(html, /data-kp-economics-static-projection="narrative"/);
  assert.match(html, /Why does an increase in demand raise both equilibrium/);
  assert.match(html, /data-kp-economics-tutorial-passage="context"/);
  assert.match(html, /data-kp-economics-tutorial-passage="explore"/);
  assert.ok(html.indexOf("kp-section-equilibrium") <
    html.indexOf("kp-section-market-clearing"));
  assert.ok(html.indexOf('data-kp-economics-tutorial-passage="context"') <
    html.indexOf('data-kp-economics-tutorial-passage="follow-shift"'));
});

test("static economics narrative publishes math semantic links and destinations", () => {
  assert.match(html, /data-kp-latex="Q"/);
  assert.match(html, /<math/);
  assert.match(html, /data-kp-tutorial-toc-link/);
  assert.match(html, /id="kp-block-demand-shift"/);
  assert.match(html, /id="kp-checkpoint-shift-handoff"/);
  assert.match(html, /data-kp-tutorial-destination="section"/);
  assert.match(html, /data-kp-tutorial-destination="checkpoint"/);
});

test("static economics publication reserves one initial SVG and final controls", () => {
  assert.equal((html.match(/data-kp-editor-graph-svg/g) ?? []).length, 1);
  assert.match(html, /data-kp-economics-static-stage-state="initial"/);
  assert.match(html, /data-kp-economics-demand-intercept="14"/);
  assert.match(html, /data-kp-economics-equilibrium-quantity="6"/);
  assert.match(html, /data-kp-editor-graph-origin-policy="shared-endpoint"/);
  assert.match(html, /data-kp-axis-arrow-length="9"/);
  assert.equal((html.match(/data-kp-tutorial-progress-rail=/g) ?? []).length, 2);
  assert.equal((html.match(/<kp-tutorial-scrub-bar/g) ?? []).length, 2);
});
