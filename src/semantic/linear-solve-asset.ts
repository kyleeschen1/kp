import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpBehavior,
  type KpBehavior
} from "./asset-behavior.ts";
import {
  createKpTransformationDrillDownHook,
  type KpTransformationDrillDownHook
} from "./asset-decomposition.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf,
  type KpSemanticDiagramSequence
} from "./asset-diagram.ts";
import {
  createKpFlashcardSpec,
  type KpFlashcardSpec
} from "./asset-flashcard.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  createLinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSampleFrame
} from "../tutorial/linear-solve-card-sample.ts";

export interface LinearSolveKpAsset {
  readonly sourceAnimationId: "linear-equation-solve-x";
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly drillDownHooks: readonly KpTransformationDrillDownHook[];
  readonly flashcards: readonly KpFlashcardSpec[];
}

export type LinearSolveKpBehavior =
  KpBehavior<LinearSolveTutorialCardSampleFrame>;

const ids = {
  initial: "equation.linear-solve.initial",
  afterSubtract: "equation.linear-solve.after-subtract",
  leftSimplified: "equation.linear-solve.left-simplified",
  solved: "equation.linear-solve.solved",
  subtract: "transform.linear-solve.subtract-both-sides-3",
  cancel: "transform.linear-solve.cancel-left-additive-inverse",
  simplify: "transform.linear-solve.simplify-right-difference"
} as const;

export function createLinearSolveKpAssetBundle(): LinearSolveKpAsset {
  const bundle = createKpAssetBundle({
    id: "asset.linear-solve",
    title: "Solve x + 3 = 7",
    objects: [
      createKpSemanticAssetObject({
        id: ids.initial,
        objectType: "equation",
        title: "Initial equation",
        value: { latex: "x + 3 = 7" },
        selectors: [
          selector(ids.initial, "lhs.x", "term", "x"),
          selector(ids.initial, "lhs.plus3", "term", "+3"),
          selector(ids.initial, "equals", "relation", "="),
          selector(ids.initial, "rhs.7", "term", "7")
        ],
        provenance: {
          kind: "authored",
          sourceIds: ["tutorial.linear-solve.card"],
          summary: "Authored initial state for the canonical linear solve."
        }
      }),
      createKpSemanticAssetObject({
        id: ids.afterSubtract,
        objectType: "equation",
        title: "After subtracting 3 from both sides",
        value: { latex: "x + 3 - 3 = 7 - 3" },
        selectors: [
          selector(ids.afterSubtract, "lhs.x", "term", "x"),
          selector(ids.afterSubtract, "lhs.plus3", "term", "+3"),
          selector(ids.afterSubtract, "lhs.minus3", "term", "-3"),
          selector(ids.afterSubtract, "equals", "relation", "="),
          selector(ids.afterSubtract, "rhs.7", "term", "7"),
          selector(ids.afterSubtract, "rhs.minus3", "term", "-3")
        ],
        provenance: {
          kind: "transformed",
          sourceIds: [ids.initial],
          transformationId: ids.subtract
        }
      }),
      createKpSemanticAssetObject({
        id: ids.leftSimplified,
        objectType: "equation",
        title: "After cancellation",
        value: { latex: "x = 7 - 3" },
        selectors: [
          selector(ids.leftSimplified, "lhs.x", "term", "x"),
          selector(ids.leftSimplified, "equals", "relation", "="),
          selector(ids.leftSimplified, "rhs.7", "term", "7"),
          selector(ids.leftSimplified, "rhs.minus3", "term", "-3")
        ],
        provenance: {
          kind: "transformed",
          sourceIds: [ids.afterSubtract],
          transformationId: ids.cancel
        }
      }),
      createKpSemanticAssetObject({
        id: ids.solved,
        objectType: "equation",
        title: "Solved equation",
        value: { latex: "x = 4" },
        selectors: [
          selector(ids.solved, "lhs.x", "term", "x"),
          selector(ids.solved, "equals", "relation", "="),
          selector(ids.solved, "rhs.4", "term", "4")
        ],
        provenance: {
          kind: "transformed",
          sourceIds: [ids.leftSimplified],
          transformationId: ids.simplify
        }
      })
    ]
  });
  const transformations = createLinearSolveTransformations();
  const diagram = createKpSemanticDiagramSequence({
    id: "diagram.linear-solve.sequence",
    title: "Linear solve sequence",
    children: transformations.map(createKpTransformationDiagramLeaf)
  });
  const drillDownHooks = createLinearSolveDrillDownHooks();
  const flashcards = createLinearSolveFlashcards();

  return {
    sourceAnimationId: "linear-equation-solve-x",
    bundle,
    transformations,
    diagram,
    drillDownHooks,
    flashcards
  };
}

export function createLinearSolveKpBehavior(): LinearSolveKpBehavior {
  const sample = createLinearSolveTutorialCardSample();

  return createKpBehavior({
    id: "behavior.linear-solve.card",
    durationMs: sample.cardSampler.parentTimeline.durationMs,
    sample: ({ progress }) => sample.sample(progress)
  });
}

function createLinearSolveTransformations(): readonly KpSemanticTransformation[] {
  return [
    createKpSemanticTransformation({
      id: ids.subtract,
      transformType: "subtractBothSides",
      title: "Subtract 3 from both sides",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      preserves: ["value", "structure"],
      assumptions: ["Subtracting equal quantities preserves equality."],
      lawRefs: [
        {
          id: "law.equation.subtract-both-sides",
          level: "strict"
        }
      ],
      correspondence: [
        correspondence(ids.initial, "lhs.x", ids.afterSubtract, "lhs.x"),
        correspondence(ids.initial, "lhs.plus3", ids.afterSubtract, "lhs.plus3"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.7", ids.afterSubtract, "rhs.7")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancel,
      transformType: "cancelAdditiveInverses",
      title: "Cancel +3 and -3 on the left",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      preserves: ["value"],
      assumptions: ["A term plus its additive inverse simplifies to zero."],
      lawRefs: [
        {
          id: "law.algebra.additive-inverse",
          level: "strict"
        }
      ],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.x", ids.leftSimplified, "lhs.x"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.7", ids.leftSimplified, "rhs.7"),
        correspondence(
          ids.afterSubtract,
          "rhs.minus3",
          ids.leftSimplified,
          "rhs.minus3"
        )
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplify,
      transformType: "simplifyConstantDifference",
      title: "Simplify 7 - 3",
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      preserves: ["value"],
      assumptions: ["7 - 3 evaluates to 4."],
      lawRefs: [
        {
          id: "law.arithmetic.constant-difference",
          level: "strict"
        }
      ],
      correspondence: [
        correspondence(ids.leftSimplified, "lhs.x", ids.solved, "lhs.x"),
        correspondence(ids.leftSimplified, "equals", ids.solved, "equals")
      ]
    })
  ];
}

function createLinearSolveFlashcards(): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: "card.linear-solve.cloze-plus3",
      kind: "cloze",
      title: "Hide the constant term",
      assetId: "asset.linear-solve",
      prompt: "What term must be removed to isolate x?",
      selectorIds: [`${ids.initial}.lhs.plus3`],
      answer: {
        kind: "text",
        value: "+3"
      }
    }),
    createKpFlashcardSpec({
      id: "card.linear-solve.predict-subtract",
      kind: "predict-next",
      title: "Predict the first transformation",
      assetId: "asset.linear-solve",
      prompt: "Which transformation preserves equality while moving toward x?",
      transformationIds: [ids.subtract],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.subtract
      }
    }),
    createKpFlashcardSpec({
      id: "card.linear-solve.explain-cancel",
      kind: "explain-transform",
      title: "Explain cancellation",
      assetId: "asset.linear-solve",
      prompt: "Why can the +3 and -3 on the left disappear?",
      objectIds: [ids.afterSubtract, ids.leftSimplified],
      transformationIds: [ids.cancel],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: "A term plus its additive inverse simplifies to zero."
      }
    }),
    createKpFlashcardSpec({
      id: "card.linear-solve.focus-x-persistence",
      kind: "focus-relationship",
      title: "Follow x through the solve",
      assetId: "asset.linear-solve",
      prompt: "Which selector represents the same unknown after solving?",
      selectorIds: [`${ids.initial}.lhs.x`, `${ids.solved}.lhs.x`],
      transformationIds: [ids.subtract, ids.cancel, ids.simplify],
      answer: {
        kind: "selector",
        value: `${ids.solved}.lhs.x`
      }
    })
  ];
}

function createLinearSolveDrillDownHooks(): readonly KpTransformationDrillDownHook[] {
  return [
    createKpTransformationDrillDownHook({
      id: "drilldown.linear-solve.cancel-additive-inverse",
      transformationId: ids.cancel,
      title: "Explain additive inverse cancellation",
      summary: "Shows why +3 and -3 collapse to zero in the linear solve.",
      asset: createKpAssetBundle({
        id: "asset.linear-solve.cancel-additive-inverse-explainer",
        title: "Why +3 and -3 cancel",
        objects: [
          createKpSemanticAssetObject({
            id: "equation.linear-solve.cancel-law.generic",
            objectType: "equation",
            title: "Additive inverse identity",
            value: { latex: "a + (-a) = 0" },
            selectors: [
              selector(
                "equation.linear-solve.cancel-law.generic",
                "lhs.a",
                "term",
                "a"
              ),
              selector(
                "equation.linear-solve.cancel-law.generic",
                "lhs.inverse",
                "term",
                "-a"
              ),
              selector(
                "equation.linear-solve.cancel-law.generic",
                "rhs.zero",
                "term",
                "0"
              )
            ],
            provenance: {
              kind: "authored",
              sourceIds: [ids.cancel],
              summary:
                "Authored drill-down identity for additive inverse cancellation."
            }
          }),
          createKpSemanticAssetObject({
            id: "equation.linear-solve.cancel-law.instantiated",
            objectType: "equation",
            title: "Cancel +3 and -3",
            value: { latex: "3 + (-3) = 0" },
            selectors: [
              selector(
                "equation.linear-solve.cancel-law.instantiated",
                "lhs.plus3",
                "term",
                "+3"
              ),
              selector(
                "equation.linear-solve.cancel-law.instantiated",
                "lhs.minus3",
                "term",
                "-3"
              ),
              selector(
                "equation.linear-solve.cancel-law.instantiated",
                "rhs.zero",
                "term",
                "0"
              )
            ],
            provenance: {
              kind: "transformed",
              sourceIds: ["equation.linear-solve.cancel-law.generic"],
              transformationId: ids.cancel,
              summary:
                "Instantiates the additive inverse identity for the +3 and -3 terms."
            }
          })
        ]
      })
    })
  ];
}

function selector(
  objectId: string,
  selectorPath: string,
  kind: string,
  label: string
) {
  return {
    id: `${objectId}.${selectorPath}`,
    kind,
    label
  };
}

function correspondence(
  sourceObjectId: string,
  sourceSelectorPath: string,
  targetObjectId: string,
  targetSelectorPath: string
) {
  return {
    sourceSelectorId: `${sourceObjectId}.${sourceSelectorPath}`,
    targetSelectorId: `${targetObjectId}.${targetSelectorPath}`,
    preserves: ["identity", "role"] as const
  };
}
