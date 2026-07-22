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
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";

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
 * Defines the exact algebra and selector lineage independently of choreography.
 * Branching records describe semantic derivation, not clone paths or timing.
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
        correspondence: splitCorrespondence(),
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
        correspondence: mergeCorrespondence(),
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
  readonly correspondence: readonly SelectorCorrespondenceRecord[];
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
    correspondenceMap: {
      id: `${input.id}.correspondence`,
      records: input.correspondence
    },
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }]
  });
}

function splitCorrespondence(): readonly SelectorCorrespondenceRecord[] {
  return [
    identity("coefficient-persists", ids.combined, "fraction.numerator.coefficient.2", ids.split, "left.fraction.numerator.coefficient.2"),
    identity("variable-persists", ids.combined, "fraction.numerator.x", ids.split, "left.fraction.numerator.x"),
    roleChange("plus-leaves-numerator", ids.combined, "fraction.numerator.plus", ids.split, "between.plus", "The numerator plus becomes the operator between the two fractions."),
    identity("constant-persists", ids.combined, "fraction.numerator.6", ids.split, "right.fraction.numerator.6"),
    record(
      "fraction-rule-bifurcates",
      "fan-out",
      selectors(ids.combined, "fraction.rule"),
      selectors(ids.split, "left.fraction.rule", "right.fraction.rule"),
      "One fraction structure derives two fraction rules."
    ),
    record(
      "denominator-copies",
      "fan-out",
      selectors(ids.combined, "fraction.denominator.2"),
      selectors(ids.split, "left.fraction.denominator.2", "right.fraction.denominator.2"),
      "The shared denominator derives one denominator for each numerator term."
    )
  ];
}

function mergeCorrespondence(): readonly SelectorCorrespondenceRecord[] {
  return [
    identity("coefficient-persists", ids.split, "left.fraction.numerator.coefficient.2", ids.combined, "fraction.numerator.coefficient.2"),
    identity("variable-persists", ids.split, "left.fraction.numerator.x", ids.combined, "fraction.numerator.x"),
    roleChange("plus-enters-numerator", ids.split, "between.plus", ids.combined, "fraction.numerator.plus", "The between-fractions plus returns to the merged numerator."),
    identity("constant-persists", ids.split, "right.fraction.numerator.6", ids.combined, "fraction.numerator.6"),
    record(
      "fraction-rules-merge",
      "fan-in",
      selectors(ids.split, "left.fraction.rule", "right.fraction.rule"),
      selectors(ids.combined, "fraction.rule"),
      "Two fraction structures derive one shared fraction rule."
    ),
    record(
      "denominators-merge",
      "fan-in",
      selectors(ids.split, "left.fraction.denominator.2", "right.fraction.denominator.2"),
      selectors(ids.combined, "fraction.denominator.2"),
      "Equal denominators derive the one shared denominator."
    )
  ];
}

function identity(
  id: string,
  sourceObjectId: string,
  sourcePath: string,
  targetObjectId: string,
  targetPath: string
): SelectorCorrespondenceRecord {
  return record(
    id,
    "identity",
    selectors(sourceObjectId, sourcePath),
    selectors(targetObjectId, targetPath),
    `${sourcePath} preserves semantic identity.`
  );
}

function roleChange(
  id: string,
  sourceObjectId: string,
  sourcePath: string,
  targetObjectId: string,
  targetPath: string,
  summary: string
): SelectorCorrespondenceRecord {
  return record(
    id,
    "role-change",
    selectors(sourceObjectId, sourcePath),
    selectors(targetObjectId, targetPath),
    summary
  );
}

function record(
  id: string,
  relation: SelectorCorrespondenceRecord["relation"],
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
): SelectorCorrespondenceRecord {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function selectors(objectId: string, ...paths: readonly string[]): readonly string[] {
  return paths.map((path) => `${objectId}.${path}`);
}
