import {
  cloneCorrespondenceMap,
  type CorrespondenceMap,
  type SelectorCorrespondenceRelationId
} from "../semantic/correspondence.ts";

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

export type EquationOperationInput = {
  readonly sourceLatex: string;
  readonly operation: EquationOperation;
};

export type EquationTransitionToken = {
  readonly id: SemanticId;
  readonly lifecycle: EquationTokenLifecycle;
  readonly label: string;
  readonly sourceMotionId?: SemanticId;
  readonly targetMotionId?: SemanticId;
  readonly sourceLatex?: string;
  readonly targetLatex?: string;
};

export type EquationMotionAnnotation = {
  readonly motionId: SemanticId;
  readonly text: string;
};

export type EquationTransition = {
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly operation: EquationOperation;
  readonly tokens: readonly EquationTransitionToken[];
  readonly sourceAnnotations: readonly EquationMotionAnnotation[];
  readonly targetAnnotations: readonly EquationMotionAnnotation[];
  readonly correspondenceMap?: CorrespondenceMap;
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
      correspondenceMap: subtractBothSidesCorrespondenceMap
    });
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
      correspondenceMap: simplifyLeftCorrespondenceMap
    });
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
      correspondenceMap: simplifyRightCorrespondenceMap
    });
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

function transition(input: {
  sourceLatex: string;
  targetLatex: string;
  operation: EquationOperation;
  tokens: readonly EquationTransitionToken[];
  correspondenceMap: CorrespondenceMap;
}): EquationTransition {
  return {
    sourceLatex: input.sourceLatex,
    targetLatex: input.targetLatex,
    operation: cloneOperation(input.operation),
    tokens: input.tokens.map((transitionToken) => ({ ...transitionToken })),
    sourceAnnotations: annotationsFor("sourceMotionId", input.tokens),
    targetAnnotations: annotationsFor("targetMotionId", input.tokens),
    correspondenceMap: cloneCorrespondenceMap(input.correspondenceMap)
  };
}

function identityRecord(selectorId: KnownMotionId): CorrespondenceMap["records"][number] {
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

  for (const transitionToken of tokens) {
    const motionId = transitionToken[side];
    if (motionId !== undefined) {
      motionIds.add(motionId);
    }
  }

  return [...motionIds].map((motionId) => ({
    motionId,
    text: textForMotionId(motionId)
  }));
}

function textForMotionId(motionId: SemanticId): string {
  if (motionId in latexByMotionId) {
    return latexByMotionId[motionId as KnownMotionId];
  }

  throw new Error(`Unknown equation motion id: ${motionId}`);
}

function cloneOperation(operation: EquationOperation): EquationOperation {
  return { ...operation };
}
