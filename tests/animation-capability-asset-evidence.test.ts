import assert from "node:assert/strict";
import test from "node:test";

import generatedEquationManifest from
  "../src/architecture/equation-asset-manifest.generated.json" with {
    type: "json"
  };
import {
  compileKpAnimationCapabilityAssetEvidence,
  createKpAnimationCapabilityAssetEvidence,
  KpAnimationCapabilityAssetEvidenceError
} from "../src/architecture/animation-capability-asset-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";
import type { KpEquationAssetManifest } from
  "../src/architecture/equation-asset-manifest.ts";
import { createKpAnimationLibraryDisplayCatalog } from
  "../src/editor/animation-library-display-catalog.ts";

const equationManifest =
  generatedEquationManifest as unknown as KpEquationAssetManifest;

test("asset evidence joins exact generated manifests and direct links", () => {
  const evidence = createKpAnimationCapabilityAssetEvidence();
  const functionWrap = evidence.requirements.find(
    ({ requirementId }) =>
      requirementId === "requirement.equation.function-wrapping.exemplar"
  );
  assert.equal(functionWrap?.status, "matched");
  if (functionWrap?.status !== "matched") return;
  assert.equal(functionWrap.asset.assetId,
    "animation.generated.function-wrap.apply-f");
  assert.match(functionWrap.asset.href ?? "", /artifact=/);
  assert.ok(functionWrap.asset.disposition);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(Object.isFrozen(evidence.assets), true);
});

test("planned exemplar requirements remain explicit exact-match gaps", () => {
  const evidence = createKpAnimationCapabilityAssetEvidence();
  const alternativeBase = evidence.requirements.find(
    ({ requirementId }) =>
      requirementId === "requirement.equation.logarithm-base.exemplar"
  );
  assert.deepEqual(alternativeBase, {
    capabilityId: "capability.equation.alternative-logarithm-bases",
    requirementId: "requirement.equation.logarithm-base.exemplar",
    assetId: "exemplar.equation.logarithm-change-of-base.v1",
    status: "missing",
    reason: "no-exact-generated-asset"
  });
});

test("display-only domain exemplars retain their generated canonical link", () => {
  const evidence = createKpAnimationCapabilityAssetEvidence();
  const graph3d = evidence.requirements.find(
    ({ assetId }) => assetId === "animation.graph.surface-mode.mesh-to-donut"
  );
  assert.equal(graph3d?.status, "matched");
  if (graph3d?.status !== "matched") return;
  assert.equal(graph3d.asset.source,
    "animation-library-display-catalog");
  assert.ok(graph3d.asset.href);
  assert.equal(graph3d.asset.disposition, undefined);
});

test("asset evidence rejects duplicate and orphaned generated authorities", () => {
  const display = createKpAnimationLibraryDisplayCatalog();
  assert.throws(() => compileKpAnimationCapabilityAssetEvidence({
    plan: kpAnimationCapabilityPlan,
    equationManifest,
    displayCatalog: [...display, display[0]!]
  }), (error: unknown) =>
    error instanceof KpAnimationCapabilityAssetEvidenceError &&
    error.diagnostics.some(({ code }) => code === "asset-evidence.duplicate"));

  const omittedId = equationManifest.entries[0]!.assetId;
  assert.throws(() => compileKpAnimationCapabilityAssetEvidence({
    plan: kpAnimationCapabilityPlan,
    equationManifest,
    displayCatalog: display.filter(({ animationId }) =>
      animationId !== omittedId)
  }), (error: unknown) =>
    error instanceof KpAnimationCapabilityAssetEvidenceError &&
    error.diagnostics.some(({ code, assetId }) =>
      code === "asset-evidence.manifest-orphan" && assetId === omittedId));
});

test("every matched exemplar points to one exact generated asset", () => {
  const evidence = createKpAnimationCapabilityAssetEvidence();
  const assetIds = new Set(evidence.assets.map(({ assetId }) => assetId));
  for (const requirement of evidence.requirements) {
    if (requirement.status !== "matched") continue;
    assert.equal(requirement.assetId, requirement.asset.assetId);
    assert.ok(assetIds.has(requirement.assetId));
  }
});
