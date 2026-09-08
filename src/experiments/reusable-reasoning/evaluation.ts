import type { KpAnimationAsset } from "../../animation/asset.ts";
import { kpOperationEvaluationAuthorityDescriptors } from "../../semantic/operation-evaluation-authority.ts";
import { compileKpEquationAssetMigrationV2 } from "../../domain-ir/equation-asset-migration-v2.ts";
import { compileKpEquationEvaluationFamilyCertificateV2 } from "../../domain-ir/equation-evaluation-family-certificate-v2.ts";
import { KpReasoningRepairGap } from "./source.ts";

/** Only the bounded exemplar's evaluations are connected; no catalogue promotion. */
export function compileReasoningEvaluationCertificates(animation: KpAnimationAsset) {
  return Object.freeze(animation.transformations.slice(0, 4).flatMap(transformation => {
    const authority = kpOperationEvaluationAuthorityDescriptors.find(
      item => item.transformationKind === transformation.transformType);
    if (!authority) return [];
    const records = transformation.correspondenceMap?.records.filter(item => item.relation === "fan-in") ?? [];
    if (records.length !== 1) throw new KpReasoningRepairGap("kp.reasoning.evaluation-topology", "$.native",
      "The bounded evaluation requires one verified contributor correspondence.");
    const record = records[0]!;
    const operationId = authority.semanticOperationIds.find(id => id.startsWith("kp.arithmetic."));
    if (!operationId) throw new KpReasoningRepairGap("kp.reasoning.evaluation-operation", "$.native",
      "Resolve the registered arithmetic operation before selecting its visual family.");
    const participants = new Set([...record.sourceSelectorIds, ...record.targetSelectorIds]);
    // A result can be the next operation's operand. Operation identity belongs
    // to this transition projection, not a mutable scalar on the shared state.
    // Existing contributor/result roles and exact source objects stay intact.
    const bundle = { ...animation.bundle, objects: animation.bundle.objects.map(object => ({
      ...object, selectors: object.selectors.map(selector => participants.has(selector.id)
        ? { ...selector, metadata: { ...selector.metadata, successorOperationId: operationId } }
        : selector)
    })) };
    const migration = compileKpEquationAssetMigrationV2({
      animation: { id: animation.id, version: animation.version, bundle, transformations: [transformation] },
      operations: [{ transformationId: transformation.id, operationId, semanticClass: "evaluation",
        roleBindings: { "operands-before": record.sourceSelectorIds, "result-after": record.targetSelectorIds },
        projectionIntent: "replacement" }]
    });
    const resolved = migration.presentationPlan.transitions[0]?.evaluationAuthority;
    if (!resolved) throw new KpReasoningRepairGap("kp.reasoning.evaluation-authority", "$.native",
      "The existing registry must authorize the evaluation.");
    const result = compileKpEquationEvaluationFamilyCertificateV2({ bundle, transformation, authority: resolved });
    if (result.status !== "certified") throw new KpReasoningRepairGap("kp.reasoning.evaluation-certificate", "$.native",
      result.diagnostics.map(item => item.message).join("; "));
    return [result.certificate];
  }));
}
