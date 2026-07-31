declare const kpPlaceValuePositionProgramBrand: unique symbol;

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

export interface KpPlaceValuePositionProgram {
  readonly position: KpExactRadixPosition;
  readonly evaluation: KpPlaceValuePositionEvaluationSpec;
  readonly exchange?: KpPlaceValuePositionExchangeSpec | undefined;
  readonly [kpPlaceValuePositionProgramBrand]: true;
}
