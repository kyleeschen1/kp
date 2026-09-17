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
import { isKpVerifiedLikeDenominatorCombination, type KpVerifiedLikeDenominatorCombination } from "./fraction-like-denominator-combination.ts";

export interface NumeratorSplitMergeEquationKpAsset {
  readonly sourceTraceId: string;
  readonly ids: NumeratorSplitMergeEquationAssetIds;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
}

export interface NumeratorSplitMergeEquationAssetIds {
  readonly combined: string;
  readonly split: string;
  readonly splitTransform: string;
  readonly mergeTransform: string;
}

export interface NumeratorSplitMergeEquationParameters {
  readonly idStem: string;
  readonly coefficient: number;
  readonly variable: string;
  readonly constant: number;
  readonly denominator: number;
}

export const numeratorSplitMergeEquationAssetIds:
  NumeratorSplitMergeEquationAssetIds = {
  combined: "equation.numerator-split-merge.combined",
  split: "equation.numerator-split-merge.split",
  splitTransform: "transform.numerator-split-merge.split-sum",
  mergeTransform: "transform.numerator-split-merge.merge-sum"
} as const;

const sourceTraceId = "trace.algebra-canonical-numerator-split-merge";
const defaultParameters: NumeratorSplitMergeEquationParameters = {
  idStem: "numerator-split-merge",
  coefficient: 2,
  variable: "x",
  constant: 6,
  denominator: 2
};

/**
 * Defines the exact algebra and selector lineage independently of choreography.
 * Branching records describe semantic derivation, not clone paths or timing.
 */
export function createNumeratorSplitMergeEquationKpAsset(): NumeratorSplitMergeEquationKpAsset {
  return createParameterizedNumeratorSplitMergeEquationKpAsset(
    defaultParameters
  );
}

export function createParameterizedNumeratorSplitMergeEquationKpAsset(
  input: NumeratorSplitMergeEquationParameters
): NumeratorSplitMergeEquationKpAsset {
  assertParameters(input);
  return createSplitMergeAsset(input);
}

/** Numeric callers arrive through exact fraction authority, never by inventing
 * a variable or treating arithmetic evaluation as structural merging. */
export function createVerifiedIntegerNumeratorMergeAsset(proof: KpVerifiedLikeDenominatorCombination): NumeratorSplitMergeEquationKpAsset {
  if (!isKpVerifiedLikeDenominatorCombination(proof) || proof.operator !== "+" ||
      proof.source.terms.some(term => term.numerator.value <= 0n || term.numerator.value > 1000000n || term.denominator.value > 1000000n))
    throw new TypeError("Numeric numerator merging requires issued bounded positive addition authority.");
  return createSplitMergeAsset({ idStem: proof.id, coefficient: Number(proof.source.terms[0].numerator.value),
    constant: Number(proof.source.terms[1].numerator.value), denominator: Number(proof.source.terms[0].denominator.value) });
}

type SplitMergeParameters = Omit<NumeratorSplitMergeEquationParameters, "variable"> & { readonly variable?: string };
function createSplitMergeAsset(input: SplitMergeParameters): NumeratorSplitMergeEquationKpAsset {
  const ids: NumeratorSplitMergeEquationAssetIds = {
    combined: `equation.${input.idStem}.combined`,
    split: `equation.${input.idStem}.split`,
    splitTransform: `transform.${input.idStem}.split-sum`,
    mergeTransform: `transform.${input.idStem}.merge-sum`
  };
  const paths = selectorPaths(input);
  const traceId = input.idStem === defaultParameters.idStem
    ? sourceTraceId
    : `trace.algebra-canonical-${input.idStem}`;
  const bundle = createKpAssetBundle({
    id: `asset.${input.idStem}-equation`,
    title: "Split and merge a fraction over a numerator sum",
    objects: [
      equationState(ids.combined, "One fraction over a sum",
        `\\frac{${input.coefficient}${input.variable ?? ""} + ${input.constant}}{${input.denominator}}`, [
        part(paths.combinedCoefficient, "term", String(input.coefficient), "coefficient"),
        ...(input.variable ? [part(paths.combinedVariable, "term", input.variable, "variable")] : []),
        part("fraction.numerator.plus", "operator", "+", "numerator-operator"),
        part(paths.combinedConstant, "term", String(input.constant), "constant"),
        part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
        part(paths.combinedDenominator, "term", String(input.denominator), "denominator")
      ], traceId),
      equationState(
        ids.split,
        "Two fractions with a shared denominator",
        `\\frac{${input.coefficient}${input.variable ?? ""}}{${input.denominator}} + ` +
          `\\frac{${input.constant}}{${input.denominator}}`,
        [
          part(paths.splitCoefficient, "term", String(input.coefficient), "coefficient"),
          ...(input.variable ? [part(paths.splitVariable, "term", input.variable, "variable")] : []),
          part("left.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part(paths.leftDenominator, "term", String(input.denominator), "denominator"),
          part("between.plus", "operator", "+", "sum-operator"),
          part(paths.splitConstant, "term", String(input.constant), "constant"),
          part("right.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part(paths.rightDenominator, "term", String(input.denominator), "denominator")
        ],
        traceId,
        ids.combined,
        ids.splitTransform
      )
    ]
  });

  return {
    sourceTraceId: traceId,
    ids,
    bundle,
    transformations: [
      transformation({
        id: ids.splitTransform,
        definitionId: "definition.symbolic.algebra.split-fraction-sum",
        transformType: "splitFractionSum",
        title: "Split the numerator sum",
        sourceObjectId: ids.combined,
        targetObjectId: ids.split,
        correspondence: splitCorrespondence(ids, paths).filter(record => input.variable || record.id !== "variable-persists"),
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
        correspondence: mergeCorrespondence(ids, paths).filter(record => input.variable || record.id !== "variable-persists"),
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
  traceId: string,
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
          sourceIds: [traceId],
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

interface NumeratorSplitMergeSelectorPaths {
  readonly combinedCoefficient: string;
  readonly combinedVariable: string;
  readonly combinedConstant: string;
  readonly combinedDenominator: string;
  readonly splitCoefficient: string;
  readonly splitVariable: string;
  readonly splitConstant: string;
  readonly leftDenominator: string;
  readonly rightDenominator: string;
}

function splitCorrespondence(
  ids: NumeratorSplitMergeEquationAssetIds,
  paths: NumeratorSplitMergeSelectorPaths
): readonly SelectorCorrespondenceRecord[] {
  return [
    identity("coefficient-persists", ids.combined, paths.combinedCoefficient, ids.split, paths.splitCoefficient),
    identity("variable-persists", ids.combined, paths.combinedVariable, ids.split, paths.splitVariable),
    roleChange("plus-leaves-numerator", ids.combined, "fraction.numerator.plus", ids.split, "between.plus", "The numerator plus becomes the operator between the two fractions."),
    identity("constant-persists", ids.combined, paths.combinedConstant, ids.split, paths.splitConstant),
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
      selectors(ids.combined, paths.combinedDenominator),
      selectors(ids.split, paths.leftDenominator, paths.rightDenominator),
      "The shared denominator derives one denominator for each numerator term."
    )
  ];
}

function mergeCorrespondence(
  ids: NumeratorSplitMergeEquationAssetIds,
  paths: NumeratorSplitMergeSelectorPaths
): readonly SelectorCorrespondenceRecord[] {
  return [
    identity("coefficient-persists", ids.split, paths.splitCoefficient, ids.combined, paths.combinedCoefficient),
    identity("variable-persists", ids.split, paths.splitVariable, ids.combined, paths.combinedVariable),
    roleChange("plus-enters-numerator", ids.split, "between.plus", ids.combined, "fraction.numerator.plus", "The between-fractions plus returns to the merged numerator."),
    identity("constant-persists", ids.split, paths.splitConstant, ids.combined, paths.combinedConstant),
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
      selectors(ids.split, paths.leftDenominator, paths.rightDenominator),
      selectors(ids.combined, paths.combinedDenominator),
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

function selectorPaths(
  input: SplitMergeParameters
): NumeratorSplitMergeSelectorPaths {
  return {
    combinedCoefficient:
      `fraction.numerator.coefficient.${input.coefficient}`,
    combinedVariable: `fraction.numerator.${input.variable}`,
    combinedConstant: `fraction.numerator.${input.constant}`,
    combinedDenominator: `fraction.denominator.${input.denominator}`,
    splitCoefficient:
      `left.fraction.numerator.coefficient.${input.coefficient}`,
    splitVariable: `left.fraction.numerator.${input.variable}`,
    splitConstant: `right.fraction.numerator.${input.constant}`,
    leftDenominator: `left.fraction.denominator.${input.denominator}`,
    rightDenominator: `right.fraction.denominator.${input.denominator}`
  };
}

function assertParameters(input: NumeratorSplitMergeEquationParameters): void {
  if (!/^[a-z0-9][a-z0-9.-]*$/.test(input.idStem)) {
    throw new Error("Numerator split/merge id stem must be data-safe.");
  }
  if (!/^[a-zA-Z]$/.test(input.variable)) {
    throw new Error("Numerator split/merge variable must be one letter.");
  }
  for (const [label, value] of [
    ["coefficient", input.coefficient],
    ["constant", input.constant],
    ["denominator", input.denominator]
  ] as const) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Numerator split/merge ${label} must be a positive integer.`);
    }
  }
}
