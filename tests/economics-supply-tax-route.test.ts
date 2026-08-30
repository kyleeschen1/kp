import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { selectKpLegacyRootRoute } from
  "../src/compatibility/legacy-root-route.ts";
import {
  isKpSupplyTaxKineticFigureRoute,
  KP_SUPPLY_TAX_KINETIC_FIGURE_PATH
} from "../src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-route.ts";

test("supply-tax Focus Deck owns one isolated normalized route", () => {
  assert.equal(KP_SUPPLY_TAX_KINETIC_FIGURE_PATH,
    "/experiments/kinetic-figure/supply-tax/");
  assert.equal(isKpSupplyTaxKineticFigureRoute(
    "/experiments/kinetic-figure/supply-tax"), true);
  assert.equal(selectKpLegacyRootRoute({
    pathname: KP_SUPPLY_TAX_KINETIC_FIGURE_PATH,
    search: ""
  }), "kinetic-figure-supply-tax");
});

test("bootstrap lazily owns the route without changing existing figure entries", () => {
  const bootstrap = readFileSync("src/bootstrap.ts", "utf8");
  const entry = readFileSync(
    "src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts",
    "utf8"
  );

  assert.match(bootstrap, /case "kinetic-figure-supply-tax"/u);
  assert.match(bootstrap, /loadKpSupplyTaxKineticFigure/u);
  assert.match(entry, /economics-supply-tax\.kp\.md\?raw/u);
  assert.match(entry, /compileKpSupplyTaxArticle/u);
  assert.equal((entry.match(/createKpReaderTimelinePlaybackClock/g) ?? []).length, 2);
  assert.match(entry, /clock\.play\(\{ direction: "forward", stopAt: 1 \}\)/u);
  assert.match(entry, /clock\.play\(\{ direction: "rewind", stopAt: 0 \}\)/u);
  assert.doesNotMatch(entry, /kinetic-figure-(log-product|delta-epsilon)-entry/u);
});

test("static host exposes eight semantic scene containers and one Article source", () => {
  const entry = readFileSync(
    "src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts",
    "utf8"
  );

  assert.match(entry, /scenes\.map\(\(scene, index\) => renderScene/u);
  assert.match(entry, /hidden="until-found"/u);
  assert.doesNotMatch(entry, /This first state is the reference|The accounting now closes/u);
});
