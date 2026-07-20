import assert from "node:assert/strict";
import test from "node:test";

import {
  parseKpReaderMotionPreference,
  resolveKpReaderMotionPolicy
} from "../src/reader/runtime/public-api.ts";

test("system preference follows the OS without removing causal motion", () => {
  assert.deepEqual(resolveKpReaderMotionPolicy({
    preference: "system",
    systemReducedMotion: false
  }), {
    preference: "system",
    resolvedMode: "full",
    systemReducedMotion: false,
    sampling: "continuous",
    causalMotion: "full",
    decorativeMotion: "full"
  });
  assert.deepEqual(resolveKpReaderMotionPolicy({
    preference: "system",
    systemReducedMotion: true
  }), {
    preference: "system",
    resolvedMode: "essential",
    systemReducedMotion: true,
    sampling: "continuous",
    causalMotion: "essential",
    decorativeMotion: "none"
  });
});

test("explicit preferences override the OS and static alone snaps", () => {
  const full = resolveKpReaderMotionPolicy({
    preference: "full",
    systemReducedMotion: true
  });
  assert.equal(full.resolvedMode, "full");
  assert.equal(full.sampling, "continuous");

  const reduced = resolveKpReaderMotionPolicy({
    preference: "reduced",
    systemReducedMotion: false
  });
  assert.equal(reduced.resolvedMode, "essential");
  assert.equal(reduced.causalMotion, "essential");
  assert.equal(reduced.decorativeMotion, "none");

  const staticPolicy = resolveKpReaderMotionPolicy({
    preference: "static",
    systemReducedMotion: false
  });
  assert.equal(staticPolicy.resolvedMode, "static");
  assert.equal(staticPolicy.sampling, "checkpoint");
  assert.equal(staticPolicy.causalMotion, "none");
});

test("motion preferences parse as a closed serializable vocabulary", () => {
  assert.equal(parseKpReaderMotionPreference(undefined), undefined);
  assert.equal(parseKpReaderMotionPreference("system"), "system");
  assert.equal(parseKpReaderMotionPreference("reduced"), "reduced");
  assert.equal(parseKpReaderMotionPreference("full"), "full");
  assert.equal(parseKpReaderMotionPreference("static"), "static");
  assert.throws(
    () => parseKpReaderMotionPreference("cinematic"),
    /Unknown reader motion preference/
  );
});
