import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
  KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
  KP_DEV_REVIEW_SCHEMA_VERSION,
  kpDevReviewCreateRequestSchema,
  kpDevReviewScreenshotRequestSchema,
  kpDevReviewProtocolLimits
} from "../protocols/public-api.ts";

function request(): Record<string, unknown> {
  return {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    sessionId: "review-session.build-1",
    comment: "The handoff snaps.",
    capture: {
      route: "http://127.0.0.1:8000/reader/solve-x/?kpProgress=553",
      capturedAt: "2026-07-20T23:00:00.000Z",
      environment: {
        browserName: "Chromium",
        language: "en-US",
        viewport: {
          width: 1280, height: 720, devicePixelRatio: 2, scrollX: 0, scrollY: 600
        },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: { commit: "abc123", fingerprint: "build-abc123", dirty: false }
      },
      semantic: {
        progressPermille: 553,
        animationProgressPermille: 600,
        phaseProgressPermille: 765,
        activeNodeId: "evaluation.solve-x.subtract",
        activeTransformationIds: ["transform.cancel"],
        foldMode: "automatic",
        foldDetail: "expanded",
        layoutPolicy: "single-row",
        expression: {
          expressionId: "expr.application",
          operation: "bind",
          syntaxPath: ["expr.application", "expr.lambda", "expr.body"],
          depth: 2,
          sourceIdentityIds: ["occurrence.argument.four"],
          destinationIdentityIds: ["destination.body.x"]
        },
        checkpointClass: "minor-hold",
        themeId: "theme.kp.lesson.lisp-paper-v1",
        tuning: {
          "gestalt-style": "kp.organic-subtle@1.0.0",
          "focus-experiment": "flat"
        },
        focusRefs: [],
        target: {
          materialOwnerId: "owner.minus-three",
          normalizedPoint: { x: 0.5, y: 0.5 }
        }
      },
      render: {
        surface: {
          profile: "phone",
          shellViewport: { width: 390, height: 700 },
          contentViewport: {
            width: 390,
            height: 700,
            devicePixelRatio: 2
          }
        },
        ownerIds: ["owner.minus-three"]
      },
      temporalTrace: [{ offsetMs: -16, progressPermille: 550 }]
    }
  };
}

test("dev review schema accepts and clones a bounded canonical request", () => {
  const source = request();
  (source["capture"] as Record<string, unknown>)["screenshot"] = {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
    kind: "bitmap-data-url",
    scope: "selected-stage",
    mediaType: "image/jpeg",
    dataUrl: "data:image/jpeg;base64,/9j/2Q==",
    pixelWidth: 640,
    pixelHeight: 360,
    sourceViewport: { left: 0, top: 80, width: 640, height: 420 }
  };
  const parsed = kpDevReviewCreateRequestSchema.parse(source);
  assert.notEqual(parsed, source);
  assert.equal(parsed.capture.semantic.progressPermille, 553);
  assert.equal(
    parsed.capture.semantic.tuning?.["focus-experiment"],
    "flat"
  );
  assert.equal(parsed.capture.semantic.expression?.operation, "bind");
  assert.deepEqual(parsed.capture.semantic.expression?.syntaxPath, [
    "expr.application",
    "expr.lambda",
    "expr.body"
  ]);
  assert.equal(parsed.capture.render.surface?.profile, "phone");
  assert.equal(parsed.capture.screenshot?.pixelWidth, 640);
});

test("dev review schema bounds bitmap screenshot attachments", () => {
  const invalidMime = request();
  (invalidMime["capture"] as Record<string, unknown>)["screenshot"] = {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
    kind: "bitmap-data-url",
    scope: "selected-stage",
    mediaType: "image/jpeg",
    dataUrl: "data:image/png;base64,UklGRg==",
    pixelWidth: 640,
    pixelHeight: 360,
    sourceViewport: { left: 0, top: 0, width: 640, height: 360 }
  };
  assert.equal(
    kpDevReviewCreateRequestSchema.safeParse(invalidMime).success,
    false
  );

  const oversized = request();
  (oversized["capture"] as Record<string, unknown>)["screenshot"] = {
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
    kind: "bitmap-data-url",
    scope: "selected-stage",
    mediaType: "image/jpeg",
    dataUrl: "data:image/jpeg;base64," + "A".repeat(
      kpDevReviewProtocolLimits.screenshotDataUrlCharacters
    ),
    pixelWidth: 640,
    pixelHeight: 360,
    sourceViewport: { left: 0, top: 0, width: 640, height: 360 }
  };
  assert.equal(
    kpDevReviewCreateRequestSchema.safeParse(oversized).success,
    false
  );
});

test("screenshot requests carry capture state but never an existing bitmap", () => {
  const capture = (request()["capture"] as Record<string, unknown>);
  assert.equal(kpDevReviewScreenshotRequestSchema.safeParse({
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
    surface: "animation-catalogue",
    capture
  }).success, true);
  assert.equal(kpDevReviewScreenshotRequestSchema.safeParse({
    schemaVersion: KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION,
    surface: "animation-catalogue",
    capture: {
      ...capture,
      screenshot: {
        schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
        kind: "bitmap-data-url",
        scope: "selected-stage",
        mediaType: "image/jpeg",
        dataUrl: "data:image/jpeg;base64,/9j/2Q==",
        pixelWidth: 2,
        pixelHeight: 2,
        sourceViewport: { left: 0, top: 0, width: 2, height: 2 }
      }
    }
  }).success, false);
});

test("dev review schema rejects unknown, blank, oversized, and unsafe fields", () => {
  const unknown = request();
  unknown["filesystemPath"] = "/Users/example";
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(unknown).success, false);

  const blank = request();
  blank["comment"] = "   ";
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(blank).success, false);

  const large = request();
  large["comment"] = "x".repeat(kpDevReviewProtocolLimits.commentCharacters + 1);
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(large).success, false);

  const unsafeRoute = request();
  (unsafeRoute["capture"] as Record<string, unknown>)["route"] = "file:///etc/passwd";
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(unsafeRoute).success, false);
});

test("dev review schema bounds temporal traces and normalized target coordinates", () => {
  const trace = request();
  const capture = trace["capture"] as Record<string, unknown>;
  capture["temporalTrace"] = Array.from(
    { length: kpDevReviewProtocolLimits.temporalSamples + 1 },
    () => ({ offsetMs: -1 })
  );
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(trace).success, false);

  const target = request();
  const semantic = ((target["capture"] as Record<string, unknown>)["semantic"] as Record<string, unknown>);
  (semantic["target"] as Record<string, unknown>)["normalizedPoint"] = { x: 1.1, y: 0.5 };
  assert.equal(kpDevReviewCreateRequestSchema.safeParse(target).success, false);
});
