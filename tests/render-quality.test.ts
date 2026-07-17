import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpRenderQualityState,
  freezeKpRenderQualityState,
  kpRenderQualityPreferencePending,
  normalizeKpRenderQualityPreference,
  releaseKpRenderQualityState,
  resolveKpRenderQualityProfile,
  selectKpRenderQualityPreference
} from "../src/animation/render-quality.ts";

test("render quality normalizes persisted preferences and resolves auto by capability", () => {
  assert.equal(normalizeKpRenderQualityPreference("full"), "full");
  assert.equal(normalizeKpRenderQualityPreference("unexpected"), "auto");
  assert.equal(resolveKpRenderQualityProfile({
    preference: "auto",
    capabilities: { hardwareConcurrency: 12, deviceMemoryGb: 16 }
  }).tier, "full");
  assert.equal(resolveKpRenderQualityProfile({
    preference: "auto",
    capabilities: { hardwareConcurrency: 8, deviceMemoryGb: 8 }
  }).tier, "balanced");
  assert.equal(resolveKpRenderQualityProfile({
    preference: "auto",
    capabilities: { hardwareConcurrency: 12, deviceMemoryGb: 16, saveData: true }
  }).tier, "efficient");
});

test("every quality tier preserves semantics, witnesses, and duration", () => {
  const full = resolveKpRenderQualityProfile({ preference: "full" });
  const balanced = resolveKpRenderQualityProfile({ preference: "balanced" });
  const efficient = resolveKpRenderQualityProfile({ preference: "efficient" });
  const profiles = [full, balanced, efficient];
  profiles.forEach((profile) => {
    assert.equal(profile.semanticStepScale, 1);
    assert.equal(profile.witnessVisibility, "preserve");
    assert.equal(profile.durationScale, 1);
  });
  assert.ok(full.shadowScale > balanced.shadowScale);
  assert.ok(balanced.shadowScale > efficient.shadowScale);
  assert.ok(full.microMotionScale > balanced.microMotionScale);
  assert.ok(balanced.microMotionScale > efficient.microMotionScale);
});

test("a playback freezes its tier and queues preference changes until release", () => {
  const capabilities = { hardwareConcurrency: 12, deviceMemoryGb: 16 };
  const initial = createKpRenderQualityState({
    preference: "auto",
    capabilities
  });
  const frozen = freezeKpRenderQualityState({ state: initial, capabilities });
  const pending = selectKpRenderQualityPreference({
    state: frozen,
    preference: "efficient",
    capabilities
  });

  assert.equal(frozen.profile.tier, "full");
  assert.equal(pending.profile.tier, "full");
  assert.equal(pending.frozen, true);
  assert.equal(kpRenderQualityPreferencePending(pending), true);

  const released = releaseKpRenderQualityState({ state: pending, capabilities });
  assert.equal(released.profile.tier, "efficient");
  assert.equal(released.frozen, false);
  assert.equal(kpRenderQualityPreferencePending(released), false);
});
