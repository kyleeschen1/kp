import type { KpAnimationAsset } from "./asset.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../rendering/equation-visual-motif-defaults.ts";
import type { EquationVisualMotifKind } from "../rendering/visual-motif.ts";

export type KpAnimationDesignDimension =
  | "semantic-correspondence"
  | "object-constancy"
  | "causal-staging"
  | "representation-granularity";

export interface KpAnimationDesignIssue {
  readonly code:
    | "design.correspondence.missing"
    | "design.object-constancy.fade-dominant"
    | "design.motif.generic-replacement"
    | "design.staging.operation-unspecified"
    | "design.representation.granularity-loss";
  readonly severity: "warning" | "error";
  readonly dimension: KpAnimationDesignDimension;
  readonly message: string;
  readonly evidence: string;
  readonly repair: string;
}

export interface KpAnimationDesignDiagnosis {
  readonly kind: "animation-design-diagnosis";
  readonly animationId: string;
  readonly transformationId: string;
  readonly transformType: string;
  readonly visualStrategy:
    | "operation-specific"
    | "lifecycle-generic"
    | "whole-equation-fallback";
  readonly motifKind: EquationVisualMotifKind;
  readonly issues: readonly KpAnimationDesignIssue[];
}

const operationSpecificTransformTypes = new Set([
  "subtractBothSides",
  "addBothSides",
  "cancelAdditiveInverses",
  "simplifyConstantDifference",
  "simplifyConstantSum",
  "divideBothSides",
  "cancelMultiplicativeInverses",
  "simplifyConstantQuotient",
  "splitFractionFactors",
  "mergeFractionCommonFactor",
  "simplifyUnitFractionFactor",
  "lowerExponent",
  "unwrapUnitExponent",
  "wrapFunction",
  "unwrapFunction",
  "rewritePowerAsRoot",
  "distributeMultiplication",
  "factorCommonTerm",
  "multiplyNegativeBothSidesInequality",
  "computeDotProduct",
  "multiplyMatrixVector",
  "multiplyMatrices",
  "applyDerivativePowerRule",
  "derivativePowerRule",
  "applyDerivativeSumRule",
  "applyDerivativePowerRulesToTerms",
  "applyAntiderivativePowerRule",
  "simplifyAntiderivativePowerRule",
  "substituteValue",
  "simplify-additive-identity",
  "simplify-multiplicative-identity"
]);

export function diagnoseKpAnimationDesign(input: {
  readonly animation: KpAnimationAsset;
  readonly transformationId?: string | undefined;
}): KpAnimationDesignDiagnosis | undefined {
  const transformation = input.animation.transformations.find(
    (candidate) => candidate.id === input.transformationId
  ) ?? input.animation.transformations[0];
  if (transformation === undefined) return undefined;

  const motifKind = transformation.transformType === "computeDotProduct"
    ? "dot-product-accumulate"
    : defaultEquationTransformVisualMotifRules.find(
        (rule) => rule.transformationKind === transformation.transformType
      )?.descriptor.kind ?? "artifact-replace";
  const operationSpecific = operationSpecificTransformTypes.has(
    transformation.transformType
  );
  const correspondence = transformation.correspondenceMap;
  const issues: KpAnimationDesignIssue[] = [];

  if (correspondence === undefined) {
    issues.push(
      {
        code: "design.correspondence.missing",
        severity: "error",
        dimension: "semantic-correspondence",
        message:
          "The transition has no selector-level account of what persists, changes role, appears, or disappears.",
        evidence: `${transformation.id} has no correspondence map.`,
        repair:
          "Bind every visible source and target role through identity, role-change, split, merge, introduction, or elimination relations."
      },
      {
        code: "design.object-constancy.fade-dominant",
        severity: "error",
        dimension: "object-constancy",
        message:
          "The viewer sees an old expression leave and a new expression arrive instead of seeing mathematical parts transform.",
        evidence:
          "Without selector correspondence, the editor must use whole-equation layer motion.",
        repair:
          "Assign stable visual owners to continuants and explicit lineage to derived, copied, merged, or eliminated parts."
      }
    );
  }

  if (motifKind === "artifact-replace") {
    issues.push({
      code: "design.motif.generic-replacement",
      severity: correspondence === undefined ? "error" : "warning",
      dimension: "causal-staging",
      message:
        "The visual motif says only “replace,” so it does not explain the operation’s causal mechanism.",
      evidence:
        `${transformation.transformType} resolves to the generic artifact-replace motif.`,
      repair:
        "Compile an operation-specific motif whose preview, reflow, act, settlement, and release phases express the transformation."
    });
  }

  if (!operationSpecific) {
    issues.push({
      code: "design.staging.operation-unspecified",
      severity: "warning",
      dimension: "causal-staging",
      message:
        "The runtime has no operation-specific choreography for this transformation.",
      evidence:
        `${transformation.transformType} is not routed through a specialized choreography sampler.`,
      repair:
        "Define the operation’s attention anchor, invariant reflow, causal action, recognition checkpoint, and rewind story."
    });
  }

  const targetSelectorKind = (selectorId: string): string | undefined =>
    input.animation.bundle.objects
      .flatMap((object) => object.selectors)
      .find((selector) => selector.id === selectorId)?.kind;
  const explicitIntermediateRepresentations = new Set(
    input.animation.bundle.objects.flatMap((object) => {
      if (typeof object.value !== "object" || object.value === null) return [];
      const representation = (object.value as Record<string, unknown>)["representation"];
      return typeof representation === "string" ? [representation] : [];
    })
  );
  const dotProductIntermediatesComplete =
    explicitIntermediateRepresentations.has("dot-product-product") &&
    explicitIntermediateRepresentations.has("dot-product-partial-sum");
  const lossyRecord = correspondence?.records.find((record) =>
    record.sourceSelectorIds.length >= 3 &&
    record.targetSelectorIds.length === 1 &&
    (
      (
        transformation.transformType === "computeDotProduct" &&
        !dotProductIntermediatesComplete
      ) ||
      targetSelectorKind(record.targetSelectorIds[0]!) === "operator"
    )
  );
  if (lossyRecord !== undefined) {
    issues.push({
      code: "design.representation.granularity-loss",
      severity: "warning",
      dimension: "representation-granularity",
      message:
        "Several meaningful source parts collapse into one monolithic target role, leaving the renderer to invent their visual correspondence.",
      evidence:
        `${lossyRecord.id} maps ${lossyRecord.sourceSelectorIds.length} source roles to one target role.`,
      repair:
        "Expose target fragments at comparable granularity, then declare which source part becomes each target fragment and which parts intentionally disappear."
    });
  }

  return {
    kind: "animation-design-diagnosis",
    animationId: input.animation.id,
    transformationId: transformation.id,
    transformType: transformation.transformType,
    visualStrategy: correspondence === undefined
      ? "whole-equation-fallback"
      : operationSpecific
        ? "operation-specific"
        : "lifecycle-generic",
    motifKind,
    issues
  };
}

export function kpAnimationDesignIssueStatement(
  issue: KpAnimationDesignIssue
): string {
  return `${issue.message} Evidence: ${issue.evidence} Repair: ${issue.repair}`;
}
