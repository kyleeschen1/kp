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

test("one compositor plan stages persistent carrier fission", () => {
  const plan = compilePlan();
  assert.deepEqual(
    kpExponentialHomomorphismTransitProfile.baseHandoff,
    {
      topology: "native-scale-carrier-fission",
      sourceExit: "retain-native-carrier",
      targetEntry: "full-size-follower-peel"
    }
  );
  assert.deepEqual(
    kpExponentialHomomorphismTransitProfile.operandSeparation,
    {
      topology: "anchor-and-outward-separation",
      path: "direct-horizontal",
      anchorOrdinal: 0,
      anchorSettlement: { start: 0.16, end: 0.22 },
      outwardTransit: { start: 0.16, end: 0.3 },
      connectorContraction: { start: 0.16, end: 0.24 },
      connectorRelease: { start: 0.16, end: 0.3 }
    }
  );
  assert.equal(plan.copyFanOut, false);
  assert.equal(
    plan.endpointDwellFraction,
    kpExponentialHomomorphismTransitProfile.terminalSettlementFraction
  );
  assert.equal(plan.protectedTransit.geometryAuthority, "measured-visible-paint");
  assert.equal(plan.tracks.length, 5);

  const connector = trackFor(plan.tracks, "eliminate");
  const beforeRelease = frameFor(plan.tracks, connector.id, 0.1);
  const duringRelease = frameFor(plan.tracks, connector.id, 0.21);
  const afterRelease = frameFor(plan.tracks, connector.id, 0.34);
  assert.equal(beforeRelease.opacity, 1);
  assert.ok(duringRelease.opacity > 0 && duringRelease.opacity < 1);
  assert.equal(afterRelease.opacity, 0);
  assert.equal(beforeRelease.materialScale, 1);
  assert.ok(
    duringRelease.materialScale! >
      kpExponentialHomomorphismTransitProfile.connectorPointScale &&
    duringRelease.materialScale! < 1
  );
  assert.ok(near(
    afterRelease.materialScale!,
    kpExponentialHomomorphismTransitProfile.connectorPointScale
  ));
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
      `motion-unit.${authority.id}.operand-separation`
  ));
  assert.ok(payloads.every(({ motionPath }) => motionPath === undefined));
  assert.ok(payloads.every(({ timingGroupId }) =>
    timingGroupId === `timing.${authority.id}.operand-separation`
  ));
  assert.equal(
    connector.timingGroupId,
    `timing.${authority.id}.operand-separation`
  );
  assert.equal(
    connector.semanticMotionUnitId,
    `motion-unit.${authority.id}.operand-separation`
  );

  const anchor = trackForSourceAtom(
    payloads,
    "source.paint.exponent-payload.0"
  );
  const outward = trackForSourceAtom(
    payloads,
    "source.paint.exponent-payload.1"
  );
  assert.deepEqual(frameFor(payloads, anchor.id, 0.16).rect, anchor.startRect);
  assert.deepEqual(frameFor(payloads, anchor.id, 0.22).rect, anchor.endRect);
  assert.equal(
    sameRect(frameFor(payloads, outward.id, 0.22).rect, outward.endRect),
    false
  );
  assert.deepEqual(frameFor(payloads, outward.id, 0.3).rect, outward.endRect);

  const bases = plan.tracks.filter(({ lifecycle }) => lifecycle === "split");
  assert.equal(bases.length, 2);
  assert.ok(bases.every(({ motionAxisConstraint }) =>
    motionAxisConstraint === "horizontal"
  ));
  assert.ok(bases.every(({ sampleMaterialScale }) =>
    sampleMaterialScale === undefined
  ));
  const sourceBaseFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.1)
  );
  assert.deepEqual(
    sourceBaseFrames.map(({ opacity }) => opacity).sort(),
    [0, 1]
  );
  const nativeCarrierFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.22)
  ).filter(({ opacity }) => opacity > 0);
  assert.equal(nativeCarrierFrames.length, 1);
  assert.equal(nativeCarrierFrames[0]!.opacity, 1);
  assert.equal(nativeCarrierFrames[0]!.materialScale, undefined);
  const branchStartFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.36)
  );
  assert.deepEqual(
    branchStartFrames.map(({ opacity }) => opacity).sort(),
    [0, 1]
  );
  assert.ok(sameRect(branchStartFrames[0]!.rect, branchStartFrames[1]!.rect));
  const branchFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.52)
  );
  assert.ok(branchFrames.every(({ opacity, materialScale }) =>
    opacity === 1 && materialScale === undefined
  ));
  assert.equal(sameRect(branchFrames[0]!.rect, branchFrames[1]!.rect), false);
  const targetCenterFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.62)
  );
  assert.ok(targetCenterFrames.every((frame, index) =>
    frame.opacity === 1 && frame.materialScale === undefined &&
      sameRect(frame.rect, bases[index]!.endRect)
  ));
  const settledFrames = bases.map(({ id }) =>
    frameFor(plan.tracks, id, 0.66)
  );
  assert.ok(settledFrames.every(({ opacity, materialScale }, index) =>
    opacity === 1 && materialScale === undefined &&
      sameRect(settledFrames[index]!.rect, bases[index]!.endRect)
  ));
  for (const progress of [0, 0.2, 0.36, 0.42, 0.52, 0.62, 0.7]) {
    assert.ok(bases.some(({ id }) =>
      frameFor(plan.tracks, id, progress).opacity > 0
    ));
  }
  assert.equal(plan.tracks.some(({ intentionalForegroundOcclusion }) =>
    intentionalForegroundOcclusion !== undefined
  ), false);
});

test("carrier fission keeps measured base paint at native scale", () => {
  const bases = compilePlan().tracks.filter(({ lifecycle }) =>
    lifecycle === "split"
  );
  for (const progress of [0, 0.22, 0.4, 0.52, 0.62, 1]) {
    for (const base of bases) {
      const frame = frameFor(bases, base.id, progress);
      assert.equal(frame.materialScale, undefined);
      assert.deepEqual(frame.expectedPaintRect, frame.paintAlignmentRect);
    }
  }
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

function trackForSourceAtom(
  tracks: ReturnType<typeof compilePlan>["tracks"],
  sourceAtomId: string
) {
  const track = tracks.find((candidate) =>
    candidate.sourceAtomId === sourceAtomId
  );
  if (track === undefined) throw new Error(`Missing track for ${sourceAtomId}.`);
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

function near(left: number, right: number): boolean {
  return Math.abs(left - right) < Number.EPSILON;
}
