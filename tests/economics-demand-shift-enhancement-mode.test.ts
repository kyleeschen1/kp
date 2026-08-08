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
    readKpEconomicsDemandShiftEnhancementMode("?enhancement=other"),
    "presenter"
  );
  assert.equal(readKpEconomicsDemandShiftEnhancementMode(""), "presenter");
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
