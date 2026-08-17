import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpAnimationLibraryProductionTarget,
  measureKpAnimationLibraryBundleBoundaryDeltas
} from "./check-animation-library-bundle-boundary.ts";

test("bundle boundary follows the dedicated Internal Studio production graph", () => {
  assert.deepEqual(kpAnimationLibraryProductionTarget, {
    distRoot: "dist/internal-studio",
    outerEntry: "studio/index.html"
  });
  assert.equal(Object.isFrozen(kpAnimationLibraryProductionTarget), true);
});

test("animation library closure deltas retain accepted limits", () => {
  assert.deepEqual(measureKpAnimationLibraryBundleBoundaryDeltas({
    outerGzipBytes: 9_911,
    mainHostGzipBytes: 495_627,
    measuredCatalogueRouteScriptGzipBytes: 180_000,
    placeValueIncrementalGzipBytes: 70_436
  }), {
    outerGzipBytes: -40_089,
    mainHostGzipBytes: 5_627,
    measuredCatalogueRouteScriptGzipBytes: -10_000,
    placeValueIncrementalGzipBytes: -4_564
  });
});

test("main host loads the optional workbench at its route boundary", async () => {
  const source = await readFile("src/main.ts", "utf8");

  assert.doesNotMatch(
    source,
    /from "\.\/editor\/semantic-animation-workbench-view\.ts"/
  );
  assert.match(
    source,
    /import\(\s*"\.\/editor\/semantic-animation-workbench-view\.ts"\s*\)/
  );
});
