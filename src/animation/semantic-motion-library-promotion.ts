import {
  checkKpAnimationAssetSeekRewindLaw,
  type KpAnimationAsset
} from "./asset.ts";
import { diagnoseKpAnimationDesign } from "./animation-design-diagnostics.ts";
import { createKpAnimationAssets } from "./catalog.ts";
import {
  createKpLlmSemanticMotionOperationCatalog
} from "./llm-semantic-motion-operation-authoring.ts";
import {
  kpBaseGestaltStyleCatalog,
  kpGestaltStyleKey
} from "./gestalt-base-styles.ts";
import {
  kpEquationDomGestaltRenderer,
  resolveKpGestaltRendererCapabilities
} from "./gestalt-renderer-capabilities.ts";
import { resolveKpGestaltStyle } from "./gestalt-style-resolution.ts";
import {
  resolveKpRenderQualityProfile,
  type KpRenderQualityTier
} from "./render-quality.ts";
import {
  evaluateKpAnimationStaticCost,
  type KpAnimationStaticCostInput
} from "./static-cost-model.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../domain-ir/public-api.ts";
import type { EquationVisualMotifKind } from "./motifs/visual-motif.ts";

export interface KpSemanticMotionPromotionRequirement {
  readonly transformType: string;
  readonly motifKind: EquationVisualMotifKind;
}

export interface KpSemanticMotionLibraryPromotionReport {
  readonly kind: "semantic-motion-library-promotion-report";
  readonly status: "promoted" | "blocked";
  readonly requirementCount: number;
  readonly animationCount: number;
  readonly transformationCount: number;
  readonly llmOperationCount: number;
  readonly matrixCellCount: number;
  readonly complexityLevels: readonly KpSemanticMotionComplexityLevel[];
  readonly qualityTiers: readonly KpRenderQualityTier[];
  readonly gestaltStyleKeys: readonly string[];
  readonly hotPathLayoutReadBudget: 0;
  readonly surpriseInitialLoadBudget: 0;
  readonly gaps: readonly string[];
}

export type KpSemanticMotionComplexityLevel = "low" | "medium" | "high";

export interface KpSemanticMotionPromotionFixture {
  readonly id: string;
  readonly animationId: string;
  readonly transformType: string;
  readonly complexity: KpSemanticMotionComplexityLevel;
  readonly cost: KpAnimationStaticCostInput;
}

export interface KpSemanticMotionPromotionMatrixCell {
  readonly fixtureId: string;
  readonly animationId: string;
  readonly transformType: string;
  readonly complexity: KpSemanticMotionComplexityLevel;
  readonly qualityTier: KpRenderQualityTier;
  readonly gestaltStyleKey: string;
  readonly semanticIdentity: string;
  readonly staticCostStatus: "accepted" | "compression-required" | "rejected";
  readonly recommendedTier?: KpRenderQualityTier | undefined;
  readonly styleCompatible: boolean;
}

export const kpSemanticMotionPromotionRequirements:
  readonly KpSemanticMotionPromotionRequirement[] = [
    requirement("subtractBothSides", "append-after-shift"),
    requirement("cancelAdditiveInverses", "cancelation"),
    requirement("simplifyConstantDifference", "simplify-into"),
    requirement("splitFractionFactors", "fraction-factor-split"),
    requirement("mergeFractionCommonFactor", "fraction-common-factor-extract"),
    requirement("simplifyUnitFractionFactor", "fraction-unit-absorb"),
    requirement("lowerExponent", "exponent-factor-peel"),
    requirement("unwrapUnitExponent", "exponent-unit-absorb"),
    requirement("rewritePowerAsRoot", "radical-corner-transfer"),
    requirement("wrapFunction", "wrap"),
    requirement("distributeMultiplication", "copy-fan-out"),
    requirement("factorCommonTerm", "merge-fan-in"),
    requirement("multiplyNegativeBothSidesInequality", "relation-flip"),
    requirement("simplify-additive-identity", "simplify-into"),
    requirement("substituteValue", "substitute"),
    requirement("applyDerivativePowerRule", "derivative-power"),
    requirement("applyDerivativeSumRule", "copy-fan-out"),
    requirement("applyDerivativePowerRulesToTerms", "merge-fan-in"),
    requirement("applyAntiderivativePowerRule", "copy-fan-out"),
    requirement("simplifyAntiderivativePowerRule", "merge-fan-in"),
    requirement("computeDotProduct", "dot-product-accumulate"),
    requirement("multiplyMatrixVector", "matrix-row-compose"),
    requirement("multiplyMatrices", "matrix-cell-compose")
  ];

export const kpSemanticMotionPromotionFixtures:
  readonly KpSemanticMotionPromotionFixture[] = [
    {
      id: "fixture.promotion.low.function-wrap",
      animationId: "animation.generated.function-wrap.apply-f",
      transformType: "wrapFunction",
      complexity: "low",
      cost: {
        tokenCount: 16,
        simultaneousMovingGroupCount: 1,
        fragmentCount: 8,
        shadowLayerCount: 1,
        threeDLayerCount: 0
      }
    },
    {
      id: "fixture.promotion.medium.distribution",
      animationId: "animation.generated.distribution.expand-a-sum",
      transformType: "distributeMultiplication",
      complexity: "medium",
      cost: {
        tokenCount: 48,
        simultaneousMovingGroupCount: 4,
        fragmentCount: 64,
        shadowLayerCount: 2,
        threeDLayerCount: 0
      }
    },
    {
      id: "fixture.promotion.high.matrix-matrix",
      animationId: "animation.generated.linear-algebra.matrix-matrix.two-by-two",
      transformType: "multiplyMatrices",
      complexity: "high",
      cost: {
        tokenCount: 96,
        simultaneousMovingGroupCount: 7,
        fragmentCount: 160,
        shadowLayerCount: 4,
        threeDLayerCount: 1
      }
    }
  ];

const promotionQualityTiers = ["full", "balanced", "efficient"] as const;

export function createKpSemanticMotionPromotionMatrix(input: {
  readonly catalog?: readonly KpAnimationAsset[] | undefined;
} = {}): readonly KpSemanticMotionPromotionMatrixCell[] {
  const catalog = input.catalog ?? createKpAnimationAssets();
  return kpSemanticMotionPromotionFixtures.flatMap((fixture) => {
    const animation = catalog.find((candidate) => candidate.id === fixture.animationId);
    const transformation = animation?.transformations.find(
      (candidate) => candidate.transformType === fixture.transformType
    );
    const semanticIdentity = transformation === undefined
      ? `missing:${fixture.animationId}:${fixture.transformType}`
      : [
          transformation.transformType,
          ...transformation.sourceObjectIds.map((id) => `source:${id}`),
          ...transformation.targetObjectIds.map((id) => `target:${id}`)
        ].join("|");
    const staticCost = evaluateKpAnimationStaticCost(fixture.cost);

    return [...kpBaseGestaltStyleCatalog.values()].flatMap((style) => {
      const resolvedStyle = resolveKpGestaltStyle({
        pinnedStyle: { id: style.id, version: style.version },
        catalog: kpBaseGestaltStyleCatalog
      });
      const compatibility = resolveKpGestaltRendererCapabilities({
        style,
        renderer: kpEquationDomGestaltRenderer
      });
      return promotionQualityTiers.map((qualityTier) => {
        const quality = resolveKpRenderQualityProfile({ preference: qualityTier });
        const preservesSemantics =
          quality.semanticStepScale === 1 &&
          quality.witnessVisibility === "preserve" &&
          quality.durationScale === 1;
        return {
          fixtureId: fixture.id,
          animationId: fixture.animationId,
          transformType: fixture.transformType,
          complexity: fixture.complexity,
          qualityTier,
          gestaltStyleKey: kpGestaltStyleKey(style),
          semanticIdentity: preservesSemantics
            ? semanticIdentity
            : `quality-semantic-drift:${semanticIdentity}`,
          staticCostStatus: staticCost.status,
          ...(staticCost.status === "accepted"
            ? { recommendedTier: staticCost.recommendedTier }
            : {}),
          styleCompatible:
            compatibility.status === "compatible" &&
            !resolvedStyle.diagnostics.some((diagnostic) => diagnostic.severity === "error")
        };
      });
    });
  });
}

export function auditKpSemanticMotionLibraryPromotion(input: {
  readonly catalog?: readonly KpAnimationAsset[] | undefined;
} = {}): KpSemanticMotionLibraryPromotionReport {
  const catalog = input.catalog ?? createKpAnimationAssets();
  const llmCatalog = createKpLlmSemanticMotionOperationCatalog();
  const promotionMatrix = createKpSemanticMotionPromotionMatrix({ catalog });
  const gaps: string[] = [];
  const matchedAnimationIds = new Set<string>();
  let transformationCount = 0;

  kpSemanticMotionPromotionRequirements.forEach((requirement) => {
    const matches = catalog.flatMap((animation) =>
      animation.transformations
        .filter((transformation) => transformation.transformType === requirement.transformType)
        .map((transformation) => ({ animation, transformation }))
    );
    if (matches.length === 0) {
      gaps.push(`Missing promoted transformation type ${requirement.transformType}.`);
      return;
    }
    const authoredOperation = llmCatalog.operations.find(
      (operation) => operation.transformType === requirement.transformType
    );
    if (authoredOperation === undefined) {
      gaps.push(`${requirement.transformType} is not available to constrained LLM authors.`);
    } else if (authoredOperation.visualMotif !== requirement.motifKind) {
      gaps.push(
        `${authoredOperation.operationId} advertises ${authoredOperation.visualMotif}; ` +
        `expected ${requirement.motifKind}.`
      );
    }
    matches.forEach(({ animation, transformation }) => {
      matchedAnimationIds.add(animation.id);
      transformationCount += 1;
      const semantic = compileKpSemanticEquationTransitionResult({
        transformation,
        bundle: animation.bundle
      });
      if (semantic.status !== "semantic") {
        gaps.push(`${transformation.id} does not compile total semantic token motion.`);
      }
      const diagnosis = diagnoseKpAnimationDesign({
        animation,
        transformationId: transformation.id
      });
      if (diagnosis?.visualStrategy !== "operation-specific") {
        gaps.push(`${transformation.id} is not classified as operation-specific.`);
      }
      if (diagnosis?.motifKind !== requirement.motifKind) {
        gaps.push(
          `${transformation.id} uses ${diagnosis?.motifKind ?? "no motif"}; ` +
          `expected ${requirement.motifKind}.`
        );
      }
      diagnosis?.issues.forEach((issue) =>
        gaps.push(`${transformation.id}: ${issue.code}.`)
      );
    });
  });

  [...matchedAnimationIds].forEach((animationId) => {
    const animation = catalog.find((candidate) => candidate.id === animationId)!;
    if (!checkKpAnimationAssetSeekRewindLaw(animation).passed) {
      gaps.push(`${animation.id} does not satisfy the seek/rewind law.`);
    }
  });

  kpSemanticMotionPromotionFixtures.forEach((fixture) => {
    const cells = promotionMatrix.filter((cell) => cell.fixtureId === fixture.id);
    if (cells.length !== promotionQualityTiers.length * kpBaseGestaltStyleCatalog.size) {
      gaps.push(`${fixture.id} does not cover every quality and Gestalt style.`);
      return;
    }
    if (cells.some((cell) => cell.semanticIdentity.startsWith("missing:"))) {
      gaps.push(`${fixture.id} does not resolve its promoted semantic operation.`);
    }
    if (new Set(cells.map((cell) => cell.semanticIdentity)).size !== 1) {
      gaps.push(`${fixture.id} changes semantic identity across quality or style.`);
    }
    if (cells.some((cell) => !cell.styleCompatible)) {
      gaps.push(`${fixture.id} has an incompatible Gestalt style cell.`);
    }
    if (cells.some((cell) => cell.staticCostStatus !== "accepted")) {
      gaps.push(`${fixture.id} does not have an accepted static-cost realization.`);
    }
  });

  return {
    kind: "semantic-motion-library-promotion-report",
    status: gaps.length === 0 ? "promoted" : "blocked",
    requirementCount: kpSemanticMotionPromotionRequirements.length,
    animationCount: matchedAnimationIds.size,
    transformationCount,
    llmOperationCount: llmCatalog.operations.length,
    matrixCellCount: promotionMatrix.length,
    complexityLevels: [...new Set(promotionMatrix.map((cell) => cell.complexity))],
    qualityTiers: [...promotionQualityTiers],
    gestaltStyleKeys: [...new Set(
      promotionMatrix.map((cell) => cell.gestaltStyleKey)
    )],
    // Runtime instrumentation enforces these zero-tolerance budgets under
    // throttling; the matrix makes them part of catalog promotion policy.
    hotPathLayoutReadBudget: 0,
    surpriseInitialLoadBudget: 0,
    gaps
  };
}

function requirement(
  transformType: string,
  motifKind: EquationVisualMotifKind
): KpSemanticMotionPromotionRequirement {
  return { transformType, motifKind };
}
