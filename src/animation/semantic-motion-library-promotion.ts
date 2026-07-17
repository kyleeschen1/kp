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
  compileKpSemanticEquationTransitionResult
} from "../rendering/semantic-equation-transition-compiler.ts";
import type { EquationVisualMotifKind } from "../rendering/visual-motif.ts";

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
  readonly gaps: readonly string[];
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

export function auditKpSemanticMotionLibraryPromotion(input: {
  readonly catalog?: readonly KpAnimationAsset[] | undefined;
} = {}): KpSemanticMotionLibraryPromotionReport {
  const catalog = input.catalog ?? createKpAnimationAssets();
  const llmCatalog = createKpLlmSemanticMotionOperationCatalog();
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

  return {
    kind: "semantic-motion-library-promotion-report",
    status: gaps.length === 0 ? "promoted" : "blocked",
    requirementCount: kpSemanticMotionPromotionRequirements.length,
    animationCount: matchedAnimationIds.size,
    transformationCount,
    llmOperationCount: llmCatalog.operations.length,
    gaps
  };
}

function requirement(
  transformType: string,
  motifKind: EquationVisualMotifKind
): KpSemanticMotionPromotionRequirement {
  return { transformType, motifKind };
}
