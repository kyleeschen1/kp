import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexRendererReadyScenePlan,
  isKpNativeKatexRendererReadyScenePlan,
  type KpNativeKatexPaintMeasuredSceneTrack
} from "../src/rendering/native-katex-base-scene-plan.ts";
import type {
  KpEquationProtectedTransitCertificate
} from "../src/rendering/equation-protected-transit-types.ts";

test("renderer-ready plans are immutable one-session handoffs", () => {
  const stage = {} as HTMLElement;
  const source = observation("source", stage);
  const target = observation("target", stage);
  const tracks = [track("track.x")];
  const reconciliation = Object.freeze({
    kind: "native-katex-scene-reconciliation" as const,
    lifecycle: "renderer-session" as const,
    source,
    target,
    dispositions: Object.freeze([])
  });
  const plan = createKpNativeKatexRendererReadyScenePlan({
    reconciliation,
    hierarchy: Object.freeze({
      kind: "native-katex-hierarchical-scene-plan",
      lifecycle: "renderer-session",
      reconciliation,
      components: Object.freeze([])
    }),
    tracks,
    protectedTransit: certificate(),
    disposition: Object.freeze({
      mode: "motion",
      reason: "clear",
      affectedIds: Object.freeze([])
    })
  });

  tracks.push(track("track.later"));
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.tracks), true);
  assert.equal(plan.tracks.length, 1);
  assert.equal(plan.lifecycle, "renderer-session-ephemeral");
  assert.equal(isKpNativeKatexRendererReadyScenePlan(plan), true);
  assert.equal(isKpNativeKatexRendererReadyScenePlan({ ...plan }), false);
});

test("renderer-ready plans reject durable serialization", () => {
  const stage = {} as HTMLElement;
  const plan = createMinimalPlan(stage);
  assert.throws(
    () => JSON.stringify(plan),
    /cannot enter durable state/
  );
  assert.equal("schemaVersion" in plan, false);
  assert.equal("clock" in plan, false);
  assert.equal("progress" in plan, false);
  assert.equal("apply" in plan, false);
});

test("renderer-ready plans reject cross-stage and duplicate-track input", () => {
  assert.throws(
    () => createMinimalPlan({} as HTMLElement, {} as HTMLElement),
    /share one measured stage/
  );
  const stage = {} as HTMLElement;
  assert.throws(
    () => createMinimalPlan(stage, stage, [track("same"), track("same")]),
    /unique measured track IDs/
  );
});

test("renderer-ready plans validate endpoint dwell without owning a clock", () => {
  const stage = {} as HTMLElement;
  assert.throws(
    () => createMinimalPlan(stage, stage, [], 0.5),
    /between zero and 0.25/
  );
  assert.equal(createMinimalPlan(stage).endpointDwellFraction, 0);
});

function createMinimalPlan(
  sourceStage: HTMLElement,
  targetStage = sourceStage,
  tracks: KpNativeKatexPaintMeasuredSceneTrack[] = [],
  endpointDwellFraction?: number
) {
  const source = observation("source", sourceStage);
  const target = observation("target", targetStage);
  const reconciliation = Object.freeze({
    kind: "native-katex-scene-reconciliation" as const,
    lifecycle: "renderer-session" as const,
    source,
    target,
    dispositions: Object.freeze([])
  });
  return createKpNativeKatexRendererReadyScenePlan({
    reconciliation,
    hierarchy: Object.freeze({
      kind: "native-katex-hierarchical-scene-plan",
      lifecycle: "renderer-session",
      reconciliation,
      components: Object.freeze([])
    }),
    tracks,
    protectedTransit: certificate(),
    disposition: Object.freeze({
      mode: "motion",
      reason: "clear",
      affectedIds: Object.freeze([])
    }),
    ...(endpointDwellFraction === undefined ? {} : { endpointDwellFraction })
  });
}

function observation(endpoint: "source" | "target", stage: HTMLElement) {
  return Object.freeze({
    kind: "native-katex-rendered-scene-observation" as const,
    lifecycle: "renderer-session" as const,
    endpoint,
    stage,
    root: {} as HTMLElement,
    atoms: Object.freeze([]),
    groups: Object.freeze([]),
    fontRevision: 1,
    viewportKey: "wide"
  });
}

function track(id: string): KpNativeKatexPaintMeasuredSceneTrack {
  return Object.freeze({
    id,
    componentId: "component.x",
    lifecycle: "persist",
    visualAtomId: "atom.x",
    sourceAtomId: "atom.x",
    targetAtomId: "atom.x",
    paintKind: "glyph",
    sizingMode: "rect",
    startRect: Object.freeze({ left: 0, top: 0, width: 10, height: 10 }),
    endRect: Object.freeze({ left: 10, top: 0, width: 10, height: 10 }),
    startOpacity: 1,
    endOpacity: 1,
    startPaintRect: Object.freeze({
      left: 0, top: 0, width: 10, height: 10
    }),
    endPaintRect: Object.freeze({
      left: 10, top: 0, width: 10, height: 10
    })
  });
}

function certificate(): KpEquationProtectedTransitCertificate {
  return Object.freeze({
    kind: "equation-protected-transit-certificate" as const,
    geometryAuthority: "measured-visible-paint" as const,
    sampleCount: 0,
    inspectedPairCount: 0,
    opacityScheduledTrackIds: Object.freeze([]),
    rescheduledComponentIds: Object.freeze([]),
    routedComponentIds: Object.freeze([]),
    routedTrackIds: Object.freeze([])
  }) as unknown as KpEquationProtectedTransitCertificate;
}
