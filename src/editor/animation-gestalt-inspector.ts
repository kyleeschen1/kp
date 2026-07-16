import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  kpBaseGestaltStyleCatalog,
  kpGeneratedAnimationGestaltDefaults,
  kpOrganicSubtleStyleRef,
  kpRestrainedEditorialStyleRef,
  kpGestaltStyleKey
} from "../animation/gestalt-base-styles.ts";
import {
  compileKpChoreographyTimeline,
  sampleKpChoreographyTimeline,
  type KpChoreographyTimeline
} from "../animation/choreography-timeline.ts";
import type { KpCompiledChoreographyPlan } from "../animation/choreography-compiler.ts";
import {
  createKpDotProductTraversalChoreography
} from "../animation/dot-product-traversal-choreography.ts";
import {
  createKpFunctionWrapChoreography
} from "../animation/function-wrap-choreography.ts";
import {
  createKpLinearRearrangementChoreography
} from "../animation/linear-rearrangement-choreography.ts";
import {
  createKpRadicalSuccessionChoreography
} from "../animation/radical-succession-choreography.ts";
import {
  kpDiagramSvgGestaltRenderer,
  kpEquationDomGestaltRenderer,
  resolveKpGestaltRendererCapabilities,
  type KpGestaltRendererCapabilityResolution
} from "../animation/gestalt-renderer-capabilities.ts";
import {
  resolveKpGestaltStyle,
  type KpResolvedGestaltStyle
} from "../animation/gestalt-style-resolution.ts";
import {
  gateKpGeneratedAnimationPromotion
} from "../animation/generated-promotion-gate.ts";
import type {
  KpGestaltStyleChannels,
  KpGestaltStyleRef
} from "../animation/gestalt-style.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";

export interface KpEditorAnimationGestaltInspection {
  readonly kind: "editor-animation-gestalt-inspection";
  readonly status: "ready" | "warning" | "error";
  readonly pinnedStyleKey: string;
  readonly selectedStyleKey: string;
  readonly resolvedStyle: KpResolvedGestaltStyle;
  readonly resolvedChainLabel: string;
  readonly channels: KpGestaltStyleChannels;
  readonly choreographyPlanId?: string | undefined;
  readonly envelopePhaseLabel: string;
  readonly focusGroupLabel: string;
  readonly salienceLabel: string;
  readonly traversalLabel: string;
  readonly capabilityLabel: string;
  readonly capabilityResolution?: KpGestaltRendererCapabilityResolution | undefined;
  readonly warnings: readonly string[];
}

interface KpInspectableChoreography {
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focusGroupIds: readonly string[];
}

const choreographyCache = new Map<string, KpInspectableChoreography>();

export function kpEditorGestaltStyleRefs(): readonly KpGestaltStyleRef[] {
  return [kpOrganicSubtleStyleRef, kpRestrainedEditorialStyleRef];
}

export function parseKpEditorGestaltStyleRef(
  value: string | undefined
): KpGestaltStyleRef {
  const match = /^([a-z][a-z0-9.-]+)@(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(
    value ?? ""
  );
  const ref = match === null
    ? undefined
    : { id: match[1]!, version: match[2]! };
  return ref !== undefined &&
    kpBaseGestaltStyleCatalog.has(kpGestaltStyleKey(ref))
    ? ref
    : kpGeneratedAnimationGestaltDefaults.generatedAnimationStyle;
}

export function createKpEditorAnimationGestaltInspection(input: {
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
  readonly selectedStyle?: KpGestaltStyleRef | undefined;
}): KpEditorAnimationGestaltInspection {
  const pinnedStyle = kpGeneratedAnimationGestaltDefaults.generatedAnimationStyle;
  const selectedStyle = input.selectedStyle ?? pinnedStyle;
  const resolvedStyle = resolveKpGestaltStyle({
    pinnedStyle,
    catalog: kpBaseGestaltStyleCatalog,
    ...(kpGestaltStyleKey(selectedStyle) === kpGestaltStyleKey(pinnedStyle)
      ? {}
      : { viewerSubstitution: selectedStyle })
  });
  const warnings: string[] = resolvedStyle.diagnostics.map(
    (diagnostic) => diagnostic.message
  );
  if (input.animation.dashboard?.tags.includes("llm-authored")) {
    warnings.push(
      ...gateKpGeneratedAnimationPromotion({
        animation: input.animation,
        legacy: true
      }).diagnostics.map((diagnostic) => diagnostic.message)
    );
  }
  const choreography = inspectChoreography(input.animation, input.state);
  if (choreography === undefined) {
    warnings.push(
      "This animation has not yet been migrated to the phase-ordered choreography inspector."
    );
  }
  const capabilityResolution = resolveRendererCapabilities(
    input.state,
    selectedStyle
  );
  if (capabilityResolution === undefined) {
    warnings.push(
      `No gestalt renderer capability declaration covers ${input.state.surface.kind}.`
    );
  } else {
    warnings.push(
      ...capabilityResolution.gaps.map((gap) => gap.message),
      ...capabilityResolution.diagnostics
        .filter((diagnostic) => diagnostic.severity === "warning")
        .map((diagnostic) => diagnostic.message)
    );
  }
  const localProgress = localKpEditorAnimationProgress(
    input.animation,
    input.state
  );
  const timelineFrame = choreography === undefined
    ? undefined
    : sampleKpChoreographyTimeline({
        timeline: choreography.timeline,
        progress: localProgress,
        direction: input.state.direction
      });
  const activePhaseIds = timelineFrame?.activePhaseIds ?? [];
  const traversal = choreography?.plan.semantic.traversal;
  const salience = choreography?.plan.semantic.salience;
  const status =
    resolvedStyle.diagnostics.some((diagnostic) => diagnostic.severity === "error") ||
    capabilityResolution?.status === "incompatible"
      ? "error"
      : warnings.length > 0
        ? "warning"
        : "ready";

  return {
    kind: "editor-animation-gestalt-inspection",
    status,
    pinnedStyleKey: kpGestaltStyleKey(pinnedStyle),
    selectedStyleKey: kpGestaltStyleKey(selectedStyle),
    resolvedStyle,
    resolvedChainLabel: resolvedStyle.appliedLayerIds.join(" → "),
    channels: resolvedStyle.channels,
    ...(choreography === undefined
      ? {}
      : { choreographyPlanId: choreography.plan.id }),
    envelopePhaseLabel:
      activePhaseIds.length > 0
        ? `${activePhaseIds.join(" + ")} · ${Math.round(
            Math.max(...activePhaseIds.map(
              (phaseId) => timelineFrame?.phaseProgress[phaseId] ?? 0
            )) * 100
          )}%`
        : "unavailable",
    focusGroupLabel:
      choreography === undefined
        ? "unavailable"
        : choreography.focusGroupIds.length === 0
          ? "salience-only"
          : choreography.focusGroupIds.join(", "),
    salienceLabel:
      salience === undefined
        ? "unavailable"
        : `${salience.nodes.length} nodes · ${salience.edges.length} transfers`,
    traversalLabel:
      traversal === undefined
        ? "unavailable"
        : `${traversal.policy} · ${traversal.ranks.length} ranks`,
    capabilityLabel:
      capabilityResolution === undefined
        ? "unreported"
        : `${capabilityResolution.status} · ${capabilityResolution.realizedCapabilityIds.length} realized · ${capabilityResolution.fallbackCapabilityIds.length} fallbacks`,
    ...(capabilityResolution === undefined ? {} : { capabilityResolution }),
    warnings
  };
}

export function localKpEditorAnimationProgress(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState
): number {
  const description = describeKpAnimationAssetTransformationTree(animation);
  const phaseCount = Math.max(
    1,
    state.direction === "forward"
      ? description.forwardPhases.length
      : description.rewindPhases.length
  );
  return Math.min(
    1,
    Math.max(
      0,
      state.progress * phaseCount - state.runtimeFrame.phase.phaseIndex
    )
  );
}

function inspectChoreography(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState
): KpInspectableChoreography | undefined {
  const activeTransformationId =
    state.runtimeFrame.activeTransformationIds[0] ??
    animation.transformations[0]?.id ??
    "none";
  const cacheKey = `${animation.id}:${activeTransformationId}`;
  const cached = choreographyCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let result: KpInspectableChoreography | undefined;
  if (animation.transformations.some(
    (transformation) => transformation.transformType === "wrapFunction"
  )) {
    const choreography = createKpFunctionWrapChoreography(animation);
    result = {
      plan: choreography.plan,
      timeline: choreography.timeline,
      focusGroupIds: [choreography.focus.groupId]
    };
  } else if (animation.transformations.some(
    (transformation) => transformation.transformType === "rewritePowerAsRoot"
  )) {
    const choreography = createKpRadicalSuccessionChoreography(animation);
    result = {
      plan: choreography.plan,
      timeline: choreography.timeline,
      focusGroupIds: [choreography.focus.groupId]
    };
  } else if (animation.transformations.some(
    (transformation) => transformation.transformType === "computeDotProduct"
  )) {
    const choreography = createKpDotProductTraversalChoreography(animation);
    result = {
      plan: choreography.plan,
      timeline: compileKpChoreographyTimeline({
        id: `timeline.${choreography.id}.editor-inspector`,
        plan: choreography.plan
      }),
      focusGroupIds: choreography.contributions.map(
        (contribution) => contribution.focus.groupId
      )
    };
  } else if (animation.transformations.some((transformation) =>
    transformation.transformType === "subtractBothSides" ||
    transformation.transformType === "cancelAdditiveInverses" ||
    transformation.transformType === "simplifyConstantDifference"
  )) {
    const choreography = createKpLinearRearrangementChoreography(animation);
    const step = choreography.steps.find(
      (candidate) => candidate.transformationId === activeTransformationId
    ) ?? choreography.steps[0];
    if (step !== undefined) {
      result = {
        plan: step.plan,
        timeline: step.timeline,
        focusGroupIds: [step.focus.groupId]
      };
    }
  }
  if (result !== undefined) choreographyCache.set(cacheKey, result);
  return result;
}

function resolveRendererCapabilities(
  state: KpEditorAnimationPlayerState,
  selectedStyle: KpGestaltStyleRef
): KpGestaltRendererCapabilityResolution | undefined {
  const style = kpBaseGestaltStyleCatalog.get(kpGestaltStyleKey(selectedStyle));
  if (style === undefined) return undefined;
  const renderer = state.surface.slotKinds.includes("equation")
    ? kpEquationDomGestaltRenderer
    : state.surface.slotKinds.includes("diagram")
      ? kpDiagramSvgGestaltRenderer
      : undefined;
  return renderer === undefined
    ? undefined
    : resolveKpGestaltRendererCapabilities({ style, renderer });
}
