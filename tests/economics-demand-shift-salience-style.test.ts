import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectKpEconomicsSalience } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-salience-adapter.ts";
import {
  projectKpEconomicsSalienceCssProperties,
  serializeKpEconomicsSalienceCssProperties
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-salience-style.ts";

const projection = projectKpEconomicsSalience({
  market: "shifted",
  presentation: "comparison-verified",
  focusTarget: "supply"
});

test("economics projects one route-local salience property seam", () => {
  const dark = projectKpEconomicsSalienceCssProperties({
    theme: "dark",
    projection
  });
  assert.equal(Object.keys(dark).length, 60);
  assert.equal(dark["--kp-economics-salience-market-supply-color"], "#7cbdff");
  assert.equal(dark["--kp-economics-salience-market-supply-opacity"], "1");
  assert.equal(dark["--kp-economics-salience-market-demand-current-opacity"], "0.62");
  assert.equal(dark["--kp-economics-salience-market-demand-initial-rendered"], "1");
  assert.equal(dark["--kp-economics-salience-market-equations-rendered"], "1");
});

test("theme projection changes recipes without adding layout authority", () => {
  const dark = projectKpEconomicsSalienceCssProperties({ theme: "dark", projection });
  const light = projectKpEconomicsSalienceCssProperties({ theme: "light", projection });
  assert.notEqual(
    dark["--kp-economics-salience-market-supply-color"],
    light["--kp-economics-salience-market-supply-color"]
  );
  assert.equal(
    light["--kp-economics-salience-market-demand-current-opacity"],
    "0.72"
  );
  const serialized = serializeKpEconomicsSalienceCssProperties(dark);
  assert.doesNotMatch(serialized, /(?:width|height|inset|gap|top|left|right|bottom):/);
});

test("economics route mounts the semantic property seam for local consumers", () => {
  const component = readFileSync(new URL(
    "../src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte",
    import.meta.url
  ), "utf8");
  assert.match(component, /semanticSalienceStyle/);
  assert.match(component, /projectKpEconomicsSalienceCssProperties/);
  assert.match(component, /serializeKpEconomicsSalienceCssProperties/);
  const theme = readFileSync(new URL(
    "../src/tutorial/economics-demand-shift/economics-demand-shift-theme.css",
    import.meta.url
  ), "utf8");
  const graph = readFileSync(new URL(
    "../src/tutorial/economics-demand-shift/economics-demand-shift-graph.css",
    import.meta.url
  ), "utf8");
  assert.match(theme, /--kp-economics-salience-market-supply-color/);
  assert.match(graph, /--kp-economics-salience-market-supply-opacity/);
  assert.match(graph, /--kp-economics-salience-market-supply-stroke-scale/);
});
