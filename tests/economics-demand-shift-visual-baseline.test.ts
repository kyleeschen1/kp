import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { kpEconomicsPreSalienceVisualBaseline as baseline } from
  "../src/tutorial/economics-demand-shift/economics-demand-shift-visual-baseline.ts";

const sourceDirectory = new URL(
  "../src/tutorial/economics-demand-shift/",
  import.meta.url
);

function readSource(name: string): string {
  return readFileSync(new URL(name, sourceDirectory), "utf8");
}

test("pre-salience economics visual baseline is explicit and executable", () => {
  assert.equal(baseline.schemaVersion, "kp.economics.visual-baseline.v1");
  assert.deepEqual(baseline.pageBackgrounds, {
    dark: "#0d0e1c",
    light: "#f4f1e9"
  });
  assert.equal(baseline.knownBroadSuiteBaseline.failures, 24);
  assert.equal(new Set(baseline.stateAttributes).size, 7);
  assert.equal(new Set(baseline.tuningQueryKeys).size, 8);
  assert.equal(new Set(baseline.stylesheetOwners).size, 8);
});

test("frozen palette and state controls still describe the issued exemplar", () => {
  const theme = readSource("economics-demand-shift-theme.css");
  const component = readSource("KpEconomicsDemandShiftTutorial.svelte");
  const tuning = readSource("economics-demand-shift-visual-tuning.ts");
  const graphTuning = readSource("economics-demand-shift-graph-style.ts");
  const layoutTuning = readSource("economics-demand-shift-layout.ts");
  const global = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  for (const color of Object.values(baseline.pageBackgrounds)) {
    assert.equal(theme.includes(color), true, `missing page background ${color}`);
  }
  for (const color of Object.values(baseline.graphSeries.dark)) {
    assert.equal(theme.includes(color), true, `missing dark graph color ${color}`);
  }
  for (const color of Object.values(baseline.graphSeries.light)) {
    assert.equal(global.includes(color), true, `missing light graph color ${color}`);
  }
  for (const attribute of baseline.stateAttributes) {
    assert.equal(component.includes(attribute), true, `missing state attribute ${attribute}`);
  }
  for (const key of baseline.tuningQueryKeys) {
    assert.equal(
      `${tuning}\n${graphTuning}\n${layoutTuning}\n${component}`.includes(
        `"${key}"`
      ),
      true,
      `missing tuning query key ${key}`
    );
  }
});

test("frozen stylesheet owners remain present without overlapping the inventory", () => {
  for (const owner of baseline.stylesheetOwners) {
    assert.match(readSource(owner), /^\/\* [^\n]+ \*\//);
  }
  assert.equal(
    baseline.stylesheetOwners.includes(
      "economics-demand-shift-visual-baseline.ts" as never
    ),
    false
  );
});
