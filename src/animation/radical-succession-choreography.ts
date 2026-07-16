import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
import {
  createKpChoreographyHierarchyPlan,
  type KpChoreographyHierarchyPlan
} from "./choreography-hierarchy.ts";
import {
  compileKpChoreographyTimeline,
  sampleKpChoreographyTimeline,
  type KpChoreographyTimeline,
  type KpChoreographyTimelineFrame
} from "./choreography-timeline.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";
import {
  compileKpFocusProfile,
  sampleKpFocusProfile,
  type KpFocusAccessibilityMode,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";

export const kpRadicalSuccessionTiming = {
  orientEnd: 0.12,
  reflowEnd: 0.32,
  gatherEnd: 0.58,
  targetRevealStart: 0.42,
  sourceReleaseEnd: 0.78,
  targetRevealEnd: 0.82,
  settleEnd: 0.92
} as const;

export interface KpRadicalSuccessionChoreography {
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focus: KpFocusProfilePlan;
  readonly hierarchy: KpChoreographyHierarchyPlan;
  readonly propagationRule: "far-to-near";
  readonly pathRequirement: {
    readonly motifId: "radical.rewrite-power-as-root";
    readonly requiredPathFamily: "opposite-corner";
    readonly requireOppositeCornerReconciliation: true;
  };
}

export interface KpRadicalSuccessionChoreographyFrame {
  readonly timeline: KpChoreographyTimelineFrame;
  readonly focus: KpFocusProfileFrame;
}

export function createKpRadicalSuccessionChoreography(
  animation: KpAnimationAsset
): KpRadicalSuccessionChoreography {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "rewritePowerAsRoot"
  );
  if (transformation === undefined) {
    throw new Error(`Animation ${animation.id} has no radical rewrite.`);
  }
  const base = transformation.correspondenceMap?.records.find(
    (record) => record.id === "base-becomes-radicand"
  );
  const notation = transformation.correspondenceMap?.records.find(
    (record) => record.id === "exponent-becomes-radical"
  );
  if (base === undefined || notation === undefined) {
    throw new Error("Radical succession requires base and notation correspondence.");
  }
  const sourceRepresentationId = `${transformation.id}.source-root-notation`;
  const targetRepresentationId = `${transformation.id}.target-root-notation`;
  const continuantId = `${transformation.id}.base-continuant`;
  const lineageId = `${transformation.id}.root-notation-lineage`;
  const vocabulary: KpChoreographyVocabulary = {
    id: `vocabulary.${transformation.id}`,
    continuants: [{
      id: continuantId,
      meaning: "The same base becomes the radical's radicand.",
      relation: "role-change",
      source: {
        entityId: base.sourceSelectorIds[0]!,
        selectorIds: base.sourceSelectorIds
      },
      target: {
        entityId: base.targetSelectorIds[0]!,
        selectorIds: base.targetSelectorIds
      },
      identityAuthority: {
        kind: "correspondence",
        transformationId: transformation.id,
        correspondenceRecordId: base.id
      }
    }],
    representationalLineages: [{
      id: lineageId,
      meaning: "Fractional exponent notation succeeds into radical notation.",
      sourceRepresentation: {
        entityId: sourceRepresentationId,
        selectorIds: notation.sourceSelectorIds
      },
      targetRepresentation: {
        entityId: targetRepresentationId,
        selectorIds: notation.targetSelectorIds
      },
      cause: {
        kind: "transformation",
        transformationId: transformation.id,
        correspondenceRecordIds: [notation.id]
      }
    }],
    objectConstancy: [{
      id: `${continuantId}.constancy`,
      continuantId,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    }],
    materialContinuity: [{
      id: `${lineageId}.continuity`,
      mode: "shared-reconciliation",
      sourceEntityIds: notation.sourceSelectorIds,
      targetEntityIds: notation.targetSelectorIds,
      authorityRef: {
        kind: "representational-lineage",
        lineageId
      },
      summary: "Exponent material reconciles through the radical's opposite corner."
    }],
    motionClassifications: [{
      id: `${transformation.id}.notation-motion`,
      entityIds: [...notation.sourceSelectorIds, ...notation.targetSelectorIds],
      motionClass: "meaningful",
      reason: "Token-level opposite-corner motion communicates notation succession."
    }]
  };
  const lifecycle = {
    id: `lifecycle.${transformation.id}`,
    records: [
      {
        id: `${transformation.id}.base`,
        kind: "continuant" as const,
        continuantId,
        sourceEntityIds: base.sourceSelectorIds,
        targetEntityIds: base.targetSelectorIds,
        summary: "The base persists as the radicand."
      },
      {
        id: `${transformation.id}.notation`,
        kind: "successor" as const,
        representationalLineageId: lineageId,
        sourceEntityIds: notation.sourceSelectorIds,
        targetEntityIds: notation.targetSelectorIds,
        summary: "Fractional exponent notation succeeds into a radical."
      }
    ]
  };
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: [
      ...base.sourceSelectorIds,
      ...notation.sourceSelectorIds
    ],
    targetEntityIds: [
      ...base.targetSelectorIds,
      ...notation.targetSelectorIds
    ],
    edges: [
      {
        id: `${transformation.id}.base-persist`,
        relation: "persist",
        sourceEntityIds: base.sourceSelectorIds,
        targetEntityIds: base.targetSelectorIds,
        summary: "The base persists as the radicand."
      },
      {
        id: `${transformation.id}.notation-successor`,
        relation: "representation-succession",
        sourceEntityIds: notation.sourceSelectorIds,
        targetEntityIds: notation.targetSelectorIds,
        representationAuthorityId: `${transformation.id}#${notation.id}`,
        summary: "Root notation changes representation."
      }
    ]
  });
  const result = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: animation.timeline?.id ?? `timeline.${animation.id}`,
    canonicalOperationId: "kp.core.rewrite-power-as-root",
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle,
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: [
        {
          id: `${transformation.id}.source-notation-salience`,
          entityIds: notation.sourceSelectorIds,
          role: "source",
          readinessThreshold: 0.6
        },
        {
          id: `${transformation.id}.target-notation-salience`,
          entityIds: notation.targetSelectorIds,
          role: "target",
          readinessThreshold: 0.72
        }
      ],
      edges: [{
        id: `${transformation.id}.notation-handoff`,
        sourceNodeId: `${transformation.id}.source-notation-salience`,
        targetNodeId: `${transformation.id}.target-notation-salience`,
        lineageEdgeId: `${transformation.id}.notation-successor`,
        targetReadyAt: 0.62,
        sourceReleaseAt: 0.78
      }],
      branchGroups: []
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "execution",
      authorityId: "kp.core.rewrite-power-as-root",
      participants: [{
        id: `${transformation.id}.notation-participant`,
        entityIds: [
          ...base.sourceSelectorIds,
          ...base.targetSelectorIds,
          ...notation.sourceSelectorIds,
          ...notation.targetSelectorIds
        ],
        rank: 0
      }],
      ranks: [{
        rank: 0,
        participantIds: [`${transformation.id}.notation-participant`],
        presentation: "show"
      }],
      cascade: {
        adjacentOnly: true,
        nextRankReadinessThreshold: 0.62
      }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: ["opposite-corner-seed", "representation-succession"]
  });
  if (result.status !== "compiled") {
    throw new Error(
      `Radical choreography failed: ${result.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  const hierarchy = createKpChoreographyHierarchyPlan({
    id: `${transformation.id}.hierarchy`,
    groups: [{
      id: `${transformation.id}.notation-group`,
      semanticEntityIds: [sourceRepresentationId, targetRepresentationId],
      tokenIds: [...notation.sourceSelectorIds, ...notation.targetSelectorIds],
      motionFieldId: `${transformation.id}.opposite-corner-field`,
      cohesion: {
        anchorTokenIds: [notation.sourceSelectorIds[1] ?? notation.sourceSelectorIds[0]!],
        maximumSeparation: 0.32,
        maximumStaggerSpan: 0.18,
        preserveTokenOrder: true,
        maximumCrossings: 0,
        minimumVisibleMaterial: 0.18,
        reconciliationRegionId: `${transformation.id}.target-opposite-corner`,
        exactTargetRegrouping: true
      }
    }],
    tokens: [
      ...notation.sourceSelectorIds.map((id) => ({
        id,
        kind: "structural" as const,
        groupId: `${transformation.id}.notation-group`,
        ownerSemanticEntityId: sourceRepresentationId,
        selectorIds: [id],
        fragmentIds: [],
        nativeRendererOwnerId: "katex-dom"
      })),
      ...notation.targetSelectorIds.map((id) => ({
        id,
        kind: "structural" as const,
        groupId: `${transformation.id}.notation-group`,
        ownerSemanticEntityId: targetRepresentationId,
        selectorIds: [id],
        fragmentIds: [],
        nativeRendererOwnerId: "katex-dom"
      }))
    ],
    fragments: [],
    settlement: {
      checkpointId: `${transformation.id}.native-settled`,
      phaseId: "settle",
      rendererId: "katex-dom",
      nativeTokenIds: [
        ...notation.sourceSelectorIds,
        ...notation.targetSelectorIds
      ],
      disposedFragmentIds: [],
      requireExactTargetGeometry: true
    }
  });
  return {
    plan: result.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.choreography`,
      plan: result.plan,
      focusReadinessThreshold: 0.6,
      recognitionDwell: 0.45,
      phaseWeights: {
        orient: 0.12,
        reflow: 0.2,
        act: 0.38,
        settle: 0.2,
        release: 0.1
      }
    }),
    focus: compileKpFocusProfile({
      id: `focus.${transformation.id}.source-notation`,
      groupId: `${transformation.id}.source-notation`,
      semanticEntityIds: notation.sourceSelectorIds,
      fragmentIds: [],
      profile: "elevated",
      strength: 0.5,
      contextDimming: 0.1,
      accessibilityMode: "full"
    }),
    hierarchy,
    propagationRule: "far-to-near",
    pathRequirement: {
      motifId: "radical.rewrite-power-as-root",
      requiredPathFamily: "opposite-corner",
      requireOppositeCornerReconciliation: true
    }
  };
}

export function sampleKpRadicalSuccessionChoreography(input: {
  readonly choreography: KpRadicalSuccessionChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpRadicalSuccessionChoreographyFrame {
  const timeline = sampleKpChoreographyTimeline({
    timeline: input.choreography.timeline,
    progress: input.progress,
    direction: input.direction
  });
  const phaseId = timeline.activePhaseIds.at(-1) ??
    (timeline.semanticProgress <= 0 ? "orient" : "release");
  const focusPlan = input.accessibilityMode === "full"
    ? input.choreography.focus
    : compileKpFocusProfile({
        id: input.choreography.focus.id,
        groupId: input.choreography.focus.groupId,
        semanticEntityIds: input.choreography.focus.semanticEntityIds,
        fragmentIds: [],
        profile: input.choreography.focus.groupTreatment.profile,
        strength: 0.5,
        contextDimming: input.choreography.focus.contextProfile.dimming,
        accessibilityMode: input.accessibilityMode
      });
  return {
    timeline,
    focus: sampleKpFocusProfile({
      plan: focusPlan,
      phaseId,
      phaseProgress: timeline.phaseProgress[phaseId] ?? 1
    })
  };
}
