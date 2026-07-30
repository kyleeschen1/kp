import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type KpAssetBundle,
  type KpAssetMetadataValue
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";

export interface KpConstantQuotientEvaluationSpec {
  readonly id: string;
  readonly numerator: number;
  readonly denominator: number;
}

export interface KpConstantQuotientEvaluationAsset {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}

/**
 * Compiles an exact integer quotient into evaluation lineage. The stacked
 * fraction rule is causal operator paint, not cancellable mathematical
 * material, so it participates as a catalyst without seeding the result.
 */
export function createKpConstantQuotientEvaluationAsset(
  spec: KpConstantQuotientEvaluationSpec
): KpConstantQuotientEvaluationAsset {
  requireSafeId(spec.id);
  requireInteger(spec.numerator, "numerator");
  requireInteger(spec.denominator, "denominator");
  if (spec.denominator === 0) {
    throw new Error("Constant-quotient denominator must not be zero.");
  }
  const divisor = greatestCommonDivisor(
    Math.abs(spec.numerator),
    Math.abs(spec.denominator)
  );
  const denominatorSign = spec.denominator < 0 ? -1 : 1;
  const resultNumerator =
    denominatorSign * spec.numerator / divisor;
  const resultDenominator = Math.abs(spec.denominator) / divisor;
  const sourceLatex = fractionLatex(spec.numerator, spec.denominator);
  const targetLatex = resultDenominator === 1
    ? String(resultNumerator)
    : fractionLatex(resultNumerator, resultDenominator);
  const baseId = `operation-evaluation.${spec.id}`;
  const sourceId = `expression.${baseId}.source`;
  const targetId = `expression.${baseId}.target`;
  const transformationId = `transform.${baseId}.simplify-quotient`;
  const operationId = "kp.arithmetic.divide";
  const sourceSelectorIds = {
    numerator: `${sourceId}.numerator`,
    rule: `${sourceId}.fraction-rule`,
    denominator: `${sourceId}.denominator`
  };
  const targetSelectorId = `${targetId}.result`;
  const bundle = createKpAssetBundle({
    id: `asset.${baseId}`,
    title: `${spec.numerator} divided by ${spec.denominator}`,
    objects: [
      createKpSemanticAssetObject({
        id: sourceId,
        objectType: "expression",
        title: "Constant quotient",
        value: { latex: sourceLatex },
        selectors: [
          selector(
            sourceSelectorIds.numerator,
            "term",
            String(spec.numerator),
            {
              successorContribution: "material-input",
              successorRole: "dividend",
              successorRank: 0,
              successorOperationId: operationId
            }
          ),
          selector(
            sourceSelectorIds.rule,
            "artifact",
            "fraction-rule",
            {
              successorContribution: "catalyst",
              successorRole: "division-operator",
              successorRank: 1,
              successorOperationId: operationId
            }
          ),
          selector(
            sourceSelectorIds.denominator,
            "term",
            String(spec.denominator),
            {
              successorContribution: "material-input",
              successorRole: "divisor",
              successorRank: 2,
              successorOperationId: operationId
            }
          )
        ]
      }),
      createKpSemanticAssetObject({
        id: targetId,
        objectType: "expression",
        title: "Evaluated quotient",
        value: { latex: targetLatex },
        // The reduced fraction is one semantic result. Its native numerator,
        // rule, and denominator stay renderer-owned paint atoms beneath this
        // selector instead of becoming caller-authored motion instructions.
        selectors: [
          selector(targetSelectorId, "term", targetLatex, {
            successorTarget: true,
            successorRole: "evaluated-quotient",
            successorRank: 0,
            successorOperationId: operationId
          })
        ],
        provenance: {
          kind: "transformed",
          sourceIds: [sourceId],
          transformationId
        }
      })
    ]
  });
  const transformation = createKpSemanticTransformation({
    id: transformationId,
    definitionId:
      "definition.generated.linear-solve.simplify-constant-quotient",
    transformType: "simplifyConstantQuotient",
    title: `Evaluate ${spec.numerator} divided by ${spec.denominator}`,
    sourceObjectIds: [sourceId],
    targetObjectIds: [targetId],
    preserves: ["value"],
    correspondenceMap: {
      id: `${transformationId}.correspondence`,
      records: [{
        id: `${transformationId}.quotient-to-result`,
        relation: "fan-in",
        sourceSelectorIds: [
          sourceSelectorIds.numerator,
          sourceSelectorIds.rule,
          sourceSelectorIds.denominator
        ],
        targetSelectorIds: [targetSelectorId],
        summary:
          "The numerator and denominator contribute material while the " +
          "fraction rule catalyzes their evaluated quotient."
      }]
    },
    assumptions: [
      `${spec.numerator}/${spec.denominator} reduces exactly to ` +
      `${resultNumerator}/${resultDenominator}.`
    ],
    lawRefs: [{
      id: "law.arithmetic.constant-quotient",
      level: "strict"
    }]
  });

  return Object.freeze({
    id: baseId,
    title: `${sourceLatex} → ${targetLatex}`,
    bundle,
    transformation
  });
}

function selector(
  id: string,
  kind: "term" | "artifact",
  label: string,
  metadata: Readonly<Record<string, KpAssetMetadataValue>>
) {
  return { id, kind, label, metadata };
}

function fractionLatex(numerator: number, denominator: number): string {
  return `\\frac{${numerator}}{${denominator}}`;
}

function greatestCommonDivisor(left: number, right: number): number {
  let dividend = left;
  let divisor = right;
  while (divisor !== 0) {
    [dividend, divisor] = [divisor, dividend % divisor];
  }
  return dividend === 0 ? 1 : dividend;
}

function requireSafeId(id: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(
      "Constant-quotient evaluation ids must be lowercase kebab-case."
    );
  }
}

function requireInteger(
  value: number,
  position: "numerator" | "denominator"
): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Constant-quotient ${position} must be a safe integer.`);
  }
}
