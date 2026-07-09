import {
  cloneCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";
import { parseLatexEquation } from "./equation-classifier.ts";
import { evaluateConstantExpression } from "./expression.ts";
import {
  parseLatexExpression,
  type ParsedLatexExpression
} from "./latex-parser.ts";
import { parsedLatexExpressionToMathExpression } from "./latex-to-expression.ts";

export type SemanticId = string;

export type EquationTokenLifecycle =
  | "persist"
  | "enter"
  | "exit"
  | "move"
  | "cancel"
  | "inverse-enter"
  | "simplify-into"
  | "group-wrap"
  | "group-unwrap";

export type EquationTokenEasingName =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export type EquationTokenEntryEffect = "shared" | "direct";

export interface EquationTokenMotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface EquationTokenMotionTiming {
  readonly start: number;
  readonly end: number;
  readonly easing: EquationTokenEasingName;
  readonly from: EquationTokenMotionPose;
  readonly to: EquationTokenMotionPose;
}

export type EquationOperation =
  | {
      readonly kind: "subtractBothSides";
      readonly valueLatex: string;
    }
  | {
      readonly kind: "simplifySide";
      readonly side: "left" | "right";
      readonly rule: "cancel-additive-inverse" | "evaluate-constant-difference";
    };

export type EquationTransitionOperation =
  | EquationOperation
  | {
      readonly kind: "fixtureTransform";
      readonly fixtureId: string;
      readonly intent: string;
    };

export type EquationOperationInput = {
  readonly sourceLatex: string;
  readonly operation: EquationOperation;
};

export type EquationTransitionToken = {
  readonly id: SemanticId;
  readonly lifecycle: EquationTokenLifecycle;
  readonly label: string;
  readonly motion?: EquationTokenMotionTiming;
  readonly entryEffect?: EquationTokenEntryEffect;
  readonly sourceMotionId?: SemanticId;
  readonly targetMotionId?: SemanticId;
  readonly sourceLatex?: string;
  readonly targetLatex?: string;
};

export type EquationMotionAnnotation = {
  readonly motionId: SemanticId;
  readonly text: string;
};

export interface EquationTransitionSelectorPaths {
  readonly source: Readonly<Record<SemanticId, string>>;
  readonly target: Readonly<Record<SemanticId, string>>;
}

export type EquationTransition = {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly operation: EquationTransitionOperation;
  readonly tokens: readonly EquationTransitionToken[];
  readonly sourceAnnotations: readonly EquationMotionAnnotation[];
  readonly targetAnnotations: readonly EquationMotionAnnotation[];
  readonly correspondenceMap?: CorrespondenceMap;
  readonly selectorPaths?: EquationTransitionSelectorPaths;
};

const latexByMotionId = {
  "lhs.x": "x",
  "lhs.plus": "+",
  "lhs.3": "3",
  equals: "=",
  "rhs.7": "7",
  "lhs.inverse.minus": "-",
  "lhs.inverse.3": "3",
  "rhs.inverse.minus": "-",
  "rhs.inverse.3": "3",
  "rhs.4": "4"
} as const;

type KnownMotionId = keyof typeof latexByMotionId;

const subtractBothSidesTokens: EquationTransitionToken[] = [
  token("lhs.x", "persist", "lhs.x", "lhs.x"),
  token("lhs.plus", "persist", "lhs.plus", "lhs.plus"),
  token("lhs.3", "persist", "lhs.3", "lhs.3"),
  token("lhs.inverse.minus", "inverse-enter", undefined, "lhs.inverse.minus"),
  token("lhs.inverse.3", "inverse-enter", undefined, "lhs.inverse.3"),
  token("equals", "persist", "equals", "equals"),
  token("rhs.7", "persist", "rhs.7", "rhs.7"),
  token("rhs.inverse.minus", "inverse-enter", undefined, "rhs.inverse.minus"),
  token("rhs.inverse.3", "inverse-enter", undefined, "rhs.inverse.3")
];

const initialEquationSelectorPaths = {
  "lhs.x": "equation.left.left",
  "lhs.plus": "equation.left.operator",
  "lhs.3": "equation.left.right",
  equals: "equation.relation",
  "rhs.7": "equation.right"
} as const;

const expandedEquationSelectorPaths = {
  "lhs.x": "equation.left.left.left",
  "lhs.plus": "equation.left.left.operator",
  "lhs.3": "equation.left.left.right",
  "lhs.inverse.minus": "equation.left.operator",
  "lhs.inverse.3": "equation.left.right",
  equals: "equation.relation",
  "rhs.7": "equation.right.left",
  "rhs.inverse.minus": "equation.right.operator",
  "rhs.inverse.3": "equation.right.right"
} as const;

const leftSimplifiedEquationSelectorPaths = {
  "lhs.x": "equation.left",
  equals: "equation.relation",
  "rhs.7": "equation.right.left",
  "rhs.inverse.minus": "equation.right.operator",
  "rhs.inverse.3": "equation.right.right"
} as const;

const fullySimplifiedEquationSelectorPaths = {
  "lhs.x": "equation.left",
  equals: "equation.relation",
  "rhs.4": "equation.right"
} as const;

const subtractBothSidesCorrespondenceMap: CorrespondenceMap = {
  id: "linear-equation.subtract-both-sides.3",
  records: [
    identityRecord("lhs.x"),
    identityRecord("lhs.plus"),
    identityRecord("lhs.3"),
    identityRecord("equals"),
    identityRecord("rhs.7"),
    correspondenceRecord(
      "introduction.lhs.inverse.minus",
      "introduction",
      [],
      ["lhs.inverse.minus"],
      "lhs.inverse.minus is introduced by subtractBothSides"
    ),
    correspondenceRecord(
      "introduction.lhs.inverse.3",
      "introduction",
      [],
      ["lhs.inverse.3"],
      "lhs.inverse.3 is introduced by subtractBothSides"
    ),
    correspondenceRecord(
      "introduction.rhs.inverse.minus",
      "introduction",
      [],
      ["rhs.inverse.minus"],
      "rhs.inverse.minus is introduced by subtractBothSides"
    ),
    correspondenceRecord(
      "introduction.rhs.inverse.3",
      "introduction",
      [],
      ["rhs.inverse.3"],
      "rhs.inverse.3 is introduced by subtractBothSides"
    )
  ]
};

const simplifyLeftTokens: EquationTransitionToken[] = [
  token("lhs.x", "persist", "lhs.x", "lhs.x"),
  token("lhs.plus", "cancel", "lhs.plus", undefined),
  token("lhs.3", "cancel", "lhs.3", undefined),
  token("lhs.inverse.minus", "cancel", "lhs.inverse.minus", undefined),
  token("lhs.inverse.3", "cancel", "lhs.inverse.3", undefined),
  token("equals", "persist", "equals", "equals"),
  token("rhs.7", "persist", "rhs.7", "rhs.7"),
  token("rhs.inverse.minus", "persist", "rhs.inverse.minus", "rhs.inverse.minus"),
  token("rhs.inverse.3", "persist", "rhs.inverse.3", "rhs.inverse.3")
];

const simplifyLeftCorrespondenceMap: CorrespondenceMap = {
  id: "linear-equation.cancel-left-additive-inverse",
  records: [
    identityRecord("lhs.x"),
    correspondenceRecord(
      "cancelation.lhs.additive-inverse",
      "cancelation",
      ["lhs.plus", "lhs.3", "lhs.inverse.minus", "lhs.inverse.3"],
      [],
      "left additive inverse cancels"
    ),
    identityRecord("equals"),
    identityRecord("rhs.7"),
    identityRecord("rhs.inverse.minus"),
    identityRecord("rhs.inverse.3")
  ]
};

const simplifyRightTokens: EquationTransitionToken[] = [
  token("lhs.x", "persist", "lhs.x", "lhs.x"),
  token("equals", "persist", "equals", "equals"),
  token("rhs.7", "simplify-into", "rhs.7", undefined),
  token("rhs.inverse.minus", "simplify-into", "rhs.inverse.minus", undefined),
  token("rhs.inverse.3", "simplify-into", "rhs.inverse.3", undefined),
  token("rhs.4", "enter", undefined, "rhs.4")
];

const simplifyRightCorrespondenceMap: CorrespondenceMap = {
  id: "linear-equation.evaluate-right-constant-difference",
  records: [
    identityRecord("lhs.x"),
    identityRecord("equals"),
    correspondenceRecord(
      "fan-in.rhs.constant-difference",
      "fan-in",
      ["rhs.7", "rhs.inverse.minus", "rhs.inverse.3"],
      ["rhs.4"],
      "7 - 3 simplifies to 4"
    )
  ]
};

export const createEquationOperationTransition = (
  input: EquationOperationInput
): EquationTransition => {
  const operation = input.operation;

  if (
    input.sourceLatex === "x + 3 = 7" &&
    operation.kind === "subtractBothSides" &&
    operation.valueLatex === "3"
  ) {
    return transition({
      sourceLatex: input.sourceLatex,
      targetLatex: "x + 3 - 3 = 7 - 3",
      operation,
      tokens: subtractBothSidesTokens,
      correspondenceMap: subtractBothSidesCorrespondenceMap,
      selectorPaths: {
        source: initialEquationSelectorPaths,
        target: expandedEquationSelectorPaths
      }
    });
  }

  if (operation.kind === "subtractBothSides") {
    const generatedTransition = createSimpleSubtractBothSidesTransition(
      input.sourceLatex,
      operation
    );

    if (generatedTransition !== undefined) {
      return generatedTransition;
    }
  }

  if (
    input.sourceLatex === "x + 3 - 3 = 7 - 3" &&
    operation.kind === "simplifySide" &&
    operation.side === "left" &&
    operation.rule === "cancel-additive-inverse"
  ) {
    return transition({
      sourceLatex: input.sourceLatex,
      targetLatex: "x = 7 - 3",
      operation,
      tokens: simplifyLeftTokens,
      correspondenceMap: simplifyLeftCorrespondenceMap,
      selectorPaths: {
        source: expandedEquationSelectorPaths,
        target: leftSimplifiedEquationSelectorPaths
      }
    });
  }

  if (
    operation.kind === "simplifySide" &&
    operation.side === "left" &&
    operation.rule === "cancel-additive-inverse"
  ) {
    const generatedTransition = createSimpleCancelAdditiveInverseTransition(
      input.sourceLatex,
      operation
    );

    if (generatedTransition !== undefined) {
      return generatedTransition;
    }
  }

  if (
    input.sourceLatex === "x = 7 - 3" &&
    operation.kind === "simplifySide" &&
    operation.side === "right" &&
    operation.rule === "evaluate-constant-difference"
  ) {
    return transition({
      sourceLatex: input.sourceLatex,
      targetLatex: "x = 4",
      operation,
      tokens: simplifyRightTokens,
      correspondenceMap: simplifyRightCorrespondenceMap,
      selectorPaths: {
        source: leftSimplifiedEquationSelectorPaths,
        target: fullySimplifiedEquationSelectorPaths
      }
    });
  }

  if (
    operation.kind === "simplifySide" &&
    operation.side === "right" &&
    operation.rule === "evaluate-constant-difference"
  ) {
    const generatedTransition = createSimpleEvaluateConstantDifferenceTransition(
      input.sourceLatex,
      operation
    );

    if (generatedTransition !== undefined) {
      return generatedTransition;
    }
  }

  throw new Error("Unsupported equation operation transition.");
};

function token(
  id: KnownMotionId,
  lifecycle: EquationTokenLifecycle,
  sourceMotionId: KnownMotionId | undefined,
  targetMotionId: KnownMotionId | undefined
): EquationTransitionToken {
  const sourceLatex =
    sourceMotionId === undefined ? undefined : textForMotionId(sourceMotionId);
  const targetLatex =
    targetMotionId === undefined ? undefined : textForMotionId(targetMotionId);

  return {
    id,
    lifecycle,
    label: textForMotionId(id),
    ...(sourceMotionId === undefined ? {} : { sourceMotionId }),
    ...(targetMotionId === undefined ? {} : { targetMotionId }),
    ...(sourceLatex === undefined ? {} : { sourceLatex }),
    ...(targetLatex === undefined ? {} : { targetLatex })
  };
}

function dynamicToken(
  id: SemanticId,
  lifecycle: EquationTokenLifecycle,
  label: string,
  sourceMotionId: SemanticId | undefined,
  targetMotionId: SemanticId | undefined
): EquationTransitionToken {
  return {
    id,
    lifecycle,
    label,
    ...(sourceMotionId === undefined ? {} : { sourceMotionId }),
    ...(targetMotionId === undefined ? {} : { targetMotionId }),
    ...(sourceMotionId === undefined ? {} : { sourceLatex: label }),
    ...(targetMotionId === undefined ? {} : { targetLatex: label })
  };
}

function createSimpleSubtractBothSidesTransition(
  sourceLatex: string,
  operation: Extract<EquationOperation, { kind: "subtractBothSides" }>
): EquationTransition | undefined {
  const equation = parseLatexEquation(sourceLatex);
  const valueExpression = parseLatexExpression(operation.valueLatex);

  if (
    equation.left.kind !== "identifier" ||
    equation.right.kind !== "number" ||
    valueExpression.kind !== "number"
  ) {
    return undefined;
  }

  const lhsLabel = equation.left.name;
  const rhsLabel = formatParsedNumber(equation.right);
  const valueLabel = formatParsedNumber(valueExpression);
  const lhsId = `lhs.${motionIdSegment(lhsLabel)}`;
  const rhsId = `rhs.${motionIdSegment(rhsLabel)}`;
  const lhsValueId = `lhs.inverse.${motionIdSegment(valueLabel)}`;
  const rhsValueId = `rhs.inverse.${motionIdSegment(valueLabel)}`;
  const tokens: EquationTransitionToken[] = [
    dynamicToken(lhsId, "persist", lhsLabel, lhsId, lhsId),
    dynamicToken(
      "lhs.inverse.minus",
      "inverse-enter",
      "-",
      undefined,
      "lhs.inverse.minus"
    ),
    dynamicToken(lhsValueId, "inverse-enter", valueLabel, undefined, lhsValueId),
    dynamicToken("equals", "persist", "=", "equals", "equals"),
    dynamicToken(rhsId, "persist", rhsLabel, rhsId, rhsId),
    dynamicToken(
      "rhs.inverse.minus",
      "inverse-enter",
      "-",
      undefined,
      "rhs.inverse.minus"
    ),
    dynamicToken(rhsValueId, "inverse-enter", valueLabel, undefined, rhsValueId)
  ];

  return transition({
    sourceLatex,
    targetLatex: `${lhsLabel} - ${valueLabel} = ${rhsLabel} - ${valueLabel}`,
    operation,
    tokens,
    correspondenceMap: {
      id: `equation.subtract-both-sides.${motionIdSegment(sourceLatex)}.minus-${motionIdSegment(valueLabel)}`,
      records: [
        identityRecord(lhsId),
        identityRecord("equals"),
        identityRecord(rhsId),
        correspondenceRecord(
          "introduction.lhs.inverse.minus",
          "introduction",
          [],
          ["lhs.inverse.minus"],
          "lhs.inverse.minus is introduced by subtractBothSides"
        ),
        correspondenceRecord(
          `introduction.${lhsValueId}`,
          "introduction",
          [],
          [lhsValueId],
          `${lhsValueId} is introduced by subtractBothSides`
        ),
        correspondenceRecord(
          "introduction.rhs.inverse.minus",
          "introduction",
          [],
          ["rhs.inverse.minus"],
          "rhs.inverse.minus is introduced by subtractBothSides"
        ),
        correspondenceRecord(
          `introduction.${rhsValueId}`,
          "introduction",
          [],
          [rhsValueId],
          `${rhsValueId} is introduced by subtractBothSides`
        )
      ]
    },
    selectorPaths: {
      source: {
        [lhsId]: "equation.left",
        equals: "equation.relation",
        [rhsId]: "equation.right"
      },
      target: {
        [lhsId]: "equation.left.left",
        "lhs.inverse.minus": "equation.left.operator",
        [lhsValueId]: "equation.left.right",
        equals: "equation.relation",
        [rhsId]: "equation.right.left",
        "rhs.inverse.minus": "equation.right.operator",
        [rhsValueId]: "equation.right.right"
      }
    }
  });
}

function createSimpleCancelAdditiveInverseTransition(
  sourceLatex: string,
  operation: Extract<EquationOperation, { kind: "simplifySide" }>
): EquationTransition | undefined {
  const equation = parseLatexEquation(sourceLatex);

  if (
    equation.left.kind !== "binary" ||
    equation.left.operator !== "-" ||
    equation.left.left.kind !== "binary" ||
    equation.left.left.operator !== "+" ||
    equation.left.left.left.kind !== "identifier" ||
    equation.left.left.right.kind !== "number" ||
    equation.left.right.kind !== "number" ||
    equation.left.left.right.value !== equation.left.right.value ||
    equation.right.kind !== "binary" ||
    equation.right.operator !== "-" ||
    equation.right.left.kind !== "number" ||
    equation.right.right.kind !== "number"
  ) {
    return undefined;
  }

  const lhsLabel = equation.left.left.left.name;
  const cancelValueLabel = formatParsedNumber(equation.left.right);
  const rhsLabel = formatParsedNumber(equation.right.left);
  const rhsValueLabel = formatParsedNumber(equation.right.right);
  const lhsId = `lhs.${motionIdSegment(lhsLabel)}`;
  const lhsValueId = `lhs.${motionIdSegment(cancelValueLabel)}`;
  const lhsInverseValueId = `lhs.inverse.${motionIdSegment(cancelValueLabel)}`;
  const rhsId = `rhs.${motionIdSegment(rhsLabel)}`;
  const rhsValueId = `rhs.inverse.${motionIdSegment(rhsValueLabel)}`;
  const tokens: EquationTransitionToken[] = [
    dynamicToken(lhsId, "persist", lhsLabel, lhsId, lhsId),
    dynamicToken("lhs.plus", "cancel", "+", "lhs.plus", undefined),
    dynamicToken(lhsValueId, "cancel", cancelValueLabel, lhsValueId, undefined),
    dynamicToken(
      "lhs.inverse.minus",
      "cancel",
      "-",
      "lhs.inverse.minus",
      undefined
    ),
    dynamicToken(
      lhsInverseValueId,
      "cancel",
      cancelValueLabel,
      lhsInverseValueId,
      undefined
    ),
    dynamicToken("equals", "persist", "=", "equals", "equals"),
    dynamicToken(rhsId, "persist", rhsLabel, rhsId, rhsId),
    dynamicToken(
      "rhs.inverse.minus",
      "persist",
      "-",
      "rhs.inverse.minus",
      "rhs.inverse.minus"
    ),
    dynamicToken(
      rhsValueId,
      "persist",
      rhsValueLabel,
      rhsValueId,
      rhsValueId
    )
  ];

  return transition({
    sourceLatex,
    targetLatex: `${lhsLabel} = ${rhsLabel} - ${rhsValueLabel}`,
    operation,
    tokens,
    correspondenceMap: {
      id: `equation.cancel-additive-inverse.${motionIdSegment(sourceLatex)}`,
      records: [
        identityRecord(lhsId),
        correspondenceRecord(
          "cancelation.lhs.additive-inverse",
          "cancelation",
          ["lhs.plus", lhsValueId, "lhs.inverse.minus", lhsInverseValueId],
          [],
          "left additive inverse cancels"
        ),
        identityRecord("equals"),
        identityRecord(rhsId),
        identityRecord("rhs.inverse.minus"),
        identityRecord(rhsValueId)
      ]
    },
    selectorPaths: {
      source: {
        [lhsId]: "equation.left.left.left",
        "lhs.plus": "equation.left.left.operator",
        [lhsValueId]: "equation.left.left.right",
        "lhs.inverse.minus": "equation.left.operator",
        [lhsInverseValueId]: "equation.left.right",
        equals: "equation.relation",
        [rhsId]: "equation.right.left",
        "rhs.inverse.minus": "equation.right.operator",
        [rhsValueId]: "equation.right.right"
      },
      target: {
        [lhsId]: "equation.left",
        equals: "equation.relation",
        [rhsId]: "equation.right.left",
        "rhs.inverse.minus": "equation.right.operator",
        [rhsValueId]: "equation.right.right"
      }
    }
  });
}

function createSimpleEvaluateConstantDifferenceTransition(
  sourceLatex: string,
  operation: Extract<EquationOperation, { kind: "simplifySide" }>
): EquationTransition | undefined {
  const equation = parseLatexEquation(sourceLatex);

  if (
    equation.left.kind !== "identifier" ||
    equation.right.kind !== "binary" ||
    equation.right.operator !== "-" ||
    equation.right.left.kind !== "number" ||
    equation.right.right.kind !== "number"
  ) {
    return undefined;
  }

  const result = evaluateConstantExpression(
    parsedLatexExpressionToMathExpression(equation.right)
  );

  if (result === undefined) {
    return undefined;
  }

  const lhsLabel = equation.left.name;
  const rhsLabel = formatParsedNumber(equation.right.left);
  const rhsValueLabel = formatParsedNumber(equation.right.right);
  const resultLabel = formatNumberValue(result);
  const lhsId = `lhs.${motionIdSegment(lhsLabel)}`;
  const rhsId = `rhs.${motionIdSegment(rhsLabel)}`;
  const rhsValueId = `rhs.inverse.${motionIdSegment(rhsValueLabel)}`;
  const resultId = `rhs.${motionIdSegment(resultLabel)}`;
  const tokens: EquationTransitionToken[] = [
    dynamicToken(lhsId, "persist", lhsLabel, lhsId, lhsId),
    dynamicToken("equals", "persist", "=", "equals", "equals"),
    dynamicToken(rhsId, "simplify-into", rhsLabel, rhsId, undefined),
    dynamicToken(
      "rhs.inverse.minus",
      "simplify-into",
      "-",
      "rhs.inverse.minus",
      undefined
    ),
    dynamicToken(
      rhsValueId,
      "simplify-into",
      rhsValueLabel,
      rhsValueId,
      undefined
    ),
    dynamicToken(resultId, "enter", resultLabel, undefined, resultId)
  ];

  return transition({
    sourceLatex,
    targetLatex: `${lhsLabel} = ${resultLabel}`,
    operation,
    tokens,
    correspondenceMap: {
      id: `equation.evaluate-constant-difference.${motionIdSegment(sourceLatex)}`,
      records: [
        identityRecord(lhsId),
        identityRecord("equals"),
        correspondenceRecord(
          "fan-in.rhs.constant-difference",
          "fan-in",
          [rhsId, "rhs.inverse.minus", rhsValueId],
          [resultId],
          `${rhsLabel} - ${rhsValueLabel} simplifies to ${resultLabel}`
        )
      ]
    },
    selectorPaths: {
      source: {
        [lhsId]: "equation.left",
        equals: "equation.relation",
        [rhsId]: "equation.right.left",
        "rhs.inverse.minus": "equation.right.operator",
        [rhsValueId]: "equation.right.right"
      },
      target: {
        [lhsId]: "equation.left",
        equals: "equation.relation",
        [resultId]: "equation.right"
      }
    }
  });
}

function transition(input: {
  sourceLatex: string;
  targetLatex: string;
  operation: EquationOperation;
  tokens: readonly EquationTransitionToken[];
  correspondenceMap: CorrespondenceMap;
  selectorPaths: EquationTransitionSelectorPaths;
}): EquationTransition {
  return {
    sourceLatex: input.sourceLatex,
    targetLatex: input.targetLatex,
    operation: cloneOperation(input.operation),
    tokens: input.tokens.map((transitionToken) => ({ ...transitionToken })),
    sourceAnnotations: annotationsFor("sourceMotionId", input.tokens),
    targetAnnotations: annotationsFor("targetMotionId", input.tokens),
    correspondenceMap: cloneCorrespondenceMap(input.correspondenceMap),
    selectorPaths: cloneSelectorPaths(input.selectorPaths)
  };
}

function cloneSelectorPaths(
  selectorPaths: EquationTransitionSelectorPaths
): EquationTransitionSelectorPaths {
  return {
    source: { ...selectorPaths.source },
    target: { ...selectorPaths.target }
  };
}

function identityRecord(selectorId: SemanticId): CorrespondenceMap["records"][number] {
  return correspondenceRecord(
    `identity.${selectorId}`,
    "identity",
    [selectorId],
    [selectorId],
    `${selectorId} persists`
  );
}

function correspondenceRecord(
  id: string,
  relation: SelectorCorrespondenceRelationId,
  sourceSelectorIds: readonly SemanticId[],
  targetSelectorIds: readonly SemanticId[],
  summary: string
): CorrespondenceMap["records"][number] {
  return {
    id,
    relation,
    sourceSelectorIds,
    targetSelectorIds,
    summary
  };
}

function annotationsFor(
  side: "sourceMotionId" | "targetMotionId",
  tokens: readonly EquationTransitionToken[]
): EquationMotionAnnotation[] {
  const motionIds = new Set<SemanticId>();
  const textByMotionId = new Map<SemanticId, string>();

  for (const transitionToken of tokens) {
    const motionId = transitionToken[side];
    if (motionId !== undefined) {
      motionIds.add(motionId);
      textByMotionId.set(
        motionId,
        (side === "sourceMotionId"
          ? transitionToken.sourceLatex
          : transitionToken.targetLatex) ?? transitionToken.label
      );
    }
  }

  return [...motionIds].map((motionId) => ({
    motionId,
    text: textByMotionId.get(motionId) ?? textForMotionId(motionId)
  }));
}

function formatParsedNumber(
  expression: Extract<ParsedLatexExpression, { kind: "number" }>
): string {
  return formatNumberValue(expression.value);
}

function formatNumberValue(value: number): string {
  return String(value);
}

function motionIdSegment(value: string): string {
  const trimmed = value.trim();
  const normalized = trimmed.startsWith("-")
    ? `minus-${trimmed.slice(1)}`
    : trimmed;

  return normalized.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function textForMotionId(motionId: SemanticId): string {
  if (motionId in latexByMotionId) {
    return latexByMotionId[motionId as KnownMotionId];
  }

  throw new Error(`Unknown equation motion id: ${motionId}`);
}

function cloneOperation(
  operation: EquationTransitionOperation
): EquationTransitionOperation {
  return { ...operation };
}
