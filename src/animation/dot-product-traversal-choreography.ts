import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
import {
  compileKpFocusProfile,
  sampleKpFocusProfile,
  type KpFocusAccessibilityMode,
  type KpFocusProfileFrame,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
import { planKpMotionField, type KpMotionFieldPlan } from "./motion-field.ts";
import {
  deriveKpOrganicMotionSignature
} from "./organic-motion-primitives.ts";
import {
  compileKpPropagation,
  type KpPropagationPlan
} from "./propagation-compiler.ts";
import type { KpSemanticTraversalPlan } from "./semantic-traversal.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  sampleKpDotProductTraversalProgress,
  type KpDotProductRendererContributionPlan,
  type KpDotProductRendererPlan,
  type KpDotProductTraversalProgressFrame
} from "../rendering/equation-dot-product-traversal.ts";

export interface KpDotProductTraversalContributionPlan
  extends KpDotProductRendererContributionPlan {
  readonly traversalParticipantId: string;
  readonly motionField: KpMotionFieldPlan;
  readonly focus: KpFocusProfilePlan;
}

export interface KpDotProductTraversalChoreography {
  readonly id: string;
  readonly transformationId: string;
  readonly plan: KpCompiledChoreographyPlan;
  readonly traversal: KpSemanticTraversalPlan;
  readonly propagation: KpPropagationPlan;
  readonly rendererPlan: KpDotProductRendererPlan;
  readonly contributions: readonly KpDotProductTraversalContributionPlan[];
  readonly patternCompression: {
    readonly available: true;
    readonly applied: false;
    readonly minimumContributionCount: 5;
    readonly preserveFirstAndFinal: true;
  };
}

export interface KpDotProductTraversalChoreographyFrame {
  readonly motion: KpDotProductTraversalProgressFrame;
  readonly focusFrames: readonly {
    readonly semanticIndex: number;
    readonly plan: KpFocusProfilePlan;
    readonly frame: KpFocusProfileFrame;
  }[];
}

export function createKpDotProductTraversalChoreography(
  animation: KpAnimationAsset
): KpDotProductTraversalChoreography {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "computeDotProduct"
  );
  if (transformation?.correspondenceMap === undefined) {
    throw new Error(`Animation ${animation.id} has no semantic dot-product fan-in.`);
  }
  const source = animation.bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  const target = animation.bundle.objects.find(
    (object) => object.id === transformation.targetObjectIds[0]
  );
  const leftVector = numericArray(source?.value, "leftVector");
  const rightVector = numericArray(source?.value, "rightVector");
  const result = numericValue(target?.value, "result");
  if (
    leftVector.length !== rightVector.length ||
    leftVector.length < 3
  ) {
    throw new Error("Dot-product traversal proof requires at least three matched components.");
  }
  const leftSelectorIds = indexedSelectorIds(source, "leftVector.component.");
  const rightSelectorIds = indexedSelectorIds(source, "rightVector.component.");
  const resultSelectorId = target?.selectors.find(
    (selector) => selector.id.endsWith(".result.scalar")
  )?.id;
  if (
    leftSelectorIds.length !== leftVector.length ||
    rightSelectorIds.length !== rightVector.length ||
    resultSelectorId === undefined
  ) {
    throw new Error("Dot-product traversal selectors do not match vector values.");
  }
  const participants = leftVector.map((_value, semanticIndex) => ({
    id: `${transformation.id}.contribution.${semanticIndex}`,
    entityIds: [
      leftSelectorIds[semanticIndex]!,
      rightSelectorIds[semanticIndex]!
    ],
    rank: semanticIndex,
    semanticIndex
  }));
  const traversal: KpSemanticTraversalPlan = {
    id: `traversal.${transformation.id}`,
    kind: "semantic-traversal-plan",
    policy: "ranked-index",
    authorityId: "kp.algebra.compute-dot-product#index-pairing",
    participants,
    ranks: participants.map((participant) => ({
      rank: participant.rank,
      participantIds: [participant.id],
      presentation: "show"
    })),
    cascade: {
      adjacentOnly: true,
      nextRankReadinessThreshold: 0.6
    }
  };
  const propagation = compileKpPropagation({
    id: `propagation.${transformation.id}`,
    rule: "semantic-traversal-rank",
    participants: participants.map((participant) => ({
      id: `${participant.id}.visual`,
      semanticEntityIds: participant.entityIds,
      traversalParticipantId: participant.id
    })),
    traversalPlan: traversal,
    constraints: {
      maximumStaggerSpan: 0.3,
      requestedStaggerSpan: 0.3,
      readinessThreshold: 0.6,
      latestOverlappingStartProgress: 0.85,
      minimumParticipantDuration: 0.24,
      stableVariationStrength: 0.06
    }
  });
  if (!propagation.promotable) {
    throw new Error(
      `Dot-product propagation failed: ${propagation.diagnostics[0] ?? "unknown gap"}`
    );
  }
  let accumulatedValue = 0;
  const contributions: KpDotProductTraversalContributionPlan[] =
    participants.map((participant, semanticIndex) => {
      const product =
        leftVector[semanticIndex]! * rightVector[semanticIndex]!;
      accumulatedValue += product;
      const propagationEntry = propagation.entries.find(
        (entry) => entry.participantId === `${participant.id}.visual`
      )!;
      const contributionId = `${transformation.id}.pair.${semanticIndex}`;
      const motionField = planKpMotionField({
        id: contributionId,
        groupEntityIds: participant.entityIds,
        purpose: "meaningful-transform",
        sourceRegion: semanticIndex === 0
          ? "upper-left"
          : semanticIndex === leftVector.length - 1
            ? "lower-left"
            : "center",
        targetRegion: "center",
        readingDirection: "left-to-right",
        traversalDirection: "forward",
        requiredPathFamily: "diagonal-arc",
        cohesion: {
          anchorEntityIds: [participant.entityIds[0]!],
          maximumSeparation: 0.3,
          maximumStaggerSpan: 0.08,
          preserveTokenOrder: true,
          maximumCrossings: 0,
          minimumVisibleMaterial: 0.7,
          exactTargetRegrouping: true
        }
      });
      return {
        id: contributionId,
        semanticIndex,
        leftSelectorId: leftSelectorIds[semanticIndex]!,
        rightSelectorId: rightSelectorIds[semanticIndex]!,
        leftValue: leftVector[semanticIndex]!,
        rightValue: rightVector[semanticIndex]!,
        product,
        accumulatedValue,
        start: propagationEntry.start,
        end: propagationEntry.end,
        traversalParticipantId: participant.id,
        motionField,
        focus: compileKpFocusProfile({
          id: `focus.${contributionId}`,
          groupId: contributionId,
          semanticEntityIds: participant.entityIds,
          fragmentIds: [],
          profile: "elevated",
          strength: 0.48,
          contextDimming: 0.08,
          accessibilityMode: "full"
        }),
        leftSignature: deriveKpOrganicMotionSignature({
          identityId: leftSelectorIds[semanticIndex]!,
          lineageEdgeId: contributionId,
          branchIndex: 0,
          motifId: "dot-product-accumulate",
          motionFieldId: motionField.id
        }),
        rightSignature: deriveKpOrganicMotionSignature({
          identityId: rightSelectorIds[semanticIndex]!,
          lineageEdgeId: contributionId,
          branchIndex: 1,
          motifId: "dot-product-accumulate",
          motionFieldId: motionField.id
        })
      };
    });
  if (accumulatedValue !== result) {
    throw new Error(
      `Dot-product contributions accumulate to ${accumulatedValue}, not ${result}.`
    );
  }
  const sourceSelectorIds = [
    ...leftSelectorIds,
    ...rightSelectorIds
  ];
  const lineageId = `${transformation.id}.dot-product-lineage`;
  const lineageEdgeId = `${transformation.id}.component-merge`;
  const vocabulary = {
    id: `vocabulary.${transformation.id}`,
    continuants: [],
    representationalLineages: [{
      id: lineageId,
      meaning: "Index-paired component products accumulate into one scalar.",
      sourceRepresentation: {
        entityId: `${transformation.id}.component-expression`,
        selectorIds: sourceSelectorIds
      },
      targetRepresentation: {
        entityId: `${transformation.id}.scalar-result`,
        selectorIds: [resultSelectorId]
      },
      cause: {
        kind: "transformation" as const,
        transformationId: transformation.id,
        correspondenceRecordIds: ["component-pairs-accumulate"]
      }
    }],
    objectConstancy: [],
    materialContinuity: [{
      id: `${lineageId}.continuity`,
      mode: "causal-derivation" as const,
      sourceEntityIds: sourceSelectorIds,
      targetEntityIds: [resultSelectorId],
      authorityRef: {
        kind: "representational-lineage" as const,
        lineageId
      },
      summary:
        "Every matched component pair remains attributable through products and partial sums."
    }],
    motionClassifications: [{
      id: `${transformation.id}.index-cascade`,
      entityIds: [...sourceSelectorIds, resultSelectorId],
      motionClass: "meaningful" as const,
      reason:
        "Index-ranked pairing, product persistence, and accumulation communicate dot-product causality."
    }]
  };
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: sourceSelectorIds,
    targetEntityIds: [resultSelectorId],
    edges: [{
      id: lineageEdgeId,
      relation: "representation-succession",
      sourceEntityIds: sourceSelectorIds,
      targetEntityIds: [resultSelectorId],
      representationAuthorityId:
        `${transformation.id}#component-pairs-accumulate`,
      summary: "All indexed products derive the scalar result."
    }]
  });
  const compiled = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: animation.timeline?.id ?? `timeline.${animation.id}`,
    canonicalOperationId: "kp.algebra.compute-dot-product",
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle: {
      id: `lifecycle.${transformation.id}`,
      records: [{
        id: `${transformation.id}.scalar-successor`,
        kind: "successor",
        representationalLineageId: lineageId,
        sourceEntityIds: sourceSelectorIds,
        targetEntityIds: [resultSelectorId],
        summary:
          "The indexed component expression succeeds into the accumulated scalar."
      }]
    },
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: [
        ...participants.map((participant) => ({
          id: `${participant.id}.salience`,
          entityIds: participant.entityIds,
          role: "source" as const,
          readinessThreshold: 0.6
        })),
        {
          id: `${transformation.id}.result-salience`,
          entityIds: [resultSelectorId],
          role: "target",
          readinessThreshold: 0.78
        }
      ],
      edges: participants.map((participant, index) => ({
        id: `${participant.id}.handoff`,
        sourceNodeId: `${participant.id}.salience`,
        targetNodeId: `${transformation.id}.result-salience`,
        lineageEdgeId,
        targetReadyAt: 0.58 + index * 0.1,
        sourceReleaseAt: 0.76 + index * 0.1
      })),
      branchGroups: []
    },
    traversal,
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: ["dot-product-accumulate", "semantic-index-cascade"]
  });
  if (compiled.status !== "compiled") {
    throw new Error(
      `Dot-product choreography failed: ${compiled.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  return {
    id: `dot-product.${transformation.id}`,
    transformationId: transformation.id,
    plan: compiled.plan,
    traversal,
    propagation,
    rendererPlan: {
      id: `renderer.${transformation.id}.dot-product`,
      kind: "dot-product-renderer-plan",
      resultSelectorId,
      contributions,
      resultRevealStart: 0.78,
      resultRevealEnd: 0.92
    },
    contributions,
    patternCompression: {
      available: true,
      applied: false,
      minimumContributionCount: 5,
      preserveFirstAndFinal: true
    }
  };
}

export function sampleKpDotProductTraversalChoreography(input: {
  readonly choreography: KpDotProductTraversalChoreography;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode: KpFocusAccessibilityMode;
}): KpDotProductTraversalChoreographyFrame {
  const semanticProgress = round(
    input.direction === "forward"
      ? input.progress
      : 1 - input.progress
  );
  const motion = sampleKpDotProductTraversalProgress({
    plan: input.choreography.rendererPlan,
    progress: semanticProgress
  });
  return {
    motion,
    focusFrames: input.choreography.contributions.map((contribution) => {
      const contributionFrame = motion.contributions.find(
        (candidate) => candidate.id === contribution.id
      )!;
      const focusPlan = input.accessibilityMode === "full"
        ? contribution.focus
        : compileKpFocusProfile({
            id: contribution.focus.id,
            groupId: contribution.focus.groupId,
            semanticEntityIds: contribution.focus.semanticEntityIds,
            fragmentIds: [],
            profile: contribution.focus.groupTreatment.profile,
            strength: 0.48,
            contextDimming: contribution.focus.contextProfile.dimming,
            accessibilityMode: input.accessibilityMode
          });
      const phase = contributionFrame.status === "upcoming"
        ? { id: "orient" as const, progress: 0 }
        : contributionFrame.status === "accumulated"
          ? { id: "release" as const, progress: 1 }
          : contributionFrame.localProgress < 0.28
            ? {
                id: "orient" as const,
                progress: contributionFrame.localProgress / 0.28
              }
            : contributionFrame.localProgress <= 0.72
              ? { id: "act" as const, progress: 1 }
              : {
                  id: "release" as const,
                  progress:
                    (contributionFrame.localProgress - 0.72) / 0.28
                };
      return {
        semanticIndex: contribution.semanticIndex,
        plan: focusPlan,
        frame: sampleKpFocusProfile({
          plan: focusPlan,
          phaseId: phase.id,
          phaseProgress: Math.max(0, Math.min(1, phase.progress))
        })
      };
    })
  };
}

function indexedSelectorIds(
  object: KpAnimationAsset["bundle"]["objects"][number] | undefined,
  marker: string
): readonly string[] {
  return [...(object?.selectors ?? [])]
    .filter((selector) => selector.id.includes(marker))
    .sort((left, right) =>
      selectorIndex(left.id) - selectorIndex(right.id)
    )
    .map((selector) => selector.id);
}

function selectorIndex(id: string): number {
  const value = Number(id.split(".").at(-1));
  return Number.isInteger(value) ? value : Number.MAX_SAFE_INTEGER;
}

function numericArray(value: unknown, key: string): readonly number[] {
  const candidate = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
  if (
    !Array.isArray(candidate) ||
    !candidate.every(
      (item: unknown) => typeof item === "number"
    )
  ) {
    throw new Error(`Dot-product source requires numeric ${key}.`);
  }
  return [...candidate] as number[];
}

function numericValue(value: unknown, key: string): number {
  const candidate = typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[key]
    : undefined;
  if (typeof candidate !== "number") {
    throw new Error(`Dot-product target requires numeric ${key}.`);
  }
  return candidate;
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
