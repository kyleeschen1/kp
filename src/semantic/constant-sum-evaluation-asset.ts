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
  requireSafeId(spec.id);
  requireFinite(spec.left, "left");
  requireFinite(spec.right, "right");
  const result = spec.left + spec.right;
  const baseId = `operation-evaluation.${spec.id}`;
  const sourceId = `expression.${baseId}.source`;
  const targetId = `expression.${baseId}.target`;
  const transformationId = `transform.${baseId}.simplify-sum`;
  const operationId = "kp.arithmetic.add";
  const sourceSelectorIds = {
    left: `${sourceId}.left`,
    operator: `${sourceId}.operator`,
    right: `${sourceId}.right`
  };
  const targetSelectorId = `${targetId}.result`;
  const bundle = createKpAssetBundle({
    id: `asset.${baseId}`,
    title: `${spec.left} plus ${spec.right}`,
    objects: [
      createKpSemanticAssetObject({
        id: sourceId,
        objectType: "expression",
        title: "Constant sum",
        value: { latex: `${spec.left} + ${spec.right}` },
        selectors: [
          selector(sourceSelectorIds.left, String(spec.left), {
            successorContribution: "material-input",
            successorRole: "addend",
            successorRank: 0,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.operator, "+", {
            successorContribution: "catalyst",
            successorRole: "addition-operator",
            successorRank: 1,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.right, String(spec.right), {
            successorContribution: "material-input",
            successorRole: "addend",
            successorRank: 2,
            successorOperationId: operationId
          })
        ]
      }),
      createKpSemanticAssetObject({
        id: targetId,
        objectType: "expression",
        title: "Evaluated sum",
        value: { latex: String(result) },
        selectors: [
          selector(targetSelectorId, String(result), {
            successorTarget: true,
            successorRole: "evaluated-sum",
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
      "definition.generated.linear-solve.simplify-constant-sum",
    transformType: "simplifyConstantSum",
    title: `Evaluate ${spec.left} plus ${spec.right}`,
    sourceObjectIds: [sourceId],
    targetObjectIds: [targetId],
    preserves: ["value"],
    correspondenceMap: {
      id: `${transformationId}.correspondence`,
      records: [{
        id: `${transformationId}.sum-to-result`,
        relation: "fan-in",
        sourceSelectorIds: [
          sourceSelectorIds.left,
          sourceSelectorIds.operator,
          sourceSelectorIds.right
        ],
        targetSelectorIds: [targetSelectorId],
        summary:
          "The two addends contribute material while the plus sign catalyzes " +
          "their shared evaluated result."
      }]
    },
    assumptions: [
      `The exact sum of ${spec.left} and ${spec.right} is ${result}.`
    ],
    lawRefs: [{
      id: "law.arithmetic.constant-sum",
      level: "strict"
    }]
  });

  return Object.freeze({
    id: baseId,
    title: `${spec.left} + ${spec.right} → ${result}`,
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
