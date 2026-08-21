import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../../src/rendering/native-katex-rendered-scene.ts";
import type {
  KpRootRewriteNativeEndpoint
} from "../../src/rendering/root-rewrite-native-endpoint.ts";

export interface KpRootRewritePaintFixture {
  readonly entityId: string;
  readonly rect: KpRootRewriteFixtureRect;
  readonly paintKind: "glyph" | "path" | "delimiter";
  readonly visualKey: string;
}

export interface KpRootRewriteFixtureRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const ownerDocument = { defaultView: null };
export const kpRootRewriteFixtureStage = { ownerDocument } as HTMLElement;

export function rootRewritePaint(
  entityId: string,
  left: number,
  top: number,
  width: number,
  height: number,
  paintKind: KpRootRewritePaintFixture["paintKind"],
  visualKey: string
): KpRootRewritePaintFixture {
  return { entityId, rect: { left, top, width, height }, paintKind, visualKey };
}

/**
 * Reconstruct the recursive group topology emitted by the real observer while
 * keeping focused compositor tests independent of DOM and font availability.
 */
export function createRootRewriteSceneObservation(
  endpoint: KpRootRewriteNativeEndpoint,
  fixtures: readonly KpRootRewritePaintFixture[],
  fixtureId: string
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
    stage: kpRootRewriteFixtureStage,
    root,
    atoms,
    groups: groups.map((group) => group.parentGroupId === undefined
      ? (({ parentGroupId: _ignored, ...rest }) => rest)(group)
      : group),
    fontRevision: 2,
    viewportKey: `${endpoint.endpoint}:${fixtureId}:font-2`
  });
}

function atom(
  side: "source" | "target",
  fixture: KpRootRewritePaintFixture,
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
      throw new Error("root-rewrite fixture attempted DOM remeasurement");
    }
  } as unknown as HTMLElement;
}

function union(
  rects: readonly KpRootRewriteFixtureRect[]
): KpRootRewriteFixtureRect {
  if (rects.length === 0) {
    throw new Error("Fixture group must own at least one paint atom.");
  }
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}
