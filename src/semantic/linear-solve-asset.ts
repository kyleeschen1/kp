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
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf,
  type KpSemanticDiagramSequence
} from "./asset-diagram.ts";
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

  return {
    sourceAnimationId: "linear-equation-solve-x",
    bundle,
    transformations,
    diagram
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
