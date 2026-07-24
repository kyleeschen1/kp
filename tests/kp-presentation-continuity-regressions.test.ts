import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpInterOwnerEquivalence,
  evaluateKpIntraOwnerContinuity,
  type KpPresentationGroupContract,
  type KpPresentationOwnerObservation
} from "../src/animation/presentation-group-continuity.ts";

const productContract: KpPresentationGroupContract = {
  id: "distribution.product.0",
  kind: "presentation-group",
  members: [
    { memberId: "factor.0", semanticEntityId: "a.0", nativeOrder: 0 },
    { memberId: "addend.0", semanticEntityId: "b", nativeOrder: 1 }
  ],
  settlementAnchorMemberId: "factor.0",
  nativeOwnerId: "katex.product.0",
  cohesionLockProgress: 0.72
};

test("negative fixture: a distributed factor cannot finish before its term", () => {
  const issues = evaluateKpIntraOwnerContinuity({
    actual: snapshot(8),
    native: snapshot(0)
  });
  assert.deepEqual(
    [...new Set(issues.map((issue) => issue.kind))].sort(),
    ["adjacent-gap", "relative-position"]
  );
});

test("negative fixture: WebGL fraction metadata cannot stand in for native ink", () => {
  const contract: KpPresentationGroupContract = {
    id: "radical.source-fraction",
    kind: "presentation-group",
    members: [
      { memberId: "numerator", semanticEntityId: "one", nativeOrder: 0 },
      { memberId: "bar", semanticEntityId: "fraction-bar", nativeOrder: 1 },
      { memberId: "denominator", semanticEntityId: "two", nativeOrder: 2 }
    ],
    settlementAnchorMemberId: "bar",
    nativeOwnerId: "katex.source-fraction",
    cohesionLockProgress: 0.9
  };
  const native = fractionObservation("katex", 1, 0);
  const webgl = fractionObservation("webgl", 0.92, 2);
  const issues = evaluateKpInterOwnerEquivalence({
    contract,
    outgoing: webgl,
    incoming: native
  });

  assert.ok(issues.some((issue) => issue.kind === "relative-size"));
  assert.ok(issues.some((issue) => issue.kind === "ink-bounds"));
});

function snapshot(termOffset: number) {
  return {
    groupId: productContract.id,
    ownerId: "temporary",
    progress: 0.94,
    anchorMemberId: "factor.0",
    memberLocalRects: [
      {
        memberId: "factor.0",
        rect: { x: 0, y: 0, width: 10, height: 14 }
      },
      {
        memberId: "addend.0",
        rect: { x: 10 + termOffset, y: 0, width: 11, height: 14 }
      }
    ],
    adjacentEdgeGaps: [{
      leadingMemberId: "factor.0",
      trailingMemberId: "addend.0",
      horizontalPx: termOffset,
      verticalPx: 0
    }]
  };
}

function fractionObservation(
  ownerId: string,
  scale: number,
  offsetX: number
): KpPresentationOwnerObservation {
  const rect = (x: number, y: number, width: number, height: number) => ({
    x: offsetX + x,
    y,
    width: width * scale,
    height: height * scale
  });
  return {
    groupId: "radical.source-fraction",
    ownerId,
    progress: 0.01,
    members: [
      { memberId: "numerator", rect: rect(3, 0, 5, 7), opacity: 1 },
      { memberId: "bar", rect: rect(0, 8, 11, 1), opacity: 1 },
      { memberId: "denominator", rect: rect(3, 10, 5, 7), opacity: 1 }
    ],
    ink: {
      rect: rect(0, 0, 11, 17),
      coverage: scale === 1 ? 0.42 : 0.36
    }
  };
}
