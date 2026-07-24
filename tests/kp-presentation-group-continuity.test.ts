import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCompoundTargetDeclarations,
  evaluateKpIntraOwnerContinuity,
  kpDefaultPresentationContinuityBudget,
  observeKpCompositeInk,
  observeKpMeasuredInk,
  observeKpRasterInk,
  snapshotKpPresentationGroupGeometry,
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

test("intra-owner law rejects a late factor-to-term gap", () => {
  const native = geometrySnapshot(0);
  const actual = geometrySnapshot(7);
  const issues = evaluateKpIntraOwnerContinuity({ actual, native });

  assert.ok(issues.some((issue) => issue.kind === "relative-position"));
  assert.ok(issues.some((issue) => issue.kind === "adjacent-gap"));
  assert.deepEqual(
    evaluateKpIntraOwnerContinuity({ actual: native, native }),
    []
  );
});

test("rendered ink observations ignore transparent raster padding", () => {
  const alpha = new Uint8Array(6 * 4);
  alpha[1 * 6 + 2] = 255;
  alpha[1 * 6 + 3] = 255;
  alpha[2 * 6 + 2] = 255;
  alpha[2 * 6 + 3] = 255;

  assert.deepEqual(observeKpRasterInk({
    origin: { x: 100, y: 50 },
    width: 6,
    height: 4,
    alpha
  }), {
    rect: { x: 102, y: 51, width: 2, height: 2 },
    coverage: 1
  });
});

test("measured and raster owners compose into one visible ink union", () => {
  const dom = observeKpMeasuredInk([
    { x: 10, y: 10, width: 4, height: 8 },
    { x: 15, y: 10, width: 3, height: 8 }
  ]);
  const canvas = observeKpRasterInk({
    origin: { x: 20, y: 10 },
    width: 2,
    height: 2,
    alpha: new Uint8Array([255, 255, 255, 255])
  });
  const composite = observeKpCompositeInk([dom, canvas]);

  assert.deepEqual(composite?.rect, {
    x: 10,
    y: 10,
    width: 12,
    height: 8
  });
  assert.ok((composite?.coverage ?? 0) > 0);
});

test("geometry snapshots preserve native-local offsets and edge gaps", () => {
  const contract: KpPresentationGroupContract = {
    id: "product",
    kind: "presentation-group",
    members: [
      { memberId: "factor", semanticEntityId: "a", nativeOrder: 0 },
      { memberId: "term", semanticEntityId: "wide-term", nativeOrder: 1 }
    ],
    settlementAnchorMemberId: "factor",
    nativeOwnerId: "native",
    cohesionLockProgress: 0.72
  };
  const snapshot = snapshotKpPresentationGroupGeometry({
    contract,
    observation: {
      groupId: "product",
      ownerId: "temporary",
      progress: 0.8,
      members: [
        {
          memberId: "term",
          rect: { x: 124, y: 31, width: 32, height: 15 },
          opacity: 1
        },
        {
          memberId: "factor",
          rect: { x: 100, y: 30, width: 19, height: 17 },
          opacity: 1
        }
      ]
    }
  });

  assert.deepEqual(snapshot.memberLocalRects, [
    {
      memberId: "factor",
      rect: { x: 0, y: 0, width: 19, height: 17 }
    },
    {
      memberId: "term",
      rect: { x: 24, y: 1, width: 32, height: 15 }
    }
  ]);
  assert.equal(snapshot.adjacentEdgeGaps[0]?.horizontalPx, 5);
});

test("compound targets use correspondence order rather than token order", () => {
  const [declaration] = compileKpCompoundTargetDeclarations([{
    id: "product.0",
    nativeOwnerId: "native.product.0",
    memberBindings: [
      { memberId: "addend", semanticEntityId: "b", correspondenceOrder: 1 },
      { memberId: "factor", semanticEntityId: "a", correspondenceOrder: 0 }
    ]
  }]);

  assert.equal(declaration?.kind, "presentation-group");
  assert.deepEqual(
    declaration?.kind === "presentation-group"
      ? declaration.members.map((member) => member.memberId)
      : [],
    ["factor", "addend"]
  );
});

test("single and intentionally independent targets require typed exemptions", () => {
  assert.throws(() => compileKpCompoundTargetDeclarations([{
    id: "single",
    nativeOwnerId: "native.single",
    memberBindings: [
      { memberId: "only", semanticEntityId: "x", correspondenceOrder: 0 }
    ]
  }]), /typed exemption/);

  const [declaration] = compileKpCompoundTargetDeclarations([{
    id: "single",
    nativeOwnerId: "native.single",
    memberBindings: [
      { memberId: "only", semanticEntityId: "x", correspondenceOrder: 0 }
    ],
    exemption: {
      reason: "single-member-target",
      rationale: "There is no internal relationship to preserve."
    }
  }]);
  assert.equal(declaration?.kind, "presentation-group-exemption");
});

function geometrySnapshot(termOffset: number) {
  return {
    groupId: "product",
    ownerId: "temporary",
    progress: 0.9,
    anchorMemberId: "factor",
    memberLocalRects: [
      {
        memberId: "factor",
        rect: { x: 0, y: 0, width: 10, height: 12 }
      },
      {
        memberId: "term",
        rect: { x: 10 + termOffset, y: 0, width: 11, height: 12 }
      }
    ],
    adjacentEdgeGaps: [{
      leadingMemberId: "factor",
      trailingMemberId: "term",
      horizontalPx: termOffset,
      verticalPx: 0
    }]
  };
}
