export type VisualMotionPrimitiveId =
  | "enter"
  | "exit"
  | "reveal"
  | "shift"
  | "vanish"
  | "wrap"
  | "unwrap";

export type EquationMotionPrimitiveId = VisualMotionPrimitiveId;

export type EquationVisualMotifKind =
  | "append-after-shift"
  | "artifact-enter"
  | "artifact-exit"
  | "artifact-replace"
  | "cancelation"
  | "simplify-into"
  | "wrap"
  | "unwrap";

export const equationVisualMotifPhaseIds = [
  "artifact-enter",
  "artifact-exit",
  "layout-shift",
  "introduced-token-enter",
  "cancel-meet",
  "cancel-collapse",
  "post-cancel-layout-shift",
  "final-simplify-meet",
  "final-simplify-collapse",
  "final-simplify-reveal",
  "unwrap-artifact-exit",
  "wrap-artifact-enter",
  "wrapped-token-shift"
] as const;

export type EquationVisualMotifPhaseId =
  (typeof equationVisualMotifPhaseIds)[number];

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
