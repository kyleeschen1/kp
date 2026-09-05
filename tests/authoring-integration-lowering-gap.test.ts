import assert from "node:assert/strict";
import test from "node:test";
import { createKpEconomicsSupplyTaxAnimationAsset } from "../src/animation/economics-supply-tax-asset.ts";
import { normalizeKpSemanticTransformationCorrespondence } from "../src/semantic/asset-transformation.ts";
import { validateCorrespondenceMap } from "../src/semantic/correspondence.ts";
import { kpCanonicalOperationRegistry } from "../src/semantic/canonical-operation-registry.ts";
import {
  validateKpGovernedCanonicalConstructionCompilation,
  type KpGovernedConstructionSourceAuthority
} from "../src/authoring/governed-canonical-construction-compiler.ts";
import type { KpGovernedCanonicalConstructionRequest } from "../src/authoring/governed-semantic-request.ts";

// This characterizes a stop, not a supported lowering path. Replace these gap
// expectations only with evidence for an explicitly accepted domain contract.
test("canonical supply-tax authority does not yet satisfy the governed compiler entrance", () => {
  const asset = createKpEconomicsSupplyTaxAnimationAsset();
  const authority: KpGovernedConstructionSourceAuthority = {
    sourceId: asset.semantics.id, revisionId: "diagnostic-only",
    operationPacks: [], animation: asset.animation
  };
  const operationIds = asset.animation.transformations.map(operation => operation.id);
  const request: KpGovernedCanonicalConstructionRequest = {
    schemaVersion: "kp.governed-semantic-authoring-request.v2", id: "request.market-gap-probe",
    source: { kind: "verified-semantic-source", sourceId: authority.sourceId,
      revisionId: authority.revisionId, operationPacks: [] },
    approvedObjectIds: asset.animation.bundle.objects.map(object => object.id),
    approvedOperationIds: operationIds,
    explanationPurpose: { kind: "cause", objectIds: [], operationIds },
    detailLevel: "complete", compositionIntent: { kind: "sequence", operationIds }
  };
  const issues = validateKpGovernedCanonicalConstructionCompilation({ request, authority });
  assert.ok(issues.some(issue => issue.path === "$.source.operationPacks"));
  assert.ok(issues.some(issue => issue.code === "governed-verification.lineage"));
  assert.equal(asset.semantics.model.states.taxed.marketClearsExactly, true);
  assert.equal(asset.semantics.model.states.taxed.wedgeEqualsTaxExactly, true);
  console.log("MARKET_LOWERING_GAPS", JSON.stringify(issues));
});

test("registered operation packs contain no supply-tax operation authority to pin", () => {
  const asset = createKpEconomicsSupplyTaxAnimationAsset();
  const operation = asset.animation.transformations[0]!;
  const candidates = kpCanonicalOperationRegistry.entries.filter(entry =>
    entry.id === operation.id || entry.sourceDefinitionId === operation.definitionId ||
    entry.sourceTransformType === operation.transformType);
  assert.deepEqual(candidates, []);
});

test("legacy pair normalization is not complete or value-preserving market lineage", () => {
  const asset = createKpEconomicsSupplyTaxAnimationAsset();
  const operation = asset.animation.transformations[0]!;
  const normalized = normalizeKpSemanticTransformationCorrespondence(operation);
  const objects = new Map(asset.animation.bundle.objects.map(object => [object.id, object]));
  const selectors = (ids: readonly string[]) => ids.flatMap(id => objects.get(id)!.selectors.map(selector => selector.id));
  const issues = validateCorrespondenceMap(normalized, {
    sourceSelectorIds: selectors(operation.sourceObjectIds),
    targetSelectorIds: selectors(operation.targetObjectIds)
  });
  assert.ok(issues.length > 0, "Legacy normalization cannot certify complete target lifecycle coverage.");
  const taxPair = normalized.records.find(record =>
    record.sourceSelectorIds.includes(`${asset.semantics.model.input.tax.id}.untaxed`));
  assert.equal(taxPair?.relation, "identity");
  assert.notDeepEqual(asset.semantics.model.input.tax.initialAmount, asset.semantics.model.input.tax.finalAmount);
  assert.equal(asset.semantics.correspondences.find(record => record.relation === "split")?.targetEntityIds.length, 2);
  console.log("MARKET_LEGACY_LIFECYCLE_GAPS", JSON.stringify(issues));
});
