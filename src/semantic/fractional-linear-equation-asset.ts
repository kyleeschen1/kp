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
import type {
  SelectorCorrespondenceRecord
} from "./correspondence.ts";

export interface FractionalLinearEquationKpAsset {
  readonly sourceTraceId: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
}

export const fractionalLinearEquationAssetIds = {
  initial: "equation.fractional-linear.initial",
  afterSubtract: "equation.fractional-linear.after-subtract",
  additiveCancelled: "equation.fractional-linear.additive-cancelled",
  rightSimplified: "equation.fractional-linear.right-simplified",
  multiplied: "equation.fractional-linear.multiplied",
  denominatorCancelled: "equation.fractional-linear.denominator-cancelled",
  solved: "equation.fractional-linear.solved",
  subtract: "transform.fractional-linear.subtract-both-sides-3",
  cancelAdditive: "transform.fractional-linear.cancel-additive-inverses",
  simplifyDifference: "transform.fractional-linear.simplify-right-difference",
  multiply: "transform.fractional-linear.multiply-both-sides-2",
  cancelDenominator: "transform.fractional-linear.cancel-denominator",
  simplifyProduct: "transform.fractional-linear.simplify-right-product"
} as const;

const ids = fractionalLinearEquationAssetIds;

export function createFractionalLinearEquationKpAsset(): FractionalLinearEquationKpAsset {
  const bundle = createKpAssetBundle({
    id: "asset.fractional-linear-equation",
    title: "Solve x/2 + 3 = 7",
    objects: [
      equationState(ids.initial, "Initial fractional equation", "\\frac{x}{2} + 3 = 7", [
        part("fraction.numerator.x", "term", "x", "numerator"),
        part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
        part("fraction.denominator.2", "term", "2", "denominator"),
        part("lhs.plus3", "term", "+3"),
        part("equals", "relation", "="),
        part("rhs.7", "term", "7")
      ]),
      equationState(
        ids.afterSubtract,
        "Subtract three from both sides",
        "\\frac{x}{2} + 3 - 3 = 7 - 3",
        [
          part("fraction.numerator.x", "term", "x", "numerator"),
          part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("fraction.denominator.2", "term", "2", "denominator"),
          part("lhs.plus3", "term", "+3"),
          part("lhs.minus3", "term", "-3"),
          part("equals", "relation", "="),
          part("rhs.7", "term", "7"),
          part("rhs.minus", "operator", "−"),
          part("rhs.3", "term", "3")
        ],
        ids.initial,
        ids.subtract
      ),
      equationState(
        ids.additiveCancelled,
        "Cancel additive inverses",
        "\\frac{x}{2} = 7 - 3",
        [
          part("fraction.numerator.x", "term", "x", "numerator"),
          part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("fraction.denominator.2", "term", "2", "denominator"),
          part("equals", "relation", "="),
          part("rhs.7", "term", "7"),
          part("rhs.minus", "operator", "−"),
          part("rhs.3", "term", "3")
        ],
        ids.afterSubtract,
        ids.cancelAdditive
      ),
      equationState(
        ids.rightSimplified,
        "Simplify the right side",
        "\\frac{x}{2} = 4",
        [
          part("fraction.numerator.x", "term", "x", "numerator"),
          part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("fraction.denominator.2", "term", "2", "denominator"),
          part("equals", "relation", "="),
          part("rhs.4", "term", "4")
        ],
        ids.additiveCancelled,
        ids.simplifyDifference
      ),
      equationState(
        ids.multiplied,
        "Multiply both sides by two",
        "2\\left(\\frac{x}{2}\\right) = 2 \\cdot 4",
        [
          part("lhs.multiplier.2", "term", "2", "multiplier"),
          part("lhs.left-paren", "artifact", "left parenthesis", "delimiter"),
          part("fraction.numerator.x", "term", "x", "numerator"),
          part("fraction.rule", "artifact", "fraction rule", "fraction-rule"),
          part("fraction.denominator.2", "term", "2", "denominator"),
          part("lhs.right-paren", "artifact", "right parenthesis", "delimiter"),
          part("equals", "relation", "="),
          part("rhs.multiplier.2", "term", "2", "multiplier"),
          part("rhs.product", "operator", "·"),
          part("rhs.4", "term", "4")
        ],
        ids.rightSimplified,
        ids.multiply
      ),
      equationState(
        ids.denominatorCancelled,
        "Cancel the denominator",
        "x = 2 \\cdot 4",
        [
          part("lhs.x", "term", "x"),
          part("equals", "relation", "="),
          part("rhs.multiplier.2", "term", "2", "multiplier"),
          part("rhs.product", "operator", "·"),
          part("rhs.4", "term", "4")
        ],
        ids.multiplied,
        ids.cancelDenominator
      ),
      equationState(
        ids.solved,
        "Solved equation",
        "x = 8",
        [
          part("lhs.x", "term", "x"),
          part("equals", "relation", "="),
          part("rhs.8", "term", "8")
        ],
        ids.denominatorCancelled,
        ids.simplifyProduct
      )
    ]
  });

  return {
    sourceTraceId: "trace.linear-canonical-fractional",
    bundle,
    transformations: createTransformations()
  };
}

function createTransformations(): readonly KpSemanticTransformation[] {
  return [
    transform(ids.subtract, "subtractBothSides", "Subtract 3 from both sides", ids.initial, ids.afterSubtract, [
      identity("x-persists", ids.initial, "fraction.numerator.x", ids.afterSubtract, "fraction.numerator.x"),
      identity("fraction-rule-persists", ids.initial, "fraction.rule", ids.afterSubtract, "fraction.rule"),
      identity("denominator-persists", ids.initial, "fraction.denominator.2", ids.afterSubtract, "fraction.denominator.2"),
      identity("left-three-persists", ids.initial, "lhs.plus3", ids.afterSubtract, "lhs.plus3"),
      identity("relation-persists", ids.initial, "equals", ids.afterSubtract, "equals"),
      identity("right-seven-persists", ids.initial, "rhs.7", ids.afterSubtract, "rhs.7"),
      record("inverse-terms-enter", "introduction", [], selectors(ids.afterSubtract, "lhs.minus3", "rhs.minus", "rhs.3"), "Equal inverse terms enter on both sides.")
    ], "Subtracting the same value from both sides preserves equality."),
    transform(ids.cancelAdditive, "cancelAdditiveInverses", "Cancel +3 and -3", ids.afterSubtract, ids.additiveCancelled, [
      ...fractionPersists(ids.afterSubtract, ids.additiveCancelled),
      record("left-inverses-cancel", "cancelation", selectors(ids.afterSubtract, "lhs.plus3", "lhs.minus3"), [], "+3 and -3 cancel."),
      ...identityRecords(ids.afterSubtract, ids.additiveCancelled, ["equals", "rhs.7", "rhs.minus", "rhs.3"])
    ], "A value and its additive inverse sum to zero."),
    transform(ids.simplifyDifference, "simplifyConstantDifference", "Simplify 7 - 3", ids.additiveCancelled, ids.rightSimplified, [
      ...fractionPersists(ids.additiveCancelled, ids.rightSimplified),
      identity("relation-persists", ids.additiveCancelled, "equals", ids.rightSimplified, "equals"),
      record("difference-becomes-four", "fan-in", selectors(ids.additiveCancelled, "rhs.7", "rhs.minus", "rhs.3"), selectors(ids.rightSimplified, "rhs.4"), "Seven minus three derives four.")
    ], "7 - 3 evaluates exactly to 4."),
    transform(ids.multiply, "multiplyBothSides", "Multiply both sides by 2", ids.rightSimplified, ids.multiplied, [
      ...fractionPersists(ids.rightSimplified, ids.multiplied),
      identity("relation-persists", ids.rightSimplified, "equals", ids.multiplied, "equals"),
      identity("right-four-persists", ids.rightSimplified, "rhs.4", ids.multiplied, "rhs.4"),
      record("equal-factors-enter", "introduction", [], selectors(ids.multiplied, "lhs.multiplier.2", "rhs.multiplier.2", "rhs.product"), "A factor of two enters on both sides."),
      record("grouping-enters", "introduction", [], selectors(ids.multiplied, "lhs.left-paren", "lhs.right-paren"), "Parentheses make the left multiplication explicit.")
    ], "Multiplying both sides by the same nonzero value preserves equality."),
    transform(ids.cancelDenominator, "cancelMultiplicativeInverses", "Cancel the denominator", ids.multiplied, ids.denominatorCancelled, [
      identity("x-persists", ids.multiplied, "fraction.numerator.x", ids.denominatorCancelled, "lhs.x"),
      record("twos-cancel", "cancelation", selectors(ids.multiplied, "lhs.multiplier.2", "fraction.denominator.2"), [], "The factor two cancels the denominator two."),
      record("fraction-and-grouping-retire", "removal", selectors(ids.multiplied, "lhs.left-paren", "fraction.rule", "lhs.right-paren"), [], "Fraction and grouping marks retire with the completed cancellation."),
      ...identityRecords(ids.multiplied, ids.denominatorCancelled, ["equals", "rhs.multiplier.2", "rhs.product", "rhs.4"])
    ], "A nonzero factor divided by itself simplifies to one."),
    transform(ids.simplifyProduct, "simplifyConstantProduct", "Simplify 2 · 4", ids.denominatorCancelled, ids.solved, [
      identity("x-persists", ids.denominatorCancelled, "lhs.x", ids.solved, "lhs.x"),
      identity("relation-persists", ids.denominatorCancelled, "equals", ids.solved, "equals"),
      record("product-becomes-eight", "fan-in", selectors(ids.denominatorCancelled, "rhs.multiplier.2", "rhs.product", "rhs.4"), selectors(ids.solved, "rhs.8"), "Two times four derives eight.")
    ], "2 · 4 evaluates exactly to 8.")
  ];
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
      ...(partValue.structureRole === undefined
        ? {}
        : { metadata: { equationStructureRole: partValue.structureRole } })
    })),
    provenance: sourceId === undefined
      ? {
          kind: "authored",
          sourceIds: ["trace.linear-canonical-fractional"],
          summary: "Canonical exact-rational fractional equation state."
        }
      : {
          kind: "transformed",
          sourceIds: [sourceId],
          transformationId
        }
  });
}

interface Part {
  readonly path: string;
  readonly kind: KpAssetSelector["kind"];
  readonly label: string;
  readonly structureRole?: string;
}

function part(path: string, kind: string, label: string, structureRole?: string): Part {
  return { path, kind, label, ...(structureRole === undefined ? {} : { structureRole }) };
}

function transform(
  id: string,
  transformType: string,
  title: string,
  sourceObjectId: string,
  targetObjectId: string,
  records: readonly SelectorCorrespondenceRecord[],
  assumption: string
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id,
    transformType,
    title,
    sourceObjectIds: [sourceObjectId],
    targetObjectIds: [targetObjectId],
    preserves: ["value"],
    correspondenceMap: { id: `${id}.correspondence`, records },
    assumptions: [assumption],
    lawRefs: [{ id: `law.${transformType}`, level: "strict" }]
  });
}

function fractionPersists(source: string, target: string): readonly SelectorCorrespondenceRecord[] {
  return [
    identity("x-persists", source, "fraction.numerator.x", target, "fraction.numerator.x"),
    identity("fraction-rule-persists", source, "fraction.rule", target, "fraction.rule"),
    identity("denominator-persists", source, "fraction.denominator.2", target, "fraction.denominator.2")
  ];
}

function identityRecords(
  source: string,
  target: string,
  paths: readonly string[]
): readonly SelectorCorrespondenceRecord[] {
  return paths.map((path) => identity(`${path.replaceAll(".", "-")}-persists`, source, path, target, path));
}

function identity(
  id: string,
  sourceObjectId: string,
  sourcePath: string,
  targetObjectId: string,
  targetPath: string
): SelectorCorrespondenceRecord {
  return record(id, "identity", selectors(sourceObjectId, sourcePath), selectors(targetObjectId, targetPath), `${sourcePath} preserves identity.`);
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
