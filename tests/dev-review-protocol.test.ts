import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_DEV_REVIEW_SCHEMA_VERSION,
  type KpDevReviewCreateRequestV1,
  type KpDevReviewEventV1
} from "../protocols/public-api.ts";

test("dev review protocol round trips renderer-neutral capture evidence", () => {
  const request: KpDevReviewCreateRequestV1 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    sessionId: "review-session.commit-abc123",
    comment: "The minus three snaps at this boundary.",
    capture: {
      route: "http://127.0.0.1:8000/reader/solve-x/?kpProgress=553",
      capturedAt: "2026-07-20T23:00:00.000Z",
      environment: {
        browserName: "Chromium",
        language: "en-US",
        viewport: {
          width: 1280,
          height: 720,
          devicePixelRatio: 2,
          scrollX: 0,
          scrollY: 640
        },
        reducedMotion: false,
        forcedColors: false,
        colorScheme: "light",
        build: { commit: "abc123", fingerprint: "build-abc123", dirty: false }
      },
      semantic: {
        documentId: "lesson.solve-x.x-plus-3",
        progressPermille: 553,
        animationProgressPermille: 600,
        phaseProgressPermille: 765,
        activeNodeId: "evaluation.solve-x.subtract",
        activeTransformationIds: ["transform.cancel-left-inverses"],
        activePhase: "collapse",
        foldMode: "automatic",
        foldDetail: "expanded",
        layoutPolicy: "single-row",
        focusRefs: [],
        target: {
          materialOwnerId: "material-owner.left-inverses-cancel",
          normalizedPoint: { x: 0.5, y: 0.5 }
        }
      },
      render: {
        motionAuthority: "operation-specific",
        layoutReadCount: 1,
        surface: {
          profile: "phone",
          shellViewport: { width: 390, height: 700 },
          contentViewport: {
            width: 390,
            height: 700,
            devicePixelRatio: 2
          },
          stageViewport: {
            left: 0,
            top: 80,
            width: 390,
            height: 420
          }
        },
        ownerIds: ["material-owner.left-inverses-cancel"]
      },
      temporalTrace: [{
        offsetMs: -16,
        progressPermille: 548,
        frameIntervalMs: 16,
        transitionId: "transform.cancel-left-inverses"
      }]
    }
  };
  const event: KpDevReviewEventV1 = {
    schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
    kind: "note-created",
    occurredAt: request.capture.capturedAt,
    note: { ...request, id: "review.1", sequence: 1, status: "new" }
  };

  assert.deepEqual(JSON.parse(JSON.stringify(event)), event);
  assert.equal(event.note.capture.semantic.target?.materialOwnerId,
    "material-owner.left-inverses-cancel");
  assert.equal(event.note.capture.render.surface?.profile, "phone");
});
