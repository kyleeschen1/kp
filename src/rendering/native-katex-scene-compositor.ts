import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import type {
  KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import { syncKpEquationMaterialLayer } from "./equation-material-layer-dom.ts";

export type KpNativeKatexAtomLifecycle =
  | "persist"
  | "merge"
  | "split"
  | "introduce"
  | "eliminate"
  | "unsupported";

export interface KpNativeKatexAtomDisposition {
  readonly id: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceAtomIds: readonly string[];
  readonly targetAtomIds: readonly string[];
  readonly semanticEntityIds: readonly string[];
  readonly reason?: string | undefined;
}

export interface KpNativeKatexSceneReconciliation {
  readonly kind: "native-katex-scene-reconciliation";
  readonly lifecycle: "renderer-session";
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}

export interface KpNativeKatexSceneComponent {
  readonly id: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceGroupIds: readonly string[];
  readonly targetGroupIds: readonly string[];
  readonly sourceBounds?: KpStageRelativeRect | undefined;
  readonly targetBounds?: KpStageRelativeRect | undefined;
  readonly atoms: readonly {
    readonly atomId: string;
    readonly endpoint: "source" | "target";
    readonly localRect: KpStageRelativeRect;
  }[];
}

export interface KpNativeKatexHierarchicalScenePlan {
  readonly kind: "native-katex-hierarchical-scene-plan";
  readonly lifecycle: "renderer-session";
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly components: readonly KpNativeKatexSceneComponent[];
}

export interface KpNativeKatexSceneTrack {
  readonly id: string;
  readonly componentId: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceAtomId?: string | undefined;
  readonly targetAtomId?: string | undefined;
  readonly visualAtomId: string;
  readonly paintKind: KpNativeKatexPaintAtomObservation["paintKind"];
  readonly sizingMode: "rect" | "rule-length";
  readonly startRect: KpStageRelativeRect;
  readonly endRect: KpStageRelativeRect;
  readonly startOpacity: number;
  readonly endOpacity: number;
}

export interface KpNativeKatexSceneTrackFrame {
  readonly trackId: string;
  readonly componentId: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly visualAtomId: string;
  readonly paintKind: KpNativeKatexPaintAtomObservation["paintKind"];
  readonly sizingMode: "rect" | "rule-length";
  readonly rect: KpStageRelativeRect;
  readonly opacity: number;
}

export interface KpNativeKatexSceneOwnershipFrame {
  readonly visualOwner: "source-native" | "material-scene" | "target-native";
  readonly sourceNativeOpacity: 0 | 1;
  readonly materialSceneOpacity: 0 | 1;
  readonly targetNativeOpacity: 0 | 1;
  readonly frames: readonly KpNativeKatexSceneTrackFrame[];
}

export interface KpNativeKatexScenePlayback {
  readonly kind: "native-katex-scene-playback";
  readonly lifecycle: "renderer-session";
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly sample: (progress: number) => readonly KpNativeKatexSceneTrackFrame[];
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
}

export interface KpNativeKatexHandoffCorrelation {
  readonly kind: "native-katex-handoff-correlation";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly materialOwnerId: string;
  readonly trackId: string;
  readonly componentId: string;
  readonly atomLifecycle: KpNativeKatexAtomLifecycle;
  readonly visualAtomId: string;
  readonly sourceAtomId?: string | undefined;
  readonly targetAtomId?: string | undefined;
  readonly semanticEntityId: string;
  readonly disposition:
    | "target-bound"
    | "departing-without-native-target";
}

export interface KpNativeKatexSemanticPaintRelation {
  readonly id: string;
  readonly relation: "persist" | "merge" | "split";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export function reconcileKpNativeKatexScenes(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly relations?: readonly KpNativeKatexSemanticPaintRelation[] | undefined;
}): KpNativeKatexSceneReconciliation {
  const sourceRemaining = new Map(input.source.atoms.map((atom) => [atom.id, atom]));
  const targetRemaining = new Map(input.target.atoms.map((atom) => [atom.id, atom]));
  const dispositions: KpNativeKatexAtomDisposition[] = [];
  const sharedEntityIds = [...new Set(input.source.atoms.map(
    ({ semanticEntityId }) => semanticEntityId
  ))].filter((entityId) =>
    input.target.atoms.some((atom) => atom.semanticEntityId === entityId)
  );
  for (const entityId of sharedEntityIds.sort()) {
    pairCompatibleAtoms({
      idPrefix: `persist.${entityId}`,
      lifecycle: "persist",
      semanticEntityIds: [entityId],
      sources: matchingEntityAtoms(sourceRemaining, [entityId]),
      targets: matchingEntityAtoms(targetRemaining, [entityId]),
      dispositions,
      sourceRemaining,
      targetRemaining
    });
  }
  for (const relation of [...(input.relations ?? [])].sort((left, right) =>
    left.id.localeCompare(right.id)
  )) {
    pairCompatibleAtoms({
      idPrefix: relation.id,
      lifecycle: relation.relation,
      semanticEntityIds: [
        ...relation.sourceEntityIds,
        ...relation.targetEntityIds
      ],
      sources: matchingEntityAtoms(sourceRemaining, relation.sourceEntityIds),
      targets: matchingEntityAtoms(targetRemaining, relation.targetEntityIds),
      dispositions,
      sourceRemaining,
      targetRemaining
    });
  }
  for (const atom of [...sourceRemaining.values()].sort(byAtomId)) {
    dispositions.push({
      id: `eliminate.${atom.id}`,
      lifecycle: "eliminate",
      sourceAtomIds: [atom.id],
      targetAtomIds: [],
      semanticEntityIds: [atom.semanticEntityId]
    });
  }
  for (const atom of [...targetRemaining.values()].sort(byAtomId)) {
    dispositions.push({
      id: `introduce.${atom.id}`,
      lifecycle: "introduce",
      sourceAtomIds: [],
      targetAtomIds: [atom.id],
      semanticEntityIds: [atom.semanticEntityId]
    });
  }
  return createKpNativeKatexSceneReconciliation({
    source: input.source,
    target: input.target,
    dispositions
  });
}

export function createKpNativeKatexSceneReconciliation(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}): KpNativeKatexSceneReconciliation {
  if (input.source.endpoint !== "source" || input.target.endpoint !== "target") {
    throw new Error("Scene reconciliation requires source and target endpoints.");
  }
  const sourceIds = new Set(input.source.atoms.map(({ id }) => id));
  const targetIds = new Set(input.target.atoms.map(({ id }) => id));
  const usedSourceIds: string[] = [];
  const usedTargetIds: string[] = [];
  const dispositionIds = new Set<string>();
  for (const disposition of input.dispositions) {
    if (dispositionIds.has(disposition.id)) {
      throw new Error(`Scene disposition ${disposition.id} is duplicated.`);
    }
    dispositionIds.add(disposition.id);
    assertLifecycleArity(disposition);
    for (const id of disposition.sourceAtomIds) {
      if (!sourceIds.has(id)) {
        throw new Error(`Scene disposition ${disposition.id} has unknown source atom ${id}.`);
      }
      usedSourceIds.push(id);
    }
    for (const id of disposition.targetAtomIds) {
      if (!targetIds.has(id)) {
        throw new Error(`Scene disposition ${disposition.id} has unknown target atom ${id}.`);
      }
      usedTargetIds.push(id);
    }
  }
  assertTotalCoverage(sourceIds, usedSourceIds, "source");
  assertTotalCoverage(targetIds, usedTargetIds, "target");
  return Object.freeze({
    kind: "native-katex-scene-reconciliation",
    lifecycle: "renderer-session",
    source: input.source,
    target: input.target,
    dispositions: Object.freeze(input.dispositions.map((disposition) =>
      Object.freeze({
        ...disposition,
        sourceAtomIds: Object.freeze([...disposition.sourceAtomIds]),
        targetAtomIds: Object.freeze([...disposition.targetAtomIds]),
        semanticEntityIds: Object.freeze([...disposition.semanticEntityIds])
      })
    ))
  });
}

export function compileKpNativeKatexHierarchicalScenePlan(
  reconciliation: KpNativeKatexSceneReconciliation
): KpNativeKatexHierarchicalScenePlan {
  const sourceById = new Map(reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const components = reconciliation.dispositions.map((disposition) => {
    const sourceAtoms = disposition.sourceAtomIds.map((id) => sourceById.get(id)!);
    const targetAtoms = disposition.targetAtomIds.map((id) => targetById.get(id)!);
    const sourceBounds = sourceAtoms.length === 0
      ? undefined
      : unionRects(sourceAtoms.map(({ rect }) => rect));
    const targetBounds = targetAtoms.length === 0
      ? undefined
      : unionRects(targetAtoms.map(({ rect }) => rect));
    return Object.freeze({
      id: `component.${disposition.id}`,
      lifecycle: disposition.lifecycle,
      sourceGroupIds: Object.freeze([
        ...new Set(sourceAtoms.map(({ presentationGroupId }) =>
          presentationGroupId
        ))
      ]),
      targetGroupIds: Object.freeze([
        ...new Set(targetAtoms.map(({ presentationGroupId }) =>
          presentationGroupId
        ))
      ]),
      ...(sourceBounds === undefined ? {} : {
        sourceBounds: Object.freeze(sourceBounds)
      }),
      ...(targetBounds === undefined ? {} : {
        targetBounds: Object.freeze(targetBounds)
      }),
      atoms: Object.freeze([
        ...sourceAtoms.map((atom) => Object.freeze({
          atomId: atom.id,
          endpoint: "source" as const,
          localRect: Object.freeze(localRect(atom.rect, sourceBounds!))
        })),
        ...targetAtoms.map((atom) => Object.freeze({
          atomId: atom.id,
          endpoint: "target" as const,
          localRect: Object.freeze(localRect(atom.rect, targetBounds!))
        }))
      ])
    });
  });
  return Object.freeze({
    kind: "native-katex-hierarchical-scene-plan",
    lifecycle: "renderer-session",
    reconciliation,
    components: Object.freeze(components)
  });
}

export function compileKpNativeKatexSceneTracks(
  plan: KpNativeKatexHierarchicalScenePlan
): readonly KpNativeKatexSceneTrack[] {
  const sourceById = new Map(plan.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(plan.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  return Object.freeze(plan.reconciliation.dispositions.flatMap((disposition) => {
    const sources = disposition.sourceAtomIds.map((id) => sourceById.get(id)!);
    const targets = disposition.targetAtomIds.map((id) => targetById.get(id)!);
    if (disposition.lifecycle === "persist") {
      return [track(disposition, 0, sources[0]!, targets[0]!, 1, 1)];
    }
    if (disposition.lifecycle === "merge") {
      return sources.map((source, index) =>
        track(
          disposition,
          index,
          source,
          targets[0]!,
          1,
          index === 0 ? 1 : 0
        )
      );
    }
    if (disposition.lifecycle === "split") {
      return targets.map((target, index) =>
        track(
          disposition,
          index,
          sources[0]!,
          target,
          index === 0 ? 1 : 0,
          1,
          target.id
        )
      );
    }
    if (disposition.lifecycle === "eliminate") {
      return sources.map((source, index) => {
        const sceneTrack = track(disposition, index, source, source, 1, 0);
        return Object.freeze({
          ...sceneTrack,
          endRect: Object.freeze({
            ...source.rect,
            top: source.rect.top - 8
          })
        });
      });
    }
    if (disposition.lifecycle === "introduce") {
      return targets.map((target, index) => {
        const sceneTrack = track(
          disposition,
          index,
          target,
          target,
          0,
          1,
          target.id
        );
        return Object.freeze({
          ...sceneTrack,
          startRect: Object.freeze({
            ...target.rect,
            top: target.rect.top + 8
          })
        });
      });
    }
    return [];
  }));
}

export function sampleKpNativeKatexSceneTracks(
  tracks: readonly KpNativeKatexSceneTrack[],
  progress: number
): readonly KpNativeKatexSceneTrackFrame[] {
  if (!Number.isFinite(progress)) {
    throw new Error("Scene track progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, progress));
  const eased = smoothstep(bounded);
  return Object.freeze(tracks.map((sceneTrack) => Object.freeze({
    trackId: sceneTrack.id,
    componentId: sceneTrack.componentId,
    lifecycle: sceneTrack.lifecycle,
    visualAtomId: sceneTrack.visualAtomId,
    paintKind: sceneTrack.paintKind,
    sizingMode: sceneTrack.sizingMode,
    rect: Object.freeze(interpolateRect(
      sceneTrack.startRect,
      sceneTrack.endRect,
      eased
    )),
    opacity: lerp(
      sceneTrack.startOpacity,
      sceneTrack.endOpacity,
      lifecycleOpacityProgress(sceneTrack, bounded)
    )
  })));
}

export function correlateKpNativeKatexSceneHandoff(input: {
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
}): readonly KpNativeKatexHandoffCorrelation[] {
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Native handoff correlation requires unique track IDs.");
  }
  const sourceById = new Map(input.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const dispositionsByComponentId = new Map(
    input.reconciliation.dispositions.map((disposition) => [
      `component.${disposition.id}`,
      disposition
    ])
  );
  const correlations = [...input.tracks].sort((left, right) =>
    left.id.localeCompare(right.id)
  ).map((sceneTrack) => {
    const disposition = dispositionsByComponentId.get(sceneTrack.componentId);
    if (disposition === undefined) {
      throw new Error(
        `Scene track ${sceneTrack.id} has no reconciliation disposition.`
      );
    }
    if (disposition.lifecycle !== sceneTrack.lifecycle) {
      throw new Error(
        `Scene track ${sceneTrack.id} disagrees with its disposition lifecycle.`
      );
    }
    const visualAtom = sourceById.get(sceneTrack.visualAtomId) ??
      targetById.get(sceneTrack.visualAtomId);
    if (visualAtom === undefined) {
      throw new Error(
        `Scene track ${sceneTrack.id} references unknown visual atom ` +
        `${sceneTrack.visualAtomId}.`
      );
    }
    const targetAtomId =
      sceneTrack.targetAtomId !== undefined &&
      disposition.targetAtomIds.includes(sceneTrack.targetAtomId)
        ? sceneTrack.targetAtomId
        : undefined;
    if (
      disposition.targetAtomIds.length > 0 &&
      (
        targetAtomId === undefined ||
        !targetById.has(targetAtomId)
      )
    ) {
      throw new Error(
        `Scene track ${sceneTrack.id} has no lineage-backed native target atom.`
      );
    }
    if (
      disposition.targetAtomIds.length === 0 &&
      sceneTrack.lifecycle !== "eliminate"
    ) {
      throw new Error(
        `Scene track ${sceneTrack.id} lacks a native target without departing.`
      );
    }
    const semanticEntityId = targetAtomId === undefined
      ? visualAtom.semanticEntityId
      : targetById.get(targetAtomId)!.semanticEntityId;
    return Object.freeze({
      kind: "native-katex-handoff-correlation" as const,
      lifecycle: "renderer-session" as const,
      id: `handoff.${sceneTrack.id}`,
      materialOwnerId: `native-scene-owner.${sceneTrack.id}`,
      trackId: sceneTrack.id,
      componentId: sceneTrack.componentId,
      atomLifecycle: sceneTrack.lifecycle,
      visualAtomId: sceneTrack.visualAtomId,
      ...(sceneTrack.sourceAtomId === undefined
        ? {}
        : { sourceAtomId: sceneTrack.sourceAtomId }),
      ...(targetAtomId === undefined ? {} : { targetAtomId }),
      semanticEntityId,
      disposition: targetAtomId === undefined
        ? "departing-without-native-target" as const
        : "target-bound" as const
    });
  });
  const coveredTargets = new Set(correlations.flatMap(({ targetAtomId }) =>
    targetAtomId === undefined ? [] : [targetAtomId]
  ));
  const missingTarget = input.reconciliation.target.atoms.find(({ id }) =>
    !coveredTargets.has(id)
  );
  if (missingTarget !== undefined) {
    throw new Error(
      `Native target atom ${missingTarget.id} has no material handoff correlation.`
    );
  }
  const ownerIds = correlations.map(({ materialOwnerId }) => materialOwnerId);
  if (new Set(ownerIds).size !== ownerIds.length) {
    throw new Error("Native handoff correlation repeats a material owner.");
  }
  return Object.freeze(correlations);
}

export function applyKpNativeKatexSceneFrame(input: {
  readonly stage: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly progress: number;
}): KpNativeKatexSceneOwnershipFrame {
  const frames = sampleKpNativeKatexSceneTracks(input.tracks, input.progress);
  const bounded = Math.max(0, Math.min(1, input.progress));
  const sourceOwns = bounded === 0;
  const targetOwns = bounded === 1;
  const materialOwns = !sourceOwns && !targetOwns;
  const atomsById = new Map([
    ...input.reconciliation.source.atoms,
    ...input.reconciliation.target.atoms
  ].map((atom) => [atom.id, atom]));

  input.sourceRoot.style.opacity = sourceOwns ? "1" : "0";
  input.targetRoot.style.opacity = targetOwns ? "1" : "0";
  // Endpoint DOM remains the semantic surface. Interior clones own only paint,
  // so a handoff cannot duplicate accessibility or interaction semantics.
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners: frames.map((frame) => {
      const atom = atomsById.get(frame.visualAtomId);
      if (atom === undefined) {
        throw new Error(
          `Scene track ${frame.trackId} references unknown visual atom ` +
          `${frame.visualAtomId}.`
        );
      }
      return {
        ownerId: `native-scene-owner.${frame.trackId}`,
        sourceElement: atom.sourceElement,
        rect: frame.rect,
        opacity: materialOwns ? frame.opacity : 0,
        transform: "none",
        fragmentRole: `${frame.paintKind}:${frame.sizingMode}`
      };
    })
  });
  input.stage.querySelectorAll<HTMLElement>(
    "[data-kp-equation-material-owner-id^=\"native-scene-owner.\"]"
  ).forEach((owner) => {
    owner.setAttribute("inert", "");
    owner.dataset["kpNativeKatexSceneOwner"] = "true";
  });

  return Object.freeze({
    visualOwner:
      sourceOwns ? "source-native" :
      targetOwns ? "target-native" :
      "material-scene",
    sourceNativeOpacity: sourceOwns ? 1 : 0,
    materialSceneOpacity: materialOwns ? 1 : 0,
    targetNativeOpacity: targetOwns ? 1 : 0,
    frames
  });
}

export function createKpNativeKatexScenePlayback(input: {
  readonly stage: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
}): KpNativeKatexScenePlayback {
  const trackIds = input.tracks.map(({ id }) => id);
  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Scene playback requires unique track IDs.");
  }
  const atomIds = new Set([
    ...input.reconciliation.source.atoms,
    ...input.reconciliation.target.atoms
  ].map(({ id }) => id));
  const unknownVisualAtom = input.tracks.find(({ visualAtomId }) =>
    !atomIds.has(visualAtomId)
  );
  if (unknownVisualAtom !== undefined) {
    throw new Error(
      `Scene track ${unknownVisualAtom.id} references unknown visual atom ` +
      `${unknownVisualAtom.visualAtomId}.`
    );
  }
  if (input.reconciliation.dispositions.some(({ lifecycle }) =>
    lifecycle === "unsupported"
  )) {
    throw new Error("Unsupported scene dispositions cannot enter playback.");
  }
  const tracks = Object.freeze([...input.tracks]);
  return Object.freeze({
    kind: "native-katex-scene-playback",
    lifecycle: "renderer-session",
    tracks,
    sample: (progress: number) =>
      sampleKpNativeKatexSceneTracks(tracks, progress),
    apply: (progress: number) => applyKpNativeKatexSceneFrame({
      ...input,
      tracks,
      progress
    })
  });
}

function assertLifecycleArity(
  disposition: KpNativeKatexAtomDisposition
): void {
  const sources = disposition.sourceAtomIds.length;
  const targets = disposition.targetAtomIds.length;
  const valid = {
    persist: sources === 1 && targets === 1,
    merge: sources >= 2 && targets === 1,
    split: sources === 1 && targets >= 2,
    introduce: sources === 0 && targets >= 1,
    eliminate: sources >= 1 && targets === 0,
    unsupported:
      (sources >= 1 || targets >= 1) &&
      disposition.reason !== undefined &&
      disposition.reason.trim() !== ""
  }[disposition.lifecycle];
  if (!valid) {
    throw new Error(
      `Scene disposition ${disposition.id} has invalid ${disposition.lifecycle} arity.`
    );
  }
}

function pairCompatibleAtoms(input: {
  readonly idPrefix: string;
  readonly lifecycle: "persist" | "merge" | "split";
  readonly semanticEntityIds: readonly string[];
  readonly sources: readonly KpNativeKatexPaintAtomObservation[];
  readonly targets: readonly KpNativeKatexPaintAtomObservation[];
  readonly dispositions: KpNativeKatexAtomDisposition[];
  readonly sourceRemaining: Map<string, KpNativeKatexPaintAtomObservation>;
  readonly targetRemaining: Map<string, KpNativeKatexPaintAtomObservation>;
}): void {
  const keys = [...new Set(input.sources.map(compatibilityKey))]
    .filter((key) => input.targets.some((atom) => compatibilityKey(atom) === key))
    .sort();
  for (const [keyIndex, key] of keys.entries()) {
    const sources = input.sources.filter((atom) => compatibilityKey(atom) === key)
      .sort(byAtomId);
    const targets = input.targets.filter((atom) => compatibilityKey(atom) === key)
      .sort(byAtomId);
    if (input.lifecycle === "persist") {
      const count = Math.min(sources.length, targets.length);
      for (let index = 0; index < count; index += 1) {
        addDisposition(
          input,
          `${input.idPrefix}.${keyIndex}.${index}`,
          [sources[index]!],
          [targets[index]!]
        );
      }
    } else if (input.lifecycle === "merge" && sources.length >= 2 && targets.length === 1) {
      addDisposition(input, `${input.idPrefix}.${keyIndex}`, sources, targets);
    } else if (input.lifecycle === "split" && sources.length === 1 && targets.length >= 2) {
      addDisposition(input, `${input.idPrefix}.${keyIndex}`, sources, targets);
    }
  }
}

function addDisposition(
  input: Parameters<typeof pairCompatibleAtoms>[0],
  id: string,
  sources: readonly KpNativeKatexPaintAtomObservation[],
  targets: readonly KpNativeKatexPaintAtomObservation[]
): void {
  input.dispositions.push({
    id,
    lifecycle: input.lifecycle,
    sourceAtomIds: sources.map(({ id: atomId }) => atomId),
    targetAtomIds: targets.map(({ id: atomId }) => atomId),
    semanticEntityIds: [...input.semanticEntityIds]
  });
  sources.forEach(({ id: atomId }) => input.sourceRemaining.delete(atomId));
  targets.forEach(({ id: atomId }) => input.targetRemaining.delete(atomId));
}

function matchingEntityAtoms(
  atoms: ReadonlyMap<string, KpNativeKatexPaintAtomObservation>,
  entityIds: readonly string[]
): KpNativeKatexPaintAtomObservation[] {
  return [...atoms.values()].filter(({ semanticEntityId }) =>
    entityIds.includes(semanticEntityId)
  );
}

function compatibilityKey(atom: KpNativeKatexPaintAtomObservation): string {
  return `${atom.paintKind}:${atom.visualKey}`;
}

function byAtomId(
  left: KpNativeKatexPaintAtomObservation,
  right: KpNativeKatexPaintAtomObservation
): number {
  return left.id.localeCompare(right.id);
}

function assertTotalCoverage(
  expected: ReadonlySet<string>,
  used: readonly string[],
  endpoint: "source" | "target"
): void {
  const duplicates = used.filter((id, index) => used.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Scene ${endpoint} atom ${duplicates[0]} has multiple dispositions.`);
  }
  const missing = [...expected].filter((id) => !used.includes(id));
  if (missing.length > 0) {
    throw new Error(`Scene ${endpoint} atom ${missing[0]} has no disposition.`);
  }
}

function unionRects(rects: readonly KpStageRelativeRect[]): KpStageRelativeRect {
  const left = Math.min(...rects.map(({ left }) => left));
  const top = Math.min(...rects.map(({ top }) => top));
  const right = Math.max(...rects.map(({ left, width }) => left + width));
  const bottom = Math.max(...rects.map(({ top, height }) => top + height));
  return { left, top, width: right - left, height: bottom - top };
}

function localRect(
  rect: KpStageRelativeRect,
  bounds: KpStageRelativeRect
): KpStageRelativeRect {
  return {
    left: rect.left - bounds.left,
    top: rect.top - bounds.top,
    width: rect.width,
    height: rect.height
  };
}

function track(
  disposition: KpNativeKatexAtomDisposition,
  index: number,
  source: KpNativeKatexPaintAtomObservation,
  target: KpNativeKatexPaintAtomObservation,
  startOpacity: number,
  endOpacity: number,
  visualAtomId = source.id
): KpNativeKatexSceneTrack {
  return Object.freeze({
    id: `track.${disposition.id}.${index}`,
    componentId: `component.${disposition.id}`,
    lifecycle: disposition.lifecycle,
    sourceAtomId: source.id,
    targetAtomId: target.id,
    visualAtomId,
    paintKind: source.paintKind,
    sizingMode: source.paintKind === "rule" ? "rule-length" : "rect",
    startRect: source.rect,
    endRect: target.rect,
    startOpacity,
    endOpacity
  });
}

function interpolateRect(
  source: KpStageRelativeRect,
  target: KpStageRelativeRect,
  progress: number
): KpStageRelativeRect {
  return {
    left: lerp(source.left, target.left, progress),
    top: lerp(source.top, target.top, progress),
    width: lerp(source.width, target.width, progress),
    height: lerp(source.height, target.height, progress)
  };
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lifecycleOpacityProgress(
  track: KpNativeKatexSceneTrack,
  progress: number
): number {
  if (track.startOpacity === track.endOpacity) return progress;
  const [start, end] =
    track.lifecycle === "merge" ? [0.62, 0.94] :
    track.lifecycle === "split" ? [0.18, 0.68] :
    track.lifecycle === "introduce" ? [0.28, 0.82] :
    track.lifecycle === "eliminate" ? [0.08, 0.62] :
    [0, 1];
  return smoothstep(Math.max(0, Math.min(1, (progress - start) / (end - start))));
}
