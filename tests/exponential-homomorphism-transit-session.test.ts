import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExponentialHomomorphismNativeEndpoints,
  type KpExponentialNativeEndpoint
} from "../src/rendering/exponential-homomorphism-native-endpoints.ts";
import {
  compileKpExponentialHomomorphismTransitPlan,
  kpExponentialHomomorphismTransitProfile,
  projectKpExponentialHomomorphismNativePaintRelations
} from "../src/rendering/exponential-homomorphism-transit-session.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  sampleKpNativeKatexSceneTracks
} from "../src/rendering/native-katex-scene-compositor.ts";
import {
  compileKpExponentialHomomorphismCorrespondence
} from "../src/semantic/exponential-homomorphism-correspondence.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "../src/semantic/power-application-endpoint-normalizer.ts";

const normalized = normalizeKpPowerApplicationEndpoint("b^{x+y}");
if (normalized.status !== "normalized") {
  throw new Error("Transit fixture requires normalized power authority.");
}
const authority = compileKpExponentialHomomorphismCorrespondence({
  id: "exponential.sum-to-product.transit.xy",
  source: normalized.endpoint,
  baseReferentId: "semantic.exponential.base.b",
  operandReferentIds: [
    "semantic.exponential.operand.x",
    "semantic.exponential.operand.y"
  ]
});
const endpoints = createKpExponentialHomomorphismNativeEndpoints(authority);
const measured = measuredEndpoints();

test("transit projects only payload continuants and base fission into paint", () => {
  const relations = projectKpExponentialHomomorphismNativePaintRelations(
    authority
  );
  assert.equal(relations.length, 3);
  assert.deepEqual(relations.map(({ relation }) => relation), [
    "persist",
    "persist",
    "split"
  ]);
  assert.equal(relations.some(({ sourceEntityIds }) =>
    sourceEntityIds.some((id) => id.includes("combination"))
  ), false);
});

test("one compositor plan stages connector release and direct horizontal transit", () => {
  const plan = compilePlan();
  assert.equal(plan.copyFanOut, false);
  assert.equal(
    plan.endpointDwellFraction,
    kpExponentialHomomorphismTransitProfile.terminalSettlementFraction
  );
  assert.equal(plan.protectedTransit.geometryAuthority, "measured-visible-paint");
  assert.equal(plan.tracks.length, 5);

  const connector = trackFor(plan.tracks, "eliminate");
  const beforeRelease = frameFor(plan.tracks, connector.id, 0.04);
  const afterRelease = frameFor(plan.tracks, connector.id, 0.2);
  assert.equal(beforeRelease.opacity, 1);
  assert.equal(afterRelease.opacity, 0);
  assert.deepEqual(beforeRelease.rect, afterRelease.rect);

  const payloads = plan.tracks.filter(({ lifecycle }) =>
    lifecycle === "persist"
  );
  assert.equal(payloads.length, 2);
  assert.ok(payloads.every(({ motionAxisConstraint }) =>
    motionAxisConstraint === "horizontal"
  ));
  assert.ok(payloads.every(({ semanticMotionUnitId }) =>
    semanticMotionUnitId ===
      `motion-unit.${authority.id}.payloads`
  ));

  const bases = plan.tracks.filter(({ lifecycle }) => lifecycle === "split");
  assert.equal(bases.length, 2);
  assert.equal(new Set(bases.map(({ intentionalContactGroupId }) =>
    intentionalContactGroupId
  )).size, 1);
  assert.ok(bases.every(({ motionAxisConstraint }) =>
    motionAxisConstraint === "horizontal"
  ));
  const foregroundPair = plan.tracks.filter(
    ({ intentionalForegroundOcclusion }) =>
      intentionalForegroundOcclusion !== undefined
  );
  assert.equal(foregroundPair.length, 2);
  assert.deepEqual(
    new Set(foregroundPair.map(({ intentionalForegroundOcclusion }) =>
      intentionalForegroundOcclusion?.role)),
    new Set(["occluder", "occluded"])
  );
  assert.equal(foregroundPair.every(({ intentionalForegroundOcclusion }) =>
    intentionalForegroundOcclusion?.progressWindow ===
      kpExponentialHomomorphismTransitProfile.basePayloadForegroundCrossing
  ), true);
});

test("sampled motion is deterministic under direct seek and rewind", () => {
  const tracks = compilePlan().tracks;
  const middleA = sampleKpNativeKatexSceneTracks(tracks, 0.48, false);
  sampleKpNativeKatexSceneTracks(tracks, 0.91, false);
  const startAfterReverse = sampleKpNativeKatexSceneTracks(tracks, 0, false);
  const middleB = sampleKpNativeKatexSceneTracks(tracks, 0.48, false);
  assert.deepEqual(middleB, middleA);
  assert.ok(startAfterReverse.every(({ rect }, index) =>
    sameRect(rect, tracks[index]!.startRect)
  ));
  const target = sampleKpNativeKatexSceneTracks(tracks, 1, false);
  assert.ok(target.every(({ rect }, index) =>
    sameRect(rect, tracks[index]!.endRect)
  ));
});

test("payload and base tracks complete without terminal geometry changes", () => {
  const tracks = compilePlan().tracks;
  const settled = sampleKpNativeKatexSceneTracks(tracks, 0.72, false);
  const target = sampleKpNativeKatexSceneTracks(tracks, 1, false);
  for (const track of tracks.filter(({ lifecycle }) =>
    lifecycle === "persist" || lifecycle === "split"
  )) {
    const index = tracks.indexOf(track);
    assert.deepEqual(settled[index]?.rect, target[index]?.rect);
  }
});

test("transit rejects endpoint paint outside correspondence authority", () => {
  const foreignSource = createKpNativeKatexRenderedSceneObservation({
    ...sceneInput("source"),
    atoms: measured.source.atoms.map((atom, index) => index === 0
      ? { ...atom, semanticEntityId: "foreign.base" }
      : atom)
  });
  assert.throws(() => compileKpExponentialHomomorphismTransitPlan({
    authority,
    sourceEndpoint: endpoints.source,
    targetEndpoint: endpoints.target,
    source: foreignSource,
    target: measured.target
  }), /does not close over semantic occurrences/u);
});

function compilePlan() {
  return compileKpExponentialHomomorphismTransitPlan({
    authority,
    sourceEndpoint: endpoints.source,
    targetEndpoint: endpoints.target,
    source: measured.source,
    target: measured.target
  });
}

function measuredEndpoints() {
  const ownerDocument = {};
  const stage = { ownerDocument } as HTMLElement;
  const sourceRoot = { ownerDocument } as HTMLElement;
  const targetRoot = { ownerDocument } as HTMLElement;
  const sourceAtoms = [
    atom(endpoints.source, "base", 0, "b", 12, 34, 12, 18,
      sourceRoot, "source"),
    atom(endpoints.source, "exponent-payload", 0, "x", 25, 18, 8, 12,
      sourceRoot, "source"),
    atom(endpoints.source, "combination-connector", 0, "+", 35, 18, 9, 12,
      sourceRoot, "source"),
    atom(endpoints.source, "exponent-payload", 1, "y", 46, 18, 8, 12,
      sourceRoot, "source")
  ];
  const targetAtoms = [
    atom(endpoints.target, "base", 0, "b", 8, 34, 12, 18,
      targetRoot, "target"),
    atom(endpoints.target, "exponent-payload", 0, "x", 21, 18, 8, 12,
      targetRoot, "target"),
    atom(endpoints.target, "base", 1, "b", 42, 34, 12, 18,
      targetRoot, "target"),
    atom(endpoints.target, "exponent-payload", 1, "y", 55, 18, 8, 12,
      targetRoot, "target")
  ];
  return {
    source: createKpNativeKatexRenderedSceneObservation({
      endpoint: "source",
      stage,
      root: sourceRoot,
      atoms: sourceAtoms,
      groups: sourceAtoms.map(groupFor),
      fontRevision: 4,
      viewportKey: "source:wide@1:font-4"
    }),
    target: createKpNativeKatexRenderedSceneObservation({
      endpoint: "target",
      stage,
      root: targetRoot,
      atoms: targetAtoms,
      groups: targetAtoms.map(groupFor),
      fontRevision: 4,
      viewportKey: "target:wide@1:font-4"
    })
  };
}

function sceneInput(
  side: "source" | "target"
) {
  const selected = side === "source" ? measured.source : measured.target;
  return {
    endpoint: side,
    stage: selected.stage,
    root: selected.root,
    groups: selected.groups,
    fontRevision: selected.fontRevision,
    viewportKey: selected.viewportKey
  } as const;
}

function atom(
  endpoint: KpExponentialNativeEndpoint,
  role: KpExponentialNativeEndpoint["nodes"][number]["role"],
  ordinal: number,
  glyph: string,
  left: number,
  top: number,
  width: number,
  height: number,
  sourceElement: HTMLElement,
  side: "source" | "target"
): KpNativeKatexPaintAtomObservation {
  const node = endpoint.nodes.find((candidate) =>
    candidate.role === role && candidate.ordinal === ordinal
  );
  if (node === undefined) throw new Error(`Missing ${side} ${role}[${ordinal}].`);
  return Object.freeze({
    kind: "native-katex-paint-atom-observation" as const,
    lifecycle: "renderer-session" as const,
    id: `${side}.paint.${role}.${ordinal}`,
    endpoint: side,
    semanticEntityId: node.occurrenceId,
    presentationGroupId: node.presentationGroupId,
    paintKind: "glyph" as const,
    paintMeasurement: "atomic-text" as const,
    visualKey: `glyph:${glyph}`,
    sourceElement,
    rect: Object.freeze({ left, top, width, height }),
    baselineY: top + height,
    styleFingerprint: "font-family:KaTeX_Main|font-size:32px",
    zOrder: ordinal,
    fontRevision: 4
  });
}

function groupFor(atomValue: KpNativeKatexPaintAtomObservation) {
  return Object.freeze({
    id: atomValue.presentationGroupId,
    semanticEntityId: atomValue.semanticEntityId,
    atomIds: Object.freeze([atomValue.id]),
    rect: atomValue.rect
  });
}

function trackFor(
  tracks: ReturnType<typeof compilePlan>["tracks"],
  lifecycle: "eliminate"
) {
  const track = tracks.find((candidate) => candidate.lifecycle === lifecycle);
  if (track === undefined) throw new Error(`Missing ${lifecycle} track.`);
  return track;
}

function frameFor(
  tracks: ReturnType<typeof compilePlan>["tracks"],
  trackId: string,
  progress: number
) {
  const frame = sampleKpNativeKatexSceneTracks(tracks, progress, false)
    .find(({ trackId: candidateId }) => candidateId === trackId);
  if (frame === undefined) throw new Error(`Missing frame ${trackId}.`);
  return frame;
}

function sameRect(
  left: { left: number; top: number; width: number; height: number },
  right: { left: number; top: number; width: number; height: number }
) {
  return left.left === right.left && left.top === right.top &&
    left.width === right.width && left.height === right.height;
}
