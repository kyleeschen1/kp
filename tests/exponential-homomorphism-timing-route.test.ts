import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpExponentialHomomorphismPresentationProgress,
  readKpExponentialHomomorphismTimingRoute,
  writeKpExponentialHomomorphismTimingRoute
} from "../src/editor/exponential-homomorphism-timing-route.ts";

test("crossover tuner uses one coarse exact URL for every caller", () => {
  const search = writeKpExponentialHomomorphismTimingRoute(
    "?artifact=animation.example&playhead=0.27",
    { enabled: true, resolutionStart: 0.12, resolutionEnd: 0.42 }
  );
  assert.match(search, /artifact=animation\.example/u);
  assert.match(search, /playhead=0\.27/u);
  assert.match(search, /tuneCrossover=1/u);
  assert.match(search, /crossoverStart=0\.12/u);
  assert.match(search, /crossoverEnd=0\.42/u);
  const route = readKpExponentialHomomorphismTimingRoute(search);
  assert.equal(route.enabled, true);
  assert.equal(route.resolutionStart, 0.12);
  assert.equal(route.resolutionEnd, 0.42);
  assert.equal(
    projectKpExponentialHomomorphismPresentationProgress(0.12, route),
    0.16
  );
  assert.equal(
    projectKpExponentialHomomorphismPresentationProgress(0.42, route),
    0.3
  );
});

test("invalid tuning fails back to the reviewed shared profile", () => {
  const route = readKpExponentialHomomorphismTimingRoute(
    "?tuneCrossover=1&crossoverStart=0.6&crossoverEnd=0.2"
  );
  assert.equal(route.enabled, true);
  assert.equal(route.resolutionStart, 0.16);
  assert.equal(route.resolutionEnd, 0.3);
});
