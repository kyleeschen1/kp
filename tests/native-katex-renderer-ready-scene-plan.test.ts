import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexRendererReadyScenePlan,
  isKpNativeKatexRendererReadyScenePlan,
  KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION,
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

test("renderer-ready plans require terminal settlement without owning a clock", () => {
  const stage = {} as HTMLElement;
  assert.throws(
    () => createMinimalPlan(stage, stage, [], 0.5),
    /between 0.04 and 0.25/
  );
  assert.throws(
    () => createMinimalPlan(stage, stage, [], 0),
    /between 0.04 and 0.25/
  );
  assert.equal(
    createMinimalPlan(stage).endpointDwellFraction,
    KP_NATIVE_KATEX_TERMINAL_SETTLEMENT_FRACTION
  );
  assert.equal(createMinimalPlan(stage, stage, [], 0.08)
    .endpointDwellFraction, 0.08);
});

function createMinimalPlan(
  sourceStage: HTMLElement,
  targetStage = sourceStage,
  tracks: KpNativeKatexPaintMeasuredSceneTrack[] = [],
  endpointDwellFraction?: number,
  extension: Partial<Parameters<typeof createKpNativeKatexRendererReadyScenePlan>[0]> = {}
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
    ...(endpointDwellFraction === undefined ? {} : { endpointDwellFraction }),
    ...extension
  });
}

// Characterization of the pre-migration seam, not an accepted safety contract.
// The contribution migration must turn these admitted cases into rejections.
test("characterization: ready-plan issuance does not inspect extension paint or duplicate participants", () => {
  const stage = {} as HTMLElement;
  let samples = 0;
  const owner = { ownerId: "unmeasured", sourceElement: {} as HTMLElement,
    rect: { left: 0, top: 0, width: 10, height: 10 }, opacity: 1, transform: "none" };
  const plan = createMinimalPlan(stage, stage, [], undefined, {
    supplementalMaterialOwners: () => { samples++; return [owner, owner]; }
  });
  assert.equal(isKpNativeKatexRendererReadyScenePlan(plan), true);
  assert.equal(samples, 0, "Issuance never samples the actual contribution.");
  const frames = plan.supplementalMaterialOwners!(0.5);
  assert.equal(frames[0]!.expectedPaintRect, undefined);
  assert.equal(new Set(frames.map(frame => frame.ownerId)).size, 1);
  assert.equal(frames.length, 2);
});

test("characterization: another sampler can reuse the same unrelated inspection payload", () => {
  const stage = {} as HTMLElement;
  const audit = certificate();
  const first = createMinimalPlan(stage, stage, [], undefined, {
    protectedTransit: audit, supplementalMaterialOwners: () => []
  });
  const second = createMinimalPlan(stage, stage, [], undefined, {
    protectedTransit: audit,
    supplementalMaterialOwners: () => [{ ownerId: "later", sourceElement: {} as HTMLElement,
      rect: { left: 500, top: 200, width: 10, height: 10 }, opacity: 1, transform: "none" }]
  });
  assert.equal(first.protectedTransit, second.protectedTransit);
  assert.notEqual(first.supplementalMaterialOwners, second.supplementalMaterialOwners);
  assert.equal(isKpNativeKatexRendererReadyScenePlan(second), true);
  assert.equal(second.supplementalMaterialOwners!(0.5).length, 1);
});

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
