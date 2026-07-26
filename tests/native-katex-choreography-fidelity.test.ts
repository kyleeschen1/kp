import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpNativeKatexChoreographyFidelity
} from "../src/rendering/native-katex-choreography-fidelity.ts";
import type {
  KpNativeKatexSceneReconciliation,
  KpNativeKatexSceneTrack
} from "../src/rendering/native-katex-scene-compositor.ts";

const sourceEntityIds = ["power.numerator", "power.rule", "power.denominator"];
const targetEntityIds = ["radical.hook", "radical.overbar"];
const reconciliation = {
  dispositions: [
    {
      id: "source-notation",
      lifecycle: "eliminate",
      semanticEntityIds: sourceEntityIds
    },
    {
      id: "target-notation",
      lifecycle: "introduce",
      semanticEntityIds: targetEntityIds
    }
  ]
} as unknown as KpNativeKatexSceneReconciliation;
const tracks = [
  {
    componentId: "component.source-notation",
    lifecycle: "eliminate"
  },
  {
    componentId: "component.target-notation",
    lifecycle: "introduce"
  }
] as unknown as readonly KpNativeKatexSceneTrack[];
const intent = {
  kind: "equation-structural-succession-intent" as const,
  id: "intent.power-as-root",
  motifKind: "radical-corner-transfer",
  sourceEntityIds,
  targetEntityIds,
  actPhaseIds: ["radical-representation-handoff"],
  paintStrategy: {
    kind: "solid-mask-succession" as const,
    profileId: "test-profile",
    morph: { start: 0, end: 1, easing: "linear" as const },
    settlement: { start: 1, end: 1, easing: "linear" as const },
    solidMask: {
      maximumDistancePx: 1,
      edgeSoftnessPx: 1,
      boundsPaddingPx: 1,
      sourceTravelFraction: 1,
      sourceArcHeightPx: 0,
      shapeLeadFraction: 0,
      targetGrowthOriginXFraction: 0.5,
      targetGrowthOriginYFraction: 0.5,
      targetGrowthSoftnessPx: 1,
      bridgeExpansionPx: 0,
      endpointBlendFraction: 0
    }
  }
};

test("fade-only atom tracks cannot satisfy structural succession intent", () => {
  const report = auditKpNativeKatexChoreographyFidelity({
    intent,
    strategy: {
      kind: "atom-tracks",
      actPhaseIds: []
    },
    reconciliation,
    tracks
  });

  assert.equal(report.passed, false);
  assert.deepEqual(report.issues.map(({ code }) => code), [
    "choreography.structural-strategy-missing",
    "choreography.fade-dominant-succession",
    "choreography.act-phase-empty"
  ]);
});

test("solid succession and explicit checkpoint settlement are valid outcomes", () => {
  for (const strategy of [{
    kind: "solid-mask-succession" as const,
    actPhaseIds: ["radical-representation-handoff"]
  }, {
    kind: "checkpoint-settlement" as const,
    actPhaseIds: ["radical-representation-handoff"],
    reason: "reduced-motion"
  }]) {
    const report = auditKpNativeKatexChoreographyFidelity({
      intent,
      strategy,
      reconciliation,
      tracks
    });
    assert.equal(report.passed, true);
    assert.deepEqual(report.issues, []);
  }
});
