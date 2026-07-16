import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpMaterialContinuityPlan,
  type KpMaterialContinuityPlan
} from "../src/animation/material-continuity.ts";

function samplePlan(): KpMaterialContinuityPlan {
  return {
    id: "material-continuity.sample",
    materialContinuants: [
      {
        id: "continuant.x",
        authority: {
          kind: "semantic-continuant",
          continuantId: "semantic.x"
        },
        semanticEntityIds: ["source.x", "target.x"],
        sourceMotionIds: ["motion.source.x"],
        targetMotionIds: ["motion.target.x"],
        ownership: "stable-owner",
        preserveThrough: [
          "movement",
          "operation-boundary",
          "seek",
          "rewind",
          "renderer-handoff"
        ]
      },
      {
        id: "continuant.root-notation",
        authority: {
          kind: "representational-lineage",
          lineageId: "lineage.root-notation"
        },
        semanticEntityIds: ["source.exponent", "target.radical"],
        sourceMotionIds: ["motion.source.exponent"],
        targetMotionIds: ["motion.target.radical"],
        ownership: "shared-reconciliation",
        preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
      }
    ],
    fragments: [
      {
        id: "fragment.exponent-rule",
        materialContinuantId: "continuant.root-notation",
        role: "fraction-rule",
        sourceMotionIds: ["motion.source.exponent-rule"],
        targetMotionIds: [],
        semanticAuthority: false
      },
      {
        id: "fragment.radical-hook",
        materialContinuantId: "continuant.root-notation",
        role: "radical-hook",
        sourceMotionIds: [],
        targetMotionIds: ["motion.target.radical-hook"],
        semanticAuthority: false
      }
    ],
    bundles: [
      {
        id: "bundle.root-notation",
        materialContinuantId: "continuant.root-notation",
        sourceFragmentIds: ["fragment.exponent-rule"],
        targetFragmentIds: ["fragment.radical-hook"],
        reconciliation: "shared-point",
        nativeSettlementRequired: true
      }
    ],
    envelopeBridges: [
      {
        id: "bridge.solve.step-one-to-two",
        fromTransformationId: "transform.one",
        toTransformationId: "transform.two",
        preserveMaterialContinuantIds: ["continuant.x"],
        attention: "transfer",
        velocity: "settle-before-next"
      }
    ]
  };
}

test("material continuity plan names stable ownership and shared reconciliation", () => {
  const plan = createKpMaterialContinuityPlan(samplePlan());
  assert.equal(plan.materialContinuants[0]?.ownership, "stable-owner");
  assert.equal(plan.materialContinuants[1]?.ownership, "shared-reconciliation");
  assert.equal(plan.fragments[0]?.semanticAuthority, false);
  assert.equal(plan.bundles[0]?.reconciliation, "shared-point");
});

test("material continuity rejects ungrounded fragments and bridges", () => {
  const missingFragmentOwner = samplePlan();
  assert.throws(
    () => createKpMaterialContinuityPlan({
      ...missingFragmentOwner,
      fragments: [{
        ...missingFragmentOwner.fragments[0]!,
        materialContinuantId: "continuant.missing"
      }]
    }),
    /missing continuant/
  );

  const missingBridgeOwner = samplePlan();
  assert.throws(
    () => createKpMaterialContinuityPlan({
      ...missingBridgeOwner,
      envelopeBridges: [{
        ...missingBridgeOwner.envelopeBridges[0]!,
        preserveMaterialContinuantIds: ["continuant.missing"]
      }]
    }),
    /missing continuant/
  );
});
