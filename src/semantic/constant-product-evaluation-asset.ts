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

export interface KpConstantProductEvaluationSpec {
  readonly id: string;
  readonly left: number;
  readonly right: number;
}

export interface KpConstantProductEvaluationAsset {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}

/**
 * Product callers provide arithmetic values only. Semantic contributor,
 * catalyst, lineage, and operation authority remain compiler-owned so the
 * visual family cannot rewrite what multiplication means.
 */
export function createKpConstantProductEvaluationAsset(
  spec: KpConstantProductEvaluationSpec
): KpConstantProductEvaluationAsset {
  requireSafeId(spec.id);
  requireFinite(spec.left, "left");
  requireFinite(spec.right, "right");
  const result = spec.left * spec.right;
  const baseId = `operation-evaluation.${spec.id}`;
  const sourceId = `expression.${baseId}.source`;
  const targetId = `expression.${baseId}.target`;
  const transformationId = `transform.${baseId}.simplify-product`;
  const operationId = "kp.arithmetic.multiply";
  const sourceSelectorIds = {
    left: `${sourceId}.left`,
    operator: `${sourceId}.operator`,
    right: `${sourceId}.right`
  };
  const targetSelectorId = `${targetId}.result`;
  const bundle = createKpAssetBundle({
    id: `asset.${baseId}`,
    title: `${spec.left} times ${spec.right}`,
    objects: [
      createKpSemanticAssetObject({
        id: sourceId,
        objectType: "expression",
        title: "Constant product",
        value: { latex: `${spec.left} \\times ${spec.right}` },
        selectors: [
          selector(sourceSelectorIds.left, String(spec.left), {
            successorContribution: "material-input",
            successorRole: "factor",
            successorRank: 0,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.operator, "\\times", {
            successorContribution: "catalyst",
            successorRole: "multiplication-operator",
            successorRank: 1,
            successorOperationId: operationId
          }),
          selector(sourceSelectorIds.right, String(spec.right), {
            successorContribution: "material-input",
            successorRole: "factor",
            successorRank: 2,
            successorOperationId: operationId
          })
        ]
      }),
      createKpSemanticAssetObject({
        id: targetId,
        objectType: "expression",
        title: "Evaluated product",
        value: { latex: String(result) },
        selectors: [
          selector(targetSelectorId, String(result), {
            successorTarget: true,
            successorRole: "evaluated-product",
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
    transformType: "simplifyConstantProduct",
    title: `Evaluate ${spec.left} times ${spec.right}`,
    sourceObjectIds: [sourceId],
    targetObjectIds: [targetId],
    preserves: ["value"],
    correspondenceMap: {
      id: `${transformationId}.correspondence`,
      records: [{
        id: `${transformationId}.product-to-result`,
        relation: "fan-in",
        sourceSelectorIds: [
          sourceSelectorIds.left,
          sourceSelectorIds.operator,
          sourceSelectorIds.right
        ],
        targetSelectorIds: [targetSelectorId],
        summary:
          "Both factors contribute material while multiplication catalyzes " +
          "their shared evaluated result."
      }]
    },
    assumptions: [
      `The exact product of ${spec.left} and ${spec.right} is ${result}.`
    ],
    lawRefs: [{ id: "law.arithmetic.constant-product", level: "strict" }]
  });

  return Object.freeze({
    id: baseId,
    title: `${spec.left} \\times ${spec.right} → ${result}`,
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
      "Constant-product evaluation ids must be lowercase kebab-case."
    );
  }
}

function requireFinite(value: number, side: "left" | "right"): void {
  if (!Number.isFinite(value)) {
    throw new Error(`Constant-product ${side} input must be finite.`);
  }
}
