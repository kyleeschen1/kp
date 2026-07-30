import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpPlaceValueAdditionRuntimeControllerPolicy
} from "../src/rendering/place-value-addition-runtime-controller.ts";

test("place-value host hardening reuses the reader scheduler and renderer lifecycle", () => {
  assert.deepEqual(kpPlaceValueAdditionRuntimeControllerPolicy, {
    schemaVersion: "kp.place-value-addition-runtime-controller-policy.v1",
    schedulerAuthority: "reader-frame-scheduler",
    frameCacheKey: "exact-progress+view+viewport",
    hiddenWork: "retain-latest-without-sample-or-paint",
    rendererLifecycle: "shared-place-value-runtime-session",
    webglLeaseCount: 0
  });

  const source = readFileSync(
    new URL(
      "../src/rendering/place-value-addition-runtime-controller.ts",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(source, /createKpReaderFrameScheduler/);
  assert.doesNotMatch(source, /\brequestAnimationFrame\b/);
  assert.doesNotMatch(source, /\bcancelAnimationFrame\b/);
  assert.doesNotMatch(source, /\bWebGL(Renderer|RenderingContext)\b/);
  assert.doesNotMatch(source, /new\s+(Worker|ResizeObserver)\b/);
});
