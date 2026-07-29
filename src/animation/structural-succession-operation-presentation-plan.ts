import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  resolveKpRadicalFragmentSemantics
} from "../semantic/radical-fragment-semantics.ts";
import {
  compileKpOperationPresentationContextBundles
} from "./operation-presentation-correspondence.ts";
import type {
  KpVerifiedStructuralSuccessionPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  verifyKpOperationPresentationPlan
} from "./operation-presentation-plan-verification.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

/**
 * Radical succession treats the complete exponent notation and radical
 * notation as causal material bundles. The base/radicand remains a continuant,
 * and paint geometry stays exclusively in the structural renderer.
 */
export function compileKpStructuralSuccessionOperationPresentationPlan(
  input: {
    readonly transformation: KpSemanticTransformation;
    readonly sourceSelectorIds: readonly string[];
    readonly targetSelectorIds: readonly string[];
  }
): KpVerifiedStructuralSuccessionPresentationPlan | undefined {
  const { transformation } = input;
  if (transformation.transformType !== "rewritePowerAsRoot") {
    return undefined;
  }
  const fragments = resolveKpRadicalFragmentSemantics(transformation);
  const sourceEntityIds = fragments.notationRecords.flatMap(
    ({ sourceSelectorIds }) => sourceSelectorIds
  );
  const targetEntityIds = fragments.notationRecords.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  );
  if (sourceEntityIds.length === 0 || targetEntityIds.length === 0) {
    throw new Error(
      `Structural succession ${transformation.id} requires both notations.`
    );
  }
  const sourceBundle = createKpOperationPresentationBundle({
    id: `${transformation.id}.bundle.source-notation`,
    role: "source-material",
    semanticEntityIds: sourceEntityIds
  });
  const targetBundle = createKpOperationPresentationBundle({
    id: `${transformation.id}.bundle.target-notation`,
    role: "target-material",
    semanticEntityIds: targetEntityIds
  });
  const plan = verifyKpOperationPresentationPlan({
    draft: {
      schemaVersion: "kp.verified-operation-presentation-plan.v1",
      id: `operation-presentation.${transformation.id}`,
      transformationId: transformation.id,
      planKind: "structural-succession",
      roles: createKpOperationPresentationRoles({
        bundles: [
          sourceBundle,
          targetBundle,
          ...compileKpOperationPresentationContextBundles({
            transformationId: transformation.id,
            records: [fragments.baseRecord]
          })
        ]
      }),
      sourceBundleId: sourceBundle.id,
      targetBundleId: targetBundle.id
    },
    sourceSelectorIds: input.sourceSelectorIds,
    targetSelectorIds: input.targetSelectorIds,
    scheduledGroupIds: []
  });
  if (plan.planKind !== "structural-succession") {
    throw new Error(
      `Structural succession ${transformation.id} compiled the wrong plan.`
    );
  }
  return plan;
}
