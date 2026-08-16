import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
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
import {
  requireKpFunctionWrapAssetBinding,
  type KpFunctionWrapAssetBinding
} from "./function-wrap-asset-binding.ts";

export interface KpFunctionWrapChoreography {
  readonly extensionBinding: KpFunctionWrapAssetBinding;
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focus: KpFocusProfilePlan;
}

export interface KpFunctionWrapChoreographyFrame {
  readonly timeline: KpChoreographyTimelineFrame;
  readonly focus: KpFocusProfileFrame;
}

export function createKpFunctionWrapChoreography(
  animation: KpAnimationAsset
): KpFunctionWrapChoreography {
  const extensionBinding = requireKpFunctionWrapAssetBinding(animation);
  const transformation = animation.transformations.find(
    ({ id }) => id === extensionBinding.transformationId
  );
  if (transformation === undefined) {
    throw new Error(
      `Animation ${animation.id} lost bound transformation ${extensionBinding.transformationId}.`
    );
  }
  const roleChange = transformation.correspondenceMap?.records.find(
    ({ id }) => id === extensionBinding.argumentCorrespondenceRecordId
  );
  if (roleChange === undefined) {
    throw new Error(
      "Function-wrap attention projection lost its bound argument role change."
    );
  }
  const wrapperTargets = extensionBinding.wrapperEntityIds;
  const sourceArgument = extensionBinding.sourceArgumentEntityIds[0]!;
  const targetArgument = extensionBinding.targetArgumentEntityIds[0]!;
  const vocabulary: KpChoreographyVocabulary = {
    id: `vocabulary.${transformation.id}`,
    continuants: [{
      id: `continuant.${transformation.id}.argument`,
      meaning: "The same argument changes role from free expression to function argument.",
      relation: "role-change",
      source: {
        entityId: sourceArgument,
        selectorIds: roleChange.sourceSelectorIds
      },
      target: {
        entityId: targetArgument,
        selectorIds: roleChange.targetSelectorIds
      },
      identityAuthority: {
        kind: "correspondence",
        transformationId: transformation.id,
        correspondenceRecordId: roleChange.id
      }
    }],
    representationalLineages: [],
    objectConstancy: [{
      id: `constancy.${transformation.id}.argument`,
      continuantId: `continuant.${transformation.id}.argument`,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    }],
    materialContinuity: [{
      id: `continuity.${transformation.id}.argument`,
      mode: "continuant-motion",
      sourceEntityIds: roleChange.sourceSelectorIds,
      targetEntityIds: roleChange.targetSelectorIds,
      authorityRef: {
        kind: "continuant",
        continuantId: `continuant.${transformation.id}.argument`
      },
      summary: "The argument remains opaque while reflowing into its wrapper."
    }],
    motionClassifications: [{
      id: `motion.${transformation.id}.wrapper-entry`,
      entityIds: wrapperTargets,
      motionClass: "meaningful",
      reason: "Function and delimiter entry communicates application after argument reflow."
    }]
  };
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: [sourceArgument],
    targetEntityIds: [targetArgument, ...wrapperTargets],
    edges: [
      {
        id: `lineage.${transformation.id}.argument`,
        relation: "persist",
        sourceEntityIds: roleChange.sourceSelectorIds,
        targetEntityIds: roleChange.targetSelectorIds,
        summary: "The argument persists through function application."
      },
      {
        id: `lineage.${transformation.id}.wrapper`,
        relation: "introduction",
        sourceEntityIds: [],
        targetEntityIds: wrapperTargets,
        summary: "The wrap operation introduces function-call notation."
      }
    ]
  });
  const result = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: animation.timeline?.id ?? `timeline.${animation.id}`,
    canonicalOperationId: "kp.core.wrap",
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle: {
      id: `lifecycle.${transformation.id}`,
      records: [
        {
          id: `lifecycle.${transformation.id}.argument`,
          kind: "continuant",
          continuantId: `continuant.${transformation.id}.argument`,
          sourceEntityIds: roleChange.sourceSelectorIds,
          targetEntityIds: roleChange.targetSelectorIds,
          summary: "The argument persists and changes role."
        },
        {
          id: `lifecycle.${transformation.id}.wrapper`,
          kind: "introduction",
          cause: {
            kind: "structural-realization",
            authorityId: "kp.core.wrap#wrapper"
          },
          sourceEntityIds: [],
          targetEntityIds: wrapperTargets,
          summary: "Function-call notation enters because wrap realizes enclosure."
        }
      ]
    },
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: [
        {
          id: `salience.${transformation.id}.source`,
          entityIds: roleChange.sourceSelectorIds,
          role: "source",
          readinessThreshold: 0.62
        },
        {
          id: `salience.${transformation.id}.target`,
          entityIds: roleChange.targetSelectorIds,
          role: "target",
          readinessThreshold: 0.72
        }
      ],
      edges: [{
        id: `salience.${transformation.id}.handoff`,
        sourceNodeId: `salience.${transformation.id}.source`,
        targetNodeId: `salience.${transformation.id}.target`,
        lineageEdgeId: `lineage.${transformation.id}.argument`,
        targetReadyAt: 0.72,
        sourceReleaseAt: 1
      }],
      branchGroups: []
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "execution",
      authorityId: "kp.core.wrap",
      participants: [{
        id: `participant.${transformation.id}.wrap`,
        entityIds: [sourceArgument, targetArgument, ...wrapperTargets],
        rank: 0
      }],
      ranks: [{
        rank: 0,
        participantIds: [`participant.${transformation.id}.wrap`],
        presentation: "show"
      }],
      cascade: {
        adjacentOnly: true,
        nextRankReadinessThreshold: 0.65
      }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: ["wrap"]
  });
  if (result.status !== "compiled") {
    throw new Error(
      `Function-wrap choreography failed: ${result.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  return {
    extensionBinding,
    plan: result.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.choreography`,
      plan: result.plan,
      focusReadinessThreshold: 0.62,
      recognitionDwell: 0.45,
      phaseWeights: {
        orient: 0.14,
        reflow: 0.28,
        act: 0.28,
        settle: 0.2,
        release: 0.1
      }
    }),
    focus: compileKpFocusProfile({
      id: `focus.${transformation.id}.argument`,
      groupId: `group.${transformation.id}.argument`,
      semanticEntityIds: [sourceArgument, targetArgument],
      fragmentIds: [],
      profile: "elevated",
      strength: 0.55,
      contextDimming: 0.12,
      accessibilityMode: "full"
    })
  };
}

export function sampleKpFunctionWrapChoreography(input: {
  readonly choreography: KpFunctionWrapChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpFunctionWrapChoreographyFrame {
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
        fragmentIds: input.choreography.focus.sharedShadow.fragmentIds,
        profile: input.choreography.focus.groupTreatment.profile,
        strength: input.choreography.focus.groupTreatment.outlineStrength,
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
