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
  readonly renderLatex?: string | undefined;
  readonly structuralMotionAnnotations?:
    | readonly EquationAnimationStructuralMotionAnnotation[]
    | undefined;
  readonly annotations: readonly EquationMotionAnnotation[];
}

export interface EquationAnimationStructuralMotionAnnotation {
  readonly selector: "frac-line";
  readonly motionId: string;
}

export interface EquationAnimationCatalogEntry {
  readonly id: EquationAnimationId;
  readonly label: string;
  readonly fixtureId?: string | undefined;
  readonly summary: string;
  readonly transitions: readonly EquationTransition[];
  readonly states: readonly EquationAnimationState[];
  readonly beatCount: number;
  readonly defaultDurationMs: number;
  readonly defaultCollapseScalePercent: number;
}

export const DEFAULT_EQUATION_ANIMATION_ID: EquationAnimationId =
  "linear-equation-solve-x";
const EQUATION_ANIMATION_BEAT_LABEL_COUNT = 50;
const EQUATION_ANIMATION_DEFAULT_DURATION_MS = 1200;

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

export function findEquationAnimationForFixtureId(
  fixtureId: string
): EquationAnimationCatalogEntry | undefined {
  return equationAnimationCatalogEntries.find(
    (candidate) => candidate.fixtureId === fixtureId
  );
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
    beatCount: EQUATION_ANIMATION_BEAT_LABEL_COUNT,
    defaultDurationMs: EQUATION_ANIMATION_DEFAULT_DURATION_MS,
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
    fixtureId: input.fixtureId,
    summary: fixture.summary,
    transitions: [transition],
    states: [
      createFixtureAnimationState(fixture, transition, "source"),
      createFixtureAnimationState(fixture, transition, "target")
    ],
    beatCount: EQUATION_ANIMATION_BEAT_LABEL_COUNT,
    defaultDurationMs: EQUATION_ANIMATION_DEFAULT_DURATION_MS,
    defaultCollapseScalePercent: 35
  };
}

function createFixtureAnimationState(
  fixture: KatexTransformFixture,
  transition: EquationTransition,
  side: "source" | "target"
): EquationAnimationState {
  const annotations =
    side === "source"
      ? transition.sourceAnnotations
      : transition.targetAnnotations;

  return {
    step: side === "source" ? 0 : 1,
    latex: side === "source" ? transition.sourceLatex : transition.targetLatex,
    ...fixtureAnimationRenderMetadata(fixture.id, side),
    annotations
  };
}

function fixtureAnimationRenderMetadata(
  fixtureId: string,
  side: "source" | "target"
): Pick<
  EquationAnimationState,
  "renderLatex" | "structuralMotionAnnotations"
> {
  if (fixtureId === "fraction.make.inline-to-stacked") {
    if (side === "source") {
      return {
        renderLatex: [
          motionDataLatex(`${fixtureId}.source.x`, "x"),
          motionDataLatex(`${fixtureId}.source.slash`, "/"),
          motionDataLatex(`${fixtureId}.source.3`, "3")
        ].join("\\;")
      };
    }

    return {
      renderLatex: `\\frac{${motionDataLatex(`${fixtureId}.target.x`, "x")}}{${motionDataLatex(`${fixtureId}.target.3`, "3")}}`,
      structuralMotionAnnotations: [
        {
          selector: "frac-line",
          motionId: `${fixtureId}.target.frac-line`
        }
      ]
    };
  }

  if (fixtureId === "script.combine-factor-as-power") {
    if (side === "source") {
      return {
        renderLatex: [
          motionDataLatex(`${fixtureId}.source.base`, "x"),
          motionDataLatex(`${fixtureId}.source.dot`, "\\cdot"),
          motionDataLatex(`${fixtureId}.source.factor`, "x")
        ].join("\\;")
      };
    }

    return {
      renderLatex: `${motionDataLatex(`${fixtureId}.target.base`, "x")}^{${motionDataLatex(`${fixtureId}.target.exponent`, "2")}}`
    };
  }

  if (fixtureId === "wrapper.function.wrap") {
    if (side === "source") {
      return {
        renderLatex: motionDataLatex(`${fixtureId}.source.x`, "x")
      };
    }

    return {
      renderLatex: [
        motionDataLatex(`${fixtureId}.target.f`, "f"),
        motionDataLatex(`${fixtureId}.target.open-paren`, "("),
        motionDataLatex(`${fixtureId}.target.x`, "x"),
        motionDataLatex(`${fixtureId}.target.close-paren`, ")")
      ].join("")
    };
  }

  if (fixtureId === "matrix.bracket.change-delimiter") {
    return {
      renderLatex:
        side === "source"
          ? matrixBracketSwapLatex(
              "[",
              "]",
              [
                [`${fixtureId}.source.entry.r0.c0`, "1"],
                [`${fixtureId}.source.entry.r0.c1`, "0"]
              ],
              [
                [`${fixtureId}.source.entry.r1.c0`, "0"],
                [`${fixtureId}.source.entry.r1.c1`, "1"]
              ],
              `${fixtureId}.source.left-bracket`,
              `${fixtureId}.source.right-bracket`
            )
          : matrixBracketSwapLatex(
              "(",
              ")",
              [
                [`${fixtureId}.target.entry.r0.c0`, "1"],
                [`${fixtureId}.target.entry.r0.c1`, "0"]
              ],
              [
                [`${fixtureId}.target.entry.r1.c0`, "0"],
                [`${fixtureId}.target.entry.r1.c1`, "1"]
              ],
              `${fixtureId}.target.left-bracket`,
              `${fixtureId}.target.right-bracket`
            )
    };
  }

  return {};
}

function motionDataLatex(motionId: string, latex: string): string {
  return `\\htmlData{kp-motion-id=${motionId}}{${latex}}`;
}

function matrixBracketSwapLatex(
  leftDelimiter: "[" | "(",
  rightDelimiter: "]" | ")",
  firstRow: readonly [
    readonly [motionId: string, latex: string],
    readonly [motionId: string, latex: string]
  ],
  secondRow: readonly [
    readonly [motionId: string, latex: string],
    readonly [motionId: string, latex: string]
  ],
  leftMotionId: string,
  rightMotionId: string
): string {
  const leftLatex = leftDelimiter === "[" ? "\\Bigl[" : "\\Bigl(";
  const rightLatex = rightDelimiter === "]" ? "\\Bigr]" : "\\Bigr)";
  const renderRow = (
    row: readonly [
      readonly [motionId: string, latex: string],
      readonly [motionId: string, latex: string]
    ]
  ): string =>
    row
      .map(([motionId, latex]) => motionDataLatex(motionId, latex))
      .join(" & ");

  return [
    motionDataLatex(leftMotionId, leftLatex),
    "\\begin{matrix}",
    renderRow(firstRow),
    "\\\\",
    renderRow(secondRow),
    "\\end{matrix}",
    motionDataLatex(rightMotionId, rightLatex)
  ].join("");
}

function createFixtureEquationTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  if (fixture.id === "fraction.make.inline-to-stacked") {
    return createInlineFractionFixtureTransition(fixture);
  }

  if (fixture.id === "script.combine-factor-as-power") {
    return createRepeatedFactorFixtureTransition(fixture);
  }

  if (fixture.id === "wrapper.function.wrap") {
    return createFunctionWrapFixtureTransition(fixture);
  }

  if (fixture.id === "matrix.bracket.change-delimiter") {
    return createMatrixBracketSwapFixtureTransition(fixture);
  }

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

function createInlineFractionFixtureTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  const sourceX = `${fixture.id}.source.x`;
  const sourceSlash = `${fixture.id}.source.slash`;
  const sourceThree = `${fixture.id}.source.3`;
  const targetX = `${fixture.id}.target.x`;
  const targetLine = `${fixture.id}.target.frac-line`;
  const targetThree = `${fixture.id}.target.3`;

  return {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: fixtureOperation(fixture),
    tokens: [
      fixtureTransitionToken(`${fixture.id}.x`, "move", "x", sourceX, targetX),
      fixtureTransitionToken(
        `${fixture.id}.slash`,
        "exit",
        "/",
        sourceSlash,
        undefined
      ),
      fixtureTransitionToken(
        `${fixture.id}.3`,
        "move",
        "3",
        sourceThree,
        targetThree
      ),
      fixtureTransitionToken(
        `${fixture.id}.frac-line`,
        "enter",
        "structural:frac-line",
        undefined,
        targetLine
      )
    ],
    sourceAnnotations: [
      { motionId: sourceX, text: "x" },
      { motionId: sourceSlash, text: "/" },
      { motionId: sourceThree, text: "3" }
    ],
    targetAnnotations: [
      { motionId: targetX, text: "x" },
      { motionId: targetLine, text: "structural:frac-line" },
      { motionId: targetThree, text: "3" }
    ],
    correspondenceMap: {
      id: `${fixture.id}.fixture-animation`,
      records: [
        {
          id: `${fixture.id}.identity.x`,
          relation: "identity",
          sourceSelectorIds: [sourceX],
          targetSelectorIds: [targetX],
          summary: "x persists into the numerator"
        },
        {
          id: `${fixture.id}.identity.3`,
          relation: "identity",
          sourceSelectorIds: [sourceThree],
          targetSelectorIds: [targetThree],
          summary: "3 persists into the denominator"
        },
        {
          id: `${fixture.id}.removal.slash`,
          relation: "removal",
          sourceSelectorIds: [sourceSlash],
          targetSelectorIds: [],
          summary: "inline slash fades because it has no semantic persistence"
        },
        {
          id: `${fixture.id}.artifact.frac-line`,
          relation: "artifact",
          sourceSelectorIds: [],
          targetSelectorIds: [targetLine],
          summary: "fraction line fades in as a visual artifact"
        }
      ]
    },
    selectorPaths: {
      source: {
        [sourceX]: `${fixture.id}.source.tokens.0`,
        [sourceSlash]: `${fixture.id}.source.tokens.1`,
        [sourceThree]: `${fixture.id}.source.tokens.2`
      },
      target: {
        [targetX]: `${fixture.id}.target.tokens.0`,
        [targetLine]: `${fixture.id}.target.tokens.1`,
        [targetThree]: `${fixture.id}.target.tokens.2`
      }
    }
  };
}

function createRepeatedFactorFixtureTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  const sourceBase = `${fixture.id}.source.base`;
  const sourceDot = `${fixture.id}.source.dot`;
  const sourceFactor = `${fixture.id}.source.factor`;
  const targetBase = `${fixture.id}.target.base`;
  const targetExponent = `${fixture.id}.target.exponent`;

  return {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: fixtureOperation(fixture),
    tokens: [
      fixtureTransitionToken(
        `${fixture.id}.base`,
        "persist",
        "x",
        sourceBase,
        targetBase
      ),
      fixtureTransitionToken(
        `${fixture.id}.dot`,
        "exit",
        "\\cdot",
        sourceDot,
        undefined
      ),
      fixtureTransitionToken(
        `${fixture.id}.factor`,
        "simplify-into",
        "x",
        sourceFactor,
        undefined
      ),
      fixtureTransitionToken(
        `${fixture.id}.exponent`,
        "enter",
        "2",
        undefined,
        targetExponent
      )
    ],
    sourceAnnotations: [
      { motionId: sourceBase, text: "x" },
      { motionId: sourceDot, text: "\\cdot" },
      { motionId: sourceFactor, text: "x" }
    ],
    targetAnnotations: [
      { motionId: targetBase, text: "x" },
      { motionId: targetExponent, text: "2" }
    ],
    correspondenceMap: {
      id: `${fixture.id}.fixture-animation`,
      records: [
        {
          id: `${fixture.id}.identity.base`,
          relation: "identity",
          sourceSelectorIds: [sourceBase],
          targetSelectorIds: [targetBase],
          summary: "base x persists"
        },
        {
          id: `${fixture.id}.removal.dot`,
          relation: "removal",
          sourceSelectorIds: [sourceDot],
          targetSelectorIds: [],
          summary: "multiplication dot fades because it has no persistence"
        },
        {
          id: `${fixture.id}.fan-in.factor-to-exponent`,
          relation: "fan-in",
          sourceSelectorIds: [sourceFactor],
          targetSelectorIds: [targetExponent],
          summary: "the second factor is represented by the exponent"
        }
      ]
    },
    selectorPaths: {
      source: {
        [sourceBase]: `${fixture.id}.source.tokens.0`,
        [sourceDot]: `${fixture.id}.source.tokens.1`,
        [sourceFactor]: `${fixture.id}.source.tokens.2`
      },
      target: {
        [targetBase]: `${fixture.id}.target.tokens.0`,
        [targetExponent]: `${fixture.id}.target.tokens.1`
      }
    }
  };
}

function createFunctionWrapFixtureTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  const sourceX = `${fixture.id}.source.x`;
  const targetF = `${fixture.id}.target.f`;
  const targetOpen = `${fixture.id}.target.open-paren`;
  const targetX = `${fixture.id}.target.x`;
  const targetClose = `${fixture.id}.target.close-paren`;

  return {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: fixtureOperation(fixture),
    tokens: [
      fixtureTransitionToken(`${fixture.id}.x`, "group-wrap", "x", sourceX, targetX, {
        motion: motionTiming(0, 0.4, "ease-in-out", identityPose(), identityPose())
      }),
      fixtureTransitionToken(`${fixture.id}.f`, "enter", "f", undefined, targetF, {
        entryEffect: "direct",
        motion: motionTiming(
          0.5,
          0.78,
          "ease-out",
          { opacity: 0, x: -10, y: 0, scale: 0.35 },
          identityPose()
        )
      }),
      fixtureTransitionToken(
        `${fixture.id}.open-paren`,
        "enter",
        "(",
        undefined,
        targetOpen,
        {
          entryEffect: "direct",
          motion: motionTiming(
            0.42,
            0.7,
            "ease-in-out",
            { opacity: 0, x: -8, y: 0, scale: 1 },
            identityPose()
          )
        }
      ),
      fixtureTransitionToken(
        `${fixture.id}.close-paren`,
        "enter",
        ")",
        undefined,
        targetClose,
        {
          entryEffect: "direct",
          motion: motionTiming(
            0.42,
            0.7,
            "ease-in-out",
            { opacity: 0, x: 8, y: 0, scale: 1 },
            identityPose()
          )
        }
      )
    ],
    sourceAnnotations: [{ motionId: sourceX, text: "x" }],
    targetAnnotations: [
      { motionId: targetF, text: "f" },
      { motionId: targetOpen, text: "(" },
      { motionId: targetX, text: "x" },
      { motionId: targetClose, text: ")" }
    ],
    correspondenceMap: {
      id: `${fixture.id}.fixture-animation`,
      records: [
        {
          id: `${fixture.id}.role-change.x`,
          relation: "role-change",
          sourceSelectorIds: [sourceX],
          targetSelectorIds: [targetX],
          summary: "x moves into function argument position before wrappers enter"
        },
        {
          id: `${fixture.id}.artifact.function-name`,
          relation: "artifact",
          sourceSelectorIds: [],
          targetSelectorIds: [targetF],
          summary: "function name enters after the argument has moved"
        },
        {
          id: `${fixture.id}.artifact.parentheses`,
          relation: "artifact",
          sourceSelectorIds: [],
          targetSelectorIds: [targetOpen, targetClose],
          summary: "parentheses enter wide and settle around the argument"
        }
      ]
    },
    selectorPaths: {
      source: {
        [sourceX]: `${fixture.id}.source.tokens.0`
      },
      target: {
        [targetF]: `${fixture.id}.target.tokens.0`,
        [targetOpen]: `${fixture.id}.target.tokens.1`,
        [targetX]: `${fixture.id}.target.tokens.2`,
        [targetClose]: `${fixture.id}.target.tokens.3`
      }
    }
  };
}

function createMatrixBracketSwapFixtureTransition(
  fixture: KatexTransformFixture
): EquationTransition {
  const sourceLeft = `${fixture.id}.source.left-bracket`;
  const sourceRight = `${fixture.id}.source.right-bracket`;
  const targetLeft = `${fixture.id}.target.left-bracket`;
  const targetRight = `${fixture.id}.target.right-bracket`;
  const entries = [
    ["entry.r0.c0", "1"],
    ["entry.r0.c1", "0"],
    ["entry.r1.c0", "0"],
    ["entry.r1.c1", "1"]
  ] as const;
  const sourceEntryIds = Object.fromEntries(
    entries.map(([selector]) => [
      selector,
      `${fixture.id}.source.${selector}`
    ])
  ) as Record<(typeof entries)[number][0], string>;
  const targetEntryIds = Object.fromEntries(
    entries.map(([selector]) => [
      selector,
      `${fixture.id}.target.${selector}`
    ])
  ) as Record<(typeof entries)[number][0], string>;

  return {
    sourceLatex: fixture.source.latex,
    targetLatex: fixture.target.latex,
    operation: fixtureOperation(fixture),
    tokens: [
      ...entries.map(([selector, latex]) =>
        fixtureTransitionToken(
          `${fixture.id}.${selector}`,
          "persist",
          latex,
          sourceEntryIds[selector],
          targetEntryIds[selector]
        )
      ),
      fixtureTransitionToken(
        sourceLeft,
        "exit",
        "[",
        sourceLeft,
        undefined
      ),
      fixtureTransitionToken(
        sourceRight,
        "exit",
        "]",
        sourceRight,
        undefined
      ),
      fixtureTransitionToken(
        targetLeft,
        "enter",
        "(",
        undefined,
        targetLeft
      ),
      fixtureTransitionToken(
        targetRight,
        "enter",
        ")",
        undefined,
        targetRight
      )
    ],
    sourceAnnotations: [
      { motionId: sourceLeft, text: "[" },
      ...entries.map(([selector, latex]) => ({
        motionId: sourceEntryIds[selector],
        text: latex
      })),
      { motionId: sourceRight, text: "]" }
    ],
    targetAnnotations: [
      { motionId: targetLeft, text: "(" },
      ...entries.map(([selector, latex]) => ({
        motionId: targetEntryIds[selector],
        text: latex
      })),
      { motionId: targetRight, text: ")" }
    ],
    correspondenceMap: {
      id: `${fixture.id}.fixture-animation`,
      records: [
        ...entries.map(([selector]) => ({
          id: `${fixture.id}.identity.${selector}`,
          relation: "identity" as const,
          sourceSelectorIds: [sourceEntryIds[selector]],
          targetSelectorIds: [targetEntryIds[selector]],
          summary: `${selector} matrix entry persists while delimiters change`
        })),
        {
          id: `${fixture.id}.removal.source-brackets`,
          relation: "removal",
          sourceSelectorIds: [sourceLeft, sourceRight],
          targetSelectorIds: [],
          summary: "source square brackets fade because delimiter style changes"
        },
        {
          id: `${fixture.id}.artifact.target-brackets`,
          relation: "artifact",
          sourceSelectorIds: [],
          targetSelectorIds: [targetLeft, targetRight],
          summary: "target parentheses enter as delimiter artifacts"
        }
      ]
    },
    selectorPaths: {
      source: {
        [sourceLeft]: `${fixture.id}.source.tokens.0`,
        [sourceEntryIds["entry.r0.c0"]]: `${fixture.id}.source.tokens.1`,
        [sourceEntryIds["entry.r0.c1"]]: `${fixture.id}.source.tokens.2`,
        [sourceEntryIds["entry.r1.c0"]]: `${fixture.id}.source.tokens.3`,
        [sourceEntryIds["entry.r1.c1"]]: `${fixture.id}.source.tokens.4`,
        [sourceRight]: `${fixture.id}.source.tokens.5`
      },
      target: {
        [targetLeft]: `${fixture.id}.target.tokens.0`,
        [targetEntryIds["entry.r0.c0"]]: `${fixture.id}.target.tokens.1`,
        [targetEntryIds["entry.r0.c1"]]: `${fixture.id}.target.tokens.2`,
        [targetEntryIds["entry.r1.c0"]]: `${fixture.id}.target.tokens.3`,
        [targetEntryIds["entry.r1.c1"]]: `${fixture.id}.target.tokens.4`,
        [targetRight]: `${fixture.id}.target.tokens.5`
      }
    }
  };
}

function fixtureOperation(
  fixture: KatexTransformFixture
): EquationTransition["operation"] {
  return {
    kind: "fixtureTransform",
    fixtureId: fixture.id,
    intent: fixture.intent
  };
}

function fixtureTransitionToken(
  id: string,
  lifecycle: EquationTransitionToken["lifecycle"],
  latex: string,
  sourceMotionId: string | undefined,
  targetMotionId: string | undefined,
  options: Pick<EquationTransitionToken, "entryEffect" | "motion"> = {}
): EquationTransitionToken {
  return {
    id,
    lifecycle,
    label: latex,
    ...(options.entryEffect === undefined ? {} : { entryEffect: options.entryEffect }),
    ...(options.motion === undefined ? {} : { motion: options.motion }),
    ...(sourceMotionId === undefined ? {} : { sourceMotionId, sourceLatex: latex }),
    ...(targetMotionId === undefined ? {} : { targetMotionId, targetLatex: latex })
  };
}

function motionTiming(
  start: number,
  end: number,
  easing: NonNullable<EquationTransitionToken["motion"]>["easing"],
  from: NonNullable<EquationTransitionToken["motion"]>["from"],
  to: NonNullable<EquationTransitionToken["motion"]>["to"]
): NonNullable<EquationTransitionToken["motion"]> {
  return { start, end, easing, from, to };
}

function identityPose(): NonNullable<EquationTransitionToken["motion"]>["from"] {
  return { opacity: 1, x: 0, y: 0, scale: 1 };
}
