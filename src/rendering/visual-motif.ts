import {
  kpCopyFanOutPhaseIds,
  type KpCopyFanOutPhaseId
} from "../animation/copy-fan-out-choreography.ts";
import {
  kpSubstitutionPhaseIds,
  type KpSubstitutionPhaseId
} from "../animation/substitution-choreography.ts";
import {
  kpDerivativePowerPhaseIds,
  type KpDerivativePowerPhaseId
} from "../animation/derivative-power-choreography.ts";

export type VisualMotionPrimitiveId =
  | "enter"
  | "exit"
  | "reveal"
  | "shift"
  | "vanish"
  | "copy"
  | "merge"
  | "transmit"
  | "wrap"
  | "unwrap";

export type EquationMotionPrimitiveId = VisualMotionPrimitiveId;

export type EquationVisualMotifKind =
  | "append-after-shift"
  | "artifact-enter"
  | "artifact-exit"
  | "artifact-replace"
  | "cancelation"
  | "copy-fan-out"
  | "derivative-power"
  | "dot-product-accumulate"
  | "merge-fan-in"
  | "matrix-row-compose"
  | "matrix-cell-compose"
  | "radical-corner-transfer"
  | "relation-flip"
  | "simplify-into"
  | "substitute"
  | "wrap"
  | "unwrap";

export const equationVisualMotifPhaseIds = [
  "artifact-enter",
  "artifact-exit",
  "layout-shift",
  "introduced-token-enter",
  "relation-flip",
  "cancel-meet",
  "cancel-collapse",
  "post-cancel-layout-shift",
  "final-simplify-meet",
  "final-simplify-collapse",
  "final-simplify-reveal",
  "dot-pair-focus",
  "dot-product-form",
  "dot-accumulate",
  "dot-result-reveal",
  "radical-fragment-focus",
  "radical-corner-gather",
  "radical-representation-handoff",
  "radical-native-settle",
  "unwrap-artifact-exit",
  "wrap-artifact-enter",
  "wrapped-token-shift",
  ...kpCopyFanOutPhaseIds,
  ...kpSubstitutionPhaseIds,
  ...kpDerivativePowerPhaseIds
] as const;

export type EquationVisualMotifPhaseId =
  (typeof equationVisualMotifPhaseIds)[number] |
  KpCopyFanOutPhaseId |
  KpSubstitutionPhaseId |
  KpDerivativePowerPhaseId;

export interface VisualMotifPlan<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly id: string;
  readonly kind: TKind;
  readonly correspondenceRecordId: string;
  readonly sourceTokenIds: readonly string[];
  readonly targetTokenIds: readonly string[];
  readonly motionPrimitiveIds: readonly TPrimitiveId[];
  readonly phaseIds: readonly TPhaseId[];
  readonly summary: string;
}

export type EquationVisualMotifPlan = VisualMotifPlan<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
>;

export interface VisualMotifDescriptor<
  TKind extends string = string,
  TPrimitiveId extends string = string,
  TPhaseId extends string = string
> {
  readonly kind: TKind;
  readonly motionPrimitiveIds: readonly TPrimitiveId[];
  readonly phaseIds: readonly TPhaseId[];
  readonly summary: string;
}

export type EquationVisualMotifDescriptor = VisualMotifDescriptor<
  EquationVisualMotifKind,
  EquationMotionPrimitiveId,
  EquationVisualMotifPhaseId
>;

// Shared motif descriptors keep semantic-free motion vocabulary out of
// controllers while allowing equation, graph, and future renderers to adapt it.
export const equationVisualMotifDescriptors: readonly EquationVisualMotifDescriptor[] = [
  {
    kind: "append-after-shift",
    motionPrimitiveIds: ["shift", "enter"],
    phaseIds: ["layout-shift", "introduced-token-enter"],
    summary: "Persisted tokens shift before introduced tokens enter."
  },
  {
    kind: "artifact-enter",
    motionPrimitiveIds: ["enter"],
    phaseIds: ["artifact-enter"],
    summary: "A visual artifact enters without a paired source artifact."
  },
  {
    kind: "artifact-exit",
    motionPrimitiveIds: ["exit"],
    phaseIds: ["artifact-exit"],
    summary: "A visual artifact exits without a paired target artifact."
  },
  {
    kind: "artifact-replace",
    motionPrimitiveIds: ["exit", "enter"],
    phaseIds: ["artifact-exit", "artifact-enter"],
    summary: "A source artifact exits before a paired target artifact enters."
  },
  {
    kind: "cancelation",
    motionPrimitiveIds: ["vanish"],
    phaseIds: ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"],
    summary: "Matched inverse tokens meet, collapse, and leave layout room."
  },
  {
    kind: "copy-fan-out",
    motionPrimitiveIds: ["copy", "shift"],
    phaseIds: [...kpCopyFanOutPhaseIds],
    summary: "A persistent source contracts while lineage-bearing copies branch and travel independently."
  },
  {
    kind: "dot-product-accumulate",
    motionPrimitiveIds: ["transmit", "merge", "reveal"],
    phaseIds: [
      "dot-pair-focus",
      "dot-product-form",
      "dot-accumulate",
      "dot-result-reveal"
    ],
    summary:
      "Index-matched component pairs form persistent products and accumulate into one scalar."
  },
  {
    kind: "matrix-row-compose",
    motionPrimitiveIds: ["shift", "transmit", "reveal"],
    phaseIds: [
      "dot-pair-focus",
      "dot-product-form",
      "dot-accumulate",
      "dot-result-reveal"
    ],
    summary:
      "Matrix rows meet the shared vector in semantic order and leave persistent result entries."
  },
  {
    kind: "matrix-cell-compose",
    motionPrimitiveIds: ["shift", "transmit", "reveal"],
    phaseIds: [
      "dot-pair-focus",
      "dot-product-form",
      "dot-accumulate",
      "dot-result-reveal"
    ],
    summary:
      "Left rows meet right columns in semantic cell order and leave persistent product entries."
  },
  {
    kind: "derivative-power",
    motionPrimitiveIds: ["transmit", "copy", "shift", "exit"],
    phaseIds: [...kpDerivativePowerPhaseIds],
    summary:
      "The exponent branches into a coefficient and decremented successor while the base persists."
  },
  {
    kind: "merge-fan-in",
    motionPrimitiveIds: ["merge", "shift"],
    phaseIds: [...kpCopyFanOutPhaseIds].reverse(),
    summary: "Lineage-bearing sources retrace independent paths and coalesce into one result."
  },
  {
    kind: "radical-corner-transfer",
    motionPrimitiveIds: ["transmit", "shift", "exit", "reveal"],
    phaseIds: [
      "radical-fragment-focus",
      "radical-corner-gather",
      "radical-representation-handoff",
      "radical-native-settle"
    ],
    summary:
      "Fractional-exponent fragments gather into distinct opposite-corner slots and hand off to radical fragments before native settlement."
  },
  {
    kind: "relation-flip",
    motionPrimitiveIds: ["shift"],
    phaseIds: ["relation-flip"],
    summary: "An inequality relation turns as multiplication by a negative reverses its order."
  },
  {
    kind: "simplify-into",
    motionPrimitiveIds: ["vanish", "reveal"],
    phaseIds: [
      "final-simplify-meet",
      "final-simplify-collapse",
      "final-simplify-reveal"
    ],
    summary: "Source tokens collapse into a newly revealed simplified token."
  },
  {
    kind: "substitute",
    motionPrimitiveIds: ["transmit", "exit", "enter"],
    phaseIds: [...kpSubstitutionPhaseIds],
    summary: "A value carries its identity to a destination before replacing its prior occupant."
  },
  {
    kind: "wrap",
    motionPrimitiveIds: ["wrap"],
    phaseIds: ["wrapped-token-shift", "wrap-artifact-enter"],
    summary: "A persistent token shifts while wrapper artifacts enter."
  },
  {
    kind: "unwrap",
    motionPrimitiveIds: ["unwrap"],
    phaseIds: ["unwrap-artifact-exit", "wrapped-token-shift"],
    summary: "Wrapper artifacts exit while the unwrapped token shifts."
  }
];

export function phaseIdsForEquationVisualMotifKind(
  kind: EquationVisualMotifKind
): readonly EquationVisualMotifPhaseId[] {
  return [...descriptorForEquationVisualMotifKind(kind).phaseIds];
}

export function primitiveIdsForEquationVisualMotifKind(
  kind: EquationVisualMotifKind
): readonly EquationMotionPrimitiveId[] {
  return [...descriptorForEquationVisualMotifKind(kind).motionPrimitiveIds];
}

export function createVisualMotifPlan<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  input: VisualMotifPlan<TKind, TPrimitiveId, TPhaseId>
): VisualMotifPlan<TKind, TPrimitiveId, TPhaseId> {
  return {
    id: input.id,
    kind: input.kind,
    correspondenceRecordId: input.correspondenceRecordId,
    sourceTokenIds: [...input.sourceTokenIds],
    targetTokenIds: [...input.targetTokenIds],
    motionPrimitiveIds: [...input.motionPrimitiveIds],
    phaseIds: [...input.phaseIds],
    summary: input.summary
  };
}

export function cloneVisualMotifPlan<
  TKind extends string,
  TPrimitiveId extends string,
  TPhaseId extends string
>(
  motif: VisualMotifPlan<TKind, TPrimitiveId, TPhaseId>
): VisualMotifPlan<TKind, TPrimitiveId, TPhaseId> {
  return createVisualMotifPlan(motif);
}

function descriptorForEquationVisualMotifKind(
  kind: EquationVisualMotifKind
): EquationVisualMotifDescriptor {
  const descriptor = equationVisualMotifDescriptors.find(
    (candidate) => candidate.kind === kind
  );

  if (descriptor === undefined) {
    throw new Error(`Unknown equation visual motif kind: ${kind}`);
  }

  return descriptor;
}
