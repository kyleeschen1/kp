import type {
  KpExactRadixPosition,
  KpPlaceValueExtendedTerminalOutputPolicy,
  KpPlaceValueSettledTerminalOutputPolicy,
  KpPlaceValueTerminalOutputPolicy,
  KpPlaceValueTerminalOutputTarget
} from "./place-value-addition-position-types.ts";

const sealedPolicies = new WeakSet<object>();

interface KpTerminalOutputTargetInput {
  readonly targetCellId: string;
  readonly materialEntityId: string;
}

export type KpPlaceValueTerminalOutputPolicyInput =
  | {
      readonly mode: "settle-in-terminal-position";
      readonly terminalPosition: KpExactRadixPosition;
      readonly evaluatedTotal: bigint;
      readonly result: KpTerminalOutputTargetInput;
    }
  | {
      readonly mode: "extend-result-sequence";
      readonly terminalPosition: KpExactRadixPosition;
      readonly extensionPosition: KpExactRadixPosition;
      readonly evaluatedTotal: bigint;
      readonly remainder: KpTerminalOutputTargetInput;
      readonly overflow: KpTerminalOutputTargetInput;
    };

/**
 * Terminal overflow changes the result topology, not just its paint. This
 * compiler distinguishes a settled final digit from a new adjacent result
 * position so a renderer can never treat the latter as a transient carry.
 */
export function compileKpPlaceValueTerminalOutputPolicy(
  input: KpPlaceValueTerminalOutputPolicyInput
): KpPlaceValueTerminalOutputPolicy {
  assertPosition(input.terminalPosition);
  if (input.evaluatedTotal < 0n) {
    throw new Error("Terminal evaluated totals cannot be negative.");
  }
  const radix = BigInt(input.terminalPosition.radix);
  const remainderDigit = input.evaluatedTotal % radix;
  const overflowDigit = input.evaluatedTotal / radix;
  if (input.mode === "settle-in-terminal-position") {
    if (overflowDigit !== 0n) {
      throw new Error(
        "A terminal total with overflow must extend the result sequence."
      );
    }
    const output = terminalTarget({
      role: "settled-digit",
      position: input.terminalPosition,
      target: input.result,
      digitValue: remainderDigit
    });
    const policy = Object.freeze({
      schemaVersion: "kp.place-value-terminal-output.v1" as const,
      mode: input.mode,
      terminalPosition: input.terminalPosition,
      evaluatedTotal: input.evaluatedTotal,
      remainderDigit,
      outputs: Object.freeze([output] as const)
    });
    sealedPolicies.add(policy);
    return policy as unknown as KpPlaceValueSettledTerminalOutputPolicy;
  }
  assertPosition(input.extensionPosition);
  if (
    overflowDigit === 0n ||
    overflowDigit >= radix ||
    input.extensionPosition.sequenceIndex !==
      input.terminalPosition.sequenceIndex + 1 ||
    input.extensionPosition.radix !== input.terminalPosition.radix ||
    input.extensionPosition.exponent !== input.terminalPosition.exponent + 1
  ) {
    throw new Error(
      "Terminal overflow requires exactly one adjacent result-extension position in the same radix."
    );
  }
  const remainder = terminalTarget({
    role: "settled-digit",
    position: input.terminalPosition,
    target: input.remainder,
    digitValue: remainderDigit
  });
  const overflow = terminalTarget({
    role: "terminal-result-extension",
    position: input.extensionPosition,
    target: input.overflow,
    digitValue: overflowDigit
  });
  const policy = Object.freeze({
    schemaVersion: "kp.place-value-terminal-output.v1" as const,
    mode: input.mode,
    terminalPosition: input.terminalPosition,
    extensionPosition: input.extensionPosition,
    evaluatedTotal: input.evaluatedTotal,
    remainderDigit,
    overflowDigit,
    outputs: Object.freeze([remainder, overflow] as const)
  });
  sealedPolicies.add(policy);
  return policy as unknown as KpPlaceValueExtendedTerminalOutputPolicy;
}

export function isKpPlaceValueTerminalOutputPolicy(
  value: unknown
): value is KpPlaceValueTerminalOutputPolicy {
  return typeof value === "object" &&
    value !== null &&
    sealedPolicies.has(value);
}

function terminalTarget(input: {
  readonly role: KpPlaceValueTerminalOutputTarget["role"];
  readonly position: KpExactRadixPosition;
  readonly target: KpTerminalOutputTargetInput;
  readonly digitValue: bigint;
}): KpPlaceValueTerminalOutputTarget {
  if (
    input.target.targetCellId.length === 0 ||
    input.target.materialEntityId.length === 0
  ) {
    throw new Error("Terminal output targets require stable semantic IDs.");
  }
  return Object.freeze({
    role: input.role,
    position: input.position,
    targetCellId: input.target.targetCellId,
    materialEntityId: input.target.materialEntityId,
    digitValue: input.digitValue
  });
}

function assertPosition(position: KpExactRadixPosition): void {
  if (
    position.id.length === 0 ||
    position.columnId.length === 0 ||
    !Number.isSafeInteger(position.sequenceIndex) ||
    position.sequenceIndex < 0 ||
    !Number.isSafeInteger(position.radix) ||
    position.radix < 2 ||
    !Number.isSafeInteger(position.exponent)
  ) {
    throw new Error("Terminal output requires an exact radix position.");
  }
}
