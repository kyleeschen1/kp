import { kpPerUnitTaxOperation, verifyKpPerUnitTaxOperation } from "../../../domains/economics/per-unit-tax-operation.ts";
import { createKpPerUnitTaxWelfareAsset } from "../../../domains/economics/per-unit-tax-welfare-asset.ts";
import { createKpCanonicalOperationPack, type KpCanonicalOperationPackPin } from "../../semantic/canonical-operation-pack.ts";
import { createKpAssetBundle } from "../../semantic/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../../semantic/immutable-asset.ts";
import { validateCorrespondenceMap, type SelectorCorrespondenceRecord } from "../../semantic/correspondence.ts";
import { createSemanticTransformationRef } from "../../semantic/animation.ts";
import { createEditableSemanticTransformationTree, createSemanticTransformationLeaf } from "../../semantic/transformation-composition.ts";
import { createKpAnimationAsset } from "../../animation/asset.ts";
import { createKpEconomicsSupplyTaxAnimationAsset } from "../../animation/economics-supply-tax-asset.ts";
import { createKpGovernedCanonicalConstructionRequest } from "../../authoring/governed-semantic-request.ts";
import { compileKpGovernedCanonicalConstruction, type KpGovernedConstructionSourceAuthority } from "../../authoring/governed-canonical-construction-compiler.ts";
import { recoverKpPinnedSnapshot, type KpPinnedSnapshotReference, type KpSemanticSnapshotRecoveryIndex } from "../../semantic-state/pinned-recovery.ts";

// Explicit local registration keeps economics out of the populated equation
// registry and does not force graph semantics through an equation paint motif.
export const kpSupplyTaxOperationRegistration = freeze({
  pack: createKpCanonicalOperationPack({ id: kpPerUnitTaxOperation.packId, scope: "project",
    version: kpPerUnitTaxOperation.version, title: "Bounded economics per-unit-tax operation",
    operationIds: [kpPerUnitTaxOperation.id] }),
  operation: kpPerUnitTaxOperation
});

export class KpSupplyTaxSourceAuthorityError extends Error {
  readonly code: "kp.economics.operation-pin-gap" | "kp.economics.lifecycle-gap" | "kp.economics.snapshot-pin-gap";
  constructor(code: KpSupplyTaxSourceAuthorityError["code"], message: string) {
    super(message); this.name = "KpSupplyTaxSourceAuthorityError"; this.code = code;
  }
}

export function resolveKpSupplyTaxOperation(pin: KpCanonicalOperationPackPin, operationId: string) {
  const { pack, operation } = kpSupplyTaxOperationRegistration;
  if (pin.packId !== pack.id || pin.version !== pack.version || operationId !== operation.id) {
    throw new KpSupplyTaxSourceAuthorityError("kp.economics.operation-pin-gap", "Supply the exact registered economics operation and pack version.");
  }
  return operation;
}

export function createKpSupplyTaxGovernedSource(input: Parameters<typeof verifyKpPerUnitTaxOperation>[0] & {
  readonly beforePin: KpPinnedSnapshotReference;
  readonly afterPin: KpPinnedSnapshotReference;
  readonly history: KpSemanticSnapshotRecoveryIndex;
}) {
  const beforeSnapshot = recoverKpPinnedSnapshot(input.history, input.beforePin);
  const afterSnapshot = recoverKpPinnedSnapshot(input.history, input.afterPin);
  if (beforeSnapshot.id === afterSnapshot.id || beforeSnapshot.namespace !== afterSnapshot.namespace) {
    throw new KpSupplyTaxSourceAuthorityError("kp.economics.snapshot-pin-gap", "Supply distinct before/after aggregate pins in one namespace.");
  }
  const verified = verifyKpPerUnitTaxOperation(input);
  const canonical = createKpEconomicsSupplyTaxAnimationAsset(createKpPerUnitTaxWelfareAsset(verified.model));
  const original = canonical.animation.transformations[0]!;
  const tax = verified.model.input.tax;
  const taxOccurrence = (phase: "before" | "after") => createKpImmutableSemanticAssetObject({
    id: `${tax.id}.${phase}`, objectType: "economics-tax-state-occurrence", title: `${phase} tax`,
    value: { roleId: tax.id, snapshot: phase === "before" ? input.beforePin : input.afterPin,
      amount: phase === "before" ? tax.initialAmount : tax.finalAmount },
    selectors: [{ id: `${tax.id}.${phase}.value`, kind: "parameter-value", label: `${phase} tax amount` }]
  });
  const beforeTax = taxOccurrence("before");
  const afterTax = taxOccurrence("after");
  const sourceObjectIds = original.sourceObjectIds.map(id => id === tax.id ? beforeTax.id : id);
  const targetObjectIds = original.targetObjectIds.map(id => id === tax.id ? afterTax.id : id);
  const objects = [...canonical.animation.bundle.objects, beforeTax, afterTax];
  const byId = new Map(objects.map(object => [object.id, object]));
  const selector = (id: string) => {
    const object = byId.get(id);
    if (object?.selectors.length !== 1) throw new KpSupplyTaxSourceAuthorityError(
      "kp.economics.lifecycle-gap", `Expected one declared semantic selector for ${id}.`);
    return object.selectors[0]!.id;
  };
  const records: SelectorCorrespondenceRecord[] = [];
  const record = (id: string, relation: SelectorCorrespondenceRecord["relation"], source: readonly string[], target: readonly string[], summary: string) => {
    records.push({ id: `lineage.economics.tax.${id}`, relation,
      sourceSelectorIds: source.map(selector), targetSelectorIds: target.map(selector), summary });
  };
  const semantics = canonical.semantics;
  const demand = semantics.entities.curves.find(curve => curve.role === "demand")!;
  const supply = semantics.entities.curves.find(curve => curve.role === "marginal-cost-supply")!;
  for (const id of [semantics.id, demand.id, supply.id]) record(`persist.${id}`, "identity", [id], [id], "The immutable authority or unchanged curve is retained.");
  const split = semantics.correspondences.find(item => item.relation === "split")!;
  record("price-split", "fan-out", split.sourceEntityIds, split.targetEntityIds, "The domain-declared market price splits into buyer and seller prices.");
  const successive = [[beforeTax.id, afterTax.id], [verified.model.states.untaxed.id, verified.model.states.taxed.id],
    ...["consumer-surplus", "producer-surplus"].map(role => [
      semantics.entities.regions.find(region => region.role === role && region.phase === "untaxed")!.id,
      semantics.entities.regions.find(region => region.role === role && region.phase === "taxed")!.id
    ])];
  for (const [before, after] of successive) {
    // End the old occurrence and introduce its computed successor. Causal
    // succession is retained separately; neither relation claims value identity.
    record(`end.${before}`, "removal", [before!], [], "End the before-state occurrence, preserving its pinned historical value.");
    record(`begin.${after}`, "introduction", [], [after!], "Introduce the domain-computed after-state occurrence.");
  }
  const introductions = [verified.model.input.supply.taxedId,
    semantics.entities.wedge.id, ...semantics.entities.regions.filter(region =>
      region.role === "government-revenue" || region.role === "deadweight-loss").map(region => region.id)];
  for (const id of introductions) {
    const cause = semantics.lineage.find(edge => edge.targetEntityIds.includes(id));
    if (!cause) throw new KpSupplyTaxSourceAuthorityError("kp.economics.lifecycle-gap", `Missing domain cause for ${id}.`);
    record(`derive.${id}`, "introduction", [], [id], cause.claim);
  }
  const correspondenceMap = { id: `${original.id}.state-occurrences.v1`, records };
  const lifecycle = { sourceSelectorIds: sourceObjectIds.map(selector), targetSelectorIds: targetObjectIds.map(selector) };
  const issues = validateCorrespondenceMap(correspondenceMap, lifecycle);
  if (issues.length) throw new KpSupplyTaxSourceAuthorityError("kp.economics.lifecycle-gap", JSON.stringify(issues));
  const transformation = { ...original, sourceObjectIds, targetObjectIds, correspondence: [], correspondenceMap };
  // Compiler-only projection of the same domain authority. It has no render
  // targets: canonical remains the independently preserved paint entrance.
  const animation = createKpAnimationAsset({ id: `${canonical.id}.governed-source`, title: canonical.animation.title,
    bundle: createKpAssetBundle({ id: `${canonical.animation.bundle.id}.governed-source`, title: canonical.animation.bundle.title, objects }),
    transformations: [transformation], transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(createSemanticTransformationRef({ id: original.id,
        kind: original.transformType, sourceObjectIds, targetObjectIds, preserves: original.preserves, summary: original.title }))
    }) });
  const pin = { packId: kpPerUnitTaxOperation.packId, version: kpPerUnitTaxOperation.version };
  resolveKpSupplyTaxOperation(pin, kpPerUnitTaxOperation.id);
  const authority: KpGovernedConstructionSourceAuthority = freeze({ sourceId: semantics.id,
    // Aggregate IDs are session-local; include verified source values so two
    // authored models cannot share compiler authority merely by reusing IDs.
    revisionId: JSON.stringify([verified.model.input, input.beforePin, input.afterPin]), operationPacks: [pin], animation });
  const request = createKpGovernedCanonicalConstructionRequest({ schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.economics.supply-tax.authoring.v1", source: { kind: "verified-semantic-source", sourceId: authority.sourceId,
      revisionId: authority.revisionId, operationPacks: authority.operationPacks },
    approvedObjectIds: [...new Set([...sourceObjectIds, ...targetObjectIds])], approvedOperationIds: [original.id],
    explanationPurpose: { kind: "cause", objectIds: [], operationIds: [original.id] }, detailLevel: "complete",
    compositionIntent: { kind: "sequence", operationIds: [original.id] } });
  const compilation = compileKpGovernedCanonicalConstruction({ request, authority });
  return freeze({ canonical, authority, request, compilation, lifecycle,
    stateTransition: { operationId: kpPerUnitTaxOperation.id, before: input.beforePin, after: input.afterPin,
      occurrences: successive.map(([before, after]) => ({ before, after })), causes: semantics.lineage } });
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
