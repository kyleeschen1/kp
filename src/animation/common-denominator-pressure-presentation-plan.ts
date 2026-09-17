import {
  compileKpFractionEquivalencePresentationPlan,
  type KpFractionEquivalencePresentationPlan
} from "./fraction-equivalence-presentation-plan.ts";
import {
  compileKpRegisteredSuccessorSynthesisPresentation,
  type KpRegisteredSuccessorSynthesisBinding
} from "./successor-synthesis-presentation-plan.ts";
import type {
  KpSuccessorSynthesisBinding,
  KpSuccessorSynthesisSourceAnnotation,
  KpSuccessorSynthesisTargetAnnotation
} from "./successor-synthesis.ts";
import {
  isKpVerifiedCommonDenominatorAlignment,
  kpCanonicalCommonDenominatorAlignment,
  type KpVerifiedCommonDenominatorAlignment
} from "../semantic/fraction-common-denominator.ts";
import {
  verifyKpFractionEquivalence,
  type KpVerifiedFractionEquivalence
} from "../semantic/fraction-equivalence.ts";

declare const kpCommonDenominatorPressureEquivalencePlanBrand: unique symbol;
declare const kpCommonDenominatorPressurePresentationPlanBrand: unique symbol;

export type KpCommonDenominatorPressureContextRole =
  | "addition-operator"
  | "untouched-term"
  | "untouched-fraction"
  | "untouched-division"
  | "untouched-numerator"
  | "untouched-denominator";

export interface KpCommonDenominatorPressureContextTransfer {
  readonly role: KpCommonDenominatorPressureContextRole;
  readonly relation: "identity";
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
}

export interface KpCommonDenominatorPressureEquivalencePlan {
  readonly schemaVersion:
    "kp.common-denominator-pressure-equivalence-plan.v1";
  readonly id: string;
  readonly semanticContractId: string;
  readonly focus: Readonly<{
    readonly position: "first-term";
    readonly sourceTermEntityId: string;
    readonly targetTermEntityId: string;
    readonly semantic: KpVerifiedFractionEquivalence;
    readonly presentation: KpFractionEquivalencePresentationPlan;
  }>;
  readonly contextTransfers:
    readonly KpCommonDenominatorPressureContextTransfer[];
  readonly approvedOperationOrder:
    readonly ["kp.algebra.align-common-denominator"];
  readonly newMotifIds: readonly [];
  readonly [kpCommonDenominatorPressureEquivalencePlanBrand]: true;
}

export type KpCommonDenominatorPressureEndpointKind =
  | "problem"
  | "equivalence-source"
  | "product"
  | "evaluated";

export interface KpCommonDenominatorPressureEndpoint {
  readonly kind: KpCommonDenominatorPressureEndpointKind;
  readonly stateId: string;
  readonly latex: string;
}

export interface KpCommonDenominatorPressurePresentationPlan {
  readonly values: Readonly<{
    firstNumerator: string; firstDenominator: string;
    secondNumerator: string; secondDenominator: string;
    targetNumerator: string; targetDenominator: string; factor: string;
  }>;
  readonly schemaVersion:
    "kp.common-denominator-pressure-presentation-plan.v1";
  readonly id: string;
  readonly equivalence: KpCommonDenominatorPressureEquivalencePlan;
  readonly evaluation: Readonly<{
    readonly transformationId: string;
    readonly transformationKind: "simplifyConstantProduct";
    readonly fromStateId: string;
    readonly toStateId: string;
    readonly synchronization: "together";
    readonly bindings: readonly [
      KpRegisteredSuccessorSynthesisBinding,
      KpRegisteredSuccessorSynthesisBinding
    ];
    readonly persistentEntityIds: readonly string[];
  }>;
  readonly endpoints: readonly [
    KpCommonDenominatorPressureEndpoint,
    KpCommonDenominatorPressureEndpoint,
    KpCommonDenominatorPressureEndpoint,
    KpCommonDenominatorPressureEndpoint
  ];
  readonly stepOrder: readonly [
    "stage-unit-factor",
    "join-equivalent-fraction",
    "evaluate-products"
  ];
  readonly approvedOperationOrder: readonly [
    "kp.algebra.align-common-denominator",
    "kp.algebra.simplify-constant-product"
  ];
  readonly newMotifIds: readonly [];
  readonly [kpCommonDenominatorPressurePresentationPlanBrand]: true;
}

const verifiedPlans = new WeakSet<object>();
const verifiedComposedPlans = new WeakSet<object>();

/**
 * This plan is a contextual projection, not a second fraction animation. It
 * applies the approved unit-factor join to one term and makes every untouched
 * expression occurrence explicit so the host cannot repaint the whole sum.
 */
export function compileKpCommonDenominatorPressureEquivalencePlan(
  alignment: KpVerifiedCommonDenominatorAlignment
): KpCommonDenominatorPressureEquivalencePlan {
  if (!isKpVerifiedCommonDenominatorAlignment(alignment)) {
    throw new TypeError(
      "Pressure presentation requires verified common-denominator authority."
    );
  }
  if (alignment.equivalenceMultipliers[0].numerator <= 1n ||
      alignment.equivalenceMultipliers[1].numerator !== 1n ||
      alignment.equivalenceMultipliers[1].denominator !== 1n) {
    throw new TypeError("Pressure presentation requires first-term scaling and an unchanged second term.");
  }
  const sourceTerm = alignment.source.terms[0];
  const targetTerm = alignment.target.terms[0];
  const factor = alignment.equivalenceMultipliers[0];
  if (factor.numerator !== factor.denominator) {
    throw new Error(
      "The approved fraction-equivalence motif requires one unit factor."
    );
  }
  const sourceNumerator = safeNumber(
    sourceTerm.numerator.value,
    "source numerator"
  );
  const sourceDenominator = safeNumber(
    sourceTerm.denominator.value,
    "source denominator"
  );
  const scaleFactor = safeNumber(factor.numerator, "scale factor");
  const localPrefix = `${alignment.id}.pressure.first-term`;
  const semantic = verifyKpFractionEquivalence({
    schemaVersion: "kp.fraction-equivalence.v1",
    id: `${localPrefix}.equivalence`,
    operationAuthority: "operation.equation.fraction-equivalence.v1",
    lawAuthority: {
      id: "law.fraction.scale-by-nonzero-unity",
      authorityRefId: alignment.lawAuthority.authorityRefId,
      level: "strict"
    },
    source: {
      stateId: `${localPrefix}.source`,
      fractionEntityId: sourceTerm.fractionEntityId,
      divisionEntityId: sourceTerm.divisionEntityId,
      numerator: {
        kind: "number",
        entityId: sourceTerm.numerator.entityId,
        semanticId: sourceTerm.numerator.semanticId,
        value: sourceNumerator
      },
      denominator: {
        kind: "number",
        entityId: sourceTerm.denominator.entityId,
        semanticId: sourceTerm.denominator.semanticId,
        value: sourceDenominator
      }
    },
    factor: {
      kind: "number",
      entityId: factor.entityId,
      semanticId: factor.semanticId,
      value: scaleFactor
    },
    target: {
      stateId: `${localPrefix}.product`,
      fractionEntityId: targetTerm.fractionEntityId,
      divisionEntityId: targetTerm.divisionEntityId,
      numeratorProductEntityId: `${localPrefix}.numerator-product`,
      denominatorProductEntityId: `${localPrefix}.denominator-product`,
      numeratorSourceOccurrenceEntityId:
        `${localPrefix}.numerator-source-occurrence`,
      numeratorFactorOccurrenceEntityId:
        `${localPrefix}.numerator-factor-occurrence`,
      denominatorSourceOccurrenceEntityId:
        `${localPrefix}.denominator-source-occurrence`,
      denominatorFactorOccurrenceEntityId:
        `${localPrefix}.denominator-factor-occurrence`
    },
    nonzeroEvidence: {
      sourceDenominatorNonzeroEvidenceId:
        `${localPrefix}.evidence.source-denominator-nonzero`,
      scaleFactorNonzeroEvidenceId:
        `${localPrefix}.evidence.scale-factor-nonzero`
    }
  });
  const contextTransfers = createContextTransfers(alignment);
  const plan = deepFreeze({
    schemaVersion:
      "kp.common-denominator-pressure-equivalence-plan.v1" as const,
    id: `presentation.${alignment.id}.pressure-equivalence`,
    semanticContractId: alignment.id,
    focus: {
      position: "first-term" as const,
      sourceTermEntityId: sourceTerm.termEntityId,
      targetTermEntityId: targetTerm.termEntityId,
      semantic,
      presentation: compileKpFractionEquivalencePresentationPlan(
        semantic,
        { mode: "explain-unit-factor" }
      )
    },
    contextTransfers,
    approvedOperationOrder: [
      "kp.algebra.align-common-denominator"
    ] as const,
    newMotifIds: [] as const
  }) as KpCommonDenominatorPressureEquivalencePlan;
  verifiedPlans.add(plan);
  return plan;
}

export function isKpCommonDenominatorPressureEquivalencePlan(
  value: unknown
): value is KpCommonDenominatorPressureEquivalencePlan {
  return typeof value === "object" && value !== null &&
    verifiedPlans.has(value);
}

export const kpCanonicalCommonDenominatorPressureEquivalencePlan =
  compileKpCommonDenominatorPressureEquivalencePlan(
    kpCanonicalCommonDenominatorAlignment
  );

export function compileKpCommonDenominatorPressurePresentationPlan(
  alignment: KpVerifiedCommonDenominatorAlignment
): KpCommonDenominatorPressurePresentationPlan {
  const equivalence = compileKpCommonDenominatorPressureEquivalencePlan(
    alignment
  );
  const local = equivalence.focus.semantic;
  const evaluatedStateId = `${alignment.target.stateId}.evaluated-products`;
  const numerator = compileEvaluationBinding({
    id: `${alignment.id}.pressure.evaluate-numerator`,
    materialSelectorIds: [
      local.target.numeratorFactorOccurrenceEntityId,
      local.target.numeratorSourceOccurrenceEntityId
    ],
    catalystSelectorId: `${local.target.numeratorProductEntityId}.operator`,
    targetSelectorId: alignment.target.terms[0].numerator.entityId
  });
  const denominator = compileEvaluationBinding({
    id: `${alignment.id}.pressure.evaluate-denominator`,
    materialSelectorIds: [
      local.target.denominatorFactorOccurrenceEntityId,
      local.target.denominatorSourceOccurrenceEntityId
    ],
    catalystSelectorId: `${local.target.denominatorProductEntityId}.operator`,
    targetSelectorId: alignment.target.terms[0].denominator.entityId
  });
  const persistentEntityIds = Object.freeze([
    alignment.target.operatorEntityId,
    alignment.target.terms[0].divisionEntityId,
    alignment.target.terms[1].termEntityId,
    alignment.target.terms[1].fractionEntityId,
    alignment.target.terms[1].divisionEntityId,
    alignment.target.terms[1].numerator.entityId,
    alignment.target.terms[1].denominator.entityId
  ]);
  const first = alignment.source.terms[0];
  const second = alignment.source.terms[1];
  const factor = alignment.equivalenceMultipliers[0].numerator;
  const contextLatex = `+\\frac{${second.numerator.value}}{${second.denominator.value}}`;
  const endpoints = Object.freeze([
    endpoint("problem", alignment.source.stateId,
      `\\frac{${first.numerator.value}}{${first.denominator.value}}${contextLatex}`),
    endpoint("equivalence-source", local.source.stateId,
      `\\frac{${factor}}{${factor}}\\cdot\\frac{${first.numerator.value}}{${first.denominator.value}}${contextLatex}`),
    endpoint("product", local.target.stateId,
      `\\frac{${factor}\\cdot${first.numerator.value}}{${factor}\\cdot${first.denominator.value}}${contextLatex}`),
    endpoint("evaluated", evaluatedStateId,
      `\\frac{${alignment.target.terms[0].numerator.value}}{${alignment.target.terms[0].denominator.value}}${contextLatex}`)
  ] as const);
  const plan = deepFreeze({
    schemaVersion:
      "kp.common-denominator-pressure-presentation-plan.v1" as const,
    id: `presentation.${alignment.id}.pressure`,
    values: {
      firstNumerator: String(first.numerator.value), firstDenominator: String(first.denominator.value),
      secondNumerator: String(second.numerator.value), secondDenominator: String(second.denominator.value),
      targetNumerator: String(alignment.target.terms[0].numerator.value),
      targetDenominator: String(alignment.target.terms[0].denominator.value), factor: String(factor)
    },
    equivalence,
    evaluation: {
      transformationId: `${alignment.id}.pressure.evaluate-products`,
      transformationKind: "simplifyConstantProduct" as const,
      fromStateId: local.target.stateId,
      toStateId: evaluatedStateId,
      synchronization: "together" as const,
      bindings: [numerator, denominator] as const,
      persistentEntityIds
    },
    endpoints,
    stepOrder: [
      "stage-unit-factor",
      "join-equivalent-fraction",
      "evaluate-products"
    ] as const,
    approvedOperationOrder: [
      "kp.algebra.align-common-denominator",
      "kp.algebra.simplify-constant-product"
    ] as const,
    newMotifIds: [] as const
  }) as KpCommonDenominatorPressurePresentationPlan;
  verifiedComposedPlans.add(plan);
  return plan;
}

export function isKpCommonDenominatorPressurePresentationPlan(
  value: unknown
): value is KpCommonDenominatorPressurePresentationPlan {
  return typeof value === "object" && value !== null &&
    verifiedComposedPlans.has(value);
}

export const kpCanonicalCommonDenominatorPressurePresentationPlan =
  compileKpCommonDenominatorPressurePresentationPlan(
    kpCanonicalCommonDenominatorAlignment
  );

function createContextTransfers(
  alignment: KpVerifiedCommonDenominatorAlignment
): readonly KpCommonDenominatorPressureContextTransfer[] {
  const source = alignment.source.terms[1];
  const target = alignment.target.terms[1];
  const transfers = [
    transfer("addition-operator", alignment.source.operatorEntityId,
      alignment.target.operatorEntityId),
    transfer("untouched-term", source.termEntityId, target.termEntityId),
    transfer("untouched-fraction", source.fractionEntityId,
      target.fractionEntityId),
    transfer("untouched-division", source.divisionEntityId,
      target.divisionEntityId),
    transfer("untouched-numerator", source.numerator.entityId,
      target.numerator.entityId),
    transfer("untouched-denominator", source.denominator.entityId,
      target.denominator.entityId)
  ] as const;
  transfers.forEach((entry) => {
    const authority = alignment.correspondence.find((candidate) =>
      candidate.relation === "identity" &&
      candidate.sourceEntityIds.includes(entry.sourceEntityId) &&
      candidate.targetEntityIds.includes(entry.targetEntityId)
    );
    if (authority === undefined) {
      throw new Error(
        `Pressure context ${entry.role} lacks exact identity authority.`
      );
    }
  });
  return Object.freeze(transfers);
}

function compileEvaluationBinding(input: {
  readonly id: string;
  readonly materialSelectorIds: readonly [string, string];
  readonly catalystSelectorId: string;
  readonly targetSelectorId: string;
}): KpRegisteredSuccessorSynthesisBinding {
  const sourceAnnotations: readonly KpSuccessorSynthesisSourceAnnotation[] =
    Object.freeze([
      sourceAnnotation(`${input.id}.source.factor`, "product-factor",
        input.materialSelectorIds[0], "material-input", 0),
      sourceAnnotation(`${input.id}.source.operand`, "product-operand",
        input.materialSelectorIds[1], "material-input", 1),
      sourceAnnotation(`${input.id}.source.operator`, "product-operator",
        input.catalystSelectorId, "catalyst", 2)
    ]);
  const targetAnnotations: readonly KpSuccessorSynthesisTargetAnnotation[] =
    Object.freeze([Object.freeze({
      id: `${input.id}.target.result`,
      semanticRole: "evaluated-product",
      selectorIds: Object.freeze([input.targetSelectorId]),
      propagationRank: 0
    })]);
  const binding: KpSuccessorSynthesisBinding = Object.freeze({
    id: input.id,
    relationRecordId: `${input.id}.relation`,
    authority: Object.freeze({
      operationId: "kp.algebra.simplify-constant-product",
      bindingId: `${input.id}.binding`
    }),
    sourceAnnotations,
    targetAnnotations,
    lineages: Object.freeze([Object.freeze({
      id: `${input.id}.lineage`,
      sourceAnnotationIds: Object.freeze([
        sourceAnnotations[0]!.id,
        sourceAnnotations[1]!.id
      ]),
      targetAnnotationIds: Object.freeze([targetAnnotations[0]!.id])
    })]),
    layoutTopology: "shared-inline-band" as const,
    convergenceAnchor: "target-destination" as const
  });
  const compilation = compileKpRegisteredSuccessorSynthesisPresentation({
    transformationId: `${input.id}.transformation`,
    transformationKind: "simplifyConstantProduct",
    binding
  });
  if (compilation.status !== "compiled") {
    throw new Error(
      `Pressure evaluation ${input.id} did not resolve approved presentation.`
    );
  }
  return Object.freeze({
    ...binding,
    operationPresentationPlan: compilation.operationPresentationPlan,
    paintContinuityPlan: compilation.paintContinuityPlan,
    continuityProgram: compilation.continuityProgram
  });
}

function sourceAnnotation(
  id: string,
  semanticRole: string,
  selectorId: string,
  contribution: "material-input" | "catalyst",
  propagationRank: number
): KpSuccessorSynthesisSourceAnnotation {
  return Object.freeze({
    id,
    semanticRole,
    selectorIds: Object.freeze([selectorId]),
    contribution,
    propagationRank
  });
}

function endpoint(
  kind: KpCommonDenominatorPressureEndpointKind,
  stateId: string,
  latex: string
): KpCommonDenominatorPressureEndpoint {
  return Object.freeze({ kind, stateId, latex });
}

function transfer(
  role: KpCommonDenominatorPressureContextRole,
  sourceEntityId: string,
  targetEntityId: string
): KpCommonDenominatorPressureContextTransfer {
  return Object.freeze({
    role,
    relation: "identity" as const,
    sourceEntityId,
    targetEntityId
  });
}

function safeNumber(value: bigint, label: string): number {
  const converted = Number(value);
  if (!Number.isSafeInteger(converted)) {
    throw new RangeError(
      `Pressure presentation ${label} exceeds the native scalar range.`
    );
  }
  return converted;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
