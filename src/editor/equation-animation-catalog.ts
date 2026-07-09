import {
  createEquationOperationTransition,
  type EquationMotionAnnotation,
  type EquationTransition,
  type EquationTransitionToken
} from "../math/equation-transform.ts";
import { findKatexTransformFixture } from "../rendering/katex-transform-fixtures.ts";
import type { KatexTransformFixture } from "../rendering/katex-transform-fixtures.ts";

export type EquationAnimationId =
  | "fixture-fraction-make-inline-to-stacked"
  | "fixture-matrix-bracket-change-delimiter"
  | "fixture-radical-rewrite-power-as-root"
  | "fixture-script-combine-factor-as-power"
  | "fixture-wrapper-function-wrap"
  | "linear-equation-solve-x";

export interface EquationAnimationState {
  readonly step: number;
  readonly latex: string;
  readonly annotations: readonly EquationMotionAnnotation[];
}

export interface EquationAnimationCatalogEntry {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly summary: string;
  readonly transitions: readonly EquationTransition[];
  readonly states: readonly EquationAnimationState[];
  readonly beatCount: number;
  readonly defaultDurationMs: number;
  readonly defaultCollapseScalePercent: number;
}

export const DEFAULT_EQUATION_ANIMATION_ID: EquationAnimationId =
  "linear-equation-solve-x";

export const equationAnimationCatalogEntries: readonly EquationAnimationCatalogEntry[] = [
  createLinearEquationAnimationEntry(),
  createFixtureAnimationEntry({
    id: "fixture-fraction-make-inline-to-stacked",
    label: "Inline fraction to stacked",
    fixtureId: "fraction.make.inline-to-stacked"
  }),
  createFixtureAnimationEntry({
    id: "fixture-radical-rewrite-power-as-root",
    label: "Power to radical",
    fixtureId: "radical.rewrite-power-as-root"
  }),
  createFixtureAnimationEntry({
    id: "fixture-wrapper-function-wrap",
    label: "Wrap with function",
    fixtureId: "wrapper.function.wrap"
  }),
  createFixtureAnimationEntry({
    id: "fixture-script-combine-factor-as-power",
    label: "Repeated factor to exponent",
    fixtureId: "script.combine-factor-as-power"
  }),
  createFixtureAnimationEntry({
    id: "fixture-matrix-bracket-change-delimiter",
    label: "Matrix bracket swap",
    fixtureId: "matrix.bracket.change-delimiter"
  })
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
    transitions: [subtractBothSides, simplifyLeft, simplifyRight],
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

function createFixtureAnimationEntry(input: {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly fixtureId: string;
}): EquationAnimationCatalogEntry {
  const fixture = findKatexTransformFixture(input.fixtureId);
  const transition = createFixtureEquationTransition(fixture);

  return {
    id: input.id,
    label: input.label,
    summary: fixture.summary,
    transitions: [transition],
    states: [
      {
        step: 0,
        latex: transition.sourceLatex,
        annotations: transition.sourceAnnotations
      },
      {
        step: 1,
        latex: transition.targetLatex,
        annotations: transition.targetAnnotations
      }
    ],
    beatCount: 20,
    defaultDurationMs: 420,
    defaultCollapseScalePercent: 35
  };
}

function createFixtureEquationTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  const sourceMotionId = `${fixture.id}.source.expression`;
  const targetMotionId = `${fixture.id}.target.expression`;
  const sourceToken = fixtureTransitionToken(
    `${fixture.id}.source-expression`,
    "simplify-into",
    fixture.source.latex,
    sourceMotionId,
    undefined
  );
  const targetToken = fixtureTransitionToken(
    `${fixture.id}.target-expression`,
    "enter",
    fixture.target.latex,
    undefined,
    targetMotionId
  );

  return {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: {
      kind: "fixtureTransform",
      fixtureId: fixture.id,
      intent: fixture.intent
    },
    tokens: [sourceToken, targetToken],
    sourceAnnotations: [
      {
        motionId: sourceMotionId,
        text: fixture.source.latex
      }
    ],
    targetAnnotations: [
      {
        motionId: targetMotionId,
        text: fixture.target.latex
      }
    ],
    correspondenceMap: {
      id: `${fixture.id}.fixture-animation`,
      records: [
        {
          id: `${fixture.id}.fan-in-expression`,
          relation: "fan-in",
          sourceSelectorIds: [sourceMotionId],
          targetSelectorIds: [targetMotionId],
          summary: fixture.summary
        }
      ]
    },
    selectorPaths: {
      source: {
        [sourceMotionId]: `${fixture.id}.source`
      },
      target: {
        [targetMotionId]: `${fixture.id}.target`
      }
    }
  };
}

function fixtureTransitionToken(
  id: string,
  lifecycle: EquationTransitionToken["lifecycle"],
  latex: string,
  sourceMotionId: string | undefined,
  targetMotionId: string | undefined
): EquationTransitionToken {
  return {
    id,
    lifecycle,
    label: latex,
    ...(sourceMotionId === undefined ? {} : { sourceMotionId, sourceLatex: latex }),
    ...(targetMotionId === undefined ? {} : { targetMotionId, targetLatex: latex })
  };
}
