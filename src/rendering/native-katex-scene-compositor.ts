import {
  createKpNativeKatexHandoffTelemetry,
  type KpNativeKatexHandoffTelemetry,
  type KpNativeKatexPaintAtomObservation,
  type KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  normalizeKpStageRelativeRect,
  type KpStageRelativeRect
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

export interface KpNativeKatexHandoffOwnershipSample {
  readonly progress: number;
  readonly visualOwner: KpNativeKatexSceneOwnershipFrame["visualOwner"];
  readonly sourceNativeOpacity: 0 | 1;
  readonly materialSceneOpacity: 0 | 1;
  readonly targetNativeOpacity: 0 | 1;
  readonly visibleMaterialOwnerIds: readonly string[];
  readonly glyphStyleMismatchIds: readonly string[];
  readonly maximumGlyphRectResidualPx: number;
  readonly maximumGlyphBaselineResidualPx: number;
  readonly maximumRuleGeometryResidualPx: number;
}

export interface KpNativeKatexCommonHandoffAlignment {
  readonly kind: "native-katex-common-handoff-alignment";
  readonly status: "already-aligned" | "correctable" | "unsupported";
  readonly translateX: number;
  readonly translateY: number;
  readonly rejectedIds: readonly string[];
  readonly reason?:
    | "no-correlated-paint"
    | "paint-mismatch"
    | "style-mismatch"
    | "shape-mismatch"
    | "alignment-outlier"
    | "correction-exceeds-bound"
    | undefined;
}

export type KpNativeKatexTypographyHandoffCompatibility =
  | "style-compatible"
  | "transform-compatible"
  | "unsupported";

export type KpNativeKatexTypographyHandoffReason =
  | "paint-mismatch"
  | "style-mismatch"
  | "shape-mismatch"
  | "clip-mismatch"
  | "font-revision-mismatch"
  | "translation-exceeds-bound"
  | "scale-exceeds-bound";

export interface KpNativeKatexTypographyHandoffAssessment {
  readonly kind: "native-katex-typography-handoff-assessment";
  readonly lifecycle: "renderer-session";
  readonly id: string;
  readonly compatibility: KpNativeKatexTypographyHandoffCompatibility;
  readonly translateX: number;
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly stretchRatio: number;
  readonly settlement: "continuous" | "native-checkpoint";
  readonly reasons: readonly KpNativeKatexTypographyHandoffReason[];
}

export interface KpNativeKatexTypographyHandoffLaw {
  readonly kind: "native-katex-typography-handoff-law";
  readonly lifecycle: "renderer-session";
  readonly status: "continuous" | "native-checkpoint";
  readonly assessments: readonly KpNativeKatexTypographyHandoffAssessment[];
  readonly unsupportedIds: readonly string[];
}

export interface KpNativeKatexSemanticPaintRelation {
  readonly id: string;
  readonly relation: "persist" | "merge" | "split";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export function projectKpNativeKatexSemanticPaintRelations(input: {
  readonly groups: readonly {
    readonly id: string;
    readonly kind:
      | "one-to-one"
      | "many-to-one"
      | "one-to-many"
      | "introduction"
      | "removal";
    readonly sourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
  }[];
}): readonly KpNativeKatexSemanticPaintRelation[] {
  assertUniqueRelationIds(input.groups.map(({ id }) => id));
  return Object.freeze(input.groups.flatMap((group) => {
    if (group.kind === "introduction" || group.kind === "removal") return [];
    const relation = group.kind === "many-to-one"
      ? "merge" as const
      : group.kind === "one-to-many"
        ? "split" as const
        : "persist" as const;
    return [Object.freeze({
      id: `paint.${group.id}`,
      relation,
      sourceEntityIds: Object.freeze([...group.sourceEntityIds]),
      targetEntityIds: Object.freeze([...group.targetEntityIds])
    })];
  }));
}

export function reverseKpNativeKatexSemanticPaintRelations(
  relations: readonly KpNativeKatexSemanticPaintRelation[]
): readonly KpNativeKatexSemanticPaintRelation[] {
  assertUniqueRelationIds(relations.map(({ id }) => id));
  return Object.freeze(relations.map((relation) => Object.freeze({
    id: `reverse.${relation.id}`,
    relation: relation.relation === "merge"
      ? "split" as const
      : relation.relation === "split"
        ? "merge" as const
        : "persist" as const,
    sourceEntityIds: Object.freeze([...relation.targetEntityIds]),
    targetEntityIds: Object.freeze([...relation.sourceEntityIds])
  })));
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

export function measureKpNativeKatexGlyphHandoff(input: {
  readonly stage: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progress: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
}): KpNativeKatexHandoffTelemetry {
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const glyphCorrelations = input.correlations.filter((correlation) =>
    correlation.disposition === "target-bound" &&
    targetById.get(correlation.targetAtomId!)?.paintKind === "glyph"
  );
  if (glyphCorrelations.length === 0) {
    throw new Error("Native handoff microscope requires correlated glyph paint.");
  }
  const observations = glyphCorrelations.flatMap((correlation) => {
    const target = targetById.get(correlation.targetAtomId!)!;
    const materialOwner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${
        CSS.escape(correlation.materialOwnerId)
      }"]`
    );
    const materialVisual = materialOwner?.firstElementChild;
    if (
      materialOwner === null ||
      !(materialVisual instanceof HTMLElement)
    ) {
      throw new Error(
        `Native handoff microscope cannot find ${correlation.materialOwnerId}.`
      );
    }
    return [
      observeHandoffGlyph({
        id: `${correlation.id}.material`,
        side: "material",
        stage: input.stage,
        element: materialVisual,
        rectElement: materialOwner,
        target,
        fontRevision: input.fontRevision
      }),
      observeHandoffGlyph({
        id: `${correlation.id}.native`,
        side: "native-target",
        stage: input.stage,
        element: target.sourceElement,
        rectElement: target.sourceElement,
        target,
        fontRevision: input.fontRevision
      })
    ];
  });
  return createKpNativeKatexHandoffTelemetry({
    stage: input.stage,
    progress: input.progress,
    observations,
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export function measureKpNativeKatexRuleHandoff(input: {
  readonly stage: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progress: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
}): KpNativeKatexHandoffTelemetry {
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const ruleCorrelations = input.correlations.filter((correlation) =>
    correlation.disposition === "target-bound" &&
    targetById.get(correlation.targetAtomId!)?.paintKind === "rule"
  );
  if (ruleCorrelations.length === 0) {
    throw new Error("Native handoff microscope requires correlated rule paint.");
  }
  const observations = ruleCorrelations.flatMap((correlation) => {
    const target = targetById.get(correlation.targetAtomId!)!;
    const materialOwner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${
        CSS.escape(correlation.materialOwnerId)
      }"]`
    );
    const materialVisual = materialOwner?.firstElementChild;
    if (
      materialOwner === null ||
      !(materialVisual instanceof HTMLElement)
    ) {
      throw new Error(
        `Native handoff microscope cannot find ${correlation.materialOwnerId}.`
      );
    }
    return [
      observeHandoffRule({
        id: `${correlation.id}.material`,
        side: "material",
        stage: input.stage,
        element: materialVisual,
        target,
        fontRevision: input.fontRevision
      }),
      observeHandoffRule({
        id: `${correlation.id}.native`,
        side: "native-target",
        stage: input.stage,
        element: target.sourceElement,
        target,
        fontRevision: input.fontRevision
      })
    ];
  });
  return createKpNativeKatexHandoffTelemetry({
    stage: input.stage,
    progress: input.progress,
    observations,
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export function measureKpNativeKatexCorrelatedHandoff(input: {
  readonly stage: HTMLElement;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progress: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
}): KpNativeKatexHandoffTelemetry {
  const sourceById = new Map(input.reconciliation.source.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const targetById = new Map(input.reconciliation.target.atoms.map((atom) => [
    atom.id,
    atom
  ]));
  const paintById = new Map([
    ...sourceById,
    ...targetById
  ]);
  const observations = input.correlations.flatMap((correlation) => {
    if (correlation.disposition !== "target-bound") return [];
    const target = targetById.get(correlation.targetAtomId!);
    const visual = paintById.get(correlation.visualAtomId);
    const source = correlation.sourceAtomId === undefined
      ? undefined
      : sourceById.get(correlation.sourceAtomId);
    if (target === undefined || visual === undefined) {
      throw new Error(
        `Correlated handoff ${correlation.id} references missing paint.`
      );
    }
    const materialOwner = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${
        CSS.escape(correlation.materialOwnerId)
      }"]`
    );
    const materialVisual = materialOwner?.firstElementChild;
    if (
      materialOwner === null ||
      !(materialVisual instanceof HTMLElement)
    ) {
      throw new Error(
        `Correlated handoff cannot find ${correlation.materialOwnerId}.`
      );
    }
    return [
      ...(source === undefined
        ? []
        : [observeCorrelatedHandoffPaint({
            id: `${correlation.id}.source`,
            side: "native-source",
            stage: input.stage,
            element: source.sourceElement,
            rectElement: source.sourceElement,
            atom: source,
            fontRevision: input.fontRevision
          })]),
      observeCorrelatedHandoffPaint({
        id: `${correlation.id}.material`,
        side: "material",
        stage: input.stage,
        element: materialVisual,
        rectElement: materialOwner,
        atom: visual,
        fontRevision: input.fontRevision
      }),
      observeCorrelatedHandoffPaint({
        id: `${correlation.id}.native`,
        side: "native-target",
        stage: input.stage,
        element: target.sourceElement,
        rectElement: target.sourceElement,
        atom: target,
        fontRevision: input.fontRevision
      })
    ];
  });
  if (observations.length === 0) {
    throw new Error("Correlated handoff microscope requires target-bound paint.");
  }
  return createKpNativeKatexHandoffTelemetry({
    stage: input.stage,
    progress: input.progress,
    observations,
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey
  });
}

export function calculateKpNativeKatexCommonHandoffAlignment(input: {
  readonly telemetry: KpNativeKatexHandoffTelemetry;
  readonly tolerancePx: number;
  readonly maximumCorrectionPx: number;
}): KpNativeKatexCommonHandoffAlignment {
  requireNonnegativeFinite(input.tolerancePx, "alignment tolerance");
  requireNonnegativeFinite(
    input.maximumCorrectionPx,
    "maximum alignment correction"
  );
  const pairs = handoffTelemetryPairs(input.telemetry);
  if (pairs.length === 0) {
    return commonAlignmentResult("unsupported", 0, 0, [], {
      reason: "no-correlated-paint"
    });
  }
  const paintMismatchIds = pairs.filter(([material, native]) =>
    material.paintKind !== native.paintKind ||
    material.paintFingerprint !== native.paintFingerprint
  ).map(([material]) => correlationId(material.id));
  if (paintMismatchIds.length > 0) {
    return commonAlignmentResult("unsupported", 0, 0, paintMismatchIds, {
      reason: "paint-mismatch"
    });
  }
  const styleMismatchIds = pairs.filter(([material, native]) =>
    material.styleFingerprint !== native.styleFingerprint
  ).map(([material]) => correlationId(material.id));
  if (styleMismatchIds.length > 0) {
    return commonAlignmentResult("unsupported", 0, 0, styleMismatchIds, {
      reason: "style-mismatch"
    });
  }
  const shapeMismatchIds = pairs.filter(([material, native]) =>
    Math.abs(material.rect.width - native.rect.width) > input.tolerancePx ||
    Math.abs(material.rect.height - native.rect.height) > input.tolerancePx ||
    (material.baselineY === null) !== (native.baselineY === null)
  ).map(([material]) => correlationId(material.id));
  if (shapeMismatchIds.length > 0) {
    return commonAlignmentResult("unsupported", 0, 0, shapeMismatchIds, {
      reason: "shape-mismatch"
    });
  }
  const deltas = pairs.map(([material, native]) => ({
    id: correlationId(material.id),
    x: native.rect.left - material.rect.left,
    y: material.baselineY === null
      ? native.rect.top - material.rect.top
      : native.baselineY! - material.baselineY
  }));
  const translateX = median(deltas.map(({ x }) => x));
  const translateY = median(deltas.map(({ y }) => y));
  const outlierIds = deltas.filter(({ x, y }) =>
    Math.abs(x - translateX) > input.tolerancePx ||
    Math.abs(y - translateY) > input.tolerancePx
  ).map(({ id }) => id);
  if (outlierIds.length > 0) {
    return commonAlignmentResult(
      "unsupported",
      translateX,
      translateY,
      outlierIds,
      { reason: "alignment-outlier" }
    );
  }
  if (
    Math.abs(translateX) > input.maximumCorrectionPx ||
    Math.abs(translateY) > input.maximumCorrectionPx
  ) {
    return commonAlignmentResult(
      "unsupported",
      translateX,
      translateY,
      deltas.map(({ id }) => id),
      { reason: "correction-exceeds-bound" }
    );
  }
  const status =
    Math.abs(translateX) <= input.tolerancePx &&
      Math.abs(translateY) <= input.tolerancePx
      ? "already-aligned"
      : "correctable";
  return commonAlignmentResult(status, translateX, translateY, []);
}

export function assessKpNativeKatexTypographyHandoff(input: {
  readonly from: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly to: KpNativeKatexHandoffTelemetry["observations"][number];
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyHandoffAssessment {
  requireNonnegativeFinite(input.tolerancePx, "handoff tolerance");
  requireNonnegativeFinite(
    input.maximumTranslationPx,
    "maximum handoff translation"
  );
  if (
    !Number.isFinite(input.maximumScaleRatio) ||
    input.maximumScaleRatio < 1
  ) {
    throw new Error("Maximum handoff scale ratio must be finite and at least one.");
  }

  const translateX = input.to.rect.left - input.from.rect.left;
  const translateY =
    input.from.baselineY === null || input.to.baselineY === null
      ? input.to.rect.top - input.from.rect.top
      : input.to.baselineY - input.from.baselineY;
  const scaleX = safeScale(input.to.rect.width, input.from.rect.width);
  const scaleY = safeScale(input.to.rect.height, input.from.rect.height);
  const stretchRatio = maximum([
    symmetricScaleRatio(scaleX),
    symmetricScaleRatio(scaleY)
  ]);
  const reasons: KpNativeKatexTypographyHandoffReason[] = [];

  if (
    input.from.paintKind !== input.to.paintKind ||
    input.from.paintFingerprint !== input.to.paintFingerprint
  ) {
    reasons.push("paint-mismatch");
  }
  if (input.from.fontRevision !== input.to.fontRevision) {
    reasons.push("font-revision-mismatch");
  }
  if (input.from.clipPath !== input.to.clipPath) {
    reasons.push("clip-mismatch");
  }
  if (
    (input.from.baselineY === null) !== (input.to.baselineY === null) ||
    !compatibleRuleAxis(input.from, input.to)
  ) {
    reasons.push("shape-mismatch");
  }
  if (
    Math.abs(translateX) > input.maximumTranslationPx ||
    Math.abs(translateY) > input.maximumTranslationPx
  ) {
    reasons.push("translation-exceeds-bound");
  }
  if (
    !Number.isFinite(stretchRatio) ||
    stretchRatio > input.maximumScaleRatio
  ) {
    reasons.push("scale-exceeds-bound");
  }

  const sameStyle =
    input.from.styleFingerprint === input.to.styleFingerprint;
  const transformableStyle = sameStyle || handoffStylesAreTransformable(
    input.from,
    input.to
  );
  if (!transformableStyle) reasons.push("style-mismatch");

  const shapeResidual = maximum([
    Math.abs(input.to.rect.width - input.from.rect.width),
    Math.abs(input.to.rect.height - input.from.rect.height)
  ]);
  const compatibility = reasons.length > 0
    ? "unsupported"
    : sameStyle && shapeResidual <= input.tolerancePx
      ? "style-compatible"
      : "transform-compatible";
  return Object.freeze({
    kind: "native-katex-typography-handoff-assessment",
    lifecycle: "renderer-session",
    id: correlationId(input.from.id),
    compatibility,
    translateX,
    translateY,
    scaleX,
    scaleY,
    stretchRatio,
    settlement: compatibility === "unsupported"
      ? "native-checkpoint"
      : "continuous",
    reasons: Object.freeze([...new Set(reasons)].sort())
  });
}

export function evaluateKpNativeKatexTypographyHandoffLaw(input: {
  readonly telemetry: KpNativeKatexHandoffTelemetry;
  readonly tolerancePx: number;
  readonly maximumTranslationPx: number;
  readonly maximumScaleRatio: number;
}): KpNativeKatexTypographyHandoffLaw {
  const assessments = handoffTelemetryPairs(input.telemetry).map(
    ([material, native]) => assessKpNativeKatexTypographyHandoff({
      from: material,
      to: native,
      tolerancePx: input.tolerancePx,
      maximumTranslationPx: input.maximumTranslationPx,
      maximumScaleRatio: input.maximumScaleRatio
    })
  );
  const unsupportedIds = assessments
    .filter(({ compatibility }) => compatibility === "unsupported")
    .map(({ id }) => id);
  return Object.freeze({
    kind: "native-katex-typography-handoff-law",
    lifecycle: "renderer-session",
    status: unsupportedIds.length === 0
      ? "continuous"
      : "native-checkpoint",
    assessments: Object.freeze(assessments),
    unsupportedIds: Object.freeze(unsupportedIds)
  });
}

export function traceKpNativeKatexHandoffOwnership(input: {
  readonly stage: HTMLElement;
  readonly playback: KpNativeKatexScenePlayback;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly correlations: readonly KpNativeKatexHandoffCorrelation[];
  readonly progresses: readonly number[];
  readonly fontRevision: number;
  readonly viewportKey: string;
}): readonly KpNativeKatexHandoffOwnershipSample[] {
  return Object.freeze(input.progresses.map((progress) => {
    const ownership = input.playback.apply(progress);
    const glyphTelemetry = measureKpNativeKatexGlyphHandoff({
      ...input,
      progress
    });
    const ruleTelemetry = measureKpNativeKatexRuleHandoff({
      ...input,
      progress
    });
    const glyphPairs = handoffTelemetryPairs(glyphTelemetry);
    const rulePairs = handoffTelemetryPairs(ruleTelemetry);
    const visibleMaterialOwnerIds = [
      ...input.stage.querySelectorAll<HTMLElement>(
        "[data-kp-native-katex-scene-owner]"
      )
    ].filter((owner) => effectiveOpacity(owner, input.stage) > 0)
      .map((owner) => owner.dataset["kpEquationMaterialOwnerId"]!)
      .sort();
    return Object.freeze({
      progress,
      visualOwner: ownership.visualOwner,
      sourceNativeOpacity: ownership.sourceNativeOpacity,
      materialSceneOpacity: ownership.materialSceneOpacity,
      targetNativeOpacity: ownership.targetNativeOpacity,
      visibleMaterialOwnerIds: Object.freeze(visibleMaterialOwnerIds),
      glyphStyleMismatchIds: Object.freeze(glyphPairs.filter(
        ([material, native]) =>
          material.styleFingerprint !== native.styleFingerprint
      ).map(([material]) =>
        material.id.replace(/\.material$/, "")
      )),
      maximumGlyphRectResidualPx: maximum(
        glyphPairs.map(([material, native]) =>
          rectDelta(material.rect, native.rect)
        )
      ),
      maximumGlyphBaselineResidualPx: maximum(
        glyphPairs.flatMap(([material, native]) =>
          material.baselineY === null || native.baselineY === null
            ? []
            : [Math.abs(material.baselineY - native.baselineY)]
        )
      ),
      maximumRuleGeometryResidualPx: maximum(
        rulePairs.map(([material, native]) =>
          ruleGeometryDelta(
            material.ruleGeometry!,
            native.ruleGeometry!
          )
        )
      )
    });
  }));
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

function assertUniqueRelationIds(ids: readonly string[]): void {
  if (
    ids.some((id) => id.trim() === "") ||
    new Set(ids).size !== ids.length
  ) {
    throw new Error("Semantic paint relation IDs must be unique and non-empty.");
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

function observeHandoffGlyph(input: {
  readonly id: string;
  readonly side: "native-source" | "material" | "native-target";
  readonly stage: HTMLElement;
  readonly element: HTMLElement;
  readonly rectElement: HTMLElement;
  readonly target: KpNativeKatexPaintAtomObservation;
  readonly fontRevision: number;
}) {
  const stageRect = input.stage.getBoundingClientRect();
  const rect = normalizeKpStageRelativeRect({
    stageClientRect: stageRect,
    stageLayoutWidth: input.stage.offsetWidth || stageRect.width,
    stageLayoutHeight: input.stage.offsetHeight || stageRect.height,
    fragmentClientRect: input.rectElement.getBoundingClientRect()
  });
  const computed = getComputedStyle(input.element);
  return {
    kind: "native-katex-handoff-paint-observation" as const,
    lifecycle: "renderer-session" as const,
    id: input.id,
    side: input.side,
    paintAtomId: input.target.id,
    semanticEntityId: input.target.semanticEntityId,
    presentationGroupId: input.target.presentationGroupId,
    paintKind: input.target.paintKind,
    element: input.element,
    rect,
    baselineY: fontMetricBaseline(input.element, computed, rect),
    wrapperTransform: computedTransformChain(input.element, input.stage),
    wrapperFingerprint: computedWrapperFingerprint(input.element, input.stage),
    clipPath: computed.clipPath || "none",
    paintFingerprint: input.target.visualKey,
    styleFingerprint: handoffStyleFingerprint(computed),
    opacity: effectiveOpacity(input.rectElement, input.stage),
    fontRevision: input.fontRevision
  };
}

function observeHandoffRule(input: {
  readonly id: string;
  readonly side: "native-source" | "material" | "native-target";
  readonly stage: HTMLElement;
  readonly element: HTMLElement;
  readonly target: KpNativeKatexPaintAtomObservation;
  readonly fontRevision: number;
}) {
  const stageRect = input.stage.getBoundingClientRect();
  const rect = normalizeKpStageRelativeRect({
    stageClientRect: stageRect,
    stageLayoutWidth: input.stage.offsetWidth || stageRect.width,
    stageLayoutHeight: input.stage.offsetHeight || stageRect.height,
    fragmentClientRect: input.element.getBoundingClientRect()
  });
  const computed = getComputedStyle(input.element);
  return {
    kind: "native-katex-handoff-paint-observation" as const,
    lifecycle: "renderer-session" as const,
    id: input.id,
    side: input.side,
    paintAtomId: input.target.id,
    semanticEntityId: input.target.semanticEntityId,
    presentationGroupId: input.target.presentationGroupId,
    paintKind: "rule" as const,
    element: input.element,
    rect,
    baselineY: null,
    wrapperTransform: computedTransformChain(input.element, input.stage),
    wrapperFingerprint: computedWrapperFingerprint(input.element, input.stage),
    clipPath: computed.clipPath || "none",
    paintFingerprint: input.target.visualKey,
    styleFingerprint: structuralStyleFingerprint(computed),
    opacity: effectiveOpacity(input.element, input.stage),
    ruleGeometry: measureRuleGeometry(computed, rect),
    fontRevision: input.fontRevision
  };
}

function observeCorrelatedHandoffPaint(input: {
  readonly id: string;
  readonly side: "native-source" | "material" | "native-target";
  readonly stage: HTMLElement;
  readonly element: HTMLElement;
  readonly rectElement: HTMLElement;
  readonly atom: KpNativeKatexPaintAtomObservation;
  readonly fontRevision: number;
}) {
  if (input.atom.paintKind === "glyph") {
    return observeHandoffGlyph({
      ...input,
      target: input.atom
    });
  }
  if (input.atom.paintKind === "rule") {
    return observeHandoffRule({
      id: input.id,
      side: input.side,
      stage: input.stage,
      element: input.element,
      target: input.atom,
      fontRevision: input.fontRevision
    });
  }
  const stageRect = input.stage.getBoundingClientRect();
  const rect = normalizeKpStageRelativeRect({
    stageClientRect: stageRect,
    stageLayoutWidth: input.stage.offsetWidth || stageRect.width,
    stageLayoutHeight: input.stage.offsetHeight || stageRect.height,
    fragmentClientRect: input.rectElement.getBoundingClientRect()
  });
  const computed = getComputedStyle(input.element);
  return {
    kind: "native-katex-handoff-paint-observation" as const,
    lifecycle: "renderer-session" as const,
    id: input.id,
    side: input.side,
    paintAtomId: input.atom.id,
    semanticEntityId: input.atom.semanticEntityId,
    presentationGroupId: input.atom.presentationGroupId,
    paintKind: input.atom.paintKind,
    element: input.element,
    rect,
    baselineY: null,
    wrapperTransform: computedTransformChain(input.element, input.stage),
    wrapperFingerprint: computedWrapperFingerprint(input.element, input.stage),
    clipPath: computed.clipPath || "none",
    paintFingerprint: input.atom.visualKey,
    styleFingerprint: structuralStyleFingerprint(computed),
    opacity: effectiveOpacity(input.rectElement, input.stage),
    fontRevision: input.fontRevision
  };
}

function fontMetricBaseline(
  element: HTMLElement,
  computed: CSSStyleDeclaration,
  rect: KpStageRelativeRect
): number {
  const canvas = element.ownerDocument.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Native handoff baseline measurement requires canvas text metrics.");
  }
  context.font = [
    computed.fontStyle,
    computed.fontWeight,
    computed.fontSize,
    computed.fontFamily
  ].join(" ");
  const metrics = context.measureText(element.textContent?.trim() ?? "");
  return rect.top + rect.height - metrics.actualBoundingBoxDescent;
}

function computedTransformChain(
  element: HTMLElement,
  stage: HTMLElement
): string {
  const transforms: string[] = [];
  let current: HTMLElement | null = element;
  while (current !== null && current !== stage) {
    const computed = getComputedStyle(current);
    transforms.push([
      computed.transform || "none",
      computed.translate || "none",
      computed.scale || "none"
    ].join(","));
    current = current.parentElement;
  }
  return transforms.join(">");
}

function computedWrapperFingerprint(
  element: HTMLElement,
  stage: HTMLElement
): string {
  const wrappers: string[] = [];
  let current = element.parentElement;
  while (current !== null && current !== stage) {
    const computed = getComputedStyle(current);
    wrappers.push([
      `display:${computed.display}`,
      `position:${computed.position}`,
      `font-family:${computed.fontFamily}`,
      `font-size:${computed.fontSize}`,
      `line-height:${computed.lineHeight}`,
      `vertical-align:${computed.verticalAlign}`
    ].join("|"));
    current = current.parentElement;
  }
  return wrappers.join(">");
}

function handoffStyleFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "color",
    "letter-spacing",
    "line-height",
    "vertical-align"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function structuralStyleFingerprint(computed: CSSStyleDeclaration): string {
  return [
    "background-color",
    "border-top-width",
    "border-top-style",
    "border-right-width",
    "border-right-style",
    "border-bottom-width",
    "border-bottom-style",
    "border-left-width",
    "border-left-style",
    "box-sizing",
    "overflow",
    "clip-path"
  ].map((property) =>
    `${property}:${computed.getPropertyValue(property)}`
  ).join("|");
}

function measureRuleGeometry(
  computed: CSSStyleDeclaration,
  rect: KpStageRelativeRect
) {
  const candidates = [
    {
      side: "top",
      axis: "horizontal" as const,
      width: computed.borderTopWidth,
      style: computed.borderTopStyle
    },
    {
      side: "bottom",
      axis: "horizontal" as const,
      width: computed.borderBottomWidth,
      style: computed.borderBottomStyle
    },
    {
      side: "left",
      axis: "vertical" as const,
      width: computed.borderLeftWidth,
      style: computed.borderLeftStyle
    },
    {
      side: "right",
      axis: "vertical" as const,
      width: computed.borderRightWidth,
      style: computed.borderRightStyle
    }
  ].map((candidate) => ({
    ...candidate,
    thickness: Number.parseFloat(candidate.width)
  })).filter(({ style, thickness }) =>
    Number.isFinite(thickness) &&
    thickness > 0 &&
    style !== "none" &&
    style !== "hidden"
  ).sort((left, right) => right.thickness - left.thickness);
  const border = candidates[0];
  if (border === undefined) {
    throw new Error("Native handoff rule requires one visible border.");
  }
  const horizontal = border.axis === "horizontal";
  return {
    axis: border.axis,
    left:
      border.side === "right"
        ? rect.left + rect.width - border.thickness
        : rect.left,
    top:
      border.side === "bottom"
        ? rect.top + rect.height - border.thickness
        : rect.top,
    width: horizontal ? rect.width : rect.height,
    thickness: border.thickness
  };
}

function effectiveOpacity(element: HTMLElement, stage: HTMLElement): number {
  let opacity = 1;
  let current: HTMLElement | null = element;
  while (current !== null) {
    opacity *= Number(getComputedStyle(current).opacity);
    if (current === stage) break;
    current = current.parentElement;
  }
  return opacity;
}

function handoffTelemetryPairs(
  telemetry: KpNativeKatexHandoffTelemetry
) {
  const byId = new Map<string, typeof telemetry.observations>();
  for (const observation of telemetry.observations) {
    const id = observation.id.replace(/\.(source|material|native)$/, "");
    byId.set(id, [...(byId.get(id) ?? []), observation]);
  }
  return [...byId.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  ).map(([id, observations]) => {
    const material = observations.find(({ side }) => side === "material");
    const native = observations.find(({ side }) => side === "native-target");
    if (material === undefined || native === undefined) {
      throw new Error(`Native handoff telemetry ${id} is not paired.`);
    }
    return [material, native] as const;
  });
}

function rectDelta(
  left: KpStageRelativeRect,
  right: KpStageRelativeRect
): number {
  return maximum([
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  ]);
}

function ruleGeometryDelta(
  left: NonNullable<
    KpNativeKatexHandoffTelemetry["observations"][number]["ruleGeometry"]
  >,
  right: NonNullable<
    KpNativeKatexHandoffTelemetry["observations"][number]["ruleGeometry"]
  >
): number {
  if (left.axis !== right.axis) return Number.POSITIVE_INFINITY;
  return maximum([
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.thickness - right.thickness)
  ]);
}

function maximum(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function correlationId(observationId: string): string {
  return observationId.replace(/\.(source|material|native)$/, "");
}

// Other style changes substitute paint; these two metrics can be assessed
// continuously without knowing a character, notation, or renderer class.
const kpTransformableTypographyProperties = new Set([
  "font-size",
  "line-height"
]);

function handoffStylesAreTransformable(
  from: KpNativeKatexHandoffTelemetry["observations"][number],
  to: KpNativeKatexHandoffTelemetry["observations"][number]
): boolean {
  if (from.paintKind === "rule" || to.paintKind === "rule") return false;
  const fromStyle = parseFingerprint(from.styleFingerprint);
  const toStyle = parseFingerprint(to.styleFingerprint);
  if (
    fromStyle.size !== toStyle.size ||
    [...fromStyle.keys()].some((property) => !toStyle.has(property))
  ) {
    return false;
  }
  let changed = false;
  for (const [property, fromValue] of fromStyle) {
    const toValue = toStyle.get(property);
    if (fromValue === toValue) continue;
    changed = true;
    if (!kpTransformableTypographyProperties.has(property)) return false;
    if (!positiveCssLength(fromValue) || !positiveCssLength(toValue!)) {
      return false;
    }
  }
  return changed;
}

function parseFingerprint(fingerprint: string): ReadonlyMap<string, string> {
  return new Map(fingerprint.split("|").map((entry) => {
    const separator = entry.indexOf(":");
    return separator < 1
      ? [entry, ""] as const
      : [entry.slice(0, separator), entry.slice(separator + 1)] as const;
  }));
}

function positiveCssLength(value: string): boolean {
  const match = /^([0-9]+(?:\.[0-9]+)?)px$/.exec(value);
  return match !== null && Number(match[1]) > 0;
}

function compatibleRuleAxis(
  from: KpNativeKatexHandoffTelemetry["observations"][number],
  to: KpNativeKatexHandoffTelemetry["observations"][number]
): boolean {
  if (from.ruleGeometry === undefined && to.ruleGeometry === undefined) {
    return true;
  }
  return from.ruleGeometry?.axis === to.ruleGeometry?.axis;
}

function safeScale(to: number, from: number): number {
  return from === 0 ? Number.POSITIVE_INFINITY : to / from;
}

function symmetricScaleRatio(scale: number): number {
  return scale <= 0 ? Number.POSITIVE_INFINITY : Math.max(scale, 1 / scale);
}

function commonAlignmentResult(
  status: KpNativeKatexCommonHandoffAlignment["status"],
  translateX: number,
  translateY: number,
  rejectedIds: readonly string[],
  input: {
    readonly reason?: KpNativeKatexCommonHandoffAlignment["reason"];
  } = {}
): KpNativeKatexCommonHandoffAlignment {
  return Object.freeze({
    kind: "native-katex-common-handoff-alignment",
    status,
    translateX,
    translateY,
    rejectedIds: Object.freeze([...rejectedIds].sort()),
    ...(input.reason === undefined ? {} : { reason: input.reason })
  });
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

function requireNonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative.`);
  }
}
