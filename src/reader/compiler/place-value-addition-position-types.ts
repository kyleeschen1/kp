declare const kpPlaceValuePositionProgramBrand: unique symbol;
declare const kpPlaceValueTerminalOutputPolicyBrand: unique symbol;

export interface KpExactRadixPosition {
  readonly id: string;
  readonly sequenceIndex: number;
  readonly radix: number;
  readonly exponent: number;
  readonly columnId: string;
}

export interface KpPlaceValueEvaluationDigitSpec {
  readonly semanticEntityId: string;
  readonly columnId: string;
  readonly latex: string;
}

export interface KpPlaceValuePositionEvaluationSpec {
  readonly schemaVersion: string;
  readonly beatId: string;
  readonly expression: string;
  readonly contributorCellIds: readonly string[];
  readonly evaluationDigits: readonly KpPlaceValueEvaluationDigitSpec[];
  readonly evaluatedTotalEntityId: string;
  readonly stageDataset: string;
}

export interface KpPlaceValuePositionExchangeSpec {
  readonly schemaVersion: string;
  readonly beatId: string;
  readonly baseTenExchangeId: string;
  readonly outputCellIds: readonly [string, string];
  readonly outputDigits: readonly [
    KpPlaceValueEvaluationDigitSpec,
    KpPlaceValueEvaluationDigitSpec
  ];
  readonly stageDataset: string;
}

export interface KpPlaceValueTerminalOutputTarget {
  readonly role: "settled-digit" | "terminal-result-extension";
  readonly position: KpExactRadixPosition;
  readonly targetCellId: string;
  readonly materialEntityId: string;
  readonly digitValue: bigint;
}

export interface KpPlaceValueSettledTerminalOutputPolicy {
  readonly schemaVersion: "kp.place-value-terminal-output.v1";
  readonly mode: "settle-in-terminal-position";
  readonly terminalPosition: KpExactRadixPosition;
  readonly evaluatedTotal: bigint;
  readonly remainderDigit: bigint;
  readonly outputs: readonly [KpPlaceValueTerminalOutputTarget];
  readonly [kpPlaceValueTerminalOutputPolicyBrand]: true;
}

export interface KpPlaceValueExtendedTerminalOutputPolicy {
  readonly schemaVersion: "kp.place-value-terminal-output.v1";
  readonly mode: "extend-result-sequence";
  readonly terminalPosition: KpExactRadixPosition;
  readonly extensionPosition: KpExactRadixPosition;
  readonly evaluatedTotal: bigint;
  readonly remainderDigit: bigint;
  readonly overflowDigit: bigint;
  readonly outputs: readonly [
    KpPlaceValueTerminalOutputTarget & { readonly role: "settled-digit" },
    KpPlaceValueTerminalOutputTarget & {
      readonly role: "terminal-result-extension";
    }
  ];
  readonly [kpPlaceValueTerminalOutputPolicyBrand]: true;
}

export type KpPlaceValueTerminalOutputPolicy =
  | KpPlaceValueSettledTerminalOutputPolicy
  | KpPlaceValueExtendedTerminalOutputPolicy;

export interface KpPlaceValuePositionProgram {
  readonly position: KpExactRadixPosition;
  readonly evaluation: KpPlaceValuePositionEvaluationSpec;
  readonly exchange?: KpPlaceValuePositionExchangeSpec | undefined;
  readonly terminalOutput?: KpPlaceValueTerminalOutputPolicy | undefined;
  readonly [kpPlaceValuePositionProgramBrand]: true;
}
