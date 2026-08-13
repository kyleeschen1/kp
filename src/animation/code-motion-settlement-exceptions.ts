const verifiedCodeSettlementException = Symbol("kp.verified-code-settlement-exception");

interface KpCodeSettlementExceptionBase {
  readonly id: string;
  readonly transitionId: string;
  readonly materialIds: readonly string[];
  readonly rationale: string;
}

export type KpCodeSettlementExceptionDraft =
  | (KpCodeSettlementExceptionBase & {
      readonly kind: "authored-cut";
      readonly fromCheckpointId: string;
      readonly toCheckpointId: string;
    })
  | (KpCodeSettlementExceptionBase & {
      readonly kind: "semantic-deletion";
      readonly deletionOperationId: string;
    })
  | (KpCodeSettlementExceptionBase & {
      readonly kind: "pedagogical-dissolve";
      readonly recognitionCheckpointId: string;
    })
  | (KpCodeSettlementExceptionBase & {
      readonly kind: "reduced-motion-endpoint-jump";
      readonly mediaCondition: "prefers-reduced-motion: reduce";
    });

export type KpVerifiedCodeSettlementException =
  KpCodeSettlementExceptionDraft & {
    readonly [verifiedCodeSettlementException]: true;
  };

export interface KpCodeSettlementExceptionPolicy {
  readonly relaxedLaw:
    | "continuous-transit"
    | "native-target-settlement"
    | "handoff-before-withdrawal"
    | "observable-intermediate-phases";
  readonly requiredOutcome:
    | "target-native-owner"
    | "semantic-absence"
    | "recognized-context-withdrawal";
}

/**
 * Exceptions are authored evidence bound to one transition and material set.
 * A renderer cannot mint a generic "fade looked better" escape hatch.
 */
export function mintKpCodeSettlementException(
  draft: KpCodeSettlementExceptionDraft
): KpVerifiedCodeSettlementException {
  assertText(draft.id, "id");
  assertText(draft.transitionId, "transitionId");
  assertText(draft.rationale, "rationale");
  assertIds(draft.materialIds, "materialIds");

  switch (draft.kind) {
    case "authored-cut":
      assertText(draft.fromCheckpointId, "fromCheckpointId");
      assertText(draft.toCheckpointId, "toCheckpointId");
      if (draft.fromCheckpointId === draft.toCheckpointId) {
        throw new Error("Authored cut checkpoints must be distinct.");
      }
      break;
    case "semantic-deletion":
      assertText(draft.deletionOperationId, "deletionOperationId");
      break;
    case "pedagogical-dissolve":
      assertText(draft.recognitionCheckpointId, "recognitionCheckpointId");
      break;
    case "reduced-motion-endpoint-jump":
      if (draft.mediaCondition !== "prefers-reduced-motion: reduce") {
        throw new Error("Reduced-motion endpoint jumps require the exact reduced-motion condition.");
      }
      break;
    default:
      throw new Error("Unknown code settlement exception kind.");
  }

  return Object.freeze({
    ...draft,
    materialIds: Object.freeze([...draft.materialIds]),
    [verifiedCodeSettlementException]: true as const
  }) as KpVerifiedCodeSettlementException;
}

export function assertKpVerifiedCodeSettlementException(
  exception: KpVerifiedCodeSettlementException
): void {
  if (exception[verifiedCodeSettlementException] !== true) {
    throw new Error("Code settlement exceptions must be minted by the shared validator.");
  }
}

export function resolveKpCodeSettlementExceptionPolicy(
  exception: KpVerifiedCodeSettlementException
): KpCodeSettlementExceptionPolicy {
  assertKpVerifiedCodeSettlementException(exception);
  switch (exception.kind) {
    case "authored-cut":
      return Object.freeze({
        relaxedLaw: "continuous-transit",
        requiredOutcome: "target-native-owner"
      });
    case "semantic-deletion":
      return Object.freeze({
        relaxedLaw: "native-target-settlement",
        requiredOutcome: "semantic-absence"
      });
    case "pedagogical-dissolve":
      return Object.freeze({
        relaxedLaw: "handoff-before-withdrawal",
        requiredOutcome: "recognized-context-withdrawal"
      });
    case "reduced-motion-endpoint-jump":
      return Object.freeze({
        relaxedLaw: "observable-intermediate-phases",
        requiredOutcome: "target-native-owner"
      });
  }
}

export function assertKpCodeSettlementExceptionScope(input: {
  readonly exception: KpVerifiedCodeSettlementException;
  readonly transitionId: string;
  readonly materialIds: readonly string[];
  readonly reducedMotion: boolean;
}): void {
  assertKpVerifiedCodeSettlementException(input.exception);
  if (input.exception.transitionId !== input.transitionId) {
    throw new Error(`Settlement exception ${input.exception.id} cannot cross transitions.`);
  }
  if (!sameSet(input.exception.materialIds, input.materialIds)) {
    throw new Error(`Settlement exception ${input.exception.id} cannot cross material identity.`);
  }
  if (input.exception.kind === "reduced-motion-endpoint-jump" && !input.reducedMotion) {
    throw new Error(`Settlement exception ${input.exception.id} requires reduced motion.`);
  }
}

function assertText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`Code settlement exception ${label} must be non-empty.`);
}

function assertIds(values: readonly string[], label: string): void {
  if (values.length === 0) throw new Error(`Code settlement exception ${label} cannot be empty.`);
  values.forEach((value, index) => assertText(value, `${label}[${index}]`));
  if (new Set(values).size !== values.length) {
    throw new Error(`Code settlement exception ${label} must be unique.`);
  }
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}
