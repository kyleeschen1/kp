import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionFrameToken,
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";
import {
  createKpSuccessorSynthesisPlan,
  sampleKpCounterConvergence,
  sampleKpSuccessorSynthesis,
  type KpSuccessorSynthesisBinding,
  type KpSuccessorSynthesisPlan
} from "../animation/successor-synthesis.ts";
import type {
  KpEquationCancellationPresentationRecipe,
  KpEquationContinuantPresentationRecipe,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "./equation-presentation-policy.ts";
import { kpFractionalLinearCertifiedTransferProxyRecordId } from "../semantic/fractional-linear-certified-transfer-contract.ts";

export type KpEquationLinearRearrangementKind =
  | "balanced-introduction"
  | "divide-both-sides"
  | "certified-fraction-transfer"
  | "split-fraction-sum"
  | "merge-fractions"
  | "cancel-additive-inverses"
  | "cancel-multiplicative-inverses"
  | "simplify-constant-difference"
  | "simplify-constant-quotient"
  | "simplify-constant-product";

export function kpEquationLinearRearrangementKindForTransformType(
  transformType: string
): KpEquationLinearRearrangementKind | undefined {
  switch (transformType) {
    case "subtractBothSides":
    case "multiplyBothSides":
      return "balanced-introduction";
    case "divideBothSides": return "divide-both-sides";
    case "projectCertifiedFractionTransfer": return "certified-fraction-transfer";
    case "splitFractionSum": return "split-fraction-sum";
    case "mergeFractions": return "merge-fractions";
    case "cancelAdditiveInverses": return "cancel-additive-inverses";
    case "cancelMultiplicativeInverses": return "cancel-multiplicative-inverses";
    case "simplifyConstantDifference": return "simplify-constant-difference";
    case "simplifyConstantQuotient": return "simplify-constant-quotient";
    case "simplifyConstantProduct": return "simplify-constant-product";
    default: return undefined;
  }
}

export interface KpEquationLinearRearrangementFrame {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly reservationProgress: number;
  readonly persistentReflowProgress: number;
  readonly focalTransitProgress: number;
  readonly meetProgress: number;
  readonly collapseProgress: number;
  readonly resultRevealProgress: number;
  readonly recognitionProgress: number;
  readonly structureEntryProgress: number;
  readonly branchProgress: number;
  readonly branchTravelProgress: number;
  readonly branchSettlementProgress: number;
  readonly operatorDescentProgress: number;
}

export function sampleKpEquationLinearRearrangementFrame(
  kind: KpEquationLinearRearrangementKind,
  progress: number,
  cancellationPresentationRecipe?:
    KpEquationCancellationPresentationRecipe | undefined,
  continuantPresentationRecipe?:
    KpEquationContinuantPresentationRecipe | undefined,
  zeroWitnessPresentationRecipe?:
    KpEquationZeroWitnessPresentationRecipe | undefined
): KpEquationLinearRearrangementFrame {
  const p = clamp01(progress);
  const reservationProgress = smooth(windowProgress(p, 0.1, 0.46));
  const reserveThenTransit = isSuccessorKind(kind) &&
    continuantPresentationRecipe === "reserve-then-transit-v1";
  const transitThenReflow = isSuccessorKind(kind) &&
    continuantPresentationRecipe === "transit-then-reflow-v1";
  // Without a +0 teaching beat, begin survivor compaction as the canceled ink
  // finishes retiring instead of concentrating it at the phase boundary.
  const counterOrbitReflowStart = zeroWitnessPresentationRecipe === "none"
    ? 0.78
    : 0.94;
  const persistentReflowProgress = isCancellationKind(kind) &&
      cancellationPresentationRecipe === "counter-orbit-v1"
    ? smooth(windowProgress(p, counterOrbitReflowStart, 0.99))
    : transitThenReflow
      ? smooth(windowProgress(p, 0.82, 0.94))
    : reserveThenTransit
      ? smooth(windowProgress(p, 0.08, 0.26))
      : reservationProgress;
  return {
    kind,
    reservationProgress,
    persistentReflowProgress,
    focalTransitProgress: smooth(windowProgress(p, reserveThenTransit ? 0.32 : 0.28, 0.7)),
    meetProgress: smooth(windowProgress(p, 0.42, 0.68)),
    collapseProgress: smooth(windowProgress(p, 0.62, 0.8)),
    resultRevealProgress: smooth(windowProgress(p, 0.68, 0.88)),
    recognitionProgress: smooth(windowProgress(p, 0.76, 0.92)),
    structureEntryProgress: kind === "divide-both-sides"
      ? smooth(windowProgress(p, 0.34, 0.72))
      : 0,
    branchProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.2, 0.28))
      : 0,
    branchTravelProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.2, 0.62))
      : kind === "merge-fractions"
        ? smooth(windowProgress(p, 0.22, 0.76))
        : 0,
    branchSettlementProgress: kind === "merge-fractions"
      ? smooth(windowProgress(p, 0.84, 0.98))
      : 0,
    operatorDescentProgress: kind === "split-fraction-sum"
      ? smooth(windowProgress(p, 0.54, 0.82))
      : kind === "merge-fractions"
        ? smooth(windowProgress(p, 0.22, 0.72))
        : 0
  };
}

export function sampleKpEquationLinearRearrangementRelation(input: {
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
  readonly progress: number;
  readonly frame: KpEquationLinearRearrangementFrame;
  readonly cancellationPresentationRecipe?:
    KpEquationCancellationPresentationRecipe | undefined;
  readonly successorSynthesisPlan?: KpSuccessorSynthesisPlan | undefined;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
  readonly successorPresentationRecipe?:
    KpEquationSuccessorPresentationRecipe | undefined;
  readonly continuantPresentationRecipe?:
    KpEquationContinuantPresentationRecipe | undefined;
}): readonly KpEquationTokenMotionFrameToken[] | undefined {
  switch (input.relation.lifecycle) {
    case "persist":
    case "role-change":
      return isFractionStructureRewriteKind(input.frame.kind)
        ? sampleFractionStructureContinuant(input)
        : input.frame.kind === "certified-fraction-transfer" &&
            input.relation.recordId === kpFractionalLinearCertifiedTransferProxyRecordId
          ? sampleCertifiedTransferProxy(input)
        : samplePersistentRelation(input);
    case "enter":
      return input.frame.kind === "divide-both-sides"
        ? sampleMatchedFractionStructureIntroduction(input)
        : input.frame.kind === "balanced-introduction"
        ? sampleBalancedIntroduction(input)
        : input.frame.kind === "certified-fraction-transfer"
          ? sampleCertifiedTransferIntroduction(input)
        : isCancellationKind(input.frame.kind)
          ? sampleExplicitCancellationTarget(input)
        : undefined;
    case "cancel":
      return isCancellationKind(input.frame.kind)
        ? input.cancellationPresentationRecipe === "counter-orbit-v1"
          ? sampleCounterOrbitCancellation(input)
          : sampleCancellation(input)
        : undefined;
    case "exit":
      return isCancellationKind(input.frame.kind)
        ? sampleStructuralRetirement(input)
        : input.frame.kind === "certified-fraction-transfer"
          ? sampleCertifiedTransferRetirement(input)
        : undefined;
    case "merge":
      return input.frame.kind === "merge-fractions"
        ? sampleFractionStructureMerge(input)
        : isCancellationKind(input.frame.kind)
        ? sampleExplicitCancellationTarget(input)
        : isSuccessorKind(input.frame.kind)
        ? input.successorPresentationRecipe === "convergence-v1"
          ? sampleConvergenceConstantDerivation(input)
          : sampleConstantDerivation(input)
        : undefined;
    case "split":
      return input.frame.kind === "split-fraction-sum"
        ? sampleFractionStructureSplit(input)
        : undefined;
    default:
      return undefined;
  }
}

function sampleCertifiedTransferProxy(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const travel = smooth(windowProgress(input.progress, 0.2, 0.78));
  const arc = -10 * Math.sin(Math.PI * travel);
  return [
    ...input.sourceTokens.map((token) => frameToken(token, "source", {
      opacity: input.progress === 1 ? 0 : 1,
      x: (input.relation.delta?.x ?? 0) * travel,
      y: (input.relation.delta?.y ?? 0) * travel + arc,
      scale: 1
    })),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.progress === 1 ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1
    }))
  ];
}

function sampleCertifiedTransferRetirement(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const visible = input.progress < 0.28;
  return input.sourceTokens.map((token) => frameToken(token, "source", {
    // Structural ink leaves in one frame; a fading rule reads as accidental DOM replacement.
    opacity: visible ? 1 : 0,
    x: 0,
    y: 0,
    scale: 1
  }));
}

function sampleCertifiedTransferIntroduction(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const visible = input.progress >= 0.36;
  return input.targetTokens.map((token) => frameToken(token, "target", {
    opacity: visible ? 1 : 0,
    x: 0,
    y: 0,
    scale: 1
  }));
}

function sampleFractionStructureContinuant(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const travel = input.relation.lifecycle === "role-change"
    ? input.frame.operatorDescentProgress
    : input.frame.branchTravelProgress;
  return [
    ...input.sourceTokens.map((token) => frameToken(token, "source", {
      opacity: input.progress === 1 ? 0 : 1,
      x: (input.relation.delta?.x ?? 0) * travel,
      y: (input.relation.delta?.y ?? 0) * travel,
      scale: 1
    })),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.progress === 1 ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1
    }))
  ];
}

function sampleFractionStructureMerge(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const targetCenter = center(input.relation.target?.bounds);
  const travel = input.frame.branchTravelProgress;
  const settlement = input.frame.branchSettlementProgress;
  const handedOff = settlement >= 1;
  return [
    ...input.sourceTokens.map((token) => {
      const sourceCenter = center(token.localRect);
      return frameToken(token, "source", {
        opacity: handedOff ? 0 : 1,
        x: (targetCenter.x - sourceCenter.x) * travel,
        y: (targetCenter.y - sourceCenter.y) * travel,
        scale: 1
      });
    }),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: handedOff ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1
    }))
  ];
}

function sampleFractionStructureSplit(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const sourceCenter = center(input.relation.source?.bounds);
  const travel = input.frame.branchTravelProgress;
  const handedOff = input.frame.branchProgress > 0;
  return [
    ...input.sourceTokens.map((token) => frameToken(token, "source", {
      opacity: handedOff ? 0 : 1,
      x: 0,
      y: 0,
      // Fraction rules and denominator glyphs keep their native geometry.
      scale: 1
    })),
    ...input.targetTokens.map((token) => {
      const targetCenter = center(token.localRect);
      return frameToken(token, "target", {
        opacity: handedOff ? 1 : 0,
        x: (sourceCenter.x - targetCenter.x) * (1 - travel),
        y: (sourceCenter.y - targetCenter.y) * (1 - travel),
        scale: 1
      });
    })
  ];
}

function sampleMatchedFractionStructureIntroduction(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const entry = input.frame.structureEntryProgress;
  return input.targetTokens.map((token) => frameToken(token, "target", {
    opacity: entry,
    x: 0,
    y: 8 * (1 - entry),
    // KaTeX fraction rules and divisors enter without geometric deformation.
    scale: 1
  }));
}

function sampleStructuralRetirement(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const retirement = input.frame.collapseProgress;
  return input.sourceTokens.map((token) => frameToken(token, "source", {
    opacity: 1 - retirement,
    x: 0,
    y: 0,
    scale: 1 - 0.18 * retirement
  }));
}

function isCancellationKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "cancel-additive-inverses" || kind === "cancel-multiplicative-inverses";
}

function isSuccessorKind(kind: KpEquationLinearRearrangementKind): boolean {
  return kind === "simplify-constant-difference" ||
    kind === "simplify-constant-quotient" ||
    kind === "simplify-constant-product";
}

function isFractionStructureRewriteKind(
  kind: KpEquationLinearRearrangementKind
): boolean {
  return kind === "split-fraction-sum" || kind === "merge-fractions";
}

function samplePersistentRelation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const travel = input.frame.persistentReflowProgress;
  return [
    ...input.sourceTokens.map((token) => frameToken(token, "source", {
      opacity: input.progress === 1 ? 0 : 1,
      x: (input.relation.delta?.x ?? 0) * travel,
      y: (input.relation.delta?.y ?? 0) * travel,
      scale: 1 + (averageScale(input.relation) - 1) * travel
    })),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.progress === 1 ? 1 : 0,
      x: 0,
      y: 0,
      scale: 1
    }))
  ];
}

function sampleBalancedIntroduction(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  return input.targetTokens.map((token, index) => {
    // Balanced operations must read as simultaneous even when the terms enter
    // from independently directed diagonals.
    const entry = smooth(windowProgress(input.progress, 0.38, 0.7));
    const direction = index % 2 === 0 ? -1 : 1;
    return frameToken(token, "target", {
      opacity: entry,
      x: direction * 8 * (1 - entry),
      y: -direction * 5 * (1 - entry),
      scale: 0.88 + 0.12 * entry
    });
  });
}

function sampleCancellation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const groupCenter = center(input.relation.source?.bounds);
  const clearanceProgress = smooth(windowProgress(input.progress, 0.08, 0.3));
  return input.sourceTokens.map((token, index) => {
    const tokenCenter = center(token.localRect);
    const direction = index % 2 === 0 ? -1 : 1;
    return frameToken(token, "source", {
      opacity: 1 - input.frame.collapseProgress,
      x: (groupCenter.x - tokenCenter.x) * input.frame.meetProgress,
      y:
        -30 * clearanceProgress +
        direction * 4 * Math.sin(Math.PI * input.frame.meetProgress),
      scale:
        1 -
        0.16 * input.frame.meetProgress -
        0.18 * input.frame.collapseProgress
    });
  });
}

function sampleCounterOrbitCancellation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const groupCenter = center(input.relation.source?.bounds);
  return input.sourceTokens.map((token) => {
    const tokenCenter = center(token.localRect);
    const orbitDirection = tokenCenter.x <= groupCenter.x ? -1 : 1;
    const travel = input.frame.meetProgress;
    // Opposite terms remain individually legible while orbiting toward the
    // shared cancellation point; the path returns to the baseline before fade.
    const orbit = travel === 0 || travel === 1
      ? 0
      : Math.sin(Math.PI * travel);
    return frameToken(token, "source", {
      opacity: 1 - input.frame.collapseProgress,
      x: (groupCenter.x - tokenCenter.x) * travel,
      y: orbitDirection * 14 * orbit,
      scale:
        1 -
        0.08 * travel -
        0.14 * input.frame.collapseProgress
    });
  });
}

function sampleExplicitCancellationTarget(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const birth = input.frame.resultRevealProgress;
  const contact = center(input.relation.source?.bounds);
  const sources = input.sourceTokens.length === 0
    ? []
    : sampleCounterOrbitCancellation(input);
  const targets = input.targetTokens.map((token) => {
    const targetCenter = center(token.localRect);
    const hasMaterialSource = input.sourceTokens.length > 0;
    return frameToken(token, "target", {
      opacity: birth,
      x: hasMaterialSource
        ? (contact.x - targetCenter.x) * (1 - birth)
        : -6 * (1 - birth),
      y: hasMaterialSource
        ? (contact.y - targetCenter.y) * (1 - birth)
        : 0,
      scale: 0.84 + 0.16 * birth
    });
  });
  return [...sources, ...targets];
}

function sampleConstantDerivation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  if (input.successorSynthesisPlan === undefined) {
    // Canonical assets may retain successor semantics while selecting their
    // proven continuity presentation until the newer motif clears review.
    return sampleContinuityConstantDerivation(input);
  }
  const synthesis = input.successorPresentationRecipe === "counter-convergence-v1"
    ? sampleKpCounterConvergence({
        plan: input.successorSynthesisPlan,
        progress: input.progress
      })
    : sampleKpSuccessorSynthesis({
        plan: input.successorSynthesisPlan,
        progress: input.progress
      });
  return [
    ...synthesis.sources.map((source) => {
      const token = input.sourceTokens.find(
        (candidate) => candidate.motionId === source.annotationId
      );
      if (token === undefined) {
        throw new Error(`Missing successor source token ${source.annotationId}.`);
      }
      return frameToken(token, "source", source.pose);
    }),
    ...synthesis.targets.map((target) => {
      const token = input.targetTokens.find(
        (candidate) => candidate.motionId === target.annotationId
      );
      if (token === undefined) {
        throw new Error(`Missing successor target token ${target.annotationId}.`);
      }
      return frameToken(token, "target", target.pose);
    })
  ];
}

function sampleContinuityConstantDerivation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const destination = center(input.relation.target?.bounds);
  const sourceOpacity = 1 - smooth(windowProgress(input.progress, 0.68, 0.84));
  return [
    ...input.sourceTokens.map((token, index) => {
      const origin = center(token.localRect);
      const staggered = smooth(windowProgress(
        input.progress,
        0.38 + index * 0.025,
        0.68 + index * 0.025
      ));
      const arcDirection = index % 2 === 0 ? -1 : 1;
      return frameToken(token, "source", {
        opacity: sourceOpacity,
        x: (destination.x - origin.x) * staggered,
        y:
          (destination.y - origin.y) * staggered +
          arcDirection * 8 * Math.sin(Math.PI * staggered),
        scale: 1 - 0.2 * staggered
      });
    }),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: input.frame.resultRevealProgress,
      x: 0,
      y: 0,
      scale: 0.78 + 0.22 * input.frame.resultRevealProgress
    }))
  ];
}

function sampleConvergenceConstantDerivation(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0]
): readonly KpEquationTokenMotionFrameToken[] {
  const sourceCenter = center(input.relation.source?.bounds);
  const destination = center(input.relation.target?.bounds);
  const convergence = input.frame.focalTransitProgress;
  const materialOpacity = 1 - smooth(windowProgress(input.progress, 0.7, 0.82));
  const catalystOpacity = 1 - smooth(windowProgress(input.progress, 0.6, 0.74));
  const targetReveal = smooth(windowProgress(input.progress, 0.84, 0.96));
  return [
    ...input.sourceTokens.map((token) => {
      const origin = center(token.localRect);
      // Compress the expression as one readable unit; individual glyphs keep
      // their relative order and never claim the successor's final position.
      const compressedX = destination.x + (origin.x - sourceCenter.x) * 0.46;
      const contribution = successorContributionForToken(input, token.motionId);
      return frameToken(token, "source", {
        opacity: contribution === "catalyst" ? catalystOpacity : materialOpacity,
        x: (compressedX - origin.x) * convergence,
        y: (destination.y - origin.y) * convergence,
        scale: 1 - 0.08 * convergence
      });
    }),
    ...input.targetTokens.map((token) => frameToken(token, "target", {
      opacity: targetReveal,
      x: 0,
      y: 0,
      scale: 0.9 + 0.1 * targetReveal
    }))
  ];
}

function successorContributionForToken(
  input: Parameters<typeof sampleKpEquationLinearRearrangementRelation>[0],
  motionId: string
): "material-input" | "catalyst" {
  const binding = input.successorSynthesisBinding;
  const source = input.relation.source;
  if (binding === undefined || source === undefined) return "material-input";
  const motionIndex = source.motionIds.indexOf(motionId);
  const selectorId = source.selectorIds[motionIndex];
  const annotation = binding.sourceAnnotations.find((candidate) =>
    candidate.id === selectorId || candidate.selectorIds.includes(selectorId ?? "")
  );
  return annotation?.contribution ?? "material-input";
}

export function createKpEquationSuccessorSynthesisPlan(
  geometry: KpMeasuredEquationTransitionGeometry
): KpSuccessorSynthesisPlan | undefined {
  const binding = geometry.successorSynthesisBinding;
  if (binding === undefined) return undefined;
  const relation = geometry.relations.find(
    (candidate) => candidate.recordId === binding.relationRecordId
  );
  if (relation?.source === undefined || relation.target === undefined) {
    throw new Error(
      `Successor binding ${binding.id} requires measured relation ${binding.relationRecordId}.`
    );
  }
  const sourceMotionIdBySelector = new Map(
    relation.source.selectorIds.map((selectorId, index) => [
      selectorId,
      relation.source!.motionIds[index]!
    ])
  );
  const targetMotionIdBySelector = new Map(
    relation.target.selectorIds.map((selectorId, index) => [
      selectorId,
      relation.target!.motionIds[index]!
    ])
  );
  const sourceAnnotations = binding.sourceAnnotations.map((annotation) => ({
    ...annotation,
    id: requiredMotionId(sourceMotionIdBySelector, annotation.id, binding.id),
    selectorIds: [annotation.id]
  }));
  const targetAnnotations = binding.targetAnnotations.map((annotation) => ({
    ...annotation,
    id: requiredMotionId(targetMotionIdBySelector, annotation.id, binding.id),
    selectorIds: [annotation.id]
  }));
  const sourceAnnotationIdBySelector = new Map(
    binding.sourceAnnotations.map((annotation, index) => [
      annotation.id,
      sourceAnnotations[index]!.id
    ])
  );
  const targetAnnotationIdBySelector = new Map(
    binding.targetAnnotations.map((annotation, index) => [
      annotation.id,
      targetAnnotations[index]!.id
    ])
  );
  const measurements = Object.fromEntries([
    ...sourceAnnotations.map((annotation) => {
      const token = geometry.sourceTokens.find(
        (candidate) => candidate.motionId === annotation.id
      );
      if (token === undefined) throw new Error(`Missing measured successor source ${annotation.id}.`);
      return [annotation.id, token.localRect] as const;
    }),
    ...targetAnnotations.map((annotation) => {
      const token = geometry.targetTokens.find(
        (candidate) => candidate.motionId === annotation.id
      );
      if (token === undefined) throw new Error(`Missing measured successor target ${annotation.id}.`);
      return [annotation.id, token.localRect] as const;
    })
  ]);
  return createKpSuccessorSynthesisPlan({
    id: binding.id,
    authority: binding.authority,
    sourceAnnotations,
    targetAnnotations,
    lineages: binding.lineages.map((lineage) => ({
      ...lineage,
      sourceAnnotationIds: lineage.sourceAnnotationIds.map((id) =>
        requiredMotionId(sourceAnnotationIdBySelector, id, lineage.id)
      ),
      targetAnnotationIds: lineage.targetAnnotationIds.map((id) =>
        requiredMotionId(targetAnnotationIdBySelector, id, lineage.id)
      )
    })),
    measurements
  });
}

function requiredMotionId(
  motionIds: ReadonlyMap<string, string>,
  selectorId: string,
  ownerId: string
): string {
  const motionId = motionIds.get(selectorId);
  if (motionId === undefined) {
    throw new Error(`${ownerId} cannot bind semantic selector ${selectorId} to measured motion.`);
  }
  return motionId;
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}

function averageScale(
  relation: KpMeasuredEquationTransitionRelationGeometry
): number {
  return ((relation.delta?.scaleX ?? 1) + (relation.delta?.scaleY ?? 1)) / 2;
}

function center(
  rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined
): { readonly x: number; readonly y: number } {
  if (rect === undefined) return { x: 0, y: 0 };
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function windowProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

function smooth(progress: number): number {
  return progress * progress * progress *
    (progress * (progress * 6 - 15) + 10);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
