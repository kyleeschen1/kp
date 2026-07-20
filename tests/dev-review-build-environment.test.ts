import assert from "node:assert/strict";
import test from "node:test";
import {
  captureKpDevReviewEnvironment,
  type KpDevReviewEnvironmentSource
} from "../src/dev-review/build-environment.ts";

const source: KpDevReviewEnvironmentSource = {
  userAgent: "Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36",
  platform: "MacIntel",
  language: "en-US",
  viewport: {
    width: 1280,
    height: 720,
    devicePixelRatio: 2,
    scrollX: 12,
    scrollY: 340
  },
  mediaMatches: (query) => query.includes("reduced-motion") || query.includes("color-scheme")
};

test("captures reproducible environment and build identity without personal fields", () => {
  const environment = captureKpDevReviewEnvironment(source, {
    commit: "abc123",
    fingerprint: "dev-abc123",
    dirty: true
  });

  assert.deepEqual(environment, {
    browserName: "Chrome",
    browserVersion: "126.0.0.0",
    platform: "MacIntel",
    language: "en-US",
    viewport: {
      width: 1280,
      height: 720,
      devicePixelRatio: 2,
      scrollX: 12,
      scrollY: 340
    },
    reducedMotion: true,
    forcedColors: false,
    colorScheme: "dark",
    build: { commit: "abc123", fingerprint: "dev-abc123", dirty: true }
  });
  assert.equal("userAgent" in environment, false);
  assert.equal("path" in environment, false);
});

test("normalizes unstable numeric and empty build inputs", () => {
  const environment = captureKpDevReviewEnvironment({
    ...source,
    platform: "",
    language: "",
    viewport: { ...source.viewport, width: Number.NaN, devicePixelRatio: Number.POSITIVE_INFINITY }
  }, { commit: "", fingerprint: "", dirty: false });

  assert.equal(environment.viewport.width, 1);
  assert.equal(environment.viewport.devicePixelRatio, 1);
  assert.equal(environment.language, "und");
  assert.equal(environment.build.commit, "unknown");
  assert.equal(environment.build.fingerprint, "dev-unknown");
  assert.equal("platform" in environment, false);
});
