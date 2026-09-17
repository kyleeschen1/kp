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
export const KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY =
  "motif.equation.fraction-equivalence-unit-factor-join.v1" as const;
export const KP_FRACTION_EQUIVALENCE_PAIRED_APPLICATION_MOTIF_AUTHORITY =
  "motif.equation.fraction-equivalence-paired-application.v1" as const;

export type KpFractionEquivalencePresentationMode =
  | "explain-unit-factor"
  | "compact-paired-operation";

export const kpFractionEquivalencePresentationOccurrenceIds = Object.freeze({
  unitFactorNumerator:
    "presentation.fraction-equivalence.unit-factor.numerator",
  unitFactorDenominator:
    "presentation.fraction-equivalence.unit-factor.denominator",
  unitFactorDivision:
    "presentation.fraction-equivalence.unit-factor.division",
  pairedOperationNumerator:
    "presentation.fraction-equivalence.paired-operation.numerator",
  pairedOperationDenominator:
    "presentation.fraction-equivalence.paired-operation.denominator"
} as const);

export type KpFractionEquivalenceFactorTransfer =
  | Readonly<{
      readonly kind: "paired-unit-factor-transfer";
      readonly correspondenceId:
        "correspondence.fraction-equivalence.factor";
      readonly relation: "paired-occurrences";
      readonly sourceSemanticEntityId: string;
      readonly sourceOccurrenceEntityIds: readonly [string, string];
      readonly targetEntityIds: readonly [string, string];
      readonly targetRoles: readonly [
        "numerator-factor",
        "denominator-factor"
      ];
      readonly synchronization: "together";
    }>
  | Readonly<{
      readonly kind: "paired-operation-transfer";
      readonly correspondenceId:
        "correspondence.fraction-equivalence.factor";
      readonly relation: "paired-occurrences";
      readonly sourceSemanticEntityId: string;
      readonly sourceOccurrenceEntityIds: readonly [string, string];
      readonly targetEntityIds: readonly [string, string];
      readonly targetRoles: readonly [
        "numerator-factor",
        "denominator-factor"
      ];
      readonly synchronization: "together";
    }>;

export type KpFractionEquivalenceDivisionTransfer =
  | Readonly<{
      readonly kind: "fraction-bar-fusion";
      readonly correspondenceId:
        "correspondence.fraction-equivalence.division";
      readonly relation: "many-to-one";
      readonly sourceDivisionEntityIds: readonly [string, string];
      readonly targetDivisionEntityIds: readonly [string];
    }>
  | Readonly<{
      readonly kind: "fraction-bar-persistence";
      readonly correspondenceId:
        "correspondence.fraction-equivalence.division";
      readonly relation: "one-to-one";
      readonly sourceDivisionEntityIds: readonly [string];
      readonly targetDivisionEntityIds: readonly [string];
    }>;

export type KpFractionEquivalenceProductNotation =
  | "implicit-juxtaposition"
  | "explicit-multiplication";

export interface KpFractionEquivalencePresentationPlan {
  readonly schemaVersion: "kp.fraction-equivalence-presentation-plan.v1";
  readonly id: string;
  readonly semanticContractId: string;
  readonly mode: KpFractionEquivalencePresentationMode;
  readonly recipeId:
    typeof KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY;
  readonly motif: Readonly<{
    readonly id:
      | typeof KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY
      | typeof KP_FRACTION_EQUIVALENCE_PAIRED_APPLICATION_MOTIF_AUTHORITY;
    readonly primitiveAuthorityIds: readonly [
      "kp.core.persist",
      "kp.core.introduce",
      typeof KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
    ];
    readonly rendererPrimitive: "none";
  }>;
  readonly structureContinuity: Readonly<{
    readonly kind: "native-fraction-structure";
    readonly sourceFractionEntityId: string;
    readonly targetFractionEntityId: string;
    readonly divisionTransfer: KpFractionEquivalenceDivisionTransfer;
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
  readonly factorTransfer: KpFractionEquivalenceFactorTransfer;
  readonly targetProducts: Readonly<{
    readonly correspondenceId:
      "correspondence.fraction-equivalence.products";
    readonly numeratorProductEntityId: string;
    readonly denominatorProductEntityId: string;
    readonly cohesion: "join-after-material-arrival";
    readonly notation: Readonly<{
      readonly factorOrder: "factor-then-source";
      readonly numerator: KpFractionEquivalenceProductNotation;
      readonly denominator: KpFractionEquivalenceProductNotation;
      readonly evaluation: "preserve-unevaluated-product";
    }>;
  }>;
  readonly joinCohort: Readonly<{
    readonly id: "cohort.fraction-equivalence.material-join";
    readonly memberRoles: readonly [
      "factor-transfer",
      "operand-transfer",
      "division-transfer"
    ];
    readonly arrival: "simultaneous";
  }>;
  readonly phaseOrder: readonly string[];
  readonly sourceSelectorIds: readonly string[];
  readonly operationMaterialSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly [kpVerifiedFractionEquivalencePresentationBrand]: true;
}

const verifiedPlans = new WeakSet<object>();

/**
 * The semantic law is shared, while the mode chooses how much of its reason
 * becomes learner-visible. Geometry, timing, and paint remain exemplar-owned.
 */
export function compileKpFractionEquivalencePresentationPlan(
  semantic: KpVerifiedFractionEquivalence,
  options: Readonly<{
    readonly mode?: KpFractionEquivalencePresentationMode | undefined;
  }> = {}
): KpFractionEquivalencePresentationPlan {
  if (!isKpVerifiedFractionEquivalence(semantic)) {
    throw new Error(
      "Fraction-equivalence presentation requires verifier-minted semantic truth."
    );
  }
  // Material occurrences belong to the checked operation instance. Two
  // fractions may introduce unit factors in the same native equation.
  const occurrenceId = (id: string) => semantic === kpCanonicalFractionEquivalence ? id : `${semantic.id}.${id}`;
  const mode = options.mode ?? "explain-unit-factor";
  const sourceSelectorIds = Object.freeze([
    semantic.source.fractionEntityId,
    semantic.source.divisionEntityId,
    semantic.source.numerator.entityId,
    semantic.source.denominator.entityId
  ]);
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
  const targetFactorIds = [
    semantic.target.numeratorFactorOccurrenceEntityId,
    semantic.target.denominatorFactorOccurrenceEntityId
  ] as const;
  const targetRoles = [
    "numerator-factor",
    "denominator-factor"
  ] as const;
  const explanatory = mode === "explain-unit-factor";
  const operationMaterialSelectorIds = explanatory
    ? Object.freeze([
        semantic.factor.entityId,
        occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorNumerator),
        occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorDenominator),
        occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorDivision)
      ])
    : Object.freeze([
        semantic.factor.entityId,
        occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.pairedOperationNumerator),
        occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.pairedOperationDenominator)
      ]);
  requireUnique(sourceSelectorIds, "source selector");
  requireUnique(operationMaterialSelectorIds, "operation material selector");
  requireUnique(targetSelectorIds, "target selector");

  const factorTransfer: KpFractionEquivalenceFactorTransfer = explanatory
    ? {
        kind: "paired-unit-factor-transfer",
        correspondenceId: "correspondence.fraction-equivalence.factor",
        relation: "paired-occurrences",
        sourceSemanticEntityId: semantic.factor.entityId,
        sourceOccurrenceEntityIds: [
          occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorNumerator),
          occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorDenominator)
        ],
        targetEntityIds: targetFactorIds,
        targetRoles,
        synchronization: "together"
      }
    : {
        kind: "paired-operation-transfer",
        correspondenceId: "correspondence.fraction-equivalence.factor",
        relation: "paired-occurrences",
        sourceSemanticEntityId: semantic.factor.entityId,
        sourceOccurrenceEntityIds: [
          occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.pairedOperationNumerator),
          occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.pairedOperationDenominator)
        ],
        targetEntityIds: targetFactorIds,
        targetRoles,
        synchronization: "together"
      };
  const divisionTransfer: KpFractionEquivalenceDivisionTransfer = explanatory
    ? {
        kind: "fraction-bar-fusion",
        correspondenceId:
          "correspondence.fraction-equivalence.division",
        relation: "many-to-one",
        sourceDivisionEntityIds: [
          occurrenceId(kpFractionEquivalencePresentationOccurrenceIds.unitFactorDivision),
          semantic.source.divisionEntityId
        ],
        targetDivisionEntityIds: [semantic.target.divisionEntityId]
      }
    : {
        kind: "fraction-bar-persistence",
        correspondenceId:
          "correspondence.fraction-equivalence.division",
        relation: "one-to-one",
        sourceDivisionEntityIds: [semantic.source.divisionEntityId],
        targetDivisionEntityIds: [semantic.target.divisionEntityId]
      };
  const plan = deepFreeze({
    schemaVersion: "kp.fraction-equivalence-presentation-plan.v1" as const,
    id: `presentation.${semantic.id}.${mode}`,
    semanticContractId: semantic.id,
    mode,
    recipeId: KP_FRACTION_EQUIVALENCE_PRESENTATION_RECIPE_AUTHORITY,
    motif: {
      id: explanatory
        ? KP_FRACTION_EQUIVALENCE_UNIT_FACTOR_JOIN_MOTIF_AUTHORITY
        : KP_FRACTION_EQUIVALENCE_PAIRED_APPLICATION_MOTIF_AUTHORITY,
      primitiveAuthorityIds: [
        "kp.core.persist",
        "kp.core.introduce",
        KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
      ] as const,
      rendererPrimitive: "none" as const
    },
    structureContinuity: {
      kind: "native-fraction-structure" as const,
      sourceFractionEntityId: semantic.source.fractionEntityId,
      targetFractionEntityId: semantic.target.fractionEntityId,
      divisionTransfer,
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
    factorTransfer,
    targetProducts: {
      correspondenceId:
        "correspondence.fraction-equivalence.products" as const,
      numeratorProductEntityId: semantic.target.numeratorProductEntityId,
      denominatorProductEntityId: semantic.target.denominatorProductEntityId,
      cohesion: "join-after-material-arrival" as const,
      notation: {
        factorOrder: "factor-then-source" as const,
        numerator: productNotationFor(
          semantic.factor,
          semantic.source.numerator
        ),
        denominator: productNotationFor(
          semantic.factor,
          semantic.source.denominator
        ),
        // Arithmetic evaluation is a separate semantic operation; notation
        // must not silently turn two numeric operands into a new value.
        evaluation: "preserve-unevaluated-product" as const
      }
    },
    joinCohort: {
      id: "cohort.fraction-equivalence.material-join" as const,
      memberRoles: [
        "factor-transfer",
        "operand-transfer",
        "division-transfer"
      ] as const,
      arrival: "simultaneous" as const
    },
    phaseOrder: explanatory
      ? [
          "hold-source-structure",
          "introduce-unit-factor",
          "join-unit-factor-with-fraction",
          "join-target-products",
          "settle-native-target"
        ] as const
      : [
          "hold-source-structure",
          "introduce-paired-branch-factors",
          "join-target-products",
          "settle-native-target"
        ] as const,
    sourceSelectorIds,
    operationMaterialSelectorIds,
    targetSelectorIds
  }) as unknown as KpFractionEquivalencePresentationPlan;
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
  compileKpFractionEquivalencePresentationPlan(
    kpCanonicalFractionEquivalence,
    { mode: "explain-unit-factor" }
  );

export const kpCanonicalCompactFractionEquivalencePresentationPlan =
  compileKpFractionEquivalencePresentationPlan(
    kpCanonicalFractionEquivalence,
    { mode: "compact-paired-operation" }
  );

function productNotationFor(
  _factor: KpVerifiedFractionEquivalence["factor"],
  source: KpVerifiedFractionEquivalence["source"]["numerator"]
): KpFractionEquivalenceProductNotation {
  return source.kind === "number"
    ? "explicit-multiplication"
    : "implicit-juxtaposition";
}

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
