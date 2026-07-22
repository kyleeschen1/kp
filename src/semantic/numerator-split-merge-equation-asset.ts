import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle,
  type KpAssetSelector
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";

export interface NumeratorSplitMergeEquationKpAsset {
  readonly sourceTraceId: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
}

export const numeratorSplitMergeEquationAssetIds = {
  combined: "equation.numerator-split-merge.combined",
  split: "equation.numerator-split-merge.split",
  splitTransform: "transform.numerator-split-merge.split-sum",
  mergeTransform: "transform.numerator-split-merge.merge-sum"
} as const;

const ids = numeratorSplitMergeEquationAssetIds;
const sourceTraceId = "trace.algebra-canonical-numerator-split-merge";

/**
 * Defines the two exact algebraic endpoints independently of choreography.
 * Denominator-copy and operator-role correspondence belongs to the next slice.
 */
export function createNumeratorSplitMergeEquationKpAsset(): NumeratorSplitMergeEquationKpAsset {
  const bundle = createKpAssetBundle({
    id: "asset.numerator-split-merge-equation",
    title: "Split and merge a fraction over a numerator sum",
    objects: [
      equationState(ids.combined, "One fraction over a sum", "\\frac{2x + 6}{2}", [
        part("fraction.numerator.coefficient.2", "term", "2", "coefficient"),
        part("fraction.numerator.x", "term", "x", "variable"),
        part("fraction.numerator.plus", "operator", "+", "numerator-operator"),
        part("fraction.numerator.6", "term", "6", "constant"),
        part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
        part("fraction.denominator.2", "term", "2", "denominator")
      ]),
      equationState(
        ids.split,
        "Two fractions with a shared denominator",
        "\\frac{2x}{2} + \\frac{6}{2}",
        [
          part("left.fraction.numerator.coefficient.2", "term", "2", "coefficient"),
          part("left.fraction.numerator.x", "term", "x", "variable"),
          part("left.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("left.fraction.denominator.2", "term", "2", "denominator"),
          part("between.plus", "operator", "+", "sum-operator"),
          part("right.fraction.numerator.6", "term", "6", "constant"),
          part("right.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("right.fraction.denominator.2", "term", "2", "denominator")
        ],
        ids.combined,
        ids.splitTransform
      )
    ]
  });

  return {
    sourceTraceId,
    bundle,
    transformations: [
      transformation({
        id: ids.splitTransform,
        definitionId: "definition.symbolic.algebra.split-fraction-sum",
        transformType: "splitFractionSum",
        title: "Split the numerator sum",
        sourceObjectId: ids.combined,
        targetObjectId: ids.split,
        assumption: "Each term in the numerator shares the same non-zero denominator.",
        lawId: "law.algebra.fraction-sum-split"
      }),
      transformation({
        id: ids.mergeTransform,
        definitionId: "definition.symbolic.algebra.merge-fractions",
        transformType: "mergeFractions",
        title: "Merge fractions over the common denominator",
        sourceObjectId: ids.split,
        targetObjectId: ids.combined,
        assumption: "Both fractions have the same non-zero denominator.",
        lawId: "law.algebra.fraction-sum-merge"
      })
    ]
  };
}

interface Part {
  readonly path: string;
  readonly kind: KpAssetSelector["kind"];
  readonly label: string;
  readonly structureRole: string;
}

function part(
  path: string,
  kind: KpAssetSelector["kind"],
  label: string,
  structureRole: string
): Part {
  return { path, kind, label, structureRole };
}

function equationState(
  id: string,
  title: string,
  latex: string,
  parts: readonly Part[],
  sourceId?: string,
  transformationId?: string
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "equation",
    title,
    value: { latex },
    selectors: parts.map((partValue) => ({
      id: `${id}.${partValue.path}`,
      kind: partValue.kind,
      label: partValue.label,
      metadata: { equationStructureRole: partValue.structureRole }
    })),
    provenance: sourceId === undefined
      ? {
          kind: "authored",
          sourceIds: [sourceTraceId],
          summary: "Canonical exact fraction over a numerator sum."
        }
      : {
          kind: "transformed",
          sourceIds: [sourceId],
          transformationId
        }
  });
}

interface TransformationInput {
  readonly id: string;
  readonly definitionId: string;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly assumption: string;
  readonly lawId: string;
}

function transformation(input: TransformationInput): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: input.id,
    definitionId: input.definitionId,
    transformType: input.transformType,
    title: input.title,
    sourceObjectIds: [input.sourceObjectId],
    targetObjectIds: [input.targetObjectId],
    preserves: ["value", "structure"],
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }]
  });
}
