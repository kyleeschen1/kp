import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCompoundRootCarrierNativeEndpoints
} from "../src/rendering/compound-root-carrier-native-endpoints.ts";
import {
  compileKpCompoundRootCarrierMotion
} from "../src/rendering/compound-root-carrier-transit-session.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import { sampleKpNativeKatexSceneTrackFrames } from
  "../src/rendering/native-katex-scene-track-sampling.ts";
import type { KpRootRewriteNativeEndpoint } from
  "../src/rendering/root-rewrite-native-endpoint.ts";
import { kpCompoundRootCarrierExemplar } from
  "../src/semantic/compound-root-carrier-exemplar.ts";

const ownerDocument = { defaultView: null };
const stage = { ownerDocument } as HTMLElement;

test("semantic exemplar projects exact recursive native endpoints", () => {
  const { source, target } = kpCompoundRootCarrierNativeEndpoints;
  assert.equal(source.annotated.rawLatex, "\\sqrt{(x+1)^{2}}");
  assert.equal(target.annotated.rawLatex, "\\lvertx+1\\rvert");
  assert.deepEqual(target.nodes.filter(({ role }) =>
    role === "enclosure-leading" || role === "enclosure-trailing"
  ).map(({ occurrence, role }) => ({ entityId: occurrence.entityId, role })), [{
    entityId: "target.absolute-value.leading",
    role: "enclosure-leading"
  }, {
    entityId: "target.absolute-value.trailing",
    role: "enclosure-trailing"
  }]);
});

test("motion preserves one opaque compound carrier and wraps it horizontally", () => {
  const source = observation(kpCompoundRootCarrierNativeEndpoints.source,
    sourcePaint());
  const target = observation(kpCompoundRootCarrierNativeEndpoints.target,
    targetPaint());
  const motion = compileKpCompoundRootCarrierMotion({
    exemplar: kpCompoundRootCarrierExemplar,
    endpoints: kpCompoundRootCarrierNativeEndpoints,
    source,
    target
  });
  const tracks = motion.rendererPlan.tracks;
  const carrier = tracks.find(({ id }) => id === motion.carrierTrackId);
  const removed = tracks.filter(({ id }) =>
    motion.removedSyntaxTrackIds.includes(id));
  const enclosures = tracks.filter(({ id }) =>
    motion.enclosureTrackIds.includes(id));
  assert.equal(carrier?.lifecycle, "persist");
  assert.equal(carrier?.sampleMaterialScale, undefined);
  assert.ok(removed.length >= 3);
  assert.ok(removed.every(({ lifecycle, sampleMaterialScale }) =>
    lifecycle === "eliminate" && sampleMaterialScale === undefined));
  assert.equal(enclosures.length, 2);
  assert.ok(enclosures.every(({ lifecycle, motionAxisConstraint,
    sampleMaterialScale }) => lifecycle === "introduce" &&
    motionAxisConstraint === "horizontal" &&
    sampleMaterialScale === undefined));
  assert.deepEqual(motion.functionWrapCertificate.matchedEnclosureEntityIds,
    ["target.absolute-value.leading", "target.absolute-value.trailing"]);

  const targetEntityByAtom = new Map(
    motion.rendererPlan.reconciliation.target.atoms.map(
      ({ id, semanticEntityId }) => [id, semanticEntityId]
    )
  );
  const leading = enclosures.find(({ targetAtomId }) =>
    targetEntityByAtom.get(targetAtomId ?? "") ===
      "target.absolute-value.leading");
  const trailing = enclosures.find(({ targetAtomId }) =>
    targetEntityByAtom.get(targetAtomId ?? "") ===
      "target.absolute-value.trailing");
  assert.ok((leading?.startPaintRect.left ?? 0) <
    (leading?.endPaintRect.left ?? 0));
  assert.ok((trailing?.startPaintRect.left ?? 0) >
    (trailing?.endPaintRect.left ?? 0));
  assert.throws(() => JSON.stringify(motion), /cannot enter durable state/u);
});

test("sampled timeline has exact endpoints and deterministic direct seek", () => {
  const motion = compileKpCompoundRootCarrierMotion({
    exemplar: kpCompoundRootCarrierExemplar,
    endpoints: kpCompoundRootCarrierNativeEndpoints,
    source: observation(kpCompoundRootCarrierNativeEndpoints.source,
      sourcePaint()),
    target: observation(kpCompoundRootCarrierNativeEndpoints.target,
      targetPaint())
  });
  const tracks = motion.rendererPlan.tracks;
  const start = sampleKpNativeKatexSceneTrackFrames(tracks, 0, false);
  const middle = sampleKpNativeKatexSceneTrackFrames(tracks, 0.6, false);
  const repeatedMiddle = sampleKpNativeKatexSceneTrackFrames(tracks, 0.6,
    false);
  const end = sampleKpNativeKatexSceneTrackFrames(tracks, 1, false);
  assert.deepEqual(middle, repeatedMiddle);
  assert.equal(start.find(({ trackId }) => trackId === motion.carrierTrackId)
    ?.opacity, 1);
  assert.equal(middle.find(({ trackId }) => trackId === motion.carrierTrackId)
    ?.opacity, 1);
  assert.ok(middle.filter(({ trackId }) =>
    motion.removedSyntaxTrackIds.includes(trackId)
  ).every(({ opacity }) => opacity === 0));
  assert.ok(start.filter(({ trackId }) =>
    motion.enclosureTrackIds.includes(trackId)
  ).every(({ opacity }) => opacity === 0));
  assert.ok(end.filter(({ trackId }) =>
    motion.enclosureTrackIds.includes(trackId)
  ).every(({ opacity, rect }, index) => opacity === 1 &&
    rect.left === tracks.find(({ id }) =>
      id === motion.enclosureTrackIds[index])?.endRect.left));
});

interface PaintFixture {
  readonly entityId: string;
  readonly rect: Rect;
  readonly paintKind: "glyph" | "path" | "delimiter";
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
    paint("source.radical", 6, 8, 9, 34, "path", "path:radical"),
    paint("source.grouping", 20, 14, 5, 26, "delimiter", "delimiter:left"),
    paint("source.x", 29, 18, 9, 20, "glyph", "glyph:x"),
    paint("source.plus", 42, 18, 9, 20, "glyph", "glyph:+"),
    paint("source.one", 55, 18, 8, 20, "glyph", "glyph:1"),
    paint("source.grouping", 67, 14, 5, 26, "delimiter", "delimiter:right"),
    paint("source.exponent", 75, 5, 7, 13, "glyph", "glyph:2")
  ];
}

function targetPaint(): readonly PaintFixture[] {
  return [
    paint("target.absolute-value.leading", 22, 14, 4, 28,
      "delimiter", "delimiter:left"),
    paint("target.x", 31, 18, 9, 20, "glyph", "glyph:x"),
    paint("target.plus", 44, 18, 9, 20, "glyph", "glyph:+"),
    paint("target.one", 57, 18, 8, 20, "glyph", "glyph:1"),
    paint("target.absolute-value.trailing", 70, 14, 4, 28,
      "delimiter", "delimiter:right")
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
  return { entityId, rect: { left, top, width, height }, paintKind,
    visualKey };
}

function observation(
  endpoint: KpRootRewriteNativeEndpoint,
  fixtures: readonly PaintFixture[]
) {
  const root = { ownerDocument } as HTMLElement;
  const nodes = new Map(endpoint.nodes.map((node) =>
    [node.occurrence.entityId, node]
  ));
  const atoms = fixtures.map((fixture, index) => {
    const node = nodes.get(fixture.entityId);
    if (node === undefined) throw new Error(`Missing endpoint node ${fixture.entityId}.`);
    return atom(endpoint.endpoint, fixture, node.presentationGroupId, index,
      root);
  });
  const atomsByEntity = new Map<string, string[]>();
  fixtures.forEach((fixture, index) => {
    const current = atomsByEntity.get(fixture.entityId) ?? [];
    current.push(atoms[index]!.id);
    atomsByEntity.set(fixture.entityId, current);
  });
  const descendants = (entityId: string): readonly string[] => {
    const direct = atomsByEntity.get(entityId) ?? [];
    const childIds = endpoint.nodes.filter(({ parentEntityId }) =>
      parentEntityId === entityId).flatMap(({ occurrence }) =>
        descendants(occurrence.entityId));
    return [...direct, ...childIds];
  };
  const atomById = new Map(atoms.map((entry) => [entry.id, entry]));
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
  const normalizedGroups = groups.map((group) => group.parentGroupId ===
    undefined
    ? (({ parentGroupId: _ignored, ...rest }) => rest)(group)
    : group);
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: endpoint.endpoint,
    stage,
    root,
    atoms,
    groups: normalizedGroups,
    fontRevision: 2,
    viewportKey: `${endpoint.endpoint}:wide:font-2`
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
      throw new Error("native realization remeasured fixture DOM");
    }
  } as unknown as HTMLElement;
}

function union(rects: readonly Rect[]): Rect {
  if (rects.length === 0) throw new Error("Cannot union empty paint.");
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}
