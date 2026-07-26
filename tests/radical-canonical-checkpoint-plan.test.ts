import assert from "node:assert/strict";
import test from "node:test";

import {
  kpRadicalCanonicalCheckpointCaptureCount,
  kpRadicalCanonicalCheckpointMoments,
  kpRadicalCanonicalCheckpointProfiles
} from "../scripts/radical-canonical-checkpoint-plan.ts";
import {
  kpRadicalSuccessionPreservationManifest as manifest
} from "../src/reader/compiler/radical-succession-preservation-manifest.ts";

test("radical browser checkpoint covers responsive DPR and handoff matrix", () => {
  assert.deepEqual(
    kpRadicalCanonicalCheckpointProfiles.map((profile) => ({
      ...profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor
    })),
    manifest.presentation.reviewViewports
  );
  assert.deepEqual(
    kpRadicalCanonicalCheckpointMoments
      .filter(({ motion }) => motion === "full")
      .map(({ progressPermille }) => progressPermille),
    [0, 250, 500, 750, 960, 999, 1_000]
  );
  assert.deepEqual(
    kpRadicalCanonicalCheckpointMoments
      .filter(({ motion }) => motion === "reduced")
      .map(({ progressPermille }) => progressPermille),
    manifest.presentation.reducedMotionEndpointsPermille
  );
  assert.equal(kpRadicalCanonicalCheckpointCaptureCount, 38);
});
