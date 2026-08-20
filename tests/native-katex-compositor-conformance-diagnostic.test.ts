import assert from "node:assert/strict";
import test from "node:test";

import { assessKpNativeKatexCompositorContinuity } from
  "./support/native-katex-compositor-continuity-laws.ts";
import {
  createKpNativeKatexCompositorDiagnosticReport,
  serializeKpNativeKatexCompositorDiagnosticReport
} from "./support/native-katex-compositor-diagnostic-report.ts";
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

function makeTrace(materialSeamTop: number) {
  return createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 7,
    fontRevision: 4,
    viewportKey: "1280x720@1",
    samples: slots.map((slot, index) => {
      const owner = expectedKpNativeKatexOwnerForSampleSlot(slot);
      const top = index === 1 ? materialSeamTop : 10;
      return {
        slot,
        progress: index / 4,
        owner,
        paintOpacityByOwner: {
          "native-source": owner === "native-source" ? 1 : 0,
          material: owner === "material" ? 1 : 0,
          "native-target": owner === "native-target" ? 1 : 0
        },
        observation: {
          kind: "native-katex-conformance-visible-ink" as const,
          measurementAuthority: "realized-paint" as const,
          coordinateSpace: "stage-layout-px" as const,
          shapeId: "shape.italic-x" as const,
          semanticEntityId: "carrier.x",
          rect: { left: 10, top, width: 8, height: 12 },
          baselineY: top + 10,
          effectiveOpacity: 1
        }
      };
    })
  });
}

test("emits stable structured seam diagnostics without screenshots", () => {
  const trace = makeTrace(24);
  const assessment = assessKpNativeKatexCompositorContinuity({ trace });
  const report = createKpNativeKatexCompositorDiagnosticReport({
    trace,
    assessment
  });
  const serialized = serializeKpNativeKatexCompositorDiagnosticReport(report);

  assert.equal(report.status, "failed");
  assert.deepEqual(report.failures[0]?.reasons, ["vertical-translation"]);
  assert.equal(report.failures[0]?.metrics.verticalTranslationPx, 14);
  assert.equal(report.samples.length, 5);
  assert.deepEqual(JSON.parse(serialized), report);
  assert.equal(serialized, serializeKpNativeKatexCompositorDiagnosticReport(report));
  assert.equal("screenshot" in report, false);
});

test("rejects a diagnostic assessment for another transition", () => {
  const trace = makeTrace(10);
  const assessment = {
    ...assessKpNativeKatexCompositorContinuity({ trace }),
    transitionId: "transition.other"
  };
  assert.throws(() => createKpNativeKatexCompositorDiagnosticReport({
    trace,
    assessment
  }), /do not match/u);
});
