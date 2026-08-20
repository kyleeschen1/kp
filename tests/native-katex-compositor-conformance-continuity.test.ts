import assert from "node:assert/strict";
import test from "node:test";

import {
  assessKpNativeKatexCompositorContinuity,
  kpNativeKatexCompositorContinuityTolerance
} from "./support/native-katex-compositor-continuity-laws.ts";
import {
  createKpNativeKatexConformanceSeamTrace,
  expectedKpNativeKatexOwnerForSampleSlot,
  type KpNativeKatexConformanceSampleSlot
} from "./support/native-katex-compositor-seam-trace.ts";

const slots = [
  "source-native",
  "source-material-seam",
  "material-midpoint",
  "material-target-seam",
  "target-native"
] as const satisfies readonly KpNativeKatexConformanceSampleSlot[];

function traceWith(overrides: Readonly<Record<number, {
  readonly left?: number;
  readonly top?: number;
  readonly width?: number;
  readonly height?: number;
  readonly baselineY?: number;
  readonly ownerOpacity?: number;
  readonly inactiveOpacity?: number;
}>> = {}) {
  return createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 1,
    fontRevision: 1,
    viewportKey: "desktop",
    samples: slots.map((slot, index) => {
      const owner = expectedKpNativeKatexOwnerForSampleSlot(slot);
      const override = overrides[index] ?? {};
      const paintOpacityByOwner = {
        "native-source": owner === "native-source"
          ? override.ownerOpacity ?? 1
          : override.inactiveOpacity ?? 0,
        material: owner === "material"
          ? override.ownerOpacity ?? 1
          : override.inactiveOpacity ?? 0,
        "native-target": owner === "native-target"
          ? override.ownerOpacity ?? 1
          : override.inactiveOpacity ?? 0
      };
      return {
        slot,
        progress: index / 4,
        owner,
        paintOpacityByOwner,
        observation: {
          kind: "native-katex-conformance-visible-ink" as const,
          measurementAuthority: "realized-paint" as const,
          coordinateSpace: "stage-layout-px" as const,
          shapeId: "shape.italic-x" as const,
          semanticEntityId: "carrier.x",
          rect: {
            left: override.left ?? (index < 2 ? 10 : index > 2 ? 30 : 20),
            top: override.top ?? 12,
            width: override.width ?? 8,
            height: override.height ?? 12
          },
          baselineY: override.baselineY ?? 22,
          effectiveOpacity: paintOpacityByOwner[owner]
        }
      };
    })
  });
}

test("passes continuous realized ink through both ownership seams", () => {
  const assessment = assessKpNativeKatexCompositorContinuity({
    trace: traceWith()
  });

  assert.equal(assessment.passed, true);
  assert.deepEqual(assessment.seams.map(({ passed }) => passed), [true, true]);
  assert.deepEqual(assessment.seams.flatMap(({ failureReasons }) =>
    failureReasons
  ), []);
});

test("classifies translation, scale, and paint-ownership discontinuities", () => {
  const assessment = assessKpNativeKatexCompositorContinuity({
    trace: traceWith({
      1: { left: 14, baselineY: 27, width: 4, ownerOpacity: 0.5 },
      4: { inactiveOpacity: 0.5 }
    })
  });

  assert.equal(assessment.passed, false);
  assert.deepEqual(assessment.seams[0]?.failureReasons, [
    "horizontal-translation",
    "vertical-translation",
    "scale-discontinuity",
    "active-owner-hidden"
  ]);
  assert.deepEqual(assessment.seams[1]?.failureReasons, [
    "inactive-owner-visible"
  ]);
});

test("keeps law thresholds explicit and aligned with the compositor seam", () => {
  assert.deepEqual(kpNativeKatexCompositorContinuityTolerance, {
    maximumSeamTranslationPx: 0.25,
    maximumSeamScaleRatio: 1.1,
    minimumActiveOwnerOpacity: 0.99,
    maximumInactiveOwnerOpacity: 0.01
  });
});
