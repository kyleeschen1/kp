import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyKpAnimationCatalogueSlotEvidence,
  type KpAnimationCatalogueSurfaceSlotEvidence
} from "../src/editor/animation-catalogue-host-observation.ts";

const readyEquation: KpAnimationCatalogueSurfaceSlotEvidence = {
  slotKind: "equation",
  adapterStatus: "ready",
  adapterId: "adapter.equation",
  painted: true
};

test("all required slots must carry adapter and paint evidence", () => {
  assert.deepEqual(
    classifyKpAnimationCatalogueSlotEvidence([readyEquation]),
    { status: "painted" }
  );
  assert.deepEqual(
    classifyKpAnimationCatalogueSlotEvidence([
      readyEquation,
      {
        slotKind: "graph",
        adapterStatus: "ready",
        adapterId: "adapter.graph",
        painted: true
      }
    ]),
    { status: "painted" }
  );
});

test("pending or placeholder slots cannot mint paint evidence", () => {
  const cases: readonly KpAnimationCatalogueSurfaceSlotEvidence[][] = [
    [{ ...readyEquation, adapterStatus: "pending" }],
    [{ ...readyEquation, adapterId: undefined }],
    [{ ...readyEquation, painted: false }],
    [{ ...readyEquation, surfaceReadiness: "preparing" }]
  ];

  for (const slots of cases) {
    assert.deepEqual(
      classifyKpAnimationCatalogueSlotEvidence(slots),
      { status: "not-observed" }
    );
  }
});

test("surface failure outranks fallback endpoint paint", () => {
  assert.deepEqual(
    classifyKpAnimationCatalogueSlotEvidence([{
      ...readyEquation,
      surfaceReadiness: "failed",
      surfaceError: "Native equation geometry failed to settle."
    }]),
    {
      status: "failed",
      message: "Native equation geometry failed to settle."
    }
  );
});

test("missing adapters remain hostability gaps rather than paint failures", () => {
  assert.deepEqual(
    classifyKpAnimationCatalogueSlotEvidence([
      readyEquation,
      {
        slotKind: "programming",
        adapterStatus: "missing",
        painted: false
      }
    ]),
    { status: "not-observed" }
  );
});

test("adapter-rendered unavailable state is an explicit paint failure", () => {
  assert.deepEqual(
    classifyKpAnimationCatalogueSlotEvidence([{
      ...readyEquation,
      unavailableMessage: "Equation payload unavailable."
    }]),
    {
      status: "failed",
      message: "Equation payload unavailable."
    }
  );
});
