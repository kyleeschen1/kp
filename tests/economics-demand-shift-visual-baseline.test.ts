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

test("frozen palette remains historical while current controls stay mounted", () => {
  const theme = readSource("economics-demand-shift-theme.css");
  const component = readSource("KpEconomicsDemandShiftTutorial.svelte");
  const tuning = readSource("economics-demand-shift-visual-tuning.ts");
  const graphTuning = readSource("economics-demand-shift-graph-style.ts");
  const layoutTuning = readSource("economics-demand-shift-layout.ts");
  const global = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

  for (const color of Object.values(baseline.pageBackgrounds)) {
    assert.equal(theme.includes(color), true, `missing page background ${color}`);
  }
  assert.deepEqual(baseline.graphSeries.dark, {
    stable: "#68a9df",
    changing: "#e77b74"
  });
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

test("dark graph palette uses the approved semantic identity sources", () => {
  const theme = readSource("economics-demand-shift-theme.css");
  for (const color of [
    "#7cbdff",
    "#f07972",
    "#f4f4f8",
    "#42465b",
    "#7d8193",
    "#696e83",
    "#5e7e9f",
    "#966b67"
  ]) {
    assert.equal(theme.includes(color), true, `missing semantic color ${color}`);
  }
  for (const color of Object.values(baseline.graphSeries.dark)) {
    assert.equal(theme.includes(color), false, `stale dark graph color ${color}`);
  }
});

test("light graph palette uses separately tuned semantic sources", () => {
  const theme = readSource("economics-demand-shift-theme.css");
  for (const color of [
    "#256ea8",
    "#b63f39",
    "#151622",
    "#aeb2bf",
    "#707586",
    "#74798a",
    "#68788a",
    "#806b67"
  ]) {
    assert.equal(theme.includes(color), true, `missing light semantic color ${color}`);
  }
  assert.deepEqual(baseline.graphSeries.light, {
    stable: "#4682b4",
    changing: "#dc443c"
  });
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

test("canonical economics captures have stable evidence names", () => {
  const manifest = JSON.parse(readFileSync(new URL(
    "./fixtures/economics-salience-exemplar-baselines.json",
    import.meta.url
  ), "utf8")) as {
    readonly command: string;
    readonly captures: readonly { readonly file: string }[];
  };
  const browserSpec = readFileSync(new URL(
    "./economics-two-column-scroll.browser.spec.ts",
    import.meta.url
  ), "utf8");

  assert.equal(manifest.command, "npm run visual:economics-two-column-scroll");
  assert.equal(new Set(manifest.captures.map(({ file }) => file)).size, 3);
  for (const { file } of manifest.captures) {
    assert.equal(browserSpec.includes(file), true, `missing capture ${file}`);
  }
});
