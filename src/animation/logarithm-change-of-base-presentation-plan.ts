import {
  isKpVerifiedLogarithmChangeOfBase,
  kpCanonicalLogarithmChangeOfBase,
  type KpVerifiedLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";
import {
  KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID
} from "./equation-structural-choreography-declarations.ts";
import {
  compileKpFunctionWrapInvocationGroup,
  createKpFunctionWrapInvocationGroupReception,
  kpCanonicalFunctionWrapDeclaration,
  type KpCompiledFunctionWrapInvocationGroup
} from "./function-wrap-invocation.ts";
import type { KpFunctionWrapReceptionPlan } from "./function-wrap-motif.ts";

declare const kpVerifiedLogarithmChangeOfBasePresentationBrand: unique symbol;

export const KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY =
  "recipe.equation.change-logarithm-base.v1" as const;
export const KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY =
  "motif.equation.logarithm-base-handoff.v1" as const;

export interface KpLogarithmChangeOfBasePresentationPlan {
  readonly schemaVersion: "kp.logarithm-change-of-base-presentation-plan.v1";
  readonly id: string;
  readonly semanticContractId: string;
  readonly recipeId: typeof KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY;
  readonly motif: Readonly<{
    id: typeof KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY;
    primitiveAuthorityIds: readonly [
      typeof kpCanonicalFunctionWrapDeclaration.motifId,
      typeof KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID,
      typeof kpCanonicalFunctionWrapDeclaration.rendererCapabilityId
    ];
    rendererPrimitive: "none";
  }>;
  readonly functionWrapInvocationGroup:
    KpCompiledFunctionWrapInvocationGroup;
  readonly forwardReception: KpFunctionWrapReceptionPlan;
  readonly rewindReception: KpFunctionWrapReceptionPlan;
  readonly fractionConstruction: Readonly<{
    authorityId: typeof KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID;
    kind: "native-katex-fraction-construction";
    quotientEntityId: string;
    fractionRuleEntityId: string;
    numeratorEntityIds: readonly string[];
    denominatorEntityIds: readonly string[];
    settlement: "native-target";
  }>;
  readonly identityTransfers: readonly [
    Readonly<{
      correspondenceId: "correspondence.change-of-base.argument";
      destinationRole: "numerator-argument";
      sourceEntityId: string;
      targetEntityId: string;
    }>,
    Readonly<{
      correspondenceId: "correspondence.change-of-base.base";
      destinationRole: "denominator-argument";
      sourceEntityId: string;
      targetEntityId: string;
    }>
  ];
  readonly phaseOrder: readonly [
    "prepare-source-handoff",
    "transfer-identity-material",
    "construct-fraction-structure",
    "receive-natural-log-wrappers",
    "settle-native-target"
  ];
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly [kpVerifiedLogarithmChangeOfBasePresentationBrand]: true;
}

const verifiedPlans = new WeakSet<object>();

/**
 * The caller composes established motif and structural authorities. This seam
 * chooses causal roles but leaves windows, routes, geometry, and paint to the
 * later exemplar profile and the canonical native-KaTeX compositor.
 */
export function compileKpLogarithmChangeOfBasePresentationPlan(
  semantic: KpVerifiedLogarithmChangeOfBase
): KpLogarithmChangeOfBasePresentationPlan {
  if (!isKpVerifiedLogarithmChangeOfBase(semantic)) {
    throw new Error(
      "Change-of-base presentation requires verifier-minted semantic truth."
    );
  }
  const numeratorOpen = `${semantic.target.numerator.applicationEntityId}.open`;
  const numeratorClose =
    `${semantic.target.numerator.applicationEntityId}.close`;
  const denominatorOpen =
    `${semantic.target.denominator.applicationEntityId}.open`;
  const denominatorClose =
    `${semantic.target.denominator.applicationEntityId}.close`;
  const functionWrapInvocationGroup = compileKpFunctionWrapInvocationGroup({
    id: semantic.id,
    branches: [{
      id: "change-of-base.numerator",
      semanticObjectId: semantic.target.numerator.applicationEntityId,
      sourceArgumentEntityIds: [semantic.source.argument.entityId],
      targetArgumentEntityIds: [semantic.target.numerator.argument.entityId],
      functionEntityIds: [semantic.target.numerator.operatorEntityId],
      enclosureEntityRoles: [
        { entityId: numeratorOpen, side: "leading" },
        { entityId: numeratorClose, side: "trailing" }
      ]
    }, {
      id: "change-of-base.denominator",
      semanticObjectId: semantic.target.denominator.applicationEntityId,
      sourceArgumentEntityIds: [semantic.source.base.entityId],
      targetArgumentEntityIds: [semantic.target.denominator.argument.entityId],
      functionEntityIds: [semantic.target.denominator.operatorEntityId],
      enclosureEntityRoles: [
        { entityId: denominatorOpen, side: "leading" },
        { entityId: denominatorClose, side: "trailing" }
      ]
    }]
  });
  const numeratorEntityIds = Object.freeze([
    semantic.target.numerator.applicationEntityId,
    semantic.target.numerator.operatorEntityId,
    numeratorOpen,
    semantic.target.numerator.argument.entityId,
    numeratorClose
  ]);
  const denominatorEntityIds = Object.freeze([
    semantic.target.denominator.applicationEntityId,
    semantic.target.denominator.operatorEntityId,
    denominatorOpen,
    semantic.target.denominator.argument.entityId,
    denominatorClose
  ]);
  const sourceSelectorIds = Object.freeze([
    semantic.source.applicationEntityId,
    semantic.source.operatorEntityId,
    semantic.source.base.entityId,
    semantic.source.argument.entityId
  ]);
  const targetSelectorIds = Object.freeze([
    semantic.target.quotientEntityId,
    semantic.target.divisionEntityId,
    ...numeratorEntityIds,
    ...denominatorEntityIds
  ]);
  requireUnique(sourceSelectorIds, "source selector");
  requireUnique(targetSelectorIds, "target selector");

  const plan = Object.freeze({
    schemaVersion:
      "kp.logarithm-change-of-base-presentation-plan.v1" as const,
    id: `presentation.${semantic.id}`,
    semanticContractId: semantic.id,
    recipeId: KP_LOGARITHM_CHANGE_OF_BASE_RECIPE_AUTHORITY,
    motif: Object.freeze({
      id: KP_LOGARITHM_BASE_HANDOFF_MOTIF_AUTHORITY,
      primitiveAuthorityIds: Object.freeze([
        kpCanonicalFunctionWrapDeclaration.motifId,
        KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID,
        kpCanonicalFunctionWrapDeclaration.rendererCapabilityId
      ] as const),
      rendererPrimitive: "none" as const
    }),
    functionWrapInvocationGroup,
    forwardReception: createKpFunctionWrapInvocationGroupReception({
      group: functionWrapInvocationGroup,
      direction: "forward"
    }),
    rewindReception: createKpFunctionWrapInvocationGroupReception({
      group: functionWrapInvocationGroup,
      direction: "rewind"
    }),
    fractionConstruction: Object.freeze({
      authorityId: KP_EQUATION_FRACTION_MATERIAL_RECIPE_ID,
      kind: "native-katex-fraction-construction" as const,
      quotientEntityId: semantic.target.quotientEntityId,
      fractionRuleEntityId: semantic.target.divisionEntityId,
      numeratorEntityIds,
      denominatorEntityIds,
      settlement: "native-target" as const
    }),
    identityTransfers: Object.freeze([
      Object.freeze({
        correspondenceId:
          "correspondence.change-of-base.argument" as const,
        destinationRole: "numerator-argument" as const,
        sourceEntityId: semantic.source.argument.entityId,
        targetEntityId: semantic.target.numerator.argument.entityId
      }),
      Object.freeze({
        correspondenceId: "correspondence.change-of-base.base" as const,
        destinationRole: "denominator-argument" as const,
        sourceEntityId: semantic.source.base.entityId,
        targetEntityId: semantic.target.denominator.argument.entityId
      })
    ] as const),
    phaseOrder: Object.freeze([
      "prepare-source-handoff",
      "transfer-identity-material",
      "construct-fraction-structure",
      "receive-natural-log-wrappers",
      "settle-native-target"
    ] as const),
    sourceSelectorIds,
    targetSelectorIds
  }) as KpLogarithmChangeOfBasePresentationPlan;
  verifiedPlans.add(plan);
  return plan;
}

export function isKpLogarithmChangeOfBasePresentationPlan(
  value: unknown
): value is KpLogarithmChangeOfBasePresentationPlan {
  return typeof value === "object" && value !== null &&
    verifiedPlans.has(value);
}

export const kpCanonicalLogarithmChangeOfBasePresentationPlan =
  compileKpLogarithmChangeOfBasePresentationPlan(
    kpCanonicalLogarithmChangeOfBase
  );

function requireUnique(values: readonly string[], label: string): void {
  if (values.some((value) => value.trim().length === 0) ||
      new Set(values).size !== values.length) {
    throw new Error(`Change-of-base ${label} ids must be non-empty and unique.`);
  }
}
