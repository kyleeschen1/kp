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

export interface KpConstantSumEvaluationSpec {
  readonly id: string;
  readonly left: number;
  readonly right: number;
}

export interface KpConstantSumEvaluationAsset {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}

/**
 * Compiles numeric inputs into the complete successor lineage. Callers choose
 * arithmetic values, but cannot choose selectors, catalyst roles, ranks, or
 * operation authority and thereby bypass the shared presentation compiler.
 */
export function createKpConstantSumEvaluationAsset(
  spec: KpConstantSumEvaluationSpec
): KpConstantSumEvaluationAsset {
  return createConstantBinaryEvaluationAsset(spec, "+");
}

export function createKpConstantDifferenceEvaluationAsset(spec: KpConstantSumEvaluationSpec): KpConstantSumEvaluationAsset {
  return createConstantBinaryEvaluationAsset(spec, "-");
}

function createConstantBinaryEvaluationAsset(spec: KpConstantSumEvaluationSpec, operator: "+" | "-"): KpConstantSumEvaluationAsset {
  const sum = operator === "+";
  const name = sum ? "sum" : "difference";
  const word = sum ? "plus" : "minus";
  requireSafeId(spec.id);
  requireFinite(spec.left, "left");
  requireFinite(spec.right, "right");
  const result = sum ? spec.left + spec.right : spec.left - spec.right;
  const baseId = `operation-evaluation.${spec.id}`;
  const sourceId = `expression.${baseId}.source`;
  const targetId = `expression.${baseId}.target`;
  const transformationId = `transform.${baseId}.simplify-${name}`;
  const operationId = sum ? "kp.arithmetic.add" : "kp.arithmetic.subtract";
  const sourceSelectorIds = {
    left: `${sourceId}.left`,
    operator: `${sourceId}.operator`,
    right: `${sourceId}.right`
  };
  const targetSelectorId = `${targetId}.result`;
  const bundle = createKpAssetBundle({
    id: `asset.${baseId}`,
    title: `${spec.left} ${word} ${spec.right}`,
    objects: [
      createKpSemanticAssetObject({
        id: sourceId,
        objectType: "expression",
        title: `Constant ${name}`,
        value: { latex: `${spec.left} ${operator} ${spec.right}` },
        selectors: [
          selector(sourceSelectorIds.left, String(spec.left), {
            successorContribution: "material-input",
            successorRole: sum ? "addend" : "operand",
            successorRank: 0,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.operator, operator, {
            successorContribution: "catalyst",
            successorRole: sum ? "addition-operator" : "subtraction-operator",
            successorRank: 1,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.right, String(spec.right), {
            successorContribution: "material-input",
            successorRole: sum ? "addend" : "operand",
            successorRank: 2,
            successorOperationId: operationId
          })
        ]
      }),
      createKpSemanticAssetObject({
        id: targetId,
        objectType: "expression",
        title: `Evaluated ${name}`,
        value: { latex: String(result) },
        selectors: [
          selector(targetSelectorId, String(result), {
            successorTarget: true,
            successorRole: `evaluated-${name}`,
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
      `definition.generated.linear-solve.simplify-constant-${name}`,
    transformType: sum ? "simplifyConstantSum" : "simplifyConstantDifference",
    title: `Evaluate ${spec.left} ${word} ${spec.right}`,
    sourceObjectIds: [sourceId],
    targetObjectIds: [targetId],
    preserves: ["value"],
    correspondenceMap: {
      id: `${transformationId}.correspondence`,
      records: [{
        id: `${transformationId}.${name}-to-result`,
        relation: "fan-in",
        sourceSelectorIds: [
          sourceSelectorIds.left,
          sourceSelectorIds.operator,
          sourceSelectorIds.right
        ],
        targetSelectorIds: [targetSelectorId],
        summary:
          (sum ? "The two addends contribute material while the plus sign catalyzes " : "The ordered operands contribute material while the minus sign catalyzes ") +
          "their shared evaluated result."
      }]
    },
    assumptions: [
      `The exact ${name} of ${spec.left} and ${spec.right} is ${result}.`
    ],
    lawRefs: [{
      id: `law.arithmetic.constant-${name}`,
      level: "strict"
    }]
  });

  return Object.freeze({
    id: baseId,
    title: `${spec.left} ${operator} ${spec.right} → ${result}`,
    bundle,
    transformation
  });
}

function selector(
  id: string,
  label: string,
  metadata: Readonly<Record<string, KpAssetMetadataValue>>
) {
  return {
    id,
    kind: id.endsWith(".operator") ? "operator" : "term",
    label,
    metadata
  };
}

function requireSafeId(id: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(
      "Constant-sum evaluation ids must be lowercase kebab-case."
    );
  }
}

function requireFinite(value: number, side: "left" | "right"): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Constant-sum ${side} input must be finite.`);
  }
}
