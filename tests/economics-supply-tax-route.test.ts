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

test("a standalone experiment page owns the route without application inversion", () => {
  const bootstrap = readFileSync("src/bootstrap.ts", "utf8");
  const page = readFileSync(
    "experiments/kinetic-figure/supply-tax/index.html",
    "utf8"
  );
  const entry = readFileSync(
    "src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts",
    "utf8"
  );
  const pageModule = readFileSync(
    "src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-page.ts",
    "utf8"
  );

  assert.match(bootstrap, /case "kinetic-figure-supply-tax"/u);
  assert.doesNotMatch(bootstrap, /loadKpSupplyTaxKineticFigure/u);
  assert.match(page, /kinetic-figure-supply-tax-page\.ts/u);
  assert.match(pageModule, /mountKpCanonicalTaxReader/u);
  assert.doesNotMatch(entry, /compileKpSupplyTaxScrollScoreArticle|createKpSupplyTaxScrollScore|createKpEconomicsSupplyTaxAnimationAsset|sampleKpEconomicsSupplyTaxAnimationFrame|exactProgress/u);
  assert.doesNotMatch(entry, /readonly source\?|source === undefined/u);
  assert.match(entry, /input\.source\.sampleFrame\(modelProgress\)/u);
  assert.equal((entry.match(/createKpReaderTimelinePlaybackClock/g) ?? []).length, 2);
  assert.match(entry, /clock\.play\(\{/u);
  assert.match(entry, /const forward = targetProgress > currentProgress/u);
  assert.match(entry, /durationMs: authoredDurationMs/u);
  assert.match(entry, /focusDeckAttentionTransitionDurationMs/u);
  assert.match(entry, /projectKpSupplyTaxSceneTransitionDom/u);
  assert.match(entry, /modelProgressForProjection/u);
  assert.match(entry, /"forward" : "rewind"/u);
  assert.match(entry, /projectKpSupplyTaxScrollScoreStageLens/u);
  assert.match(entry, /findSceneIndexFromHash/u);
  assert.match(entry, /readKpSupplyTaxScrollScorePhraseFromHash/u);
  assert.match(entry, /history\.pushState\(null, "", hash\)/u);
  assert.doesNotMatch(entry, /kinetic-figure-(log-product|delta-epsilon)-entry/u);
  assert.match(pageModule, /import\.meta\.hot\.dispose/u);
  assert.doesNotMatch(pageModule, /import\.meta\.hot\.accept/u);
});

test("static host exposes eight semantic scene containers and one Article source", () => {
  const entry = readFileSync(
    "src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry.ts",
    "utf8"
  );

  assert.match(entry, /renderKpFocusDeckScaffold/u);
  assert.match(entry, /beats: scenes\.map\(\(scene\) =>/u);
  assert.match(entry, /data-kp-supply-tax-card-viewport/u);
  assert.match(entry, /viewport\.addEventListener\("scroll", handleScroll, \{ passive: true \}\)/u);
  assert.match(entry, /viewport\.addEventListener\("scrollend", handleScrollEnd\)/u);
  assert.match(entry, /viewport\.addEventListener\("pointerdown", handlePointerDown/u);
  assert.match(entry, /viewport\.addEventListener\("pointermove", handlePointerMove\)/u);
  assert.match(entry, /event\.pointerType !== "mouse"/u);
  assert.match(entry, /data-kp-supply-tax-state-scrubber/u);
  assert.match(entry, /scrubber\.addEventListener\("input", handleScrubberInput\)/u);
  assert.match(entry, /scrubber\.addEventListener\("change", finishScrubberNavigation\)/u);
  assert.match(entry, /peakDisplacement/u);
  assert.match(entry, /swipeCommitRatio/u);
  assert.match(entry, /wheelCommitRatio/u);
  assert.match(entry, /wheelDeltaPixels/u);
  assert.match(entry,
    /viewport\.addEventListener\("wheel", handleWheel,\s*\{ passive: true \}\)/u);
  assert.match(entry, /requestAnimationFrame\(projectNativeScroll\)/u);
  assert.match(entry, /kpSupplyTaxSnapDisabled/u);
  assert.match(entry, /scrollEndFallbackMs/u);
  assert.match(entry, /viewport\.scrollLeft = boundedPosition/u);
  assert.match(entry, /profile: "scrub"/u);
  assert.match(entry, /reader clock, which remains the sole semantic playhead/u);
  assert.doesNotMatch(entry, /passive: false/u);
  assert.doesNotMatch(entry, /data-kp-focus-deck-select/u);
  assert.doesNotMatch(entry, /kp-supply-tax-narrative__context/u);
  assert.match(entry, /addEventListener\("beforematch"/u);
  assert.match(entry, /directSeek\(index, "replace"\)/u);
  assert.doesNotMatch(entry, /(?:window\.find|searchIndex)/u);
  assert.doesNotMatch(entry, /This first state is the reference|The accounting now closes/u);
});
