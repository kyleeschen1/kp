import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticAnimation } from "../src/animation/quadratic-branching-asset.ts";
import {
  createCanonicalKpQuadraticPresentationProfile,
  parseKpQuadraticPresentationProfile,
  validateKpQuadraticPresentationProfile
} from "../src/animation/quadratic-presentation-profile.ts";

test("canonical profile types method selection and five ordered phases", () => {
  const profile = createCanonicalKpQuadraticPresentationProfile();
  assert.deepEqual(profile.methodSelection.availableMethodIds, [
    "method.quadratic.completing-square",
    "method.quadratic.formula"
  ]);
  assert.deepEqual(profile.attention.map(({ phase }) => phase), [
    "intro",
    "method",
    "branch",
    "reunion",
    "graph"
  ]);
  assert.deepEqual(validateKpQuadraticPresentationProfile(profile), []);
});

test("branch schedule and graph handoff are bounded and ordered", () => {
  const profile = createCanonicalKpQuadraticPresentationProfile();
  assert.ok(profile.branchSchedule.splitAt < profile.branchSchedule.settleAt);
  assert.ok(profile.branchSchedule.settleAt < profile.branchSchedule.reuniteAt);
  assert.ok(profile.branchSchedule.reuniteAt < profile.graphHandoffAt);
});

test("decoder rejects unknown fields and unordered policy", () => {
  const profile = createCanonicalKpQuadraticPresentationProfile();
  assert.throws(
    () =>
      parseKpQuadraticPresentationProfile({
        ...profile,
        rawKeyframes: [],
        branchSchedule: {
          splitAt: 0.8,
          settleAt: 0.6,
          reuniteAt: 0.9
        }
      }),
    /Unexpected presentation field|must order/
  );
});

test("presentation policy does not mutate semantic asset serialization", () => {
  const canonical = createCanonicalKpQuadraticAnimation();
  const before = JSON.stringify(canonical.animation);
  createCanonicalKpQuadraticPresentationProfile();
  assert.equal(JSON.stringify(canonical.animation), before);
});

test("profile is deeply immutable and JSON-stable", () => {
  const profile = createCanonicalKpQuadraticPresentationProfile();
  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.methodSelection), true);
  assert.equal(Object.isFrozen(profile.attention), true);
  assert.equal(Object.isFrozen(profile.branchSchedule), true);
  assert.deepEqual(JSON.parse(JSON.stringify(profile)), profile);
});
