import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  compileKpEquationAssetMigrationV2,
  type KpEquationAssetMigrationV2,
  type KpEquationAssetMigrationOperationV2
} from "./equation-asset-migration-v2.ts";

const derivativePowerAssetId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

/**
 * The reviewed derivative exemplar keeps its two authored semantic beats.
 * Governance binds those beats but does not collapse the explicit decrement
 * into the power-rule operation or move its family choreography into v2.
 */
export function compileKpDerivativePowerMigrationV2(
  animation: KpAnimationAsset
): KpEquationAssetMigrationV2 {
  if (animation.id !== derivativePowerAssetId) {
    throw new Error(`Unsupported derivative power asset ${animation.id}.`);
  }
  const powerRule = requiredTransformation(
    animation,
    "applyDerivativePowerRule"
  );
  const evaluation = requiredTransformation(
    animation,
    "simplifyConstantDifference"
  );
  const powerSourceId = singleObjectId(powerRule, "source");
  const powerTargetId = singleObjectId(powerRule, "target");
  const evaluationSourceId = singleObjectId(evaluation, "source");
  const evaluationTargetId = singleObjectId(evaluation, "target");
  const operations: readonly KpEquationAssetMigrationOperationV2[] = [
    Object.freeze({
      transformationId: powerRule.id,
      operationId: "kp.semantic-motion.derivative-power-rule",
      semanticClass: "transformation" as const,
      roleBindings: Object.freeze({
        "base-before": [selector(animation, powerSourceId, "base")],
        "exponent-before": [selector(animation, powerSourceId, "exponent")],
        "derivative-artifacts": [
          selector(animation, powerSourceId, "operator"),
          selector(animation, powerSourceId, "operator-variable")
        ],
        "base-after": [selector(animation, powerTargetId, "base")],
        "coefficient-after": [
          selector(animation, powerTargetId, "coefficient")
        ],
        "exponent-after": [selector(animation, powerTargetId, "exponent")]
      }),
      projectionIntent: "replacement" as const
    }),
    Object.freeze({
      transformationId: evaluation.id,
      operationId: "kp.arithmetic.subtract",
      semanticClass: "evaluation" as const,
      roleBindings: Object.freeze({
        "operands-before": [
          selector(animation, evaluationSourceId, "exponent"),
          selector(animation, evaluationSourceId, "decrement-operator"),
          selector(animation, evaluationSourceId, "decrement-amount")
        ],
        "result-after": [
          selector(animation, evaluationTargetId, "exponent")
        ]
      }),
      projectionIntent: "replacement" as const
    })
  ];
  return compileKpEquationAssetMigrationV2({ animation, operations });
}

function requiredTransformation(
  animation: KpAnimationAsset,
  transformType: string
): KpSemanticTransformation {
  const matches = animation.transformations.filter(
    (transformation) => transformation.transformType === transformType
  );
  if (matches.length !== 1) {
    throw new Error(
      `${animation.id} requires one ${transformType} transformation.`
    );
  }
  return matches[0]!;
}

function singleObjectId(
  transformation: KpSemanticTransformation,
  endpoint: "source" | "target"
): string {
  const ids = endpoint === "source"
    ? transformation.sourceObjectIds
    : transformation.targetObjectIds;
  if (ids.length !== 1) {
    throw new Error(
      `${transformation.id} requires one ${endpoint} semantic object.`
    );
  }
  return ids[0]!;
}

function selector(
  animation: KpAnimationAsset,
  objectId: string,
  suffix: string
): string {
  const selectorId = `${objectId}.${suffix}`;
  const object = animation.bundle.objects.find(({ id }) => id === objectId);
  if (!object?.selectors.some(({ id }) => id === selectorId)) {
    throw new Error(`${animation.id} requires selector ${selectorId}.`);
  }
  return selectorId;
}
