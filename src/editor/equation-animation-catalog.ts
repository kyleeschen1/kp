import {
  createEquationOperationTransition,
  type EquationMotionAnnotation,
  type EquationOperation
} from "../math/equation-transform.ts";

export type EquationAnimationId = "linear-equation-solve-x";

export interface EquationAnimationState {
  readonly step: number;
  readonly latex: string;
  readonly annotations: readonly EquationMotionAnnotation[];
}

export interface EquationAnimationCatalogEntry {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly summary: string;
  readonly operations: readonly EquationOperation[];
  readonly states: readonly EquationAnimationState[];
  readonly beatCount: number;
  readonly defaultDurationMs: number;
  readonly defaultCollapseScalePercent: number;
}

export const DEFAULT_EQUATION_ANIMATION_ID: EquationAnimationId =
  "linear-equation-solve-x";

export const equationAnimationCatalogEntries: readonly EquationAnimationCatalogEntry[] = [
  createLinearEquationAnimationEntry()
];

export function findEquationAnimationCatalogEntry(
  id: string
): EquationAnimationCatalogEntry {
  const entry = equationAnimationCatalogEntries.find(
    (candidate) => candidate.id === id
  );

  if (entry === undefined) {
    throw new Error(`Unknown equation animation: ${id}`);
  }

  return entry;
}

function createLinearEquationAnimationEntry(): EquationAnimationCatalogEntry {
  const subtractBothSides = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });
  const simplifyLeft = createEquationOperationTransition({
    sourceLatex: subtractBothSides.targetLatex,
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const simplifyRight = createEquationOperationTransition({
    sourceLatex: simplifyLeft.targetLatex,
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });

  return {
    id: "linear-equation-solve-x",
    label: "x + 3 = 7",
    summary: "Subtract from both sides, cancel, and simplify.",
    operations: [
      subtractBothSides.operation,
      simplifyLeft.operation,
      simplifyRight.operation
    ],
    states: [
      {
        step: 0,
        latex: subtractBothSides.sourceLatex,
        annotations: subtractBothSides.sourceAnnotations
      },
      {
        step: 1,
        latex: subtractBothSides.targetLatex,
        annotations: subtractBothSides.targetAnnotations
      },
      {
        step: 2,
        latex: simplifyLeft.targetLatex,
        annotations: simplifyLeft.targetAnnotations
      },
      {
        step: 3,
        latex: simplifyRight.targetLatex,
        annotations: simplifyRight.targetAnnotations
      }
    ],
    beatCount: 20,
    defaultDurationMs: 420,
    defaultCollapseScalePercent: 35
  };
}
