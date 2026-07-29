import type { KpMaterialJunctionRect } from "./material-junction.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

export type KpSuccessorSynthesisPathFamily = "arc-above" | "arc-below";

export interface KpSuccessorSynthesisSourceAnnotation {
  readonly id: string;
  readonly semanticRole: string;
  readonly selectorIds: readonly string[];
  readonly contribution: "material-input" | "catalyst";
  readonly propagationRank: number;
  readonly pathFamily?: KpSuccessorSynthesisPathFamily | undefined;
}

export interface KpSuccessorSynthesisTargetAnnotation {
  readonly id: string;
  readonly semanticRole: string;
  readonly selectorIds: readonly string[];
  readonly propagationRank: number;
  readonly pathFamily?: KpSuccessorSynthesisPathFamily | undefined;
}

export interface KpSuccessorSynthesisLineage {
  readonly id: string;
  readonly sourceAnnotationIds: readonly string[];
  readonly targetAnnotationIds: readonly string[];
}

export interface KpSuccessorSynthesisBinding {
  readonly id: string;
  readonly relationRecordId: string;
  readonly authority: KpSuccessorSynthesisPlan["authority"];
  readonly sourceAnnotations: readonly KpSuccessorSynthesisSourceAnnotation[];
  readonly targetAnnotations: readonly KpSuccessorSynthesisTargetAnnotation[];
  readonly lineages: readonly KpSuccessorSynthesisLineage[];
  readonly paintPolicy?:
    | "continuous-recognition"
    | "opaque-binary-handoff"
    | undefined;
}

export interface KpSuccessorSynthesisMember {
  readonly id: string;
  readonly semanticRole: string;
  readonly selectorIds: readonly string[];
  readonly propagationRank: number;
  readonly rect: KpMaterialJunctionRect;
  readonly pathFamily: KpSuccessorSynthesisPathFamily;
}

export interface KpSuccessorSynthesisPlan {
  readonly kind: "successor-synthesis-plan";
  readonly id: string;
  readonly authority: {
    readonly operationId: string;
    readonly bindingId: string;
  };
  readonly materialInputs: readonly KpSuccessorSynthesisMember[];
  readonly catalysts: readonly KpSuccessorSynthesisMember[];
  readonly targets: readonly KpSuccessorSynthesisMember[];
  readonly lineages: readonly KpSuccessorSynthesisLineage[];
  readonly junction: { readonly x: number; readonly y: number };
  readonly targetSeedReadiness: number;
  readonly targetRecognition: number;
  readonly inputArrivalStart: number;
  readonly inputArrivalEnd: number;
  readonly inputRankStaggerSpan: number;
  readonly targetBirthStart: number;
  readonly targetBirthEnd: number;
  readonly targetRankStaggerSpan: number;
  readonly retirementStart: number;
  readonly retirementEnd: number;
  readonly inputJunctionScale: number;
  readonly targetSeedScale: number;
}

export interface KpSuccessorSynthesisPose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
}

export interface KpSuccessorSynthesisFrame {
  readonly kind: "successor-synthesis-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phase:
    | "orient"
    | "converge"
    | "synthesize"
    | "recognize"
    | "retire"
    | "settled";
  readonly allRequiredInputsReady: boolean;
  readonly targetRecognizable: boolean;
  readonly sources: readonly {
    readonly annotationId: string;
    readonly contribution: "material-input" | "catalyst";
    readonly arrivalProgress: number;
    readonly activationProgress: number;
    readonly retirementProgress: number;
    readonly pathFamily: KpSuccessorSynthesisPathFamily;
    readonly pose: KpSuccessorSynthesisPose;
  }[];
  readonly targets: readonly {
    readonly annotationId: string;
    readonly birthProgress: number;
    readonly pathFamily: KpSuccessorSynthesisPathFamily;
    readonly pose: KpSuccessorSynthesisPose;
  }[];
}

export function createKpSuccessorSynthesisBindingFromMetadata(input: {
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
  readonly correspondence: SelectorCorrespondenceRecord;
  readonly operationId: string;
  readonly supplementalSourceSelectorIds?: readonly string[] | undefined;
}): KpSuccessorSynthesisBinding {
  const selectors = new Map(
    input.bundle.objects.flatMap((object) => object.selectors).map((selector) => [
      selector.id,
      selector
    ])
  );
  const sourceSelectorIds = [
    ...input.correspondence.sourceSelectorIds,
    ...(input.supplementalSourceSelectorIds ?? []).filter(
      (id) => {
        const contribution =
          selectors.get(id)?.metadata?.["successorContribution"];
        return !input.correspondence.sourceSelectorIds.includes(id) &&
          (contribution === "material-input" || contribution === "catalyst");
      }
    )
  ];
  const sourceAnnotations = sourceSelectorIds.map((id, index) => {
    const selector = selectors.get(id);
    const contribution = selector?.metadata?.["successorContribution"];
    const semanticRole = selector?.metadata?.["successorRole"];
    const propagationRank = selector?.metadata?.["successorRank"];
    if (
      (contribution !== "material-input" && contribution !== "catalyst") ||
      typeof semanticRole !== "string" ||
      typeof propagationRank !== "number"
    ) {
      throw new Error(
        `Successor source ${id} requires authored contribution, role, and rank metadata at index ${index}.`
      );
    }
    const typedContribution: "material-input" | "catalyst" = contribution;
    return {
      id,
      semanticRole,
      selectorIds: [id],
      contribution: typedContribution,
      propagationRank
    };
  });
  const targetAnnotations = input.correspondence.targetSelectorIds.map((id, index) => {
    const selector = selectors.get(id);
    const semanticRole = selector?.metadata?.["successorRole"];
    const propagationRank = selector?.metadata?.["successorRank"];
    if (
      selector?.metadata?.["successorTarget"] !== true ||
      typeof semanticRole !== "string" ||
      typeof propagationRank !== "number"
    ) {
      throw new Error(
        `Successor target ${id} requires authored target, role, and rank metadata at index ${index}.`
      );
    }
    return { id, semanticRole, selectorIds: [id], propagationRank };
  });
  const materialSourceIds = sourceAnnotations
    .filter((annotation) => annotation.contribution === "material-input")
    .map((annotation) => annotation.id);
  return {
    id: `successor.${input.transformation.id}.${input.correspondence.id}`,
    relationRecordId: input.correspondence.id,
    authority: {
      operationId: input.operationId,
      bindingId: `${input.transformation.id}#${input.correspondence.id}`
    },
    sourceAnnotations,
    targetAnnotations,
    lineages: [{
      id: `lineage.${input.transformation.id}.${input.correspondence.id}.material`,
      sourceAnnotationIds: materialSourceIds,
      targetAnnotationIds: targetAnnotations.map((annotation) => annotation.id)
    }]
  };
}

export type KpSuccessorSynthesisLawId =
  | "successor.explicit-authority"
  | "successor.catalyst-noncontribution"
  | "successor.catalyst-co-gather"
  | "successor.readiness-gated-birth"
  | "successor.recognition-gated-retirement"
  | "successor.continuous-material-ownership"
  | "successor.temporal-continuity"
  | "successor.inline-source-band"
  | "successor.inline-source-order"
  | "successor.exact-settlement";

export interface KpSuccessorSynthesisViolation {
  readonly lawId: KpSuccessorSynthesisLawId;
  readonly progress: number;
  readonly message: string;
}

export function createKpSuccessorSynthesisPlan(input: {
  readonly id: string;
  readonly authority: {
    readonly operationId: string;
    readonly bindingId: string;
  };
  readonly sourceAnnotations: readonly KpSuccessorSynthesisSourceAnnotation[];
  readonly targetAnnotations: readonly KpSuccessorSynthesisTargetAnnotation[];
  readonly lineages: readonly KpSuccessorSynthesisLineage[];
  readonly measurements: Readonly<Record<string, KpMaterialJunctionRect>>;
  readonly targetSeedReadiness?: number | undefined;
  readonly targetRecognition?: number | undefined;
  readonly inputJunctionScale?: number | undefined;
  readonly targetSeedScale?: number | undefined;
}): KpSuccessorSynthesisPlan {
  requireText(input.id, "id");
  requireText(input.authority.operationId, "authority.operationId");
  requireText(input.authority.bindingId, "authority.bindingId");
  const sources = members(input.sourceAnnotations, input.measurements);
  const targets = members(input.targetAnnotations, input.measurements);
  const materialInputs = sources.filter((member) =>
    input.sourceAnnotations.find((annotation) => annotation.id === member.id)!
      .contribution === "material-input"
  );
  const catalysts = sources.filter((member) =>
    input.sourceAnnotations.find((annotation) => annotation.id === member.id)!
      .contribution === "catalyst"
  );
  if (materialInputs.length === 0) {
    throw new Error("Successor synthesis requires at least one material input.");
  }
  validateLineages(input.lineages, materialInputs, catalysts, targets);
  const targetSeedReadiness = input.targetSeedReadiness ?? 0.94;
  const targetRecognition = input.targetRecognition ?? 0.72;
  const inputJunctionScale = input.inputJunctionScale ?? 0.68;
  const targetSeedScale = input.targetSeedScale ?? 0.68;
  requireUnit(targetSeedReadiness, "targetSeedReadiness");
  requireUnit(targetRecognition, "targetRecognition");
  requireVisibleScale(inputJunctionScale, "inputJunctionScale");
  requireVisibleScale(targetSeedScale, "targetSeedScale");
  const targetRect = unionRect(targets.map((target) => target.rect));
  return {
    kind: "successor-synthesis-plan",
    id: input.id,
    authority: { ...input.authority },
    materialInputs,
    catalysts,
    targets,
    lineages: input.lineages.map((lineage) => ({
      ...lineage,
      sourceAnnotationIds: [...lineage.sourceAnnotationIds],
      targetAnnotationIds: [...lineage.targetAnnotationIds]
    })),
    junction: center(targetRect),
    targetSeedReadiness,
    targetRecognition,
    inputArrivalStart: 0.16,
    inputArrivalEnd: 0.58,
    inputRankStaggerSpan: 0.08,
    targetBirthStart: 0.6,
    targetBirthEnd: 0.82,
    targetRankStaggerSpan: 0.06,
    retirementStart: 0.7,
    retirementEnd: 0.9,
    inputJunctionScale,
    targetSeedScale
  };
}

export function sampleKpSuccessorSynthesis(input: {
  readonly plan: KpSuccessorSynthesisPlan;
  readonly progress: number;
}): KpSuccessorSynthesisFrame {
  const progress = clamp01(input.progress);
  const maximumInputRank = maximumRank(input.plan.materialInputs);
  const inputFrames = input.plan.materialInputs.map((member, index) => {
    const rankOffset = rankOffsetFor(
      member.propagationRank,
      maximumInputRank,
      input.plan.inputRankStaggerSpan
    );
    const arrivalProgress = easeInOut(interval(
      progress,
      input.plan.inputArrivalStart + rankOffset,
      input.plan.inputArrivalEnd + rankOffset
    ));
    return {
      member,
      index,
      arrivalProgress
    };
  });
  const allRequiredInputsReady = inputFrames.every(
    (source) => source.arrivalProgress >= input.plan.targetSeedReadiness
  );
  const maximumTargetRank = maximumRank(input.plan.targets);
  const targetBirths = input.plan.targets.map((target) => {
    const rankOffset = rankOffsetFor(
      target.propagationRank,
      maximumTargetRank,
      input.plan.targetRankStaggerSpan
    );
    return allRequiredInputsReady
      ? easeOut(interval(
          progress,
          input.plan.targetBirthStart + rankOffset,
          input.plan.targetBirthEnd + rankOffset
        ))
      : 0;
  });
  const targetRecognizable = targetBirths.every(
    (birth) => birth >= input.plan.targetRecognition
  );
  const catalystRetirement = easeInOut(interval(progress, 0.52, 0.7));
  const retirementProgress = targetRecognizable
    ? easeInOut(interval(
        progress,
        input.plan.retirementStart,
        input.plan.retirementEnd
      ))
    : 0;
  const sources = [
    ...inputFrames.map(({ member, index, arrivalProgress }) => ({
      annotationId: member.id,
      contribution: "material-input" as const,
      arrivalProgress,
      activationProgress: arrivalProgress,
      retirementProgress,
      pathFamily: member.pathFamily,
      pose: sourcePose(
        member,
        junctionSlot(input.plan, index),
        arrivalProgress,
        input.plan.inputJunctionScale,
        retirementProgress
      )
    })),
    ...input.plan.catalysts.map((member) => {
      const activationProgress = easeInOut(interval(progress, 0.1, 0.42));
      return {
        annotationId: member.id,
        contribution: "catalyst" as const,
        // Catalysts can focus and react, but zero arrival makes their non-material
        // role inspectable instead of relying on a renderer convention.
        arrivalProgress: 0,
        activationProgress,
        retirementProgress: catalystRetirement,
        pathFamily: member.pathFamily,
        pose: catalystPose(
          member,
          input.plan.junction,
          activationProgress,
          catalystRetirement
        )
      };
    })
  ];
  const targets = input.plan.targets.map((target, index) => ({
    annotationId: target.id,
    birthProgress: targetBirths[index]!,
    pathFamily: target.pathFamily,
    pose: targetPose(
      target,
      input.plan.junction,
      targetBirths[index]!,
      input.plan.targetSeedScale
    )
  }));
  return {
    kind: "successor-synthesis-frame",
    planId: input.plan.id,
    progress,
    phase: progress >= 1
      ? "settled"
      : (
          retirementProgress > 0 ||
          catalystRetirement > 0
        )
        ? "retire"
        : targetRecognizable
          ? "recognize"
          : targetBirths.some((birth) => birth > 0)
            ? "synthesize"
            : inputFrames.some((source) => source.arrivalProgress > 0)
              ? "converge"
              : "orient",
    allRequiredInputsReady,
    targetRecognizable,
    sources,
    targets
  };
}

/**
 * Counter-convergence keeps the source group readable on one inline band
 * while its material inputs approach, then retires the catalyst before the
 * result seeds during source retirement.
 */
export function sampleKpCounterConvergence(input: {
  readonly plan: KpSuccessorSynthesisPlan;
  readonly progress: number;
}): KpSuccessorSynthesisFrame {
  const progress = clamp01(input.progress);
  const maximumInputRank = maximumRank(input.plan.materialInputs);
  const inputFrames = input.plan.materialInputs.map((member, index) => {
    const rankOffset = rankOffsetFor(
      member.propagationRank,
      maximumInputRank,
      input.plan.inputRankStaggerSpan
    );
    return {
      member,
      index,
      arrivalProgress: easeInOut(interval(
        progress,
        input.plan.inputArrivalStart + rankOffset,
        input.plan.inputArrivalEnd + rankOffset
      ))
    };
  });
  const allRequiredInputsReady = inputFrames.every(
    (source) => source.arrivalProgress >= input.plan.targetSeedReadiness
  );
  const materialRetirement = allRequiredInputsReady
    ? easeInOut(interval(progress, 0.66, 0.9))
    : 0;
  // The catalyst has no result material, so its retirement follows its own
  // continuous clock instead of snapping when the last input becomes ready.
  const catalystRetirement = easeInOut(interval(progress, 0.54, 0.7));
  const maximumTargetRank = maximumRank(input.plan.targets);
  const targetBirths = input.plan.targets.map((target) => {
    const rankOffset = rankOffsetFor(
      target.propagationRank,
      maximumTargetRank,
      input.plan.targetRankStaggerSpan
    );
    // Both prerequisites settle before 0.77. Starting the continuous birth
    // clock there avoids a threshold frame that can reveal a partly born
    // target atomically during direct seek or rewind.
    return easeInOut(interval(progress, 0.77 + rankOffset, 1 + rankOffset));
  });
  const targetRecognizable = targetBirths.every(
    (birth) => birth >= input.plan.targetRecognition
  );
  const sources = [
    ...inputFrames.map(({ member, arrivalProgress }) => ({
      annotationId: member.id,
      contribution: "material-input" as const,
      arrivalProgress,
      activationProgress: arrivalProgress,
      retirementProgress: materialRetirement,
      pathFamily: member.pathFamily,
      pose: inlineSourcePose(
        member,
        inlineJunctionSlot(input.plan, member),
        arrivalProgress,
        input.plan.inputJunctionScale,
        materialRetirement
      )
    })),
    ...input.plan.catalysts.map((member) => {
      const activationProgress = easeInOut(interval(progress, 0.1, 0.5));
      return {
        annotationId: member.id,
        contribution: "catalyst" as const,
        arrivalProgress: 0,
        activationProgress,
        retirementProgress: catalystRetirement,
        pathFamily: member.pathFamily,
        pose: inlineSourcePose(
          member,
          inlineJunctionSlot(input.plan, member),
          activationProgress,
          input.plan.inputJunctionScale,
          catalystRetirement
        )
      };
    })
  ];
  const targets = input.plan.targets.map((target, index) => ({
    annotationId: target.id,
    birthProgress: targetBirths[index]!,
    pathFamily: target.pathFamily,
    pose: targetPose(
      target,
      input.plan.junction,
      targetBirths[index]!,
      input.plan.targetSeedScale
    )
  }));
  return {
    kind: "successor-synthesis-frame",
    planId: input.plan.id,
    progress,
    phase: progress >= 1
      ? "settled"
      : materialRetirement > 0
        ? targetBirths.some((birth) => birth > 0) ? "recognize" : "retire"
        : inputFrames.some((source) => source.arrivalProgress > 0)
          ? "converge"
          : "orient",
    allRequiredInputsReady,
    targetRecognizable,
    sources,
    targets
  };
}

export function evaluateKpSuccessorSynthesisLaws(
  plan: KpSuccessorSynthesisPlan,
  sampleCount = 100
): readonly KpSuccessorSynthesisViolation[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new Error("sampleCount must be an integer of at least two.");
  }
  const violations: KpSuccessorSynthesisViolation[] = [];
  if (plan.authority.operationId.trim() === "" || plan.authority.bindingId.trim() === "") {
    push(violations, "successor.explicit-authority", 0, "Successor synthesis lacks explicit operation authority.");
  }
  const catalystIds = new Set(plan.catalysts.map((catalyst) => catalyst.id));
  if (plan.lineages.some((lineage) =>
    lineage.sourceAnnotationIds.some((id) => catalystIds.has(id))
  )) {
    push(violations, "successor.catalyst-noncontribution", 0, "A catalyst is classified as result material.");
  }
  const gatheredCatalysts = sampleKpSuccessorSynthesis({
    plan,
    progress: plan.inputArrivalEnd
  }).sources.filter(({ contribution }) => contribution === "catalyst");
  if (gatheredCatalysts.some(({ annotationId, pose }) => {
    const catalyst = plan.catalysts.find(({ id }) => id === annotationId)!;
    const origin = center(catalyst.rect);
    return pose.scale > plan.inputJunctionScale + 0.001 ||
      Math.hypot(
        origin.x + pose.x - plan.junction.x,
        origin.y + pose.y - plan.junction.y
      ) > 0.001;
  })) {
    push(
      violations,
      "successor.catalyst-co-gather",
      plan.inputArrivalEnd,
      "A consumed operation remains outside the shrinking source cohort."
    );
  }
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount;
    const frame = sampleKpSuccessorSynthesis({ plan, progress });
    if (!frame.allRequiredInputsReady && frame.targets.some((target) => target.birthProgress > 0)) {
      push(violations, "successor.readiness-gated-birth", progress, "Target material appears before every required input reaches the junction.");
    }
    if (
      !frame.targetRecognizable &&
      frame.sources.some((source) =>
        source.contribution === "material-input" &&
        source.pose.opacity < 1
      )
    ) {
      push(violations, "successor.recognition-gated-retirement", progress, "A source retires before the target is recognizable.");
    }
    const maximumSourceOpacity = Math.max(...frame.sources.map((source) => source.pose.opacity));
    const maximumTargetOpacity = Math.max(...frame.targets.map((target) => target.pose.opacity));
    if (Math.max(maximumSourceOpacity, maximumTargetOpacity) <= 0) {
      push(violations, "successor.continuous-material-ownership", progress, "No visible owner carries the synthesis through this frame.");
    }
  }
  const settled = sampleKpSuccessorSynthesis({ plan, progress: 1 });
  if (
    settled.sources.some((source) => source.pose.opacity !== 0) ||
    settled.targets.some((target) =>
      target.pose.opacity !== 1 ||
      target.pose.x !== 0 ||
      target.pose.y !== 0 ||
      target.pose.scale !== 1
    )
  ) {
    push(violations, "successor.exact-settlement", 1, "Successor synthesis does not end at the exact native target pose.");
  }
  return deduplicate(violations);
}

export function evaluateKpSuccessorInlineReadability(input: {
  readonly plan: KpSuccessorSynthesisPlan;
  readonly frames: readonly KpSuccessorSynthesisFrame[];
  readonly maximumCenterDriftPx: number;
}): readonly KpSuccessorSynthesisViolation[] {
  if (
    !Number.isFinite(input.maximumCenterDriftPx) ||
    input.maximumCenterDriftPx < 0
  ) {
    throw new Error("Inline readability requires a nonnegative finite drift.");
  }
  const sourceMembers = [...input.plan.materialInputs, ...input.plan.catalysts];
  const membersById = new Map(sourceMembers.map((member) => [
    member.id,
    member
  ]));
  const sourceOrder = [...sourceMembers]
    .sort((left, right) => center(left.rect).x - center(right.rect).x)
    .map(({ id }) => id);
  const violations: KpSuccessorSynthesisViolation[] = [];
  for (const frame of input.frames) {
    const visible = frame.sources.flatMap((source) => {
      if (source.pose.opacity < 0.5) {
        return [];
      }
      const member = membersById.get(source.annotationId);
      if (member === undefined) return [];
      const origin = center(member.rect);
      return [{
        id: source.annotationId,
        x: origin.x + source.pose.x,
        y: origin.y + source.pose.y
      }];
    });
    if (visible.length < 2) continue;
    const centerDrift = Math.max(...visible.map(({ y }) => y)) -
      Math.min(...visible.map(({ y }) => y));
    if (centerDrift > input.maximumCenterDriftPx) {
      push(
        violations,
        "successor.inline-source-band",
        frame.progress,
        `Visible successor source marks drift ${centerDrift}px across the inline band.`
      );
    }
    const visibleIds = new Set(visible.map(({ id }) => id));
    const expected = sourceOrder.filter((id) => visibleIds.has(id));
    const actual = [...visible].sort((left, right) => left.x - right.x)
      .map(({ id }) => id);
    if (!sameStrings(actual, expected)) {
      push(
        violations,
        "successor.inline-source-order",
        frame.progress,
        "Visible successor source marks no longer preserve inline expression order."
      );
    }
  }
  return deduplicate(violations);
}

export function evaluateKpSuccessorTemporalContinuity(input: {
  readonly frames: readonly KpSuccessorSynthesisFrame[];
  readonly maximumOpacityDelta: number;
}): readonly KpSuccessorSynthesisViolation[] {
  if (
    !Number.isFinite(input.maximumOpacityDelta) ||
    input.maximumOpacityDelta < 0
  ) {
    throw new Error("Temporal continuity requires a nonnegative finite delta.");
  }
  const violations: KpSuccessorSynthesisViolation[] = [];
  for (let index = 1; index < input.frames.length; index += 1) {
    const previous = opacityById(input.frames[index - 1]!);
    const current = input.frames[index]!;
    for (const [id, opacity] of opacityById(current)) {
      const priorOpacity = previous.get(id);
      if (
        priorOpacity !== undefined &&
        Math.abs(opacity - priorOpacity) > input.maximumOpacityDelta
      ) {
        push(
          violations,
          "successor.temporal-continuity",
          current.progress,
          `Successor ${id} opacity changes discontinuously.`
        );
      }
    }
  }
  return deduplicate(violations);
}

function members(
  annotations: readonly {
    readonly id: string;
    readonly semanticRole: string;
    readonly selectorIds: readonly string[];
    readonly propagationRank: number;
    readonly pathFamily?: KpSuccessorSynthesisPathFamily | undefined;
  }[],
  measurements: Readonly<Record<string, KpMaterialJunctionRect>>
): readonly KpSuccessorSynthesisMember[] {
  if (annotations.length === 0) throw new Error("Successor synthesis requires annotated participants.");
  const ids = new Set<string>();
  return annotations.map((annotation, index) => {
    requireText(annotation.id, `annotations[${index}].id`);
    requireText(annotation.semanticRole, `annotations[${index}].semanticRole`);
    if (ids.has(annotation.id)) throw new Error(`Duplicate successor annotation ${annotation.id}.`);
    ids.add(annotation.id);
    if (!Number.isInteger(annotation.propagationRank) || annotation.propagationRank < 0) {
      throw new Error(`Successor annotation ${annotation.id} requires a nonnegative integer propagation rank.`);
    }
    const rect = measurements[annotation.id];
    if (rect === undefined) throw new Error(`Successor annotation ${annotation.id} lacks measured geometry.`);
    validateRect(rect, annotation.id);
    return {
      id: annotation.id,
      semanticRole: annotation.semanticRole,
      selectorIds: [...annotation.selectorIds],
      propagationRank: annotation.propagationRank,
      rect: { ...rect },
      pathFamily: annotation.pathFamily ??
        (annotation.propagationRank % 2 === 0 ? "arc-above" : "arc-below")
    };
  });
}

function validateLineages(
  lineages: readonly KpSuccessorSynthesisLineage[],
  materialInputs: readonly KpSuccessorSynthesisMember[],
  catalysts: readonly KpSuccessorSynthesisMember[],
  targets: readonly KpSuccessorSynthesisMember[]
): void {
  if (lineages.length === 0) throw new Error("Successor synthesis requires semantic lineage.");
  const materialIds = new Set(materialInputs.map((member) => member.id));
  const catalystIds = new Set(catalysts.map((member) => member.id));
  const targetIds = new Set(targets.map((member) => member.id));
  const coveredInputs = new Set<string>();
  const coveredTargets = new Set<string>();
  lineages.forEach((lineage) => {
    requireText(lineage.id, "lineage.id");
    if (lineage.sourceAnnotationIds.length === 0 || lineage.targetAnnotationIds.length === 0) {
      throw new Error(`Successor lineage ${lineage.id} requires material sources and targets.`);
    }
    lineage.sourceAnnotationIds.forEach((id) => {
      if (catalystIds.has(id)) throw new Error(`Successor catalyst ${id} cannot contribute result material.`);
      if (!materialIds.has(id)) throw new Error(`Successor lineage ${lineage.id} references missing material input ${id}.`);
      coveredInputs.add(id);
    });
    lineage.targetAnnotationIds.forEach((id) => {
      if (!targetIds.has(id)) throw new Error(`Successor lineage ${lineage.id} references missing target ${id}.`);
      coveredTargets.add(id);
    });
  });
  materialIds.forEach((id) => {
    if (!coveredInputs.has(id)) throw new Error(`Successor material input ${id} lacks lineage.`);
  });
  targetIds.forEach((id) => {
    if (!coveredTargets.has(id)) throw new Error(`Successor target ${id} lacks lineage.`);
  });
}

function sourcePose(
  member: KpSuccessorSynthesisMember,
  slot: { readonly x: number; readonly y: number },
  progress: number,
  scaleTo: number,
  retirementProgress: number
): KpSuccessorSynthesisPose {
  const from = center(member.rect);
  const position = quadratic(
    from,
    arcControl(from, slot, member.pathFamily, 10),
    slot,
    progress
  );
  return {
    x: position.x - from.x,
    y: position.y - from.y,
    scale: mix(1, scaleTo, progress),
    opacity: 1 - retirementProgress
  };
}

function inlineSourcePose(
  member: KpSuccessorSynthesisMember,
  slot: { readonly x: number; readonly y: number },
  progress: number,
  scaleTo: number,
  retirementProgress: number
): KpSuccessorSynthesisPose {
  const from = center(member.rect);
  return {
    x: (slot.x - from.x) * progress,
    y: (slot.y - from.y) * progress,
    scale: mix(1, scaleTo, progress),
    opacity: 1 - retirementProgress
  };
}

function catalystPose(
  member: KpSuccessorSynthesisMember,
  junction: { readonly x: number; readonly y: number },
  activationProgress: number,
  retirementProgress: number
): KpSuccessorSynthesisPose {
  const origin = center(member.rect);
  return {
    // The operator contributes causality rather than result material, but it
    // still belongs to the consumed expression and gathers with that cohort.
    // Unlike a material input it must collapse completely before entering the
    // fusion contact zone; giving both roles one nonzero seed scale previously
    // made operator/input overlap depend on browser font metrics.
    x: (junction.x - origin.x) * activationProgress,
    y: (junction.y - origin.y) * activationProgress,
    scale: mix(1, 0, activationProgress),
    opacity: 1 - retirementProgress
  };
}

function targetPose(
  member: KpSuccessorSynthesisMember,
  junction: { readonly x: number; readonly y: number },
  progress: number,
  scaleFrom: number
): KpSuccessorSynthesisPose {
  const target = center(member.rect);
  const position = quadratic(
    junction,
    arcControl(junction, target, member.pathFamily, 6),
    target,
    progress
  );
  return {
    x: position.x - target.x,
    y: position.y - target.y,
    scale: mix(scaleFrom, 1, progress),
    opacity: progress
  };
}

function junctionSlot(
  plan: KpSuccessorSynthesisPlan,
  index: number
): { readonly x: number; readonly y: number } {
  const centered = index - (plan.materialInputs.length - 1) / 2;
  return {
    x: plan.junction.x + centered * 8,
    y: plan.junction.y + (index % 2 === 0 ? -3.5 : 3.5)
  };
}

function inlineJunctionSlot(
  plan: KpSuccessorSynthesisPlan,
  member: KpSuccessorSynthesisMember
): { readonly x: number; readonly y: number } {
  const sources = [...plan.materialInputs, ...plan.catalysts];
  const sourceBounds = unionRect(sources.map((source) => source.rect));
  const targetBounds = unionRect(plan.targets.map((target) => target.rect));
  const memberCenter = center(member.rect);
  return {
    // A wider source expression grows toward the open result lane instead of
    // back across the preceding continuant when it contracts around a target.
    x: targetBounds.left +
      (memberCenter.x - sourceBounds.left) * plan.inputJunctionScale,
    y: plan.junction.y
  };
}

function arcControl(
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number },
  family: KpSuccessorSynthesisPathFamily,
  lift: number
): { readonly x: number; readonly y: number } {
  return {
    x: from.x + (to.x - from.x) * (family === "arc-above" ? 0.64 : 0.36),
    y: (from.y + to.y) / 2 + (family === "arc-above" ? -lift : lift)
  };
}

function quadratic(
  start: { readonly x: number; readonly y: number },
  control: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  progress: number
): { readonly x: number; readonly y: number } {
  const remaining = 1 - progress;
  return {
    x: remaining * remaining * start.x + 2 * remaining * progress * control.x + progress * progress * end.x,
    y: remaining * remaining * start.y + 2 * remaining * progress * control.y + progress * progress * end.y
  };
}

function unionRect(rects: readonly KpMaterialJunctionRect[]): KpMaterialJunctionRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: KpMaterialJunctionRect): { readonly x: number; readonly y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function maximumRank(members: readonly KpSuccessorSynthesisMember[]): number {
  return Math.max(0, ...members.map((member) => member.propagationRank));
}

function rankOffsetFor(rank: number, maximum: number, span: number): number {
  return maximum === 0 ? 0 : rank / maximum * span;
}

function interval(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function easeOut(value: number): number {
  return 1 - (1 - value) * (1 - value) * (1 - value);
}

function mix(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function opacityById(
  frame: KpSuccessorSynthesisFrame
): ReadonlyMap<string, number> {
  return new Map([
    ...frame.sources.map((source) => [
      source.annotationId,
      source.pose.opacity
    ] as const),
    ...frame.targets.map((target) => [
      target.annotationId,
      target.pose.opacity
    ] as const)
  ]);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function validateRect(rect: KpMaterialJunctionRect, id: string): void {
  if (
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
    throw new Error(`Successor annotation ${id} requires positive finite measured geometry.`);
  }
}

function requireText(value: string, path: string): void {
  if (value.trim() === "") throw new Error(`${path} must be non-empty.`);
}

function requireUnit(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${path} must be a finite number from zero to one.`);
  }
}

function requireVisibleScale(value: number, path: string): void {
  requireUnit(value, path);
  if (value === 0) throw new Error(`${path} must preserve visible material.`);
}

function push(
  violations: KpSuccessorSynthesisViolation[],
  lawId: KpSuccessorSynthesisLawId,
  progress: number,
  message: string
): void {
  violations.push({ lawId, progress, message });
}

function deduplicate(
  violations: readonly KpSuccessorSynthesisViolation[]
): readonly KpSuccessorSynthesisViolation[] {
  const seen = new Set<string>();
  return violations.filter((violation) => {
    const key = `${violation.lawId}:${violation.progress}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
