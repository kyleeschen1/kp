import {
  isKpVerifiedFractionEquivalence,
  kpCanonicalFractionEquivalence,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import {
  KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
} from "./equation-structural-choreography-declarations.ts";

declare const kpVerifiedFractionEquivalencePresentationBrand: unique symbol;

export const KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY =
  "recipe.equation.fraction-equivalence.v1" as const;
export const KP_FRACTION_EQUIVALENCE_FACTOR_COPY_MOTIF_AUTHORITY =
  "motif.equation.fraction-equivalence-factor-copy.v1" as const;

export interface KpFractionEquivalencePresentationPlan {
  readonly schemaVersion: "kp.fraction-equivalence-presentation-plan.v1";
  readonly id: string;
  readonly semanticContractId: string;
  readonly recipeId:
    typeof KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY;
  readonly motif: Readonly<{
    readonly id:
      typeof KP_FRACTION_EQUIVALENCE_FACTOR_COPY_MOTIF_AUTHORITY;
    readonly primitiveAuthorityIds: readonly [
      "kp.core.persist",
      "kp.core.fan-out",
      typeof KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
    ];
    readonly rendererPrimitive: "none";
  }>;
  readonly structureContinuity: Readonly<{
    readonly kind: "stable-native-fraction-structure";
    readonly sourceFractionEntityId: string;
    readonly targetFractionEntityId: string;
    readonly sourceDivisionEntityId: string;
    readonly targetDivisionEntityId: string;
    readonly settlement: "native-target";
  }>;
  readonly operandTransfers: readonly [
    Readonly<{
      readonly correspondenceId:
        "correspondence.fraction-equivalence.numerator";
      readonly role: "numerator-source";
      readonly sourceEntityId: string;
      readonly targetEntityId: string;
      readonly relation: "identity";
    }>,
    Readonly<{
      readonly correspondenceId:
        "correspondence.fraction-equivalence.denominator";
      readonly role: "denominator-source";
      readonly sourceEntityId: string;
      readonly targetEntityId: string;
      readonly relation: "identity";
    }>
  ];
  readonly factorTransfer: Readonly<{
    readonly correspondenceId:
      "correspondence.fraction-equivalence.factor";
    readonly relation: "copy";
    readonly sourceEntityId: string;
    readonly targetEntityIds: readonly [string, string];
    readonly targetRoles: readonly [
      "numerator-factor",
      "denominator-factor"
    ];
    readonly synchronization: "together";
  }>;
  readonly targetProducts: Readonly<{
    readonly correspondenceId:
      "correspondence.fraction-equivalence.products";
    readonly numeratorProductEntityId: string;
    readonly denominatorProductEntityId: string;
    readonly cohesion: "join-after-material-arrival";
  }>;
  readonly phaseOrder: readonly [
    "hold-source-structure",
    "introduce-shared-factor",
    "copy-factor-to-both-branches",
    "join-target-products",
    "settle-native-target"
  ];
  readonly sourceSelectorIds: readonly string[];
  readonly operationMaterialSelectorIds: readonly [string];
  readonly targetSelectorIds: readonly string[];
  readonly [kpVerifiedFractionEquivalencePresentationBrand]: true;
}

const verifiedPlans = new WeakSet<object>();

/**
 * This plan fixes causal identity and phase order only. The exemplar owns the
 * provisional route, timing, geometry, and paint until human review.
 */
export function compileKpFractionEquivalencePresentationPlan(
  semantic: KpVerifiedFractionEquivalence
): KpFractionEquivalencePresentationPlan {
  if (!isKpVerifiedFractionEquivalence(semantic)) {
    throw new Error(
      "Fraction-equivalence presentation requires verifier-minted semantic truth."
    );
  }
  const sourceSelectorIds = Object.freeze([
    semantic.source.fractionEntityId,
    semantic.source.divisionEntityId,
    semantic.source.numerator.entityId,
    semantic.source.denominator.entityId
  ]);
  const operationMaterialSelectorIds = Object.freeze([
    semantic.factor.entityId
  ] as const);
  const targetSelectorIds = Object.freeze([
    semantic.target.fractionEntityId,
    semantic.target.divisionEntityId,
    semantic.target.numeratorProductEntityId,
    semantic.target.denominatorProductEntityId,
    semantic.target.numeratorSourceOccurrenceEntityId,
    semantic.target.numeratorFactorOccurrenceEntityId,
    semantic.target.denominatorSourceOccurrenceEntityId,
    semantic.target.denominatorFactorOccurrenceEntityId
  ]);
  requireUnique(sourceSelectorIds, "source selector");
  requireUnique(operationMaterialSelectorIds, "operation material selector");
  requireUnique(targetSelectorIds, "target selector");

  const plan = deepFreeze({
    schemaVersion: "kp.fraction-equivalence-presentation-plan.v1" as const,
    id: `presentation.${semantic.id}`,
    semanticContractId: semantic.id,
    recipeId: KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY,
    motif: {
      id: KP_FRACTION_EQUIVALENCE_FACTOR_COPY_MOTIF_AUTHORITY,
      primitiveAuthorityIds: [
        "kp.core.persist",
        "kp.core.fan-out",
        KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
      ] as const,
      rendererPrimitive: "none" as const
    },
    structureContinuity: {
      kind: "stable-native-fraction-structure" as const,
      sourceFractionEntityId: semantic.source.fractionEntityId,
      targetFractionEntityId: semantic.target.fractionEntityId,
      sourceDivisionEntityId: semantic.source.divisionEntityId,
      targetDivisionEntityId: semantic.target.divisionEntityId,
      settlement: "native-target" as const
    },
    operandTransfers: [{
      correspondenceId:
        "correspondence.fraction-equivalence.numerator" as const,
      role: "numerator-source" as const,
      sourceEntityId: semantic.source.numerator.entityId,
      targetEntityId: semantic.target.numeratorSourceOccurrenceEntityId,
      relation: "identity" as const
    }, {
      correspondenceId:
        "correspondence.fraction-equivalence.denominator" as const,
      role: "denominator-source" as const,
      sourceEntityId: semantic.source.denominator.entityId,
      targetEntityId: semantic.target.denominatorSourceOccurrenceEntityId,
      relation: "identity" as const
    }] as const,
    factorTransfer: {
      correspondenceId:
        "correspondence.fraction-equivalence.factor" as const,
      relation: "copy" as const,
      sourceEntityId: semantic.factor.entityId,
      targetEntityIds: [
        semantic.target.numeratorFactorOccurrenceEntityId,
        semantic.target.denominatorFactorOccurrenceEntityId
      ] as const,
      targetRoles: ["numerator-factor", "denominator-factor"] as const,
      synchronization: "together" as const
    },
    targetProducts: {
      correspondenceId:
        "correspondence.fraction-equivalence.products" as const,
      numeratorProductEntityId: semantic.target.numeratorProductEntityId,
      denominatorProductEntityId: semantic.target.denominatorProductEntityId,
      cohesion: "join-after-material-arrival" as const
    },
    phaseOrder: [
      "hold-source-structure",
      "introduce-shared-factor",
      "copy-factor-to-both-branches",
      "join-target-products",
      "settle-native-target"
    ] as const,
    sourceSelectorIds,
    operationMaterialSelectorIds,
    targetSelectorIds
  }) as KpFractionEquivalencePresentationPlan;
  verifiedPlans.add(plan);
  return plan;
}

export function isKpFractionEquivalencePresentationPlan(
  value: unknown
): value is KpFractionEquivalencePresentationPlan {
  return typeof value === "object" && value !== null &&
    verifiedPlans.has(value);
}

export const kpCanonicalFractionEquivalencePresentationPlan =
  compileKpFractionEquivalencePresentationPlan(kpCanonicalFractionEquivalence);

function requireUnique(values: readonly string[], label: string): void {
  if (values.some((value) => value.trim().length === 0) ||
      new Set(values).size !== values.length) {
    throw new Error(
      `Fraction-equivalence ${label} ids must be non-empty and unique.`
    );
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
