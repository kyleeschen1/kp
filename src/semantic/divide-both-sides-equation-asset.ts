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

export interface DivideBothSidesEquationKpAsset {
  readonly sourceTraceId: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
}

export const divideBothSidesEquationAssetIds = {
  initial: "equation.divide-both-sides.initial",
  divided: "equation.divide-both-sides.divided",
  coefficientCancelled: "equation.divide-both-sides.coefficient-cancelled",
  solved: "equation.divide-both-sides.solved",
  divide: "transform.divide-both-sides.divide-by-3",
  cancelCoefficient: "transform.divide-both-sides.cancel-coefficient",
  simplifyQuotient: "transform.divide-both-sides.simplify-quotient"
} as const;

const ids = divideBothSidesEquationAssetIds;
const sourceTraceId = "trace.linear-canonical-divide-both-sides";

/**
 * Owns the exact algebraic trace for the divide-both-sides exemplar.
 * Selector correspondence is intentionally added separately so the equation
 * states and laws remain reviewable without committing to motion semantics.
 */
export function createDivideBothSidesEquationKpAsset(): DivideBothSidesEquationKpAsset {
  const bundle = createKpAssetBundle({
    id: "asset.divide-both-sides-equation",
    title: "Solve 3x = 12 by dividing both sides",
    objects: [
      equationState(ids.initial, "Initial coefficient equation", "3x = 12", [
        part("lhs.coefficient.3", "term", "3", "coefficient"),
        part("lhs.x", "term", "x", "variable"),
        part("equals", "relation", "=", "relation"),
        part("rhs.12", "term", "12", "constant")
      ]),
      equationState(
        ids.divided,
        "Divide both sides by three",
        "\\frac{3x}{3} = \\frac{12}{3}",
        [
          part("lhs.fraction.numerator.coefficient.3", "term", "3", "coefficient"),
          part("lhs.fraction.numerator.x", "term", "x", "variable"),
          part("lhs.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("lhs.fraction.denominator.3", "term", "3", "divisor"),
          part("equals", "relation", "=", "relation"),
          part("rhs.fraction.numerator.12", "term", "12", "constant"),
          part("rhs.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("rhs.fraction.denominator.3", "term", "3", "divisor")
        ],
        ids.initial,
        ids.divide
      ),
      equationState(
        ids.coefficientCancelled,
        "Cancel the coefficient",
        "x = \\frac{12}{3}",
        [
          part("lhs.x", "term", "x", "variable"),
          part("equals", "relation", "=", "relation"),
          part("rhs.fraction.numerator.12", "term", "12", "constant"),
          part("rhs.fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("rhs.fraction.denominator.3", "term", "3", "divisor")
        ],
        ids.divided,
        ids.cancelCoefficient
      ),
      equationState(
        ids.solved,
        "Solved equation",
        "x = 4",
        [
          part("lhs.x", "term", "x", "variable"),
          part("equals", "relation", "=", "relation"),
          part("rhs.4", "term", "4", "constant")
        ],
        ids.coefficientCancelled,
        ids.simplifyQuotient
      )
    ]
  });

  return {
    sourceTraceId,
    bundle,
    transformations: [
      transformation({
        id: ids.divide,
        transformType: "divideBothSides",
        title: "Divide both sides by 3",
        sourceObjectId: ids.initial,
        targetObjectId: ids.divided,
        correspondence: [
          identity("coefficient-enters-numerator", ids.initial, "lhs.coefficient.3", ids.divided, "lhs.fraction.numerator.coefficient.3"),
          identity("variable-enters-numerator", ids.initial, "lhs.x", ids.divided, "lhs.fraction.numerator.x"),
          identity("relation-persists", ids.initial, "equals", ids.divided, "equals"),
          identity("constant-enters-numerator", ids.initial, "rhs.12", ids.divided, "rhs.fraction.numerator.12"),
          record(
            "matched-divisors-enter",
            "introduction",
            [],
            selectors(ids.divided, "lhs.fraction.denominator.3", "rhs.fraction.denominator.3"),
            "The same divisor enters beneath both sides."
          ),
          record(
            "fraction-rules-enter",
            "introduction",
            [],
            selectors(ids.divided, "lhs.fraction.rule", "rhs.fraction.rule"),
            "Fraction rules expose the two whole-side quotients."
          )
        ],
        assumption: "Dividing equal quantities by the same non-zero value preserves equality.",
        lawId: "law.equation.divide-both-sides"
      }),
      transformation({
        id: ids.cancelCoefficient,
        transformType: "cancelMultiplicativeInverses",
        title: "Cancel the coefficient",
        sourceObjectId: ids.divided,
        targetObjectId: ids.coefficientCancelled,
        correspondence: [
          identity("variable-persists", ids.divided, "lhs.fraction.numerator.x", ids.coefficientCancelled, "lhs.x"),
          identity("relation-persists", ids.divided, "equals", ids.coefficientCancelled, "equals"),
          identity("right-numerator-persists", ids.divided, "rhs.fraction.numerator.12", ids.coefficientCancelled, "rhs.fraction.numerator.12"),
          identity("right-rule-persists", ids.divided, "rhs.fraction.rule", ids.coefficientCancelled, "rhs.fraction.rule"),
          identity("right-divisor-persists", ids.divided, "rhs.fraction.denominator.3", ids.coefficientCancelled, "rhs.fraction.denominator.3"),
          record(
            "coefficient-and-divisor-cancel",
            "cancelation",
            selectors(ids.divided, "lhs.fraction.numerator.coefficient.3", "lhs.fraction.denominator.3"),
            [],
            "The non-zero coefficient and matching divisor cancel."
          ),
          record(
            "left-fraction-rule-retires",
            "removal",
            selectors(ids.divided, "lhs.fraction.rule"),
            [],
            "The left fraction rule retires after cancellation leaves x."
          )
        ],
        assumption: "A non-zero factor divided by itself simplifies to one.",
        lawId: "law.algebra.multiplicative-inverse"
      }),
      transformation({
        id: ids.simplifyQuotient,
        transformType: "simplifyConstantQuotient",
        title: "Simplify 12 divided by 3",
        sourceObjectId: ids.coefficientCancelled,
        targetObjectId: ids.solved,
        correspondence: [
          identity("variable-persists", ids.coefficientCancelled, "lhs.x", ids.solved, "lhs.x"),
          identity("relation-persists", ids.coefficientCancelled, "equals", ids.solved, "equals"),
          record(
            "quotient-becomes-four",
            "fan-in",
            selectors(
              ids.coefficientCancelled,
              "rhs.fraction.numerator.12",
              "rhs.fraction.rule",
              "rhs.fraction.denominator.3"
            ),
            selectors(ids.solved, "rhs.4"),
            "The exact quotient twelve divided by three derives four."
          )
        ],
        assumption: "The exact quotient 12 divided by 3 is 4.",
        lawId: "law.arithmetic.constant-quotient"
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
          summary: "Canonical exact-integer coefficient equation state."
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
    transformType: input.transformType,
    title: input.title,
    sourceObjectIds: [input.sourceObjectId],
    targetObjectIds: [input.targetObjectId],
    preserves: ["value"],
    correspondenceMap: {
      id: `${input.id}.correspondence`,
      records: input.correspondence
    },
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }]
  });
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
