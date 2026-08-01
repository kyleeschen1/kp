import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
  type KpDevReviewScreenshotRequestV1
} from "../protocols/dev-review-v1.ts";
import { createKpDevReviewScreenshotService } from "./dev-review-screenshot.ts";

function request(route: string, width = 1_280): KpDevReviewScreenshotRequestV1 {
  return {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
    surface: "animation-catalogue",
    capture: {
      route,
      capturedAt: "2026-07-31T22:00:00.000Z",
      environment: {
        browserName: "chromium",
        language: "en-US",
        viewport: {
          width,
          height: 720,
          devicePixelRatio: 1,
          scrollX: 0,
          scrollY: 0
        },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: { commit: "abc123", fingerprint: "dev-abc123", dirty: false }
      },
      semantic: {
        assetId: "animation.linear-solve.solve-x",
        animationProgressPermille: 250,
        activeTransformationIds: [],
        focusRefs: []
      },
      render: { ownerIds: [] },
      temporalTrace: []
    }
  };
}

test("catalogue screenshot service rejects non-loopback routes before launch", async () => {
  const service = createKpDevReviewScreenshotService();
  await assert.rejects(
    () => service.capture(request("https://example.com/?artifact=ignored")),
    /loopback HTTP route/
  );
});

test("catalogue screenshot service bounds the replay viewport before launch", async () => {
  const service = createKpDevReviewScreenshotService();
  await assert.rejects(
    () => service.capture(request("http://127.0.0.1:8000/", 1_601)),
    /viewport at most 1600 by 1200/
  );
});
