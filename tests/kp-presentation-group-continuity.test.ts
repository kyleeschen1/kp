import assert from "node:assert/strict";
import test from "node:test";

import {
  kpDefaultPresentationContinuityBudget,
  type KpPresentationGroupContract,
  type KpPresentationOwnerObservation
} from "../src/animation/presentation-group-continuity.ts";

test("presentation groups describe semantic members without renderer resources", () => {
  const contract: KpPresentationGroupContract = {
    id: "product.0",
    kind: "presentation-group",
    members: [
      { memberId: "factor.0", semanticEntityId: "a.0", nativeOrder: 0 },
      { memberId: "addend.0", semanticEntityId: "b", nativeOrder: 1 }
    ],
    settlementAnchorMemberId: "factor.0",
    nativeOwnerId: "native.product.0",
    cohesionLockProgress: 0.72
  };
  const observation: KpPresentationOwnerObservation = {
    groupId: contract.id,
    ownerId: "temporary.distribution",
    progress: 0.8,
    members: [
      {
        memberId: "factor.0",
        rect: { x: 10, y: 4, width: 8, height: 12 },
        opacity: 1
      },
      {
        memberId: "addend.0",
        rect: { x: 18, y: 4, width: 8, height: 12 },
        opacity: 1
      }
    ]
  };

  assert.deepEqual(observation.members.map((member) => member.memberId),
    contract.members.map((member) => member.memberId));
  assert.equal(JSON.stringify(contract).includes("Element"), false);
  assert.equal(JSON.stringify(contract).includes("WebGL"), false);
  assert.equal(kpDefaultPresentationContinuityBudget.positionPx, 0.5);
});
