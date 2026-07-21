import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import {
  sampleKpEquationEnclosureChoreography,
  type KpEquationEnclosureChoreographyFrame
} from "./equation-enclosure-choreography.ts";
import {
  compileKpCopyFanOutChoreography,
  sampleKpCopyFanOutChoreography,
  type KpCopyFanOutChoreographyFrame
} from "../animation/copy-fan-out-choreography.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  sampleKpEquationMotionPath,
  type KpEquationMotionPathCandidate,
  type KpEquationMotionPathVariantId
} from "./equation-motion-path-planner.ts";
import type { KpOrganicPathVariant } from "../animation/organic-path-planner.ts";
import {
  sampleKpEquationRepresentationalSuccession,
  type KpEquationRepresentationalSuccessionFrame
} from "./equation-representational-succession.ts";
import {
  sampleKpEquationLinearRearrangementFrame,
  sampleKpEquationLinearRearrangementRelation,
  type KpEquationLinearRearrangementFrame
} from "./equation-linear-rearrangement.ts";
import {
  sampleKpDotProductTraversalProgress,
  sampleKpEquationDotProductRelation,
  type KpDotProductTraversalProgressFrame
} from "./equation-dot-product-traversal.ts";
import {
  sampleKpEquationMatrixVectorRelation,
  sampleKpMatrixVectorCompositionProgress,
  type KpMatrixVectorCompositionProgressFrame
} from "./equation-matrix-vector-composition.ts";
import {
  sampleKpEquationMatrixMatrixRelation,
  sampleKpMatrixMatrixCompositionProgress,
  type KpMatrixMatrixCompositionProgressFrame
} from "./equation-matrix-matrix-composition.ts";
import {
  sampleKpDerivativePowerChoreography,
  type KpDerivativePowerChoreographyFrame,
  type KpDerivativePowerChoreographyPlan
} from "../animation/derivative-power-choreography.ts";
import type {
  KpDistributionChoreographyFrame,
  KpDistributionChoreographyPlan
} from "../animation/distribution-choreography.ts";
import {
  kpDistributionChoreographyRuntime
} from "../animation/distribution-choreography-runtime.ts";
import type {
  KpFactoringChoreographyFrame,
  KpFactoringChoreographyPlan
} from "../animation/factoring-choreography.ts";
import {
  kpFactoringChoreographyRuntime
} from "../animation/factoring-choreography-runtime.ts";
import {
  compileKpFractionChoreography,
  sampleKpFractionChoreography,
  type KpFractionChoreographyFrame,
  type KpFractionChoreographyPlan
} from "../animation/fraction-choreography.ts";
import {
  compileKpExponentLawChoreography,
  sampleKpExponentLawChoreography,
  type KpExponentLawChoreographyFrame,
  type KpExponentLawChoreographyPlan
} from "../animation/exponent-law-choreography.ts";
import {
  compileKpIdentityAbsorptionChoreography,
  sampleKpIdentityAbsorptionChoreography,
  type KpIdentityAbsorptionChoreographyFrame,
  type KpIdentityAbsorptionChoreographyPlan
} from "../animation/identity-absorption-choreography.ts";
import {
  compileKpInequalityPivotChoreography,
  sampleKpInequalityPivotChoreography,
  type KpInequalityPivotChoreographyFrame,
  type KpInequalityPivotChoreographyPlan
} from "../animation/inequality-pivot-choreography.ts";
import type { KpWitnessedAnnihilationFrame } from "../animation/witnessed-annihilation.ts";
import {
  kpEquationWitnessedAnnihilationRuntime
} from "./equation-witnessed-annihilation-runtime.ts";
import {
  sampleKpIndependentZeroWitness,
  type KpIndependentZeroWitnessFrame
} from "./equation-independent-zero-witness.ts";
import {
  createKpEquationSemanticDepthPlan,
  sampleKpEquationSemanticDepth,
  type KpEquationSemanticDepthPose
} from "./equation-semantic-depth.ts";

export interface KpEquationTokenMotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly scaleX?: number | undefined;
  readonly rotate?: number | undefined;
  readonly depth?: KpEquationSemanticDepthPose | undefined;
}

export interface KpEquationTokenMotionFrameToken {
  readonly motionId: string;
  readonly side: "source" | "target";
  readonly pose: KpEquationTokenMotionPose;
  readonly lineagePathId?: string | undefined;
  readonly lineageEdgeId?: string | undefined;
  readonly lineageBranchIndex?: number | undefined;
  readonly motionPathVariant?:
    KpEquationMotionPathVariantId | KpOrganicPathVariant | undefined;
}

export interface KpEquationTokenMotionFrame {
  readonly transitionId: string;
  readonly progress: number;
  readonly tokens: readonly KpEquationTokenMotionFrameToken[];
  readonly enclosureChoreography?: KpEquationEnclosureChoreographyFrame | undefined;
  readonly lineageChoreography?: KpCopyFanOutChoreographyFrame | undefined;
  readonly distributionChoreography?:
    KpDistributionChoreographyFrame | undefined;
  readonly factoringChoreography?: KpFactoringChoreographyFrame | undefined;
  readonly fractionChoreography?: KpFractionChoreographyFrame | undefined;
  readonly exponentLawChoreography?: KpExponentLawChoreographyFrame | undefined;
  readonly identityAbsorptionChoreography?:
    KpIdentityAbsorptionChoreographyFrame | undefined;
  readonly inequalityPivotChoreography?:
    KpInequalityPivotChoreographyFrame | undefined;
  readonly representationalSuccession?:
    KpEquationRepresentationalSuccessionFrame | undefined;
  readonly linearRearrangement?:
    KpEquationLinearRearrangementFrame | undefined;
  readonly dotProductTraversal?:
    KpDotProductTraversalProgressFrame | undefined;
  readonly matrixVectorComposition?:
    KpMatrixVectorCompositionProgressFrame | undefined;
  readonly matrixMatrixComposition?:
    KpMatrixMatrixCompositionProgressFrame | undefined;
  readonly derivativePower?: KpDerivativePowerChoreographyFrame | undefined;
  readonly witnessedAnnihilation?: KpWitnessedAnnihilationFrame | undefined;
  readonly independentZeroWitness?: KpIndependentZeroWitnessFrame | undefined;
}

interface EnclosureChoreographyContext {
  readonly frame: KpEquationEnclosureChoreographyFrame;
  readonly persistentBounds: {
    readonly left: number;
    readonly width: number;
  };
  readonly enclosureMotionIds: ReadonlySet<string>;
}

interface LineageChoreographyContext {
  readonly kind: "copy-fan-out" | "merge-fan-in" | "substitute";
  readonly relationRecordId: string;
  readonly frame: KpCopyFanOutChoreographyFrame;
  readonly motionPathsByMotionId: KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

interface DistributionChoreographyContext {
  readonly plan: KpDistributionChoreographyPlan;
  readonly frame: KpDistributionChoreographyFrame;
  readonly factorRelationRecordId: string;
  readonly reflowRelationRecordIds: ReadonlySet<string>;
  readonly groupingRelationRecordIds: ReadonlySet<string>;
  readonly sourceFactorAnchorDelta: { readonly x: number; readonly y: number };
  readonly sourceFactorAnchorBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly groupingReflowByMotionId: ReadonlyMap<
    string,
    { readonly x: number; readonly y: number }
  >;
  readonly motionPathsByMotionId:
    KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

interface FactoringChoreographyContext {
  readonly plan: KpFactoringChoreographyPlan;
  readonly frame: KpFactoringChoreographyFrame;
  readonly factorRelationRecordId: string;
  readonly reflowRelationRecordIds: ReadonlySet<string>;
  readonly groupingRelationRecordIds: ReadonlySet<string>;
  readonly commonFactorBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly groupingEntryByMotionId: ReadonlyMap<
    string,
    { readonly x: number; readonly y: number }
  >;
  readonly motionPathsByMotionId:
    KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

interface FractionChoreographyContext {
  readonly plan: KpFractionChoreographyPlan;
  readonly frame: KpFractionChoreographyFrame;
  readonly focusRecordIds: ReadonlySet<string>;
  readonly continuantRecordIds: ReadonlySet<string>;
  readonly structuralRecordIds: ReadonlySet<string>;
  readonly artifactRecordIds: ReadonlySet<string>;
}

interface ExponentLawChoreographyContext {
  readonly plan: KpExponentLawChoreographyPlan;
  readonly frame: KpExponentLawChoreographyFrame;
  readonly continuantRecordIds: ReadonlySet<string>;
  readonly emittedRecordIds: ReadonlySet<string>;
  readonly exitRecordIds: ReadonlySet<string>;
  readonly absorptionAnchorBounds?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
}

interface IdentityAbsorptionChoreographyContext {
  readonly plan: KpIdentityAbsorptionChoreographyPlan;
  readonly frame: KpIdentityAbsorptionChoreographyFrame;
  readonly continuantRecordIds: ReadonlySet<string>;
  readonly absorptionAnchorBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly identityBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

interface InequalityPivotChoreographyContext {
  readonly plan: KpInequalityPivotChoreographyPlan;
  readonly frame: KpInequalityPivotChoreographyFrame;
  readonly continuantRecordIds: ReadonlySet<string>;
  readonly sideChangeRecordIds: ReadonlySet<string>;
  readonly rhsSourceBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly rhsTargetBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

interface RepresentationalSuccessionContext {
  readonly relationRecordIds: ReadonlySet<string>;
  readonly frame: KpEquationRepresentationalSuccessionFrame;
  readonly tokens: readonly KpEquationTokenMotionFrameToken[];
}

interface DerivativePowerChoreographyContext {
  readonly plan: KpDerivativePowerChoreographyPlan;
  readonly frame: KpDerivativePowerChoreographyFrame;
  readonly motionPathsByMotionId:
    KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

export function sampleKpEquationTokenMotion(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): KpEquationTokenMotionFrame {
  const p = clamp01(progress);
  const tokens = new Map<string, KpEquationTokenMotionFrameToken>();
  const witnessedAnnihilation = geometry.witnessedAnnihilationPlan === undefined
    ? undefined
    : requiredWitnessedAnnihilationRuntime().sample(
        geometry.witnessedAnnihilationPlan,
        p
      );
  const independentZeroWitness = geometry.independentZeroWitnessPlan === undefined
    ? undefined
    : sampleKpIndependentZeroWitness(geometry.independentZeroWitnessPlan, p);
  const enclosureChoreography = createEnclosureChoreographyContext(geometry, p);
  const lineageChoreography = createLineageChoreographyContext(geometry, p);
  const distributionChoreography = createDistributionChoreographyContext(
    geometry,
    p
  );
  const factoringChoreography = createFactoringChoreographyContext(geometry, p);
  const fractionChoreography = createFractionChoreographyContext(geometry, p);
  const exponentLawChoreography = createExponentLawChoreographyContext(geometry, p);
  const identityAbsorptionChoreography =
    createIdentityAbsorptionChoreographyContext(geometry, p);
  const inequalityPivotChoreography =
    createInequalityPivotChoreographyContext(geometry, p);
  const representationalSuccession =
    createRepresentationalSuccessionContext(geometry, p);
  const linearRearrangement = geometry.linearRearrangementKind === undefined
    ? undefined
    : sampleKpEquationLinearRearrangementFrame(
        geometry.linearRearrangementKind,
        p,
        geometry.cancellationPresentationRecipe,
        geometry.continuantPresentationRecipe
      );
  const dotProductTraversal = geometry.dotProductTraversalPlan === undefined
    ? undefined
    : sampleKpDotProductTraversalProgress({
        plan: geometry.dotProductTraversalPlan,
        progress: p
      });
  const matrixVectorComposition =
    geometry.matrixVectorCompositionPlan === undefined
      ? undefined
      : sampleKpMatrixVectorCompositionProgress({
          plan: geometry.matrixVectorCompositionPlan,
          progress: p
        });
  const matrixMatrixComposition =
    geometry.matrixMatrixCompositionPlan === undefined
      ? undefined
      : sampleKpMatrixMatrixCompositionProgress({
          plan: geometry.matrixMatrixCompositionPlan,
          progress: p
        });
  const derivativePower = createDerivativePowerChoreographyContext(
    geometry,
    p
  );
  for (const relation of geometry.relations) {
    const sampledTokens = sampleRelation(
      geometry,
      relation,
      p,
      enclosureChoreography,
      lineageChoreography,
      distributionChoreography,
      factoringChoreography,
      fractionChoreography,
      exponentLawChoreography,
      identityAbsorptionChoreography,
      inequalityPivotChoreography,
      representationalSuccession,
      linearRearrangement,
      dotProductTraversal,
      matrixVectorComposition,
      matrixMatrixComposition,
      derivativePower,
      witnessedAnnihilation
    );
    const depthPlan = geometry.depthPresentationRecipe === undefined
      ? undefined
      : createKpEquationSemanticDepthPlan(geometry.depthPresentationRecipe);
    const depth = depthPlan === undefined ||
        relation.lifecycle === "persist" || relation.lifecycle === "role-change"
      ? undefined
      : sampleKpEquationSemanticDepth(depthPlan, p);
    for (const token of sampledTokens) {
      tokens.set(`${token.side}:${token.motionId}`, depth === undefined
        ? token
        : { ...token, pose: { ...token.pose, depth } });
    }
  }
  return {
    transitionId: geometry.transitionId,
    progress: p,
    tokens: [...tokens.values()],
    ...(enclosureChoreography === undefined
      ? {}
      : { enclosureChoreography: enclosureChoreography.frame }),
    ...(lineageChoreography === undefined
      ? {}
      : { lineageChoreography: lineageChoreography.frame }),
    ...(distributionChoreography === undefined
      ? {}
      : { distributionChoreography: distributionChoreography.frame }),
    ...(factoringChoreography === undefined
      ? {}
      : { factoringChoreography: factoringChoreography.frame }),
    ...(fractionChoreography === undefined
      ? {}
      : { fractionChoreography: fractionChoreography.frame }),
    ...(exponentLawChoreography === undefined
      ? {}
      : { exponentLawChoreography: exponentLawChoreography.frame }),
    ...(identityAbsorptionChoreography === undefined
      ? {}
      : {
          identityAbsorptionChoreography:
            identityAbsorptionChoreography.frame
        }),
    ...(inequalityPivotChoreography === undefined
      ? {}
      : { inequalityPivotChoreography: inequalityPivotChoreography.frame }),
    ...(representationalSuccession === undefined
      ? {}
      : { representationalSuccession: representationalSuccession.frame }),
    ...(linearRearrangement === undefined
      ? {}
      : { linearRearrangement }),
    ...(dotProductTraversal === undefined
      ? {}
      : { dotProductTraversal }),
    ...(matrixVectorComposition === undefined
      ? {}
      : { matrixVectorComposition }),
    ...(matrixMatrixComposition === undefined
      ? {}
      : { matrixMatrixComposition }),
    ...(derivativePower === undefined
      ? {}
      : { derivativePower: derivativePower.frame }),
    ...(witnessedAnnihilation === undefined
      ? {}
      : { witnessedAnnihilation }),
    ...(independentZeroWitness === undefined
      ? {}
      : { independentZeroWitness })
  };
}

export function applyKpEquationTokenMotionFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpEquationTokenMotionFrame
): void {
  const elements = new Map([
    ...geometry.sourceTokens.map((token) => [`source:${token.motionId}`, token.element] as const),
    ...geometry.targetTokens.map((token) => [`target:${token.motionId}`, token.element] as const)
  ]);
  for (const token of frame.tokens) {
    const element = elements.get(`${token.side}:${token.motionId}`);
    if (element === undefined) continue;
    element.style.opacity = String(token.pose.opacity);
    element.style.transform =
      `translate(${token.pose.x}px, ${token.pose.y + (token.pose.depth?.translateY ?? 0)}px) translateZ(var(--kp-focus-z, 0px)) rotate(${token.pose.rotate ?? 0}deg) scale(${token.pose.scale}) scaleX(${token.pose.scaleX ?? 1}) scale(${token.pose.depth?.scale ?? 1}) scale(var(--kp-focus-scale, 1))`;
    element.style.transformOrigin = "center center";
    element.style.filter = depthFilter(token.pose.depth);
    element.style.zIndex = String(token.pose.depth?.layer ?? 0);
    if (token.pose.depth === undefined) {
      delete element.dataset["kpEquationSemanticDepth"];
    } else {
      element.dataset["kpEquationSemanticDepth"] = String(token.pose.depth.elevation);
    }
    if (token.lineagePathId === undefined) {
      delete element.dataset["kpEquationLineagePathId"];
      delete element.dataset["kpEquationLineageEdgeId"];
      delete element.dataset["kpEquationLineageBranchIndex"];
    } else {
      element.dataset["kpEquationLineagePathId"] = token.lineagePathId;
      element.dataset["kpEquationLineageEdgeId"] = token.lineageEdgeId ?? "";
      element.dataset["kpEquationLineageBranchIndex"] = String(
        token.lineageBranchIndex ?? 0
      );
    }
    if (token.motionPathVariant === undefined) {
      delete element.dataset["kpEquationMotionPathVariant"];
    } else {
      element.dataset["kpEquationMotionPathVariant"] = token.motionPathVariant ?? "direct";
    }
  }
}

function depthFilter(depth: KpEquationSemanticDepthPose | undefined): string {
  if (depth === undefined || depth.shadowOpacity === 0) return "none";
  return `drop-shadow(0 1px ${depth.shadowBlurPx}px rgba(35, 46, 58, ${depth.shadowOpacity}))`;
}

function sampleRelation(
  geometry: KpMeasuredEquationTransitionGeometry,
  relation: KpMeasuredEquationTransitionRelationGeometry,
  progress: number,
  enclosureChoreography: EnclosureChoreographyContext | undefined,
  lineageChoreography: LineageChoreographyContext | undefined,
  distributionChoreography: DistributionChoreographyContext | undefined,
  factoringChoreography: FactoringChoreographyContext | undefined,
  fractionChoreography: FractionChoreographyContext | undefined,
  exponentLawChoreography: ExponentLawChoreographyContext | undefined,
  identityAbsorptionChoreography:
    IdentityAbsorptionChoreographyContext | undefined,
  inequalityPivotChoreography:
    InequalityPivotChoreographyContext | undefined,
  representationalSuccession:
    RepresentationalSuccessionContext | undefined,
  linearRearrangement: KpEquationLinearRearrangementFrame | undefined,
  dotProductTraversal: KpDotProductTraversalProgressFrame | undefined,
  matrixVectorComposition: KpMatrixVectorCompositionProgressFrame | undefined,
  matrixMatrixComposition: KpMatrixMatrixCompositionProgressFrame | undefined,
  derivativePower: DerivativePowerChoreographyContext | undefined,
  witnessedAnnihilation: KpWitnessedAnnihilationFrame | undefined
): readonly KpEquationTokenMotionFrameToken[] {
  const sourceTokens = relationTokens(geometry.sourceTokens, relation.source?.motionIds ?? []);
  const targetTokens = relationTokens(geometry.targetTokens, relation.target?.motionIds ?? []);
  const eased = smoothstep(progress);
  if (
    witnessedAnnihilation !== undefined &&
    geometry.witnessedAnnihilationPlan !== undefined
  ) {
    const annihilationTokens = requiredWitnessedAnnihilationRuntime().sampleRelation({
      plan: geometry.witnessedAnnihilationPlan,
      frame: witnessedAnnihilation,
      relation,
      sourceTokens,
      targetTokens
    });
    if (annihilationTokens !== undefined) return annihilationTokens;
  }
  const derivativeTokens = derivativePower === undefined
    ? undefined
    : sampleDerivativePowerRelation(
        relation,
        sourceTokens,
        targetTokens,
        derivativePower
      );
  if (derivativeTokens !== undefined) return derivativeTokens;
  const distributionTokens = distributionChoreography === undefined
    ? undefined
    : sampleDistributionRelation(
        relation,
        sourceTokens,
        targetTokens,
        progress,
        distributionChoreography
      );
  if (distributionTokens !== undefined) return distributionTokens;
  const factoringTokens = factoringChoreography === undefined
    ? undefined
    : sampleFactoringRelation(
        relation,
        sourceTokens,
        targetTokens,
        progress,
        factoringChoreography
      );
  if (factoringTokens !== undefined) return factoringTokens;
  const fractionTokens = fractionChoreography === undefined
    ? undefined
    : sampleFractionRelation(
        relation,
        sourceTokens,
        targetTokens,
        progress,
        fractionChoreography
      );
  if (fractionTokens !== undefined) return fractionTokens;
  const exponentLawTokens = exponentLawChoreography === undefined
    ? undefined
    : sampleExponentLawRelation(
        relation,
        sourceTokens,
        targetTokens,
        exponentLawChoreography
      );
  if (exponentLawTokens !== undefined) return exponentLawTokens;
  const identityAbsorptionTokens = identityAbsorptionChoreography === undefined
    ? undefined
    : sampleIdentityAbsorptionRelation(
        relation,
        sourceTokens,
        targetTokens,
        identityAbsorptionChoreography
      );
  if (identityAbsorptionTokens !== undefined) return identityAbsorptionTokens;
  const inequalityPivotTokens = inequalityPivotChoreography === undefined
    ? undefined
    : sampleInequalityPivotRelation(
        relation,
        sourceTokens,
        targetTokens,
        inequalityPivotChoreography
      );
  if (inequalityPivotTokens !== undefined) return inequalityPivotTokens;
  if (representationalSuccession?.relationRecordIds.has(relation.recordId)) {
    const sourceIds = new Set(relation.source?.motionIds ?? []);
    const targetIds = new Set(relation.target?.motionIds ?? []);
    return representationalSuccession.tokens.filter((token) =>
      token.side === "source"
        ? sourceIds.has(token.motionId)
        : targetIds.has(token.motionId)
    );
  }
  if (relation.recordId === lineageChoreography?.relationRecordId) {
    return sampleLineageRelation(
      relation,
      sourceTokens,
      targetTokens,
      lineageChoreography
    );
  }
  if (linearRearrangement !== undefined) {
    const sampled = sampleKpEquationLinearRearrangementRelation({
      relation,
      sourceTokens,
      targetTokens,
      progress,
      frame: linearRearrangement,
      cancellationPresentationRecipe: geometry.cancellationPresentationRecipe,
      continuantPresentationRecipe: geometry.continuantPresentationRecipe,
      successorPresentationRecipe: geometry.successorPresentationRecipe,
      successorSynthesisBinding: geometry.successorSynthesisBinding,
      successorSynthesisPlan: geometry.successorSynthesisPlan
    });
    if (sampled !== undefined) return sampled;
  }
  if (
    dotProductTraversal !== undefined &&
    geometry.dotProductTraversalPlan !== undefined &&
    relation.lifecycle === "merge"
  ) {
    return sampleKpEquationDotProductRelation({
      plan: geometry.dotProductTraversalPlan,
      frame: dotProductTraversal,
      relation,
      sourceTokens,
      targetTokens
    });
  }
  if (
    matrixVectorComposition !== undefined &&
    geometry.matrixVectorCompositionPlan !== undefined
  ) {
    const sampled = sampleKpEquationMatrixVectorRelation({
      plan: geometry.matrixVectorCompositionPlan,
      frame: matrixVectorComposition,
      relation,
      sourceTokens,
      targetTokens
    });
    if (sampled !== undefined) return sampled;
  }
  if (
    matrixMatrixComposition !== undefined &&
    geometry.matrixMatrixCompositionPlan !== undefined
  ) {
    const sampled = sampleKpEquationMatrixMatrixRelation({
      plan: geometry.matrixMatrixCompositionPlan,
      frame: matrixMatrixComposition,
      relation,
      sourceTokens,
      targetTokens
    });
    if (sampled !== undefined) return sampled;
  }
  switch (relation.lifecycle) {
    case "persist":
    case "role-change":
      const travelProgress = relation.lifecycle === "role-change"
        ? representationalSuccession?.frame.continuantReflowProgress ??
          enclosureChoreography?.frame.persistentTravelProgress ??
          eased
        : eased;
      const relationPath =
        representationalSuccession === undefined
          ? undefined
          : geometry.precomputedRelationMotionPathsByRecordId?.[
              relation.recordId
            ];
      const travelPoint = relationPath === undefined
        ? undefined
        : sampleKpEquationMotionPath(relationPath, travelProgress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: progress === 1 ? 0 : 1,
          x: travelPoint === undefined || relationPath === undefined
            ? (relation.delta?.x ?? 0) * travelProgress
            : travelPoint.x - relationPath.start.x,
          y: travelPoint === undefined || relationPath === undefined
            ? (relation.delta?.y ?? 0) * travelProgress
            : travelPoint.y - relationPath.start.y,
          scale: 1 + ((averageScale(relation) - 1) * travelProgress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: progress === 1 ? 1 : 0,
          x: 0,
          y: 0,
          scale: 1
        }))
      ];
    case "enter":
      if (lineageChoreography?.kind === "merge-fan-in") {
        const visibility = 1 - lineageChoreography.frame.phases["branch-descendants"];
        return targetTokens.map((token) => frameToken(token, "target", {
          opacity: visibility,
          x: 0,
          y: 4 * (1 - visibility),
          scale: 0.9 + 0.1 * visibility
        }));
      }
      if (enclosureChoreography?.frame.kind === "wrap") {
        return targetTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "target",
          enclosureChoreography
        ));
      }
      return targetTokens.map((token) => frameToken(token, "target", {
        opacity: eased,
        x: 0,
        y: 6 * (1 - eased),
        scale: 0.85 + 0.15 * eased
      }));
    case "exit":
      if (lineageChoreography?.kind === "copy-fan-out" || lineageChoreography?.kind === "substitute") {
        const visibility = 1 - lineageChoreography.frame.phases["arrive-descendants"];
        return sourceTokens.map((token) => frameToken(token, "source", {
          opacity: visibility,
          x: 0,
          y: 0,
          scale: 1 - 0.1 * (1 - visibility)
        }));
      }
      if (enclosureChoreography?.frame.kind === "unwrap") {
        return sourceTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "source",
          enclosureChoreography
        ));
      }
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: 0,
        scale: 1 - 0.1 * eased
      }));
    case "cancel":
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: relation.lifecycle === "cancel" ? -4 * eased : 0,
        scale: 1 - (relation.lifecycle === "cancel" ? 0.3 * eased : 0.1 * eased)
      }));
    case "merge": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1 - 0.2 * eased
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: 0,
          y: 0,
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "split": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: -(relation.delta?.x ?? 0) * (1 - eased),
          y: -(relation.delta?.y ?? 0) * (1 - eased),
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "artifact":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - eased, x: 0, y: 0, scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: eased, x: 0, y: 0, scale: 0.9 + 0.1 * eased
        }))
      ];
    case "focus":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        }))
      ];
  }
}

function requiredWitnessedAnnihilationRuntime() {
  const runtime = kpEquationWitnessedAnnihilationRuntime();
  if (runtime === undefined) {
    throw new Error("Witnessed annihilation was not registered by the selected capability pack.");
  }
  return runtime;
}

function createRepresentationalSuccessionContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): RepresentationalSuccessionContext | undefined {
  if (
    geometry.representationalSuccessionKind !== "opposite-corner-seed"
  ) {
    return undefined;
  }
  const mergedRelation = geometry.relations.find(
    (candidate) =>
      candidate.lifecycle === "merge" &&
      candidate.source !== undefined &&
      candidate.target !== undefined
  );
  const explicitFragmentRelations = geometry.relations.filter((candidate) =>
    relationContainsRadicalNotation(candidate)
  );
  const relation = mergedRelation ?? aggregateRadicalFragmentRelations(
    explicitFragmentRelations
  );
  if (relation === undefined) return undefined;
  const sampled = sampleKpEquationRepresentationalSuccession({
    relation,
    ...(mergedRelation === undefined
      ? { fragmentRelations: explicitFragmentRelations }
      : {}),
    sourceTokens: relationTokens(
      geometry.sourceTokens,
      relation.source!.motionIds
    ),
    targetTokens: relationTokens(
      geometry.targetTokens,
      relation.target!.motionIds
    ),
    progress
  });
  return {
    relationRecordIds: new Set(
      mergedRelation === undefined
        ? explicitFragmentRelations.map((candidate) => candidate.recordId)
        : [mergedRelation.recordId]
    ),
    frame: sampled.frame,
    tokens: sampled.tokens.map((token) => ({
      motionId: token.motionId,
      side: token.side,
      pose: {
        opacity: token.opacity,
        x: token.x,
        y: token.y,
        scale: token.scale
      },
      motionPathVariant: token.pathVariant
    }))
  };
}

function relationContainsRadicalNotation(
  relation: KpMeasuredEquationTransitionRelationGeometry
): boolean {
  return [
    ...(relation.source?.motionIds ?? []),
    ...(relation.target?.motionIds ?? [])
  ].some((motionId) =>
    motionId.includes(".exponent-") ||
    motionId.startsWith("exponent.") ||
    motionId.includes(".radical-hook") ||
    motionId.includes(".radical-overbar") ||
    motionId.startsWith("radical.") ||
    motionId.includes(".root-index") ||
    motionId.includes(".radicand-exponent")
  );
}

function aggregateRadicalFragmentRelations(
  relations: readonly KpMeasuredEquationTransitionRelationGeometry[]
): KpMeasuredEquationTransitionRelationGeometry | undefined {
  const sources = relations.flatMap((relation) =>
    relation.source === undefined ? [] : [relation.source]
  );
  const targets = relations.flatMap((relation) =>
    relation.target === undefined ? [] : [relation.target]
  );
  if (sources.length === 0 || targets.length === 0) return undefined;
  return {
    recordId: relations.map((relation) => relation.recordId).join("+"),
    lifecycle: "merge",
    source: {
      selectorIds: [...new Set(sources.flatMap((endpoint) => endpoint.selectorIds))],
      motionIds: [...new Set(sources.flatMap((endpoint) => endpoint.motionIds))],
      bounds: unionBounds(sources.map((endpoint) => endpoint.bounds))
    },
    target: {
      selectorIds: [...new Set(targets.flatMap((endpoint) => endpoint.selectorIds))],
      motionIds: [...new Set(targets.flatMap((endpoint) => endpoint.motionIds))],
      bounds: unionBounds(targets.map((endpoint) => endpoint.bounds))
    }
  };
}

function unionBounds(
  bounds: readonly {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  }[]
): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  const left = Math.min(...bounds.map((rect) => rect.left));
  const top = Math.min(...bounds.map((rect) => rect.top));
  const right = Math.max(...bounds.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...bounds.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function createDistributionChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): DistributionChoreographyContext | undefined {
  if (geometry.distributionChoreographyKind !== "canonical-fan-out") {
    return undefined;
  }
  const factorRelation = geometry.relations.find(
    (relation) =>
      relation.lifecycle === "split" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const persistentRelations = geometry.relations.filter(
    (relation) =>
      relation.lifecycle === "persist" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const addendRelations = persistentRelations.filter((relation) =>
    relation.recordId.includes("term")
  );
  const connectorRelations = persistentRelations.filter(
    (relation) => !addendRelations.includes(relation)
  );
  const groupingRelations = geometry.relations.filter(
    (relation) => relation.lifecycle === "exit" && relation.source !== undefined
  );
  const sourceFactorId = factorRelation?.source?.selectorIds[0];
  if (
    factorRelation?.source === undefined ||
    factorRelation.target === undefined ||
    sourceFactorId === undefined
  ) {
    throw new Error("Canonical distribution geometry is missing factor fan-out.");
  }
  const runtime = kpDistributionChoreographyRuntime();
  const plan = runtime.compile({
    id: `${geometry.transitionId}.distribution-choreography`,
    sourceFactorId,
    factorCopyIds: factorRelation.target.selectorIds,
    addendPairs: addendRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    connectorPairs: connectorRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    groupingArtifactIds: groupingRelations.flatMap(
      (relation) => relation.source?.selectorIds ?? []
    )
  });
  const sourceFactorBounds = factorRelation.source.bounds;
  const firstFactorMotionId = factorRelation.target.motionIds[0];
  const firstFactorBounds = geometry.targetTokens.find(
    (token) => token.motionId === firstFactorMotionId
  )?.localRect;
  if (firstFactorBounds === undefined) {
    throw new Error("Canonical distribution geometry is missing its first factor copy.");
  }
  const sourceFactorCenter = rectCenter(sourceFactorBounds);
  const firstFactorCenter = rectCenter(firstFactorBounds);
  const sourceFactorAnchorDelta = {
    x: firstFactorCenter.x - sourceFactorCenter.x,
    y: firstFactorCenter.y - sourceFactorCenter.y
  };
  const orderedAddends = [...addendRelations].sort(
    (left, right) => rectCenter(left.target!.bounds).x - rectCenter(right.target!.bounds).x
  );
  const groupingTokens = groupingRelations
    .flatMap((relation) => relation.source?.motionIds ?? [])
    .map((motionId) => geometry.sourceTokens.find((token) => token.motionId === motionId))
    .filter((token): token is AnnotatedMotionToken => token !== undefined)
    .sort((left, right) => rectCenter(left.localRect).x - rectCenter(right.localRect).x);
  const groupingReflowByMotionId = new Map(
    groupingTokens.map((token, index) => {
      const isLeftBoundary = index < groupingTokens.length / 2;
      const addendBounds = isLeftBoundary
        ? orderedAddends[0]!.target!.bounds
        : orderedAddends.at(-1)!.target!.bounds;
      const sourceCenter = rectCenter(token.localRect);
      const destinationCenter = {
        x: isLeftBoundary
          ? addendBounds.left - token.localRect.width / 2 - 1
          : addendBounds.left + addendBounds.width + token.localRect.width / 2 + 1,
        y: rectCenter(addendBounds).y
      };
      return [
        token.motionId,
        {
          x: destinationCenter.x - sourceCenter.x,
          y: destinationCenter.y - sourceCenter.y
        }
      ] as const;
    })
  );
  return {
    plan,
    frame: runtime.sample({ plan, progress }),
    factorRelationRecordId: factorRelation.recordId,
    reflowRelationRecordIds: new Set(
      persistentRelations.map((relation) => relation.recordId)
    ),
    groupingRelationRecordIds: new Set(
      groupingRelations.map((relation) => relation.recordId)
    ),
    sourceFactorAnchorDelta,
    sourceFactorAnchorBounds: {
      left: sourceFactorBounds.left + sourceFactorAnchorDelta.x,
      top: sourceFactorBounds.top + sourceFactorAnchorDelta.y,
      width: sourceFactorBounds.width,
      height: sourceFactorBounds.height
    },
    groupingReflowByMotionId,
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function createFactoringChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): FactoringChoreographyContext | undefined {
  if (geometry.factoringChoreographyKind !== "canonical-fan-in") {
    return undefined;
  }
  const factorRelation = geometry.relations.find(
    (relation) =>
      relation.lifecycle === "merge" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const persistentRelations = geometry.relations.filter(
    (relation) =>
      relation.lifecycle === "persist" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const addendRelations = persistentRelations.filter((relation) =>
    relation.recordId.includes("term")
  );
  const connectorRelations = persistentRelations.filter(
    (relation) => !addendRelations.includes(relation)
  );
  const groupingRelations = geometry.relations.filter(
    (relation) => relation.lifecycle === "enter" && relation.target !== undefined
  );
  const commonFactorId = factorRelation?.target?.selectorIds[0];
  if (
    factorRelation?.source === undefined ||
    factorRelation.target === undefined ||
    commonFactorId === undefined
  ) {
    throw new Error("Canonical factoring geometry is missing factor fan-in.");
  }
  const runtime = kpFactoringChoreographyRuntime();
  const plan = runtime.compile({
    id: `${geometry.transitionId}.factoring-choreography`,
    factorCopyIds: factorRelation.source.selectorIds,
    commonFactorId,
    addendPairs: addendRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    connectorPairs: connectorRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    groupingArtifactIds: groupingRelations.flatMap(
      (relation) => relation.target?.selectorIds ?? []
    )
  });
  const groupingTokens = groupingRelations
    .flatMap((relation) => relation.target?.motionIds ?? [])
    .map((motionId) => geometry.targetTokens.find((token) => token.motionId === motionId))
    .filter((token): token is AnnotatedMotionToken => token !== undefined)
    .sort((left, right) => rectCenter(left.localRect).x - rectCenter(right.localRect).x);
  const groupingEntryByMotionId = new Map(
    groupingTokens.map((token, semanticIndex) => [
      token.motionId,
      {
        x: semanticIndex < groupingTokens.length / 2 ? -6 : 6,
        y: semanticIndex % 2 === 0 ? -4 : 4
      }
    ] as const)
  );
  return {
    plan,
    frame: runtime.sample({ plan, progress }),
    factorRelationRecordId: factorRelation.recordId,
    reflowRelationRecordIds: new Set(
      persistentRelations.map((relation) => relation.recordId)
    ),
    groupingRelationRecordIds: new Set(
      groupingRelations.map((relation) => relation.recordId)
    ),
    commonFactorBounds: factorRelation.target.bounds,
    groupingEntryByMotionId,
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function createFractionChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): FractionChoreographyContext | undefined {
  const operationKind = geometry.fractionChoreographyKind;
  if (operationKind === undefined) return undefined;
  const continuants = geometry.relations.filter((relation) =>
    relation.lifecycle === "persist" || relation.lifecycle === "role-change"
  );
  const focus = geometry.relations.filter((relation) => {
    switch (operationKind) {
      case "split-factors": return relation.lifecycle === "split";
      case "separate-common-factor": return relation.recordId.startsWith("common-");
      case "simplify-unit-factor": return relation.lifecycle === "cancel";
    }
  });
  const structural = geometry.relations.filter((relation) => {
    switch (operationKind) {
      case "split-factors": return relation.lifecycle === "split";
      case "separate-common-factor": return relation.recordId === "fraction-line-splits";
      case "simplify-unit-factor": return relation.lifecycle === "cancel";
    }
  });
  const artifacts = geometry.relations.filter((relation) => {
    switch (operationKind) {
      case "split-factors": return relation.lifecycle === "enter";
      case "separate-common-factor": return relation.lifecycle === "merge";
      case "simplify-unit-factor": return relation.lifecycle === "cancel";
    }
  });
  const plan = compileKpFractionChoreography({
    id: `${geometry.transitionId}.fraction-choreography`,
    operationKind,
    focusRecordIds: focus.map((relation) => relation.recordId),
    continuantRecordIds: continuants.map((relation) => relation.recordId),
    structuralRecordIds: structural.map((relation) => relation.recordId),
    artifactRecordIds: artifacts.map((relation) => relation.recordId),
    maximumBranchCount: Math.max(
      1,
      ...structural.map((relation) => Math.max(
        relation.source?.motionIds.length ?? 0,
        relation.target?.motionIds.length ?? 0
      ))
    )
  });
  return {
    plan,
    frame: sampleKpFractionChoreography({ plan, progress }),
    focusRecordIds: new Set(plan.focusRecordIds),
    continuantRecordIds: new Set(plan.continuantRecordIds),
    structuralRecordIds: new Set(plan.structuralRecordIds),
    artifactRecordIds: new Set(plan.artifactRecordIds)
  };
}

function createExponentLawChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): ExponentLawChoreographyContext | undefined {
  const operationKind = geometry.exponentLawChoreographyKind;
  if (operationKind === undefined) return undefined;
  const emitted = geometry.relations.filter((relation) => relation.lifecycle === "split");
  const continuants = geometry.relations.filter((relation) =>
    relation.lifecycle === "persist" || relation.lifecycle === "role-change"
  );
  const exits = geometry.relations.filter((relation) => relation.lifecycle === "exit");
  const focus = operationKind === "peel-one-factor" ? emitted : exits;
  const plan = compileKpExponentLawChoreography({
    id: `${geometry.transitionId}.exponent-law-choreography`,
    operationKind,
    focusRecordIds: focus.map((relation) => relation.recordId),
    continuantRecordIds: continuants.map((relation) => relation.recordId),
    emittedRecordIds: emitted.map((relation) => relation.recordId),
    exitRecordIds: exits.map((relation) => relation.recordId)
  });
  return {
    plan,
    frame: sampleKpExponentLawChoreography({ plan, progress }),
    continuantRecordIds: new Set(plan.continuantRecordIds),
    emittedRecordIds: new Set(plan.emittedRecordIds),
    exitRecordIds: new Set(plan.exitRecordIds),
    absorptionAnchorBounds: geometry.relations.find(
      (relation) => relation.recordId === "residual-base-persists"
    )?.target?.bounds
  };
}

function createIdentityAbsorptionChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): IdentityAbsorptionChoreographyContext | undefined {
  const operationKind = geometry.identityAbsorptionChoreographyKind;
  if (operationKind === undefined) return undefined;
  const roles = geometry.identityAbsorptionRoleRecordIds;
  if (roles === undefined) {
    throw new Error("Identity absorption requires explicit semantic role records.");
  }
  const continuants = geometry.relations.filter((relation) =>
    (relation.lifecycle === "persist" || relation.lifecycle === "role-change") &&
    relation.source !== undefined && relation.target !== undefined
  );
  const identity = geometry.relations.find(
    (relation) => relation.recordId === roles.identityRecordId
  );
  const operator = geometry.relations.find(
    (relation) => relation.recordId === roles.operatorRecordId
  );
  if (identity?.source === undefined || operator?.source === undefined) {
    throw new Error(
      "Identity absorption requires separately authored operator and identity exits."
    );
  }
  const anchor = continuants.find(
    (relation) => relation.recordId === roles.anchorRecordId
  );
  if (anchor?.target === undefined) {
    throw new Error("Identity absorption requires a persistent neighboring anchor.");
  }
  const plan = compileKpIdentityAbsorptionChoreography({
    id: `${geometry.transitionId}.identity-absorption-choreography`,
    operationKind,
    continuantRecordIds: continuants.map((relation) => relation.recordId),
    operatorRecordId: operator.recordId,
    identityRecordId: identity.recordId,
    anchorRecordId: anchor.recordId
  });
  return {
    plan,
    frame: sampleKpIdentityAbsorptionChoreography({ plan, progress }),
    continuantRecordIds: new Set(plan.continuantRecordIds),
    absorptionAnchorBounds: anchor.target.bounds,
    identityBounds: identity.source.bounds
  };
}

function createInequalityPivotChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): InequalityPivotChoreographyContext | undefined {
  if (geometry.inequalityPivotChoreographyKind === undefined) return undefined;
  const relation = geometry.relations.find(
    (candidate) =>
      candidate.lifecycle === "role-change" &&
      candidate.source !== undefined &&
      candidate.target !== undefined &&
      candidate.source.selectorIds.some((selectorId) => selectorId.endsWith(".relation"))
  );
  const continuants = geometry.relations.filter(
    (candidate) =>
      candidate !== relation &&
      (candidate.lifecycle === "persist" || candidate.lifecycle === "role-change")
  );
  const sideChanges = geometry.relations.filter(
    (candidate) => candidate.lifecycle === "enter" || candidate.lifecycle === "exit"
  );
  if (relation === undefined) {
    throw new Error("Inequality pivot requires an explicit persistent relation role.");
  }
  const rhsSource = sideChanges.find(
    (candidate) => candidate.recordId === "rhs-operand-exits"
  )?.source;
  const rhsTarget = sideChanges.find(
    (candidate) => candidate.recordId === "rhs-scaled-result-enters"
  )?.target;
  if (rhsSource === undefined || rhsTarget === undefined) {
    throw new Error("Inequality pivot requires explicit right-side scaling roles.");
  }
  const plan = compileKpInequalityPivotChoreography({
    id: `${geometry.transitionId}.inequality-pivot-choreography`,
    continuantRecordIds: continuants.map((candidate) => candidate.recordId),
    sideChangeRecordIds: sideChanges.map((candidate) => candidate.recordId),
    relationRecordId: relation.recordId
  });
  return {
    plan,
    frame: sampleKpInequalityPivotChoreography({ plan, progress }),
    continuantRecordIds: new Set(plan.continuantRecordIds),
    sideChangeRecordIds: new Set(plan.sideChangeRecordIds),
    rhsSourceBounds: rhsSource.bounds,
    rhsTargetBounds: rhsTarget.bounds
  };
}

function createLineageChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): LineageChoreographyContext | undefined {
  const kind = geometry.lineageChoreographyKind;
  const relation = geometry.relations.find((candidate) =>
    kind === "copy-fan-out" || kind === "substitute"
      ? candidate.lifecycle === "split" && candidate.source !== undefined && candidate.target !== undefined
      : kind === "merge-fan-in"
        ? candidate.lifecycle === "merge" && candidate.source !== undefined && candidate.target !== undefined
        : false
  );
  if (kind === undefined || relation?.source === undefined || relation.target === undefined) {
    return undefined;
  }

  const sourceEntityId = kind === "copy-fan-out" || kind === "substitute"
    ? relation.source.selectorIds[0]
    : relation.target.selectorIds[0];
  const descendantEntityIds = kind === "copy-fan-out" || kind === "substitute"
    ? relation.target.selectorIds
    : relation.source.selectorIds;
  if (sourceEntityId === undefined || descendantEntityIds.length < 1) return undefined;
  const lineageGraph = createKpSemanticLineageGraph({
    id: `${geometry.transitionId}.${relation.recordId}.lineage`,
    sourceEntityIds: [sourceEntityId],
    targetEntityIds: [...descendantEntityIds],
    edges: [{
      id: relation.recordId,
      relation: "split",
      sourceEntityIds: [sourceEntityId],
      targetEntityIds: [...descendantEntityIds],
      summary: `${relation.recordId} lineage choreography.`
    }]
  });
  const plan = compileKpCopyFanOutChoreography({
    id: `${geometry.transitionId}.${relation.recordId}.choreography`,
    lineageGraph,
    sourceEntityId
  });

  return {
    kind,
    relationRecordId: relation.recordId,
    frame: sampleKpCopyFanOutChoreography({
      plan,
      progress,
      direction: kind === "copy-fan-out" || kind === "substitute" ? "forward" : "rewind"
    }),
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function createDerivativePowerChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): DerivativePowerChoreographyContext | undefined {
  const plan = geometry.derivativePowerChoreographyPlan;
  if (plan === undefined) return undefined;
  return {
    plan,
    frame: sampleKpDerivativePowerChoreography({ plan, progress }),
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function sampleDerivativePowerRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: DerivativePowerChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (context.plan.operatorSelectorIds.some((selectorId) =>
    relation.source?.selectorIds.includes(selectorId)
  )) {
    return sourceTokens.map((token) => frameToken(token, "source", {
      opacity: context.frame.operator.opacity,
      x: 0,
      y: -4 * context.frame.operator.removalProgress,
      scale: 1 - (0.04 * context.frame.operator.removalProgress)
    }));
  }
  if (relation.recordId === "base-persists") {
    const delta = relation.delta;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.base.sourceOpacity,
        x: (delta?.x ?? 0) * context.frame.base.reflowProgress,
        y: (delta?.y ?? 0) * context.frame.base.reflowProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.base.targetOpacity,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (relation.recordId !== "exponent-branches") return undefined;
  if (relation.source === undefined || relation.target === undefined) return [];
  return [
    ...sourceTokens.map((token) => frameToken(token, "source", {
      opacity: context.frame.exponentSource.opacity,
      x: 0,
      y: 0,
      scale: context.frame.exponentSource.scale
    })),
    ...targetTokens.map((token) => {
      const motionIndex = relation.target!.motionIds.indexOf(token.motionId);
      const selectorId = relation.target!.selectorIds[motionIndex];
      const coefficient =
        selectorId === context.plan.exponent.coefficientSelectorId;
      const branch = coefficient
        ? context.frame.coefficient
        : context.frame.successorExponent;
      const path = lineagePathPose({
        origin: relation.source!.bounds,
        destination: token.localRect,
        pathProgress: branch.pathProgress,
        branchIndex: coefficient ? 0 : 1,
        opacity: branch.opacity,
        scale: branch.scale,
        precomputedPath: context.motionPathsByMotionId?.[token.motionId]
      });
      return {
        motionId: token.motionId,
        side: "target" as const,
        pose: path.pose,
        lineagePathId: `${context.plan.id}.path.${selectorId ?? motionIndex}`,
        lineageEdgeId: "exponent-branches",
        lineageBranchIndex: coefficient ? 0 : 1,
        motionPathVariant: path.variant
      };
    })
  ];
}

function sampleLineageRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: LineageChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] {
  if (relation.source === undefined || relation.target === undefined) return [];

  if (context.kind === "copy-fan-out" || context.kind === "substitute") {
    const origin = relation.source.bounds;
    const settle = context.frame.phases["settle-descendants"];
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - settle,
        x: 0,
        y: 0,
        scale: context.frame.source.scale
      })),
      ...targetTokens.map((token) => lineageFrameToken({
        token,
        side: "target",
        origin,
        selectorIds: relation.target!.selectorIds,
        motionIds: relation.target!.motionIds,
        context
      }))
    ];
  }

  const origin = relation.target.bounds;
  const sourceFrames = sourceTokens.map((token) => lineageFrameToken({
    token,
    side: "source",
    origin,
    selectorIds: relation.source!.selectorIds,
    motionIds: relation.source!.motionIds,
    context
  }));
  const descendantOpacity = Math.max(
    0,
    ...context.frame.descendants.map((descendant) => descendant.opacity)
  );
  return [
    ...sourceFrames,
    ...targetTokens.map((token) => frameToken(token, "target", {
      opacity: 1 - descendantOpacity,
      x: 0,
      y: 0,
      scale: context.frame.source.scale
    }))
  ];
}

function sampleFactoringRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  progress: number,
  context: FactoringChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (
    relation.recordId === context.factorRelationRecordId &&
    relation.source !== undefined &&
    relation.target !== undefined
  ) {
    return [
      ...sourceTokens.map((token) => {
        const motionIndex = relation.source!.motionIds.indexOf(token.motionId);
        const selectorId = relation.source!.selectorIds[motionIndex];
        const copy = context.frame.factorCopies.find(
          (candidate) => candidate.entityId === selectorId
        );
        if (copy === undefined) {
          throw new Error(`Missing factoring factor copy ${selectorId ?? token.motionId}.`);
        }
        const path = lineagePathPose({
          origin: context.commonFactorBounds,
          destination: token.localRect,
          pathProgress: 1 - copy.pathProgress,
          branchIndex: copy.semanticIndex,
          opacity: copy.opacity,
          scale: copy.scale,
          precomputedPath: context.motionPathsByMotionId?.[token.motionId]
        });
        return {
          motionId: token.motionId,
          side: "source" as const,
          pose: path.pose,
          lineagePathId: `${context.plan.id}.factor-copy.${copy.semanticIndex}`,
          lineageEdgeId: relation.recordId,
          lineageBranchIndex: copy.semanticIndex,
          motionPathVariant: path.variant
        };
      }),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.commonFactor.opacity,
        x: 0,
        y: 0,
        scale: context.frame.commonFactor.scale
      }))
    ];
  }
  if (context.reflowRelationRecordIds.has(relation.recordId)) {
    const reflow = context.frame.addendCompactionProgress;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * reflow,
        y: (relation.delta?.y ?? 0) * reflow,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (context.groupingRelationRecordIds.has(relation.recordId)) {
    return targetTokens.map((token) => {
      const entry = context.groupingEntryByMotionId.get(token.motionId) ?? {
        x: 0,
        y: 0
      };
      return frameToken(token, "target", {
        opacity: context.frame.groupingOpacity,
        x: entry.x * (1 - context.frame.groupingOpacity),
        y: entry.y * (1 - context.frame.groupingOpacity),
        scale: 1
      });
    });
  }
  return undefined;
}

function sampleFractionRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  progress: number,
  context: FractionChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (context.plan.operationKind === "split-factors") {
    if (context.structuralRecordIds.has(relation.recordId) && relation.source !== undefined) {
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - context.frame.settlementProgress,
          x: 0,
          y: 0,
          scale: 1 - 0.16 * context.frame.structuralProgress
        })),
        ...targetTokens.map((token, semanticIndex) => {
          const branch = context.frame.branches[semanticIndex] ?? context.frame.branches.at(-1)!;
          const path = lineagePathPose({
            origin: relation.source!.bounds,
            destination: token.localRect,
            pathProgress: branch.pathProgress,
            branchIndex: semanticIndex,
            opacity: branch.opacity,
            scale: branch.scale
          });
          return {
            motionId: token.motionId,
            side: "target" as const,
            pose: path.pose,
            lineagePathId: `${context.plan.id}.${relation.recordId}.${semanticIndex}`,
            lineageEdgeId: relation.recordId,
            lineageBranchIndex: semanticIndex,
            motionPathVariant: path.variant
          };
        })
      ];
    }
    if (context.artifactRecordIds.has(relation.recordId)) {
      return targetTokens.map((token, semanticIndex) => frameToken(token, "target", {
        opacity: context.frame.artifactProgress,
        x: (semanticIndex % 2 === 0 ? -5 : 5) * (1 - context.frame.artifactProgress),
        y: (semanticIndex % 2 === 0 ? -3 : 3) * (1 - context.frame.artifactProgress),
        scale: 1
      }));
    }
  }

  if (context.plan.operationKind === "separate-common-factor") {
    if (
      context.structuralRecordIds.has(relation.recordId) &&
      relation.source !== undefined &&
      relation.target !== undefined
    ) {
      const baseBar = targetTokens[0];
      const sourceBar = sourceTokens[0];
      if (baseBar === undefined || sourceBar === undefined) return [];
      const sourceCenter = rectCenter(sourceBar.localRect);
      const baseCenter = rectCenter(baseBar.localRect);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: progress === 1 ? 0 : 1,
          x: (baseCenter.x - sourceCenter.x) * context.frame.reflowProgress,
          y: (baseCenter.y - sourceCenter.y) * context.frame.reflowProgress,
          scale: 1,
          scaleX: 1 + (
            (baseBar.localRect.width / Math.max(1, sourceBar.localRect.width)) - 1
          ) * context.frame.reflowProgress
        })),
        ...targetTokens.map((token, semanticIndex) => {
          if (semanticIndex === 0) {
            return frameToken(token, "target", {
              opacity: progress === 1 ? 1 : 0,
              x: 0,
              y: 0,
              scale: 1
            });
          }
          const branch = context.frame.branches[semanticIndex] ?? context.frame.branches.at(-1)!;
          const path = lineagePathPose({
            origin: baseBar.localRect,
            destination: token.localRect,
            pathProgress: branch.pathProgress,
            branchIndex: semanticIndex,
            opacity: branch.opacity,
            scale: 1
          });
          return {
            motionId: token.motionId,
            side: "target" as const,
            pose: path.pose,
            lineagePathId: `${context.plan.id}.fraction-bar.${semanticIndex}`,
            lineageEdgeId: relation.recordId,
            lineageBranchIndex: semanticIndex,
            motionPathVariant: path.variant
          };
        })
      ];
    }
    if (
      context.artifactRecordIds.has(relation.recordId) &&
      relation.target !== undefined
    ) {
      return [
        ...sourceTokens.map((token, semanticIndex) => {
          const path = lineagePathPose({
            origin: relation.target!.bounds,
            destination: token.localRect,
            pathProgress: 1 - context.frame.structuralProgress,
            branchIndex: semanticIndex,
            opacity: semanticIndex === 0
              ? 1 - context.frame.settlementProgress
              : 1 - context.frame.artifactProgress,
            scale: 1
          });
          return {
            motionId: token.motionId,
            side: "source" as const,
            pose: path.pose,
            lineagePathId: `${context.plan.id}.product-sign.${semanticIndex}`,
            lineageEdgeId: relation.recordId,
            lineageBranchIndex: semanticIndex,
            motionPathVariant: path.variant
          };
        }),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: context.frame.artifactProgress,
          x: 0,
          y: 0,
          scale: 1
        }))
      ];
    }
  }

  if (
    context.plan.operationKind === "simplify-unit-factor" &&
    context.structuralRecordIds.has(relation.recordId)
  ) {
    const bundleBounds = unionBounds(sourceTokens.map((token) => token.localRect));
    const bundleCenter = rectCenter(bundleBounds);
    return sourceTokens.map((token, semanticIndex) => {
      const center = rectCenter(token.localRect);
      const jostle = semanticIndex % 2 === 0 ? -1 : 1;
      return frameToken(token, "source", {
        opacity: 1 - context.frame.artifactProgress,
        x: (bundleCenter.x - center.x) * 0.18 * context.frame.artifactProgress +
          jostle * context.frame.artifactProgress,
        y: (bundleCenter.y - center.y) * 0.18 * context.frame.artifactProgress -
          jostle * context.frame.artifactProgress,
        scale: 1 - 0.08 * context.frame.artifactProgress
      });
    });
  }

  if (context.continuantRecordIds.has(relation.recordId)) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * context.frame.reflowProgress,
        y: (relation.delta?.y ?? 0) * context.frame.reflowProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  return undefined;
}

function sampleExponentLawRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: ExponentLawChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (
    context.plan.operationKind === "peel-one-factor" &&
    context.emittedRecordIds.has(relation.recordId) &&
    relation.source !== undefined
  ) {
    const continuation = targetTokens[1];
    const source = sourceTokens[0];
    if (continuation === undefined || source === undefined) return [];
    const sourceCenter = rectCenter(source.localRect);
    const continuationCenter = rectCenter(continuation.localRect);
    const anchorDelta = {
      x: continuationCenter.x - sourceCenter.x,
      y: continuationCenter.y - sourceCenter.y
    };
    const exponentEmission = relation.recordId.includes("exponent");
    const emissionIndex = exponentEmission ? 1 : 0;
    const emission = context.frame.emissions[emissionIndex]!;
    const sourceOpacity = exponentEmission
      ? 1 - context.frame.exponentChangeProgress
      : 1 - context.frame.settlementProgress;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: sourceOpacity,
        x: anchorDelta.x * context.frame.reflowProgress,
        y: anchorDelta.y * context.frame.reflowProgress,
        scale: 1 - 0.12 * context.frame.emissionProgress *
          (1 - context.frame.settlementProgress)
      })),
      ...targetTokens.map((token, semanticIndex) => {
        if (semanticIndex === 1) {
          return frameToken(token, "target", {
            opacity: exponentEmission
              ? context.frame.exponentChangeProgress
              : context.frame.settlementProgress,
            x: 0,
            y: 0,
            scale: 1
          });
        }
        const movingOrigin = {
          ...relation.source!.bounds,
          left: relation.source!.bounds.left +
            anchorDelta.x * context.frame.reflowProgress,
          top: relation.source!.bounds.top +
            anchorDelta.y * context.frame.reflowProgress
        };
        const path = lineagePathPose({
          origin: movingOrigin,
          destination: token.localRect,
          pathProgress: emission.pathProgress,
          branchIndex: emissionIndex,
          opacity: emission.opacity,
          scale: emission.scale
        });
        return {
          motionId: token.motionId,
          side: "target" as const,
          pose: path.pose,
          lineagePathId: `${context.plan.id}.${relation.recordId}.emission`,
          lineageEdgeId: relation.recordId,
          lineageBranchIndex: emissionIndex,
          motionPathVariant: path.variant
        };
      })
    ];
  }

  if (
    context.plan.operationKind === "absorb-unit-exponent" &&
    context.exitRecordIds.has(relation.recordId)
  ) {
    const anchor = context.absorptionAnchorBounds;
    if (anchor === undefined) {
      throw new Error("Unit-exponent absorption is missing its residual-base anchor.");
    }
    return sourceTokens.map((token) => {
      const start = rectCenter(token.localRect);
      const end = rectCenter(anchor);
      const path = planKpEquationMotionPathBetweenPoints({
        id: `${context.plan.id}.unit-absorption`,
        start,
        end,
        variants: ["arc-above", "arc-below"],
        preferredVariant: "arc-below",
        clearance: 14,
        moverRadius: 0
      }).selected;
      const point = sampleKpEquationMotionPath(
        path,
        context.frame.exponentChangeProgress
      );
      return {
        motionId: token.motionId,
        side: "source" as const,
        pose: {
          opacity: 1 - context.frame.exponentChangeProgress,
          x: point.x - start.x,
          y: point.y - start.y,
          scale: 1 - 0.12 * context.frame.exponentChangeProgress
        },
        lineagePathId: path.id,
        lineageEdgeId: relation.recordId,
        lineageBranchIndex: 0,
        motionPathVariant: path.variant
      };
    });
  }

  if (context.continuantRecordIds.has(relation.recordId)) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - context.frame.settlementProgress,
        x: (relation.delta?.x ?? 0) * context.frame.reflowProgress,
        y: (relation.delta?.y ?? 0) * context.frame.reflowProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.settlementProgress,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  return undefined;
}

function sampleIdentityAbsorptionRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: IdentityAbsorptionChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (context.continuantRecordIds.has(relation.recordId)) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * context.frame.reflowProgress,
        y: (relation.delta?.y ?? 0) * context.frame.reflowProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }

  if (
    relation.recordId !== context.plan.operatorRecordId &&
    relation.recordId !== context.plan.identityRecordId
  ) {
    return undefined;
  }
  const operator = relation.recordId === context.plan.operatorRecordId;
  const motionProgress = operator
    ? context.frame.operatorFoldProgress
    : context.frame.identityAbsorptionProgress;
  const destination = operator
    ? context.identityBounds
    : context.absorptionAnchorBounds;
  return sourceTokens.map((token) => {
    const start = rectCenter(token.localRect);
    const end = rectCenter(destination);
    const preferredVariant = operator ? "arc-above" : "arc-below";
    const path = planKpEquationMotionPathBetweenPoints({
      id: `${context.plan.id}.${operator ? "operator-fold" : "identity-absorption"}`,
      start,
      end,
      variants: [preferredVariant],
      preferredVariant,
      clearance: operator ? 10 : 16,
      moverRadius: 0
    }).selected;
    const point = sampleKpEquationMotionPath(path, motionProgress);
    const disappearance = lateProgress(motionProgress);
    return {
      motionId: token.motionId,
      side: "source" as const,
      pose: {
        opacity: 1 - disappearance,
        x: point.x - start.x,
        y: point.y - start.y,
        scale: 1 - (operator ? 0.35 : 0.72) * motionProgress
      },
      lineagePathId: path.id,
      lineageEdgeId: relation.recordId,
      lineageBranchIndex: operator ? 0 : 1,
      motionPathVariant: path.variant
    };
  });
}

function sampleInequalityPivotRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: InequalityPivotChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (relation.recordId === context.plan.relationRecordId) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * context.frame.sideScaleProgress,
        y: (relation.delta?.y ?? 0) * context.frame.sideScaleProgress,
        scale: 1,
        rotate: 180 * context.frame.relationPivotProgress
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (context.continuantRecordIds.has(relation.recordId)) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * context.frame.sideScaleProgress,
        y: (relation.delta?.y ?? 0) * context.frame.sideScaleProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (relation.recordId === "rhs-operand-exits") {
    const start = rectCenter(context.rhsSourceBounds);
    const end = rectCenter(context.rhsTargetBounds);
    const change = context.frame.sideScaleProgress;
    return sourceTokens.map((token) => frameToken(token, "source", {
      opacity: 1 - lateProgress(change),
      x: (end.x - start.x) * change,
      y: (end.y - start.y) * change - 8 * change,
      scale: 1 - 0.45 * change
    }));
  }
  if (relation.recordId === "rhs-scaled-result-enters") {
    const reveal = lateProgress(context.frame.sideScaleProgress);
    return targetTokens.map((token) => {
      const destination = rectCenter(token.localRect);
      const path = planKpEquationMotionPathBetweenPoints({
        id: `${context.plan.id}.rhs-scaled-result`,
        start: rectCenter(context.rhsSourceBounds),
        end: destination,
        variants: ["arc-below"],
        preferredVariant: "arc-below",
        clearance: 12,
        moverRadius: 0
      }).selected;
      const point = sampleKpEquationMotionPath(
        path,
        context.frame.sideScaleProgress
      );
      return {
        motionId: token.motionId,
        side: "target" as const,
        pose: {
          opacity: reveal,
          x: point.x - destination.x,
          y: point.y - destination.y,
          scale: 0.76 + 0.24 * context.frame.sideScaleProgress
        },
        lineagePathId: path.id,
        lineageEdgeId: relation.recordId,
        lineageBranchIndex: 0,
        motionPathVariant: path.variant
      };
    });
  }
  if (!context.sideChangeRecordIds.has(relation.recordId)) return undefined;
  if (relation.lifecycle === "enter") {
    return targetTokens.map((token, index) => frameToken(token, "target", {
      opacity: context.frame.sideScaleProgress,
      x: (index % 2 === 0 ? -6 : 6) * (1 - context.frame.sideScaleProgress),
      y: (index % 2 === 0 ? -4 : 4) * (1 - context.frame.sideScaleProgress),
      scale: 0.88 + 0.12 * context.frame.sideScaleProgress
    }));
  }
  return sourceTokens.map((token) => frameToken(token, "source", {
    opacity: 1 - context.frame.sideScaleProgress,
    x: 4 * context.frame.sideScaleProgress,
    y: -5 * context.frame.sideScaleProgress,
    scale: 1 - 0.12 * context.frame.sideScaleProgress
  }));
}

function sampleDistributionRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  progress: number,
  context: DistributionChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (
    relation.recordId === context.factorRelationRecordId &&
    relation.source !== undefined &&
    relation.target !== undefined
  ) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.sourceFactor.opacity,
        x: context.sourceFactorAnchorDelta.x * context.frame.addendReflowProgress,
        y: context.sourceFactorAnchorDelta.y * context.frame.addendReflowProgress,
        scale: context.frame.sourceFactor.scale
      })),
      ...targetTokens.map((token) => {
        const motionIndex = relation.target!.motionIds.indexOf(token.motionId);
        const selectorId = relation.target!.selectorIds[motionIndex];
        const copy = context.frame.factorCopies.find(
          (candidate) => candidate.entityId === selectorId
        );
        if (copy === undefined) {
          throw new Error(`Missing distribution factor copy ${selectorId ?? token.motionId}.`);
        }
        const path = lineagePathPose({
          origin: {
            ...context.sourceFactorAnchorBounds,
            left: context.sourceFactorAnchorBounds.left -
              context.sourceFactorAnchorDelta.x * (1 - context.frame.addendReflowProgress),
            top: context.sourceFactorAnchorBounds.top -
              context.sourceFactorAnchorDelta.y * (1 - context.frame.addendReflowProgress)
          },
          destination: token.localRect,
          pathProgress: copy.pathProgress,
          branchIndex: copy.semanticIndex,
          opacity: copy.opacity,
          scale: copy.scale,
          precomputedPath: context.motionPathsByMotionId?.[token.motionId]
        });
        return {
          motionId: token.motionId,
          side: "target" as const,
          pose: path.pose,
          lineagePathId: `${context.plan.id}.factor-copy.${copy.semanticIndex}`,
          lineageEdgeId: relation.recordId,
          lineageBranchIndex: copy.semanticIndex,
          motionPathVariant: path.variant
        };
      })
    ];
  }
  if (context.reflowRelationRecordIds.has(relation.recordId)) {
    const reflow = context.frame.addendReflowProgress;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * reflow,
        y: (relation.delta?.y ?? 0) * reflow,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (context.groupingRelationRecordIds.has(relation.recordId)) {
    return sourceTokens.map((token) => {
      // Each delimiter follows its adjacent addend so the opening group remains legible.
      const reflow = context.groupingReflowByMotionId.get(token.motionId) ?? {
        x: 0,
        y: 0
      };
      return frameToken(token, "source", {
        opacity: context.frame.groupingOpacity,
        x: reflow.x * context.frame.addendReflowProgress,
        y: reflow.y * context.frame.addendReflowProgress,
        scale: 1
      });
    });
  }
  return undefined;
}

function lineageFrameToken(input: {
  readonly token: AnnotatedMotionToken;
  readonly side: "source" | "target";
  readonly origin: NonNullable<
    KpMeasuredEquationTransitionRelationGeometry["source"]
  >["bounds"];
  readonly selectorIds: readonly string[];
  readonly motionIds: readonly string[];
  readonly context: LineageChoreographyContext;
}): KpEquationTokenMotionFrameToken {
  const motionIndex = input.motionIds.indexOf(input.token.motionId);
  const selectorId = input.selectorIds[motionIndex];
  const descendant = input.context.frame.descendants.find(
    (candidate) => candidate.entityId === selectorId
  );
  if (descendant === undefined) {
    throw new Error(`Missing lineage descendant frame for motion token ${input.token.motionId}.`);
  }
  const path = lineagePathPose({
    origin: input.origin,
    destination: input.token.localRect,
    pathProgress: descendant.pathProgress,
    branchIndex: descendant.branchIndex,
    opacity: descendant.opacity,
    scale: descendant.scale,
    precomputedPath: input.context.motionPathsByMotionId?.[input.token.motionId]
  });
  return {
    motionId: input.token.motionId,
    side: input.side,
    pose: path.pose,
    lineagePathId: descendant.pathId,
    lineageEdgeId: descendant.lineageEdgeId,
    lineageBranchIndex: descendant.branchIndex,
    motionPathVariant: path.variant
  };
}

function lineagePathPose(input: {
  readonly origin: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly destination: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly pathProgress: number;
  readonly branchIndex: number;
  readonly opacity: number;
  readonly scale: number;
  readonly precomputedPath?: KpEquationMotionPathCandidate | undefined;
}): {
  readonly pose: KpEquationTokenMotionPose;
  readonly variant: KpEquationMotionPathVariantId;
} {
  const originCenter = rectCenter(input.origin);
  const destinationCenter = rectCenter(input.destination);
  const path = input.precomputedPath ?? planKpEquationMotionPathBetweenPoints({
    id: `lineage.branch.${input.branchIndex}`,
    start: originCenter,
    end: destinationCenter,
    variants: ["arc-above", "arc-below"],
    preferredVariant: input.branchIndex % 2 === 0 ? "arc-above" : "arc-below",
    clearance: 18 + input.branchIndex * 3,
    moverRadius: 0
  }).selected;
  const point = sampleKpEquationMotionPath(path, input.pathProgress);
  return {
    pose: {
      opacity: input.opacity,
      x: point.x - destinationCenter.x,
      y: point.y - destinationCenter.y,
      scale: input.scale
    },
    variant: path.variant
  };
}

function rectCenter(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function createEnclosureChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): EnclosureChoreographyContext | undefined {
  const persistent = geometry.relations.find(
    (relation) => relation.lifecycle === "role-change" && relation.source !== undefined && relation.target !== undefined
  );
  const kind = geometry.enclosureChoreographyKind;
  if (persistent === undefined || kind === undefined) return undefined;

  const entering = geometry.relations.filter(
    (relation) => relation.lifecycle === "enter" && relation.target !== undefined
  );
  const exiting = geometry.relations.filter(
    (relation) => relation.lifecycle === "exit" && relation.source !== undefined
  );
  if (kind === "wrap" && entering.length === 0) return undefined;
  if (kind === "unwrap" && exiting.length === 0) return undefined;

  const persistentBounds = kind === "wrap"
    ? persistent.target!.bounds
    : persistent.source!.bounds;
  const artifactMotionIds = (kind === "wrap" ? entering : exiting).flatMap(
    (relation) => kind === "wrap"
      ? relation.target?.motionIds ?? []
      : relation.source?.motionIds ?? []
  );
  const artifactTokens = relationTokens(
    kind === "wrap" ? geometry.targetTokens : geometry.sourceTokens,
    artifactMotionIds
  );

  return {
    frame: sampleKpEquationEnclosureChoreography(kind, progress),
    persistentBounds,
    enclosureMotionIds: nearestEnclosureMotionIds(artifactTokens, persistentBounds)
  };
}

function nearestEnclosureMotionIds(
  tokens: readonly AnnotatedMotionToken[],
  persistentBounds: { readonly left: number; readonly width: number }
): ReadonlySet<string> {
  // The closest artifact on each side is the enclosure; farther artifacts such
  // as a function label use the later outer-artifact phase.
  const center = persistentBounds.left + persistentBounds.width / 2;
  const left = nearestToken(tokens.filter((token) => tokenCenterX(token) < center), center);
  const right = nearestToken(tokens.filter((token) => tokenCenterX(token) >= center), center);
  return new Set([left?.motionId, right?.motionId].filter(
    (motionId): motionId is string => motionId !== undefined
  ));
}

function nearestToken(
  tokens: readonly AnnotatedMotionToken[],
  center: number
): AnnotatedMotionToken | undefined {
  return [...tokens].sort(
    (left, right) => Math.abs(tokenCenterX(left) - center) - Math.abs(tokenCenterX(right) - center)
  )[0];
}

function sampleEnclosureArtifactToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  context: EnclosureChoreographyContext
): KpEquationTokenMotionFrameToken {
  const isEnclosure = context.enclosureMotionIds.has(token.motionId);
  const visibility = isEnclosure
    ? context.frame.enclosureVisibility
    : context.frame.outerArtifactVisibility;
  const center = context.persistentBounds.left + context.persistentBounds.width / 2;
  const direction = tokenCenterX(token) < center ? -1 : 1;
  const travel = 1 - visibility;

  return frameToken(token, side, {
    opacity: visibility,
    x: direction * (isEnclosure ? 8 : 10) * travel,
    y: 0,
    scale: isEnclosure ? 1 : 0.35 + 0.65 * visibility
  });
}

function tokenCenterX(token: AnnotatedMotionToken): number {
  return token.localRect.left + token.localRect.width / 2;
}

function relationTokens(
  tokens: readonly AnnotatedMotionToken[],
  motionIds: readonly string[]
): readonly AnnotatedMotionToken[] {
  const ids = new Set(motionIds);
  return tokens.filter((token) => ids.has(token.motionId));
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}

function averageScale(relation: KpMeasuredEquationTransitionRelationGeometry): number {
  if (relation.delta === undefined) return 1;
  return (relation.delta.scaleX + relation.delta.scaleY) / 2;
}

function lateProgress(progress: number): number {
  return smoothstep(clamp01((progress - 0.55) / 0.45));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
