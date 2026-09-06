import { createKpFractionCompositionEquationAsset } from "../semantic/fraction-composition-equation-asset.ts";
import { createKpFractionCompositionEndpointSpecs } from "../semantic/fraction-composition-endpoint-spec.ts";
import { createKpSemanticTransformation, type KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { compileKpOperationPresentationContextBundles } from "./operation-presentation-correspondence.ts";
import { createKpOperationPresentationBundle, createKpOperationPresentationGroup, createKpOperationPresentationRoles } from "./operation-presentation-roles.ts";
import { verifyKpOperationPresentationPlan } from "./operation-presentation-plan-verification.ts";

export class KpFractionDistributionPresentationError extends Error {
  readonly code = "kp.fraction-distribution.presentation-authority-gap";
}

/** Bounded canonical binding, not a relaxation of scalar distribution. The
 * fraction is one semantic factor with three separately retained paint parts.
 */
export function compileKpFractionCompositionDistributionPresentationPlan(input: {
  readonly transformation: KpSemanticTransformation;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}) {
  const canonical = createKpFractionCompositionEquationAsset().transformations[0]!;
  const expected = createKpSemanticTransformation({ ...canonical,
    definitionId: "definition.generated.distribution.distribute-multiplication" });
  if (JSON.stringify(input.transformation) !== JSON.stringify(expected)) throw new KpFractionDistributionPresentationError(
    "Only the canonical verified fractional distribution and its complete primitive lineage may use this binding.");
  const endpoints = createKpFractionCompositionEndpointSpecs();
  const members = (index: number, groupId: string) => {
    const endpoint = endpoints[index]!;
    const group = endpoint.groupEnvelopes.find(group => group.id === groupId);
    if (group === undefined) throw new KpFractionDistributionPresentationError(`Missing semantic factor group ${groupId}.`);
    return [...group.memberSelectorIds,
      ...endpoint.structuralAnchors.filter(anchor => anchor.ownerNodeId === groupId).map(anchor => anchor.id)];
  };
  const source = members(0, "fraction-fan-out.source.factor");
  const targets = [members(1, "fraction-fan-out.target.factor.x"), members(1, "fraction-fan-out.target.factor.6")];
  const records = input.transformation.correspondenceMap!.records;
  const transfers = records.filter(record => record.relation === "fan-out" || record.relation === "fan-in");
  // Every source part branches once to each authored target factor. No record
  // is merged, reordered into a new identity, or classified from its glyph.
  if (transfers.length !== source.length || transfers.some(record =>
    record.relation !== "fan-out" || record.sourceSelectorIds.length !== 1 ||
    !source.includes(record.sourceSelectorIds[0]!) || record.targetSelectorIds.length !== targets.length ||
    targets.some(target => record.targetSelectorIds.filter(id => target.includes(id)).length !== 1)) ||
    source.some(id => transfers.filter(record => record.sourceSelectorIds.includes(id)).length !== 1) ||
    targets.flat().some(id => transfers.filter(record => record.targetSelectorIds.includes(id)).length !== 1)) {
    throw new KpFractionDistributionPresentationError("Fraction factor grouping does not close every primitive transfer.");
  }
  const id = input.transformation.id;
  const bundles = [createKpOperationPresentationBundle({ id: `${id}.bundle.source-factor`,
    role: "source-material", semanticEntityIds: source }),
  ...targets.map((semanticEntityIds, index) => createKpOperationPresentationBundle({
    id: `${id}.bundle.target-factor.${index}`, role: "target-material", semanticEntityIds }))];
  const group = createKpOperationPresentationGroup({ id: `${id}.group.fraction-branch`, groupKind: "branch",
    bundleIds: bundles.map(bundle => bundle.id) });
  const roles = createKpOperationPresentationRoles({ bundles: [...bundles,
    ...compileKpOperationPresentationContextBundles({ transformationId: id,
      records: records.filter(record => !transfers.includes(record)) })], groups: [group] });
  return verifyKpOperationPresentationPlan({ draft: {
    schemaVersion: "kp.verified-operation-presentation-plan.v1", id: `operation-presentation.${id}.fraction-factor`,
    transformationId: id, planKind: "distribution", branchGroupId: group.id, roles
  }, sourceSelectorIds: input.sourceSelectorIds, targetSelectorIds: input.targetSelectorIds,
  scheduledGroupIds: [group.id] });
}
