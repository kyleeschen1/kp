import {
  runKpOperationPresentationLaws
} from "./operation-presentation-laws.ts";
import type {
  KpOperationPresentationPlanDraft,
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "./operation-presentation-plan-validator.ts";

/**
 * Family compilers share one mint-and-law boundary so adding a new semantic
 * variant cannot quietly omit endpoint, rewind, ownership, or schedule proof.
 */
export function verifyKpOperationPresentationPlan(input: {
  readonly draft: KpOperationPresentationPlanDraft;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly scheduledGroupIds: readonly string[];
}): KpVerifiedOperationPresentationPlan {
  const validation = validateAndMintKpOperationPresentationPlan({
    draft: input.draft,
    expectedSelectorIds: [
      ...input.sourceSelectorIds,
      ...input.targetSelectorIds
    ]
  });
  if (validation.status !== "verified") {
    throw new Error(validation.issues[0]!.message);
  }
  const diagnostics = runKpOperationPresentationLaws({
    plan: validation.plan,
    context: {
      sourceSelectorIds: input.sourceSelectorIds,
      targetSelectorIds: input.targetSelectorIds,
      scheduledGroupIds: input.scheduledGroupIds,
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });
  if (diagnostics.length > 0) {
    throw new Error(diagnostics[0]!.message);
  }
  return validation.plan;
}
