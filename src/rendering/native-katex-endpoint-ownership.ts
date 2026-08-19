import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedEndpointHandle,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  unionKpStageRelativeRects
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexEndpointLeafOwnerView {
  readonly kind: "leaf";
  readonly id: string;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly leafAtomIds: readonly string[];
  readonly rect: KpStageRelativeRect;
}

export interface KpNativeKatexEndpointCompoundOwnerView {
  readonly kind: "compound";
  readonly id: string;
  readonly semanticEntityId: string;
  readonly presentationGroupId: string;
  readonly leafAtomIds: readonly string[];
  readonly rect: KpStageRelativeRect;
}

export type KpNativeKatexEndpointPaintOwnerView =
  | KpNativeKatexEndpointLeafOwnerView
  | KpNativeKatexEndpointCompoundOwnerView;

export interface KpNativeKatexEndpointOwnershipView {
  readonly kind: "native-katex-endpoint-ownership-view";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly handle: KpNativeKatexRenderedEndpointHandle;
  readonly endpoint: "source" | "target";
  readonly collapsedGroupIds: readonly string[];
  readonly owners: readonly KpNativeKatexEndpointPaintOwnerView[];
  readonly leafAtomIds: readonly string[];
}

export function createKpNativeKatexEndpointOwnershipView(input: {
  readonly handle: KpNativeKatexRenderedEndpointHandle;
  readonly endpoint: "source" | "target";
  readonly collapsedGroupIds?: readonly string[] | undefined;
}): KpNativeKatexEndpointOwnershipView {
  const observation = input.handle.observation;
  const collapsedGroupIds = Object.freeze([
    ...(input.collapsedGroupIds ?? [])
  ]);
  assertUnique(collapsedGroupIds, "collapsed presentation group");
  const groups = new Map(observation.groups.map((group) => [group.id, group]));
  const collapsedGroups = collapsedGroupIds.map((id) => {
    const group = groups.get(id);
    if (group === undefined) {
      throw new Error(`Unknown collapsed presentation group ${id}.`);
    }
    return group;
  });
  for (let left = 0; left < collapsedGroups.length; left += 1) {
    const leftAtoms = new Set(collapsedGroups[left]!.atomIds);
    for (let right = left + 1; right < collapsedGroups.length; right += 1) {
      if (collapsedGroups[right]!.atomIds.some((id) => leftAtoms.has(id))) {
        throw new Error(
          "Collapsed presentation groups cannot own overlapping leaf paint."
        );
      }
    }
  }

  const collapsedByAtomId = new Map<string, typeof collapsedGroups[number]>();
  collapsedGroups.forEach((group) => group.atomIds.forEach((atomId) => {
    collapsedByAtomId.set(atomId, group);
  }));
  const emittedGroups = new Set<string>();
  const owners: KpNativeKatexEndpointPaintOwnerView[] = [];
  for (const atom of observation.atoms) {
    const collapsed = collapsedByAtomId.get(atom.id);
    if (collapsed !== undefined) {
      if (emittedGroups.has(collapsed.id)) continue;
      emittedGroups.add(collapsed.id);
      owners.push(Object.freeze({
        kind: "compound" as const,
        id: `${input.endpoint}.owner.compound.${collapsed.id}`,
        semanticEntityId: collapsed.semanticEntityId,
        presentationGroupId: collapsed.id,
        leafAtomIds: Object.freeze([...collapsed.atomIds]),
        rect: Object.freeze({ ...collapsed.rect })
      }));
      continue;
    }
    owners.push(Object.freeze({
      kind: "leaf" as const,
      id: `${input.endpoint}.owner.leaf.${atom.id}`,
      semanticEntityId: atom.semanticEntityId,
      presentationGroupId: atom.presentationGroupId,
      leafAtomIds: Object.freeze([atom.id]),
      rect: Object.freeze({ ...atom.rect })
    }));
  }
  const leafAtomIds = Object.freeze(owners.flatMap(({ leafAtomIds }) =>
    leafAtomIds
  ));
  assertUnique(leafAtomIds, "owned native paint leaf");
  const expectedIds = observation.atoms.map(({ id }) => id);
  if (
    leafAtomIds.length !== expectedIds.length ||
    expectedIds.some((id) => !leafAtomIds.includes(id))
  ) {
    throw new Error(
      "Endpoint ownership view must own every native paint leaf exactly once."
    );
  }
  return Object.freeze({
    kind: "native-katex-endpoint-ownership-view",
    lifecycle: "renderer-session-ephemeral",
    handle: input.handle,
    endpoint: input.endpoint,
    collapsedGroupIds,
    owners: Object.freeze(owners),
    leafAtomIds
  });
}

export function compileKpNativeKatexEndpointOwnershipObservation(
  view: KpNativeKatexEndpointOwnershipView
): KpNativeKatexRenderedSceneObservation {
  const base = view.handle.observation;
  const atomById = new Map(base.atoms.map((atom) => [atom.id, atom]));
  const groupById = new Map(base.groups.map((group) => [group.id, group]));
  const projectedAtomIdsByLeafId = new Map<string, string>();
  const atoms = view.owners.map((owner, index) => {
    const id = `${view.endpoint}.paint.owner.${index}`;
    owner.leafAtomIds.forEach((leafId) => {
      projectedAtomIdsByLeafId.set(leafId, id);
    });
    if (owner.kind === "leaf") {
      const leaf = atomById.get(owner.leafAtomIds[0]!);
      if (leaf === undefined) {
        throw new Error(`Ownership view references unknown leaf ${owner.id}.`);
      }
      return Object.freeze({
        ...leaf,
        id,
        endpoint: view.endpoint
      });
    }
    const group = groupById.get(owner.presentationGroupId);
    if (
      group?.sourceElement === undefined ||
      group.styleFingerprint === undefined
    ) {
      throw new Error(
        `Compound owner ${owner.id} lacks settled group paint evidence.`
      );
    }
    const leaves = owner.leafAtomIds.map((leafId) => {
      const leaf = atomById.get(leafId);
      if (leaf === undefined) {
        throw new Error(`Compound owner ${owner.id} references unknown paint.`);
      }
      return leaf;
    });
    return Object.freeze({
      kind: "native-katex-paint-atom-observation" as const,
      lifecycle: "renderer-session" as const,
      id,
      endpoint: view.endpoint,
      semanticEntityId: owner.semanticEntityId,
      presentationGroupId: owner.presentationGroupId,
      paintKind: "glyph" as const,
      paintMeasurement: "subtree" as const,
      visualKey: `compound:${leaves.map(({ visualKey }) => visualKey).join("|")}`,
      sourceElement: group.sourceElement,
      rect: owner.rect,
      baselineY: group.baselineY,
      styleFingerprint: group.styleFingerprint,
      zOrder: Math.min(...leaves.map(({ zOrder }) => zOrder)),
      fontRevision: base.fontRevision
    });
  }) satisfies readonly KpNativeKatexPaintAtomObservation[];
  const projectedById = new Map(atoms.map((atom) => [atom.id, atom]));
  const groups = base.groups.flatMap((group) => {
    const atomIds = [...new Set(group.atomIds.map((leafId) =>
      projectedAtomIdsByLeafId.get(leafId)
    ).filter((id): id is string => id !== undefined))];
    if (atomIds.length === 0) return [];
    const rects = atomIds.map((id) => projectedById.get(id)!.rect);
    return [Object.freeze({
      ...group,
      atomIds: Object.freeze(atomIds),
      rect: unionKpStageRelativeRects(rects)
    })];
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint: view.endpoint,
    stage: base.stage,
    root: base.root,
    atoms,
    groups,
    fontRevision: base.fontRevision,
    // Role projection must not create a second physical endpoint revision.
    viewportKey: base.viewportKey
  });
}

function assertUnique(values: readonly string[], label: string): void {
  if (values.some((value) => value.trim() === "")) {
    throw new Error(`${label} IDs must be non-empty.`);
  }
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} IDs must be unique.`);
  }
}
