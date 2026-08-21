import assert from "node:assert/strict";
import test from "node:test";

import {
  kpClosedRootEvaluationNativeEndpoints
} from "../src/rendering/closed-root-evaluation-native-endpoints.ts";
import {
  compileKpClosedRootEvaluationMotion
} from "../src/rendering/closed-root-evaluation-transit-session.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  sampleKpNativeKatexSceneTrackFrames
} from "../src/rendering/native-katex-scene-track-sampling.ts";
import type {
  KpRootRewriteNativeEndpoint
} from "../src/rendering/root-rewrite-native-endpoint.ts";
import {
  kpClosedRootEvaluationExemplar
} from "../src/semantic/closed-root-evaluation-exemplar.ts";

const ownerDocument = { defaultView: null };
const stage = { ownerDocument } as HTMLElement;

test("closed multi-glyph root evaluation carries exact semantic authority", () => {
  const exemplar = kpClosedRootEvaluationExemplar;
  assert.equal(exemplar.plan.operationClass, "closed-evaluation");
  assert.equal(exemplar.plan.execution, "atomic");
  assert.deepEqual(exemplar.plan.dispositions, [{
    kind: "fuse",
    sourceEntityIds: [
      "source.closed-root.radical",
      "source.closed-root.radicand.144"
    ],
    targetEntityIds: ["target.closed-root.value.12"],
    evidenceIds: [
      "evidence.root.sqrt-144.closed-value",
      "evidence.root.sqrt-144.exact-root"
    ]
  }]);
  assert.deepEqual(exemplar.arithmetic.rootValue, {
    index: 2,
    radicand: 144,
    value: 12,
    arithmeticEvidenceId: "evidence.arithmetic.twelve-squared-is-144"
  });
});

test("recursive endpoints preserve exact radical and multi-glyph value syntax", () => {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\sqrt{144}");
  assert.equal(target.annotated.rawLatex, "12");
  assert.deepEqual(source.nodes.map(({ role, occurrence, parentEntityId }) => ({
    role,
    entityId: occurrence.entityId,
    parentEntityId
  })), [{
    role: "radical",
    entityId: "source.closed-root.radical",
    parentEntityId: undefined
  }, {
    role: "radicand",
    entityId: "source.closed-root.radicand.144",
    parentEntityId: "source.closed-root.radical"
  }]);
});

test("every source glyph contracts to one knot before result ink expands", () => {
  const motion = motionPlan();
  const sourceTracks = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.sourceContributorTrackIds.includes(id)
  );
  const resultTracks = motion.rendererPlan.tracks.filter(({ id }) =>
    motion.targetResultTrackIds.includes(id)
  );
  assert.equal(sourceTracks.length, 4);
  assert.equal(resultTracks.length, 2);
  assert.ok(sourceTracks.every(({ lifecycle, timingGroupId,
    intentionalContactGroupId }) => lifecycle === "eliminate" &&
    timingGroupId === motion.fusion.timingGroupId &&
    intentionalContactGroupId === motion.fusion.intentionalContactGroupId));
  assert.ok(resultTracks.every(({ lifecycle, timingGroupId,
    intentionalContactGroupId }) => lifecycle === "introduce" &&
    timingGroupId === motion.fusion.timingGroupId &&
    intentionalContactGroupId === motion.fusion.intentionalContactGroupId));

  const knot = sampleKpNativeKatexSceneTrackFrames(
    motion.rendererPlan.tracks,
    0.5,
    false
  );
  const knotCenters = knot.filter(({ trackId }) =>
    motion.sourceContributorTrackIds.includes(trackId)
  ).map(({ expectedPaintRect }) => {
    assert.ok(expectedPaintRect);
    return center(expectedPaintRect);
  });
  const [firstCenter, ...remainingCenters] = knotCenters;
  assert.ok(firstCenter);
  assert.ok(remainingCenters.every((candidate) =>
    Math.hypot(
      candidate.x - firstCenter.x,
      candidate.y - firstCenter.y
    ) < 0.01
  ));
  assert.ok(sourceTracks.every(({ sampleMaterialScale }) => {
    const scale = sampleMaterialScale?.(0.5) ?? 1;
    return scale > 0 && scale < 0.6;
  }));
  assert.ok(resultTracks.every(({ sampleMaterialScale }) => {
    const scale = sampleMaterialScale?.(0.52) ?? 1;
    return scale > 0 && scale < 0.6;
  }));
});

test("closed evaluation is deterministic and settles at native target ink", () => {
  const motion = motionPlan();
  const tracks = motion.rendererPlan.tracks;
  const direct = sampleKpNativeKatexSceneTrackFrames(tracks, 0.47, false);
  sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  assert.deepEqual(
    sampleKpNativeKatexSceneTrackFrames(tracks, 0.47, false),
    direct
  );
  const targetByAtom = new Map(
    motion.rendererPlan.reconciliation.target.atoms.map((atom) =>
      [atom.id, atom] as const
    )
  );
  const end = sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  for (const track of tracks.filter(({ id }) =>
    motion.targetResultTrackIds.includes(id))) {
    assert.ok(track.targetAtomId);
    const frame = end.find(({ trackId }) => trackId === track.id);
    assert.deepEqual(
      frame?.expectedPaintRect,
      targetByAtom.get(track.targetAtomId)?.rect
    );
    assert.equal(frame?.opacity, 1);
  }
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/u);
});

test("fusion fails closed when recursive source paint is incomplete", () => {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  assert.throws(() => compileKpClosedRootEvaluationMotion({
    exemplar: kpClosedRootEvaluationExemplar,
    endpoints: kpClosedRootEvaluationNativeEndpoints,
    source: observation(source, sourcePaint().filter(({ entityId }) =>
      entityId !== "source.closed-root.radical"
    )),
    target: observation(target, targetPaint())
  }), /every source contributor/u);
});

function motionPlan() {
  const { source, target } = kpClosedRootEvaluationNativeEndpoints;
  return compileKpClosedRootEvaluationMotion({
    exemplar: kpClosedRootEvaluationExemplar,
    endpoints: kpClosedRootEvaluationNativeEndpoints,
    source: observation(source, sourcePaint()),
    target: observation(target, targetPaint())
  });
}

interface PaintFixture {
  readonly entityId: string;
  readonly rect: Rect;
  readonly paintKind: "glyph" | "path";
  readonly visualKey: string;
}

interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function sourcePaint(): readonly PaintFixture[] {
  return [
    paint("source.closed-root.radical", 6, 8, 16, 34, "path",
      "path:radical"),
    paint("source.closed-root.radicand.144", 25, 18, 8, 20, "glyph",
      "glyph:1"),
    paint("source.closed-root.radicand.144", 35, 18, 9, 20, "glyph",
      "glyph:4"),
    paint("source.closed-root.radicand.144", 46, 18, 9, 20, "glyph",
      "glyph:4")
  ];
}

function targetPaint(): readonly PaintFixture[] {
  return [
    paint("target.closed-root.value.12", 29, 18, 8, 20, "glyph", "glyph:1"),
    paint("target.closed-root.value.12", 39, 18, 8, 20, "glyph", "glyph:2")
  ];
}

function paint(
  entityId: string,
  left: number,
  top: number,
  width: number,
  height: number,
  paintKind: PaintFixture["paintKind"],
  visualKey: string
): PaintFixture {
  return { entityId, rect: { left, top, width, height }, paintKind, visualKey };
}

function observation(
  endpoint: KpRootRewriteNativeEndpoint,
  fixtures: readonly PaintFixture[]
) {
  const root = { ownerDocument } as HTMLElement;
  const nodes = new Map(endpoint.nodes.map((node) =>
    [node.occurrence.entityId, node] as const
  ));
  const atoms = fixtures.map((fixture, index) => {
    const node = nodes.get(fixture.entityId);
    if (node === undefined) {
      throw new Error(`Missing endpoint node ${fixture.entityId}.`);
    }
    return atom(endpoint.endpoint, fixture, node.presentationGroupId, index,
      root);
  });
  const atomIdsByEntity = new Map<string, string[]>();
  fixtures.forEach((fixture, index) => {
    const ids = atomIdsByEntity.get(fixture.entityId) ?? [];
    ids.push(atoms[index]!.id);
    atomIdsByEntity.set(fixture.entityId, ids);
  });
  const descendants = (entityId: string): readonly string[] => [
    ...(atomIdsByEntity.get(entityId) ?? []),
    ...endpoint.nodes.filter(({ parentEntityId }) =>
      parentEntityId === entityId
    ).flatMap(({ occurrence }) => descendants(occurrence.entityId))
  ];
  const atomById = new Map(atoms.map((entry) => [entry.id, entry] as const));
  const groups = endpoint.nodes.map((node) => {
    const atomIds = descendants(node.occurrence.entityId);
    const rect = union(atomIds.map((id) => atomById.get(id)!.rect));
    const parentGroupId = node.parentEntityId === undefined
      ? endpoint.rootPresentationGroupId
      : nodes.get(node.parentEntityId)!.presentationGroupId;
    return {
      id: node.presentationGroupId,
      semanticEntityId: node.occurrence.entityId,
      parentGroupId,
      atomIds,
      rect,
      sourceElement: unreadableElement(root),
      styleFingerprint: "font-family:KaTeX_Main",
      baselineY: rect.top + rect.height * 0.8
    };
  });
  groups.unshift({
    id: endpoint.rootPresentationGroupId,
    semanticEntityId: endpoint.stateId,
    parentGroupId: undefined as unknown as string,
    atomIds: atoms.map(({ id }) => id),
    rect: union(atoms.map(({ rect }) => rect)),
    sourceElement: unreadableElement(root),
    styleFingerprint: "font-family:KaTeX_Main",
    baselineY: 36
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: endpoint.endpoint,
    stage,
    root,
    atoms,
    groups: groups.map((group) => group.parentGroupId === undefined
      ? (({ parentGroupId: _ignored, ...rest }) => rest)(group)
      : group),
    fontRevision: 2,
    viewportKey: `${endpoint.endpoint}:closed-root:font-2`
  });
}

function atom(
  side: "source" | "target",
  fixture: PaintFixture,
  presentationGroupId: string,
  index: number,
  root: HTMLElement
): KpNativeKatexPaintAtomObservation {
  return {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `${side}.paint.${index}`,
    endpoint: side,
    semanticEntityId: fixture.entityId,
    presentationGroupId,
    paintKind: fixture.paintKind,
    paintMeasurement: fixture.paintKind === "glyph"
      ? "atomic-text"
      : "subtree",
    visualKey: fixture.visualKey,
    sourceElement: unreadableElement(root),
    rect: fixture.rect,
    baselineY: fixture.rect.top + fixture.rect.height * 0.8,
    styleFingerprint: "font-family:KaTeX_Main",
    zOrder: index,
    fontRevision: 2
  };
}

function unreadableElement(root: HTMLElement): HTMLElement {
  return {
    ownerDocument,
    parentElement: null,
    contains: (value: unknown) => value === root,
    getBoundingClientRect(): never {
      throw new Error("closed-root fixture attempted DOM remeasurement");
    }
  } as unknown as HTMLElement;
}

function union(rects: readonly Rect[]): Rect {
  assert.ok(rects.length > 0, "fixture group must own at least one paint atom");
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: Rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
