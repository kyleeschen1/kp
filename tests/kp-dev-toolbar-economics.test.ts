import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { kpDevToolbarReviewControlId } from "../src/dev-toolbar/dev-toolbar-protocol.ts";
import { createKpEconomicsDevToolbarContribution } from "../src/tutorial/economics-demand-shift/economics-demand-shift-dev-toolbar-contribution.ts";

test("economics contributes compact URL-derived layout and theme controls", () => {
  const contribution = createKpEconomicsDevToolbarContribution(
    "?view=deck&theme=light"
  );

  assert.equal(contribution.routeId, "tutorial.economics.demand-shift");
  assert.deepEqual(contribution.controls.map(({ id }) => id), [
    "economics.view",
    "economics.theme"
  ]);
  assert.equal(contribution.controls[0]!.kind, "choice");
  assert.equal(contribution.controls[0]!.kind === "choice" && contribution.controls[0]!.value, "deck");
  assert.equal(contribution.controls[1]!.kind === "toggle" && contribution.controls[1]!.pressed, false);
  assert.doesNotMatch(JSON.stringify(contribution), new RegExp(kpDevToolbarReviewControlId, "u"));
});

test("the economics toolbar is a DEV-only dynamic route capability", () => {
  const routeSource = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-route-entry.ts",
    "utf8"
  );
  const presenterSource = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-tutorial-entry.ts",
    "utf8"
  );

  assert.match(routeSource, /import\.meta\.env\.DEV/u);
  assert.match(routeSource, /import\("\.\/economics-demand-shift-dev-toolbar\.ts"\)/u);
  assert.doesNotMatch(routeSource, /from "\.\/economics-demand-shift-dev-toolbar\.ts"/u);
  assert.doesNotMatch(presenterSource, /createKpTutorialReviewHost/u);
});

test("fixed toolbar CSS does not reserve document flow or animate layout", () => {
  const css = readFileSync("src/dev-toolbar/dev-toolbar.css", "utf8");

  assert.match(css, /\[data-kp-dev-toolbar\][\s\S]*position: fixed/u);
  assert.doesNotMatch(css, /transition:|animation:|margin-bottom|padding-bottom/u);
  assert.match(css, /kp-economics-tutorial__bottom-controls[\s\S]*display: none/u);
});
