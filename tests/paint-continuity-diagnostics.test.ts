import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpPaintContinuityBoundary,
  type KpPaintContinuityObservation
} from "../src/animation/paint-continuity-diagnostics.ts";
import type {
  KpVerifiedPaintContinuityPlan
} from "../src/animation/paint-continuity-plan-types.ts";
import type {
  KpVerifiedOperationPresentationPlanId
} from "../src/animation/operation-presentation-plan-authority.ts";

const plan = {
  schemaVersion: "kp.paint-continuity-plan.v1",
  id: "paint.sum",
  transformationId: "transform.sum",
  operationPresentationPlanId:
    "plan.sum" as KpVerifiedOperationPresentationPlanId,
  ownership: "exclusive-continuous-carrier",
  carriers: [{
    lineageId: "lineage.sum",
    sourceBundleIds: ["bundle.left", "bundle.right"],
    targetBundleIds: ["bundle.target"],
    transferTopology: "shared-zero-area-junction"
  }],
  endpointSettlement: "native-source-and-target",
  nonZeroPaint: "opaque"
} as unknown as KpVerifiedPaintContinuityPlan;

function observation(input: {
  readonly id: string;
  readonly bundleId: string;
  readonly scale: number;
  readonly opacity?: number;
  readonly x?: number;
  readonly style?: string;
  readonly structure?: string;
  readonly ownerId?: string;
}): KpPaintContinuityObservation {
  return {
    id: input.id,
    lineageId: "lineage.sum",
    bundleId: input.bundleId,
    ownerId: input.ownerId ?? input.id,
    x: input.x ?? 50,
    y: 20,
    width: 10,
    height: 16,
    scaleX: input.scale,
    scaleY: input.scale,
    opacity: input.opacity ?? 1,
    styleFingerprint: input.style ?? "KaTeX_Main|400|24px",
    structureFingerprint: input.structure ?? "span.mord.textord"
  };
}

test("t-epsilon diagnostics accept one opaque shared-zero-area junction", () => {
  const report = evaluateKpPaintContinuityBoundary({
    plan,
    boundaryProgress: 0.5,
    sample: (progress) => ({
      progress,
      observations: progress < 0.5
        ? [
            observation({
              id: "source.left",
              bundleId: "bundle.left",
              scale: 0.08,
              x: 49.9
            }),
            observation({
              id: "source.right",
              bundleId: "bundle.right",
              scale: 0.08,
              x: 50.1
            })
          ]
        : progress > 0.5
          ? [
              observation({
                id: "target",
                bundleId: "bundle.target",
                scale: 0.08
              })
            ]
          : [
              observation({
                id: "source.left",
                bundleId: "bundle.left",
                scale: 0
              }),
              observation({
                id: "source.right",
                bundleId: "bundle.right",
                scale: 0
              }),
              observation({
                id: "target",
                bundleId: "bundle.target",
                scale: 0
              })
            ]
    })
  });

  assert.equal(report.passed, true);
  assert.deepEqual(report.sampleProgresses, [0.499, 0.5, 0.501]);
});

test("diagnostics reject a visible hard swap at a shared junction", () => {
  const report = evaluateKpPaintContinuityBoundary({
    plan,
    boundaryProgress: 0.5,
    sample: (progress) => ({
      progress,
      observations: progress <= 0.5
        ? [
            observation({
              id: "source.left",
              bundleId: "bundle.left",
              scale: 1
            }),
            observation({
              id: "source.right",
              bundleId: "bundle.right",
              scale: 1
            })
          ]
        : [
            observation({
              id: "target",
              bundleId: "bundle.target",
              scale: 1
            })
          ]
    })
  });

  assert.equal(report.passed, false);
  assert.ok(report.diagnostics.some(({ code }) =>
    code === "paint.junction-nonzero"
  ));
});

test("diagnostics reject fading non-zero material paint", () => {
  const report = evaluateKpPaintContinuityBoundary({
    plan,
    boundaryProgress: 0.5,
    sample: (progress) => ({
      progress,
      observations: progress < 0.5
        ? [
            observation({
              id: "source.left",
              bundleId: "bundle.left",
              scale: 0.08,
              opacity: 0.5
            }),
            observation({
              id: "source.right",
              bundleId: "bundle.right",
              scale: 0.08
            })
          ]
        : progress > 0.5
          ? [
              observation({
                id: "target",
                bundleId: "bundle.target",
                scale: 0.08
              })
            ]
          : []
    })
  });

  assert.equal(report.passed, false);
  assert.ok(report.diagnostics.some(({ code }) =>
    code === "paint.non-opaque"
  ));
});

test("equivalent-pose transfer rejects font and geometry discontinuity", () => {
  const equivalentPlan = {
    ...plan,
    carriers: [{
      lineageId: "lineage.sum",
      sourceBundleIds: ["bundle.left"],
      targetBundleIds: ["bundle.target"],
      transferTopology: "paint-equivalent-pose"
    }]
  } as unknown as KpVerifiedPaintContinuityPlan;
  const report = evaluateKpPaintContinuityBoundary({
    plan: equivalentPlan,
    boundaryProgress: 0.5,
    sample: (progress) => ({
      progress,
      observations: progress <= 0.5
        ? [
            observation({
              id: "source.left",
              bundleId: "bundle.left",
              ownerId: "source",
              scale: 1,
              x: 40,
              style: "KaTeX_Main|400|24px"
            })
          ]
        : [
            observation({
              id: "target",
              bundleId: "bundle.target",
              ownerId: "target",
              scale: 1,
              x: 50,
              style: "system-ui|400|24px"
            })
          ]
    })
  });

  assert.equal(report.passed, false);
  const codes = new Set(report.diagnostics.map(({ code }) => code));
  assert.ok(codes.has("paint.owner-displacement"));
  assert.ok(codes.has("paint.owner-style"));
});
