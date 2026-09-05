import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("authoring-market is an isolated lazy document reusing the canonical host", () => {
  const html = read("experiments/authoring-market/index.html");
  assert.match(html, /authoring-market-page\.ts/);
  const page = read("src/experiments/authoring-market/authoring-market-page.ts");
  assert.match(page, /await import\("\.\/authoring-market-host\.ts"\)/);
  assert.match(page, /pagehide/);
  const host = read("src/experiments/authoring-market/authoring-market-host.ts");
  assert.match(host, /mountKpSupplyTaxKineticFigure\(input\)/);
  assert.doesNotMatch(host, /requestAnimationFrame|createKpReaderTimelinePlaybackClock|<svg|renderLatex/);
  assert.doesNotMatch(read("src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts"), /authoring-market/);
  assert.doesNotMatch(read("src/dev-toolbar/development-page-build-entries.ts"), /authoring-market/);
});

test("the stable visual command owns the authoring-market browser checkpoint", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts["visual:authoring-market"],
    "playwright test tests/authoring-market.browser.spec.ts --project=chromium --workers=1");
});
