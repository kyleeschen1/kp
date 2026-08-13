import {
  mintKpCodeSettlementPlan,
  sampleKpCodeSettlement,
  type KpCodeSettlementSample,
  type KpVerifiedCodeSettlementPlan
} from "./code-motion-settlement.ts";
import {
  mintKpCodeSettlementException,
  type KpVerifiedCodeSettlementException
} from "./code-motion-settlement-exceptions.ts";

export type KpSchemeFactorialSettlementMotif =
  | "structural"
  | "binding"
  | "branch"
  | "primitive"
  | "summary"
  | "return";

type KpSchemePaintOwnerId =
  | "paint.scheme.semantic-dom"
  | `paint.scheme.${KpSchemeFactorialSettlementMotif}.transit`;
type KpSchemeNativeOwnerId = "native.scheme.semantic-dom";

export interface KpSchemeFactorialSettlementEvidence {
  readonly motif: KpSchemeFactorialSettlementMotif;
  readonly transitionId: string;
  readonly materialIds: readonly string[];
  readonly sample: KpCodeSettlementSample<
    KpSchemePaintOwnerId,
    KpSchemeNativeOwnerId
  >;
  readonly exception?: KpVerifiedCodeSettlementException | undefined;
}

const nativePaintOwner = "paint.scheme.semantic-dom" as const;
const nativeOwner = "native.scheme.semantic-dom" as const;

const plans = Object.freeze({
  structural: plan("structural", {
    travel: 0.01,
    arrival: 0.18,
    recognition: 0.72,
    ownershipHandoff: 0.82,
    withdrawal: 1
  }),
  binding: plan("binding", {
    travel: 0.01,
    arrival: 0.48,
    recognition: 0.62,
    ownershipHandoff: 0.7,
    withdrawal: 1
  }),
  branch: plan("branch", {
    travel: 0.01,
    arrival: 0.3,
    recognition: 0.55,
    ownershipHandoff: 0.68,
    withdrawal: 1
  }),
  primitive: plan("primitive", {
    travel: 0.01,
    arrival: 0.48,
    recognition: 0.62,
    ownershipHandoff: 0.72,
    withdrawal: 1
  }),
  summary: plan("summary", {
    travel: 0.01,
    arrival: 0.34,
    recognition: 0.6,
    ownershipHandoff: 0.8,
    withdrawal: 1
  }),
  return: plan("return", {
    travel: 0.18,
    arrival: 0.58,
    recognition: 0.72,
    ownershipHandoff: 0.9,
    withdrawal: 1
  })
} satisfies Record<
  KpSchemeFactorialSettlementMotif,
  KpVerifiedCodeSettlementPlan<KpSchemePaintOwnerId, KpSchemeNativeOwnerId>
>);

/**
 * Adapts Scheme-owned motif progress to the shared causal law. The adapter is
 * evidence only: recursive geometry, easing, and timing remain in each motif.
 */
export function sampleKpSchemeFactorialSettlement(input: {
  readonly motif: KpSchemeFactorialSettlementMotif;
  readonly transitionId: string;
  readonly materialIds: readonly string[];
  readonly progress: number;
  readonly semanticDeletion?: {
    readonly operationId: string;
    readonly materialIds: readonly string[];
  } | undefined;
}): KpSchemeFactorialSettlementEvidence {
  assertText(input.transitionId, "transitionId");
  assertIds(input.materialIds);
  const exception = input.semanticDeletion === undefined
    ? undefined
    : mintKpCodeSettlementException({
        id: `exception.${input.transitionId}.semantic-deletion`,
        kind: "semantic-deletion",
        transitionId: input.transitionId,
        materialIds: input.semanticDeletion.materialIds,
        deletionOperationId: input.semanticDeletion.operationId,
        rationale:
          "The evaluator-selected branch makes the dormant expression semantically absent."
      });
  return Object.freeze({
    motif: input.motif,
    transitionId: input.transitionId,
    materialIds: Object.freeze([...input.materialIds]),
    sample: sampleKpCodeSettlement({
      plan: plans[input.motif],
      progress: input.progress
    }),
    ...(exception === undefined ? {} : { exception })
  });
}

/** Reduced motion may skip only one exact Scheme transition and material set. */
export function mintKpSchemeReducedMotionSettlementException(input: {
  readonly transitionId: string;
  readonly materialIds: readonly string[];
}): KpVerifiedCodeSettlementException {
  return mintKpCodeSettlementException({
    id: `exception.${input.transitionId}.reduced-motion`,
    kind: "reduced-motion-endpoint-jump",
    transitionId: input.transitionId,
    materialIds: input.materialIds,
    rationale:
      "Reduced motion preserves the exact settled Scheme endpoint without intermediate overlay paint.",
    mediaCondition: "prefers-reduced-motion: reduce"
  });
}

function plan(
  motif: KpSchemeFactorialSettlementMotif,
  milestones: Parameters<typeof mintKpCodeSettlementPlan>[0]["milestones"]
): KpVerifiedCodeSettlementPlan<KpSchemePaintOwnerId, KpSchemeNativeOwnerId> {
  return mintKpCodeSettlementPlan({
    id: `settlement.scheme.${motif}`,
    sourcePaintOwnerId: nativePaintOwner,
    transitPaintOwnerId: `paint.scheme.${motif}.transit`,
    targetPaintOwnerId: nativePaintOwner,
    sourceNativeOwnerId: nativeOwner,
    targetNativeOwnerId: nativeOwner,
    milestones
  });
}

function assertText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`Scheme settlement ${label} must be non-empty.`);
}

function assertIds(values: readonly string[]): void {
  if (values.length === 0) throw new Error("Scheme settlement materialIds cannot be empty.");
  values.forEach((value, index) => assertText(value, `materialIds[${index}]`));
  if (new Set(values).size !== values.length) {
    throw new Error("Scheme settlement materialIds must be unique.");
  }
}
