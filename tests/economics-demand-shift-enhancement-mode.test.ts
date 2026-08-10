import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  readKpEconomicsDemandShiftEnhancementMode
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-enhancement-mode.ts";

test("published enhancement is an explicit reversible route projection", () => {
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?enhancement=published"),
    "published"
  );
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?enhancement=presenter"),
    "presenter"
  );
  assert.equal(readKpEconomicsDemandShiftEnhancementMode(""), "published");
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?view=deck"),
    "published"
  );
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?view=attention-stage"),
    "published"
  );
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?view=inline-sticky"),
    "presenter"
  );
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode("?layout=animation-station"),
    "presenter"
  );
  assert.equal(
    readKpEconomicsDemandShiftEnhancementMode(
      "?layout=animation-station&enhancement=published"
    ),
    "published"
  );
});

test("published enhancement does not redownload prose or require Svelte", () => {
  const source = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-progressive-entry.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /compiled-publication|\.svelte|from "svelte"/);
  assert.match(source, /createKpEconomicsEquilibriumRuntimeSession/);
  assert.match(source, /parseKpTutorialDestinationHash/);
});

test("route and presenter capabilities remain dynamically selected", () => {
  const route = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-route-entry.ts",
    "utf8"
  );
  const presenter = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-presenter-capability.ts",
    "utf8"
  );
  assert.match(route, /import\(\s*"\.\/economics-demand-shift-progressive-entry\.ts"/);
  assert.match(route, /import\(\s*"\.\/economics-demand-shift-tutorial-entry\.ts"/);
  assert.doesNotMatch(route, /\.svelte|from "svelte"/);
  for (const capability of [
    "split-presenter-capability",
    "inline-sticky-presenter-capability",
    "animation-station-presenter-capability",
    "two-column-scroll-presenter-capability"
  ]) {
    assert.match(presenter, new RegExp(`${capability}\\.ts`));
  }
});
