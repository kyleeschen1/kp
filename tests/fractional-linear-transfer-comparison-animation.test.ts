import assert from "node:assert/strict";
import test from "node:test";

import { compileKpAnimationAssetSemanticRefs } from "../src/animation/asset.ts";
import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../src/animation/fractional-linear-transfer-comparison-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  kpFractionalLinearCertifiedTransferProxyRecordId
} from "../src/semantic/fractional-linear-certified-transfer.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpCertifiedTransferMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";
import { sampleKpEquationLinearRearrangementOwnerMotion } from "../src/rendering/equation-linear-rearrangement-owner-motion.ts";

test("balanced and fluent assets share truth but expose different presentations", () => {
  const balanced = createFractionalLinearTransferBalancedAnimationAsset();
  const fluent = createFractionalLinearTransferFluentAnimationAsset();

  assert.deepEqual(balanced.transformations.map((item) => item.transformType), [
    "multiplyBothSides",
    "cancelMultiplicativeInverses",
    "simplifyConstantProduct"
  ]);
  assert.deepEqual(fluent.transformations.map((item) => item.transformType), [
    "projectCertifiedFractionTransfer",
    "simplifyConstantProduct"
  ]);
  assert.deepEqual(compileKpAnimationAssetSemanticRefs(balanced).diagnostics, []);
  assert.deepEqual(compileKpAnimationAssetSemanticRefs(fluent).diagnostics, []);
  assert.equal(
    fluent.metadata?.["certifiedTransferProof"],
    balanced.transformations.map((item) => item.id).join(",")
  );
});

test("fluent material projection joins visual ownership without changing correspondence", () => {
  const animation = createFractionalLinearTransferFluentAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({ animation, progress: 0.25 });
  const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame });
  const semanticPlan = compileKpReaderEquationMaterialPlan(renderPlan);
  const projected = projectKpCertifiedTransferMaterialPlan(semanticPlan);
  const transition = projected.transitions[0];

  assert.ok(transition);
  assert.equal(renderPlan.transitions[0]?.semanticStatus, "ready");
  assert.equal(renderPlan.transitions[0]?.relations.some((relation) =>
    relation.recordId === kpFractionalLinearCertifiedTransferProxyRecordId
  ), false);
  const proxy = transition.owners.find((owner) =>
    owner.relationRecordId === kpFractionalLinearCertifiedTransferProxyRecordId
  );
  assert.deepEqual(proxy && {
    relation: proxy.relation,
    lifecycle: proxy.lifecycle,
    continuity: proxy.continuity,
    sourceCount: proxy.sourceAnchorIds.length,
    targetCount: proxy.targetAnchorIds.length
  }, {
    relation: "artifact",
    lifecycle: "role-change",
    continuity: "source-target",
    sourceCount: 1,
    targetCount: 1
  });
});

test("certified denominator proxy travels continuously with atomic endpoints", () => {
  const frame = (progress: number) => sampleKpEquationLinearRearrangementOwnerMotion({
    kind: "certified-fraction-transfer",
    relationRecordId: kpFractionalLinearCertifiedTransferProxyRecordId,
    lifecycle: "role-change",
    sourceAnchors: [{
      id: "source-two",
      rect: { left: 20, top: 60, width: 12, height: 18 }
    }],
    targetAnchors: [{
      id: "target-two",
      rect: { left: 100, top: 30, width: 12, height: 18 }
    }],
    progress
  });

  assert.deepEqual(frame(0).map((token) => [token.side, token.pose.opacity]), [
    ["source", 1],
    ["target", 0]
  ]);
  const midpoint = frame(0.5);
  assert.equal(midpoint[0]?.pose.opacity, 1);
  assert.equal(midpoint[1]?.pose.opacity, 0);
  assert.ok((midpoint[0]?.pose.x ?? 0) > 0);
  assert.ok((midpoint[0]?.pose.y ?? 0) < 0);
  assert.deepEqual(frame(1).map((token) => [token.side, token.pose.opacity]), [
    ["source", 0],
    ["target", 1]
  ]);
});
