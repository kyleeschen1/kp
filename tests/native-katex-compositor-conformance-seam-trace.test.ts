import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexConformanceSeamTrace,
  expectedKpNativeKatexOwnerForSampleSlot,
  type KpNativeKatexConformanceSampleSlot,
  type KpNativeKatexConformanceSeamSample
} from "./support/native-katex-compositor-seam-trace.ts";

const slots = [
  "source-native",
  "source-material-seam",
  "material-midpoint",
  "material-target-seam",
  "target-native"
] as const satisfies readonly KpNativeKatexConformanceSampleSlot[];

function samples(): readonly KpNativeKatexConformanceSeamSample[] {
  return slots.map((slot, index) => {
    const owner = expectedKpNativeKatexOwnerForSampleSlot(slot);
    return {
      slot,
      progress: index / (slots.length - 1),
      owner,
      paintOpacityByOwner: {
        "native-source": owner === "native-source" ? 1 : 0,
        material: owner === "material" ? 1 : 0,
        "native-target": owner === "native-target" ? 1 : 0
      },
      observation: {
        kind: "native-katex-conformance-visible-ink",
        measurementAuthority: "realized-paint",
        coordinateSpace: "stage-layout-px",
        shapeId: "shape.italic-x",
        semanticEntityId: "carrier.x",
        rect: { left: index, top: 10, width: 8, height: 12 },
        baselineY: 20,
        effectiveOpacity: 1
      }
    };
  });
}

test("defines one ordered realized-paint trace across both ownership seams", () => {
  const trace = createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 3,
    fontRevision: 2,
    viewportKey: "1280x720@1",
    samples: samples()
  });

  assert.deepEqual(trace.samples.map(({ slot }) => slot), slots);
  assert.deepEqual(trace.samples.map(({ owner }) => owner), [
    "native-source",
    "material",
    "material",
    "material",
    "native-target"
  ]);
  assert.equal(trace.semanticEntityId, "carrier.x");
  assert.equal(trace.shapeId, "shape.italic-x");
});

test("rejects reordered ownership, progress, or semantic identity", () => {
  const wrongOwner = samples().map((sample, index) => index === 1
    ? { ...sample, owner: "native-source" as const }
    : sample);
  assert.throws(() => createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 1,
    fontRevision: 1,
    viewportKey: "desktop",
    samples: wrongOwner
  }), /must be owned by material/u);

  const wrongProgress = samples().map((sample, index) => index === 2
    ? { ...sample, progress: 0.1 }
    : sample);
  assert.throws(() => createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 1,
    fontRevision: 1,
    viewportKey: "desktop",
    samples: wrongProgress
  }), /progress must increase strictly/u);

  const wrongIdentity = samples().map((sample, index) => index === 4
    ? {
        ...sample,
        observation: { ...sample.observation, semanticEntityId: "carrier.y" }
      }
    : sample);
  assert.throws(() => createKpNativeKatexConformanceSeamTrace({
    transitionId: "transition.x",
    lifecycleRevision: 1,
    fontRevision: 1,
    viewportKey: "desktop",
    samples: wrongIdentity
  }), /preserve semantic entity and shape identity/u);
});
