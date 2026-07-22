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
        assumption: "Dividing equal quantities by the same non-zero value preserves equality.",
        lawId: "law.equation.divide-both-sides"
      }),
      transformation({
        id: ids.cancelCoefficient,
        transformType: "cancelMultiplicativeInverses",
        title: "Cancel the coefficient",
        sourceObjectId: ids.divided,
        targetObjectId: ids.coefficientCancelled,
        assumption: "A non-zero factor divided by itself simplifies to one.",
        lawId: "law.algebra.multiplicative-inverse"
      }),
      transformation({
        id: ids.simplifyQuotient,
        transformType: "simplifyConstantQuotient",
        title: "Simplify 12 divided by 3",
        sourceObjectId: ids.coefficientCancelled,
        targetObjectId: ids.solved,
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
    assumptions: [input.assumption],
    lawRefs: [{ id: input.lawId, level: "strict" }]
  });
}
