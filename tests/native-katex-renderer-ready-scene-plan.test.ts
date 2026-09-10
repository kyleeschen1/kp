import assert from "node:assert/strict";
import test from "node:test";
import { createKpNativeKatexRendererSession } from "../src/rendering/native-katex-scene-compositor.ts";

import {
  createKpNativeKatexRendererReadyScenePlan,
  createKpNativeKatexSceneAssembly,
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

test("ready-plan issuance cannot replace inspected tracks with matching identities", () => {
  const stage = {} as HTMLElement;
  const base = createMinimalPlan(stage);
  const original = track("x");
  const assembly = createKpNativeKatexSceneAssembly({ ...base.reconciliation, tracks: [original], contributions: [] });
  const ready = { ...base, tracks: assembly.tracks, sceneAssembly: assembly };
  assert.doesNotThrow(() => createKpNativeKatexRendererReadyScenePlan(ready));
  assert.throws(() => createKpNativeKatexRendererReadyScenePlan({ ...ready, tracks: [{ ...assembly.tracks[0]! }] }), /exact issued/);
  assert.throws(() => createKpNativeKatexRendererReadyScenePlan({ ...ready, sceneAssembly: { ...assembly } }), /exact issued/);
  assert.notEqual(assembly.tracks[0], original);
  assert.equal(Object.isFrozen(assembly.tracks[0]!.startRect), true);
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

test("ready-plan issuance rejects unchecked extension paint before invoking it", () => {
  const stage = {} as HTMLElement;
  let samples = 0;
  const owner = { ownerId: "unmeasured", sourceElement: {} as HTMLElement,
    rect: { left: 0, top: 0, width: 10, height: 10 }, opacity: 1, transform: "none" };
  assert.throws(() => createMinimalPlan(stage, stage, [], undefined, {
    // @ts-expect-error Retired callbacks cannot enter renderer-ready plans.
    supplementalMaterialOwners: () => { samples++; return [owner, owner]; }
  }), /Unchecked supplemental paint is retired/);
  assert.equal(samples, 0, "An unauthenticated callback never executes.");
});

test("an ordinary-track inspection payload cannot authorize extension paint", () => {
  const stage = {} as HTMLElement;
  const audit = certificate();
  assert.throws(() => createMinimalPlan(stage, stage, [], undefined, {
    protectedTransit: audit,
    // @ts-expect-error Independent inspection metadata cannot authorize a sampler.
    supplementalMaterialOwners: () => [{ ownerId: "later", sourceElement: {} as HTMLElement,
      rect: { left: 500, top: 200, width: 10, height: 10 }, opacity: 1, transform: "none" }]
  }), /Unchecked supplemental paint is retired/);
});

test("raw renderer rejects legacy callbacks before touching DOM with or without assembly", () => {
  const stage = {} as HTMLElement;
  const base = createMinimalPlan(stage);
  const assembly = createKpNativeKatexSceneAssembly({ ...base.reconciliation, tracks: [], contributions: [] });
  for (const sceneAssembly of [undefined, assembly]) {
    assert.throws(() => createKpNativeKatexRendererSession({ stage,
      sourceRoot: base.reconciliation.source.root, targetRoot: base.reconciliation.target.root,
      reconciliation: base.reconciliation, tracks: assembly.tracks, sceneAssembly,
      // @ts-expect-error The lower-level renderer has no unchecked paint channel either.
      supplementalMaterialOwners: () => []
    }), /Unchecked supplemental paint is retired/);
  }
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
