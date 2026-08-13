export type KpSemanticTransitionGapReason =
  | "missing-correspondence"
  | "incomplete-lifecycle"
  | "missing-definition-binding"
  | "invalid-reference"
  | "invalid-correspondence"
  | "unsupported-operation"
  | "compile-failed";

export interface KpSemanticTransitionGapDiagnostic {
  readonly code: string;
  readonly severity: "warning" | "error";
  readonly message: string;
}

export interface KpSemanticTransitionGap {
  readonly kind: "semantic-transition-gap";
  readonly id: string;
  readonly transformationId: string;
  readonly reason: KpSemanticTransitionGapReason;
  readonly summary: string;
  readonly diagnostics: readonly KpSemanticTransitionGapDiagnostic[];
  readonly repair: {
    readonly kind: "supply-correspondence" | "bind-operation" | "repair-reference" | "author-operation";
    readonly targetId: string;
  };
}

export function createKpSemanticTransitionGap(input: {
  readonly transformationId: string;
  readonly reason: KpSemanticTransitionGapReason;
  readonly diagnostics: readonly KpSemanticTransitionGapDiagnostic[];
}): KpSemanticTransitionGap {
  return {
    kind: "semantic-transition-gap",
    id: `semantic-gap.${input.transformationId}`,
    transformationId: input.transformationId,
    reason: input.reason,
    summary: `Semantic choreography is unavailable for ${input.transformationId}: ${input.reason}.`,
    diagnostics: input.diagnostics.map((diagnostic) => ({ ...diagnostic })),
    repair: {
      kind: repairKind(input.reason),
      targetId: input.transformationId
    }
  };
}

function repairKind(
  reason: KpSemanticTransitionGapReason
): KpSemanticTransitionGap["repair"]["kind"] {
  switch (reason) {
    case "missing-correspondence":
    case "incomplete-lifecycle":
    case "invalid-correspondence":
      return "supply-correspondence";
    case "missing-definition-binding":
      return "bind-operation";
    case "invalid-reference":
      return "repair-reference";
    case "unsupported-operation":
    case "compile-failed":
      return "author-operation";
  }
}
