import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpLogProductFunctionWrapInvocationGroup,
  kpLogProductSemanticMotionProjectionPolicy,
  createKpLogProductSemanticMotionProjectionPolicy,
  projectKpLogProductNativePaintRelations
} from "../src/rendering/log-product-transit-session.ts";
import {
  createKpFunctionWrapInvocationGroupReception,
  isKpCompiledFunctionWrapInvocationGroup
} from "../src/animation/function-wrap-invocation.ts";
import {
  compileKpBinaryLogProductHomomorphicHandoff,
  measureKpBinaryLogProductCarrierCoverage
} from "../src/animation/log-product-homomorphic-handoff.ts";
import {
  kpCanonicalCompiledLogProductOperation,
  kpMultiFactorCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("log-product declares synchronized function-wrap enclosure roles", () => {
  const group = compileKpLogProductFunctionWrapInvocationGroup(
    kpCanonicalCompiledLogProductOperation
  );
  const plan = createKpFunctionWrapInvocationGroupReception({
    group,
    direction: "forward"
  });

  assert.equal(isKpCompiledFunctionWrapInvocationGroup(group), true);
  assert.equal(group.motifId, "motif.function-wrap.v1");
  assert.deepEqual(
    group.branches.map(({ sourceArgumentEntityIds, targetArgumentEntityIds }) => ({
      sourceArgumentEntityIds,
      targetArgumentEntityIds
    })),
    [
      {
        sourceArgumentEntityIds: ["source.product.x"],
        targetArgumentEntityIds: ["target.left.argument.x"]
      },
      {
        sourceArgumentEntityIds: ["source.product.y"],
        targetArgumentEntityIds: ["target.right.argument.y"]
      }
    ]
  );
  assert.equal(plan.kind, "function-wrap-reception");
  assert.equal(plan.synchronization, "all-enclosures-together");
  assert.deepEqual(
    plan.branches.map(({ argumentEntityIds, enclosureEntityRoles }) => ({
      argumentEntityIds,
      enclosureEntityRoles
    })),
    [
      {
        argumentEntityIds: ["target.left.argument.x"],
        enclosureEntityRoles: [
          { entityId: "target.left.log.open", side: "leading" },
          { entityId: "target.left.log.close", side: "trailing" }
        ]
      },
      {
        argumentEntityIds: ["target.right.argument.y"],
        enclosureEntityRoles: [
          { entityId: "target.right.log.open", side: "leading" },
          { entityId: "target.right.log.close", side: "trailing" }
        ]
      }
    ]
  );
});

test("binary homomorphic handoff stages a contracted operator match-dissolve", () => {
  const handoff = compileKpBinaryLogProductHomomorphicHandoff(
    kpCanonicalCompiledLogProductOperation
  );

  assert.equal(handoff.kind, "log-product-homomorphic-handoff");
  assert.equal(handoff.maturity, "candidate");
  assert.deepEqual(handoff.operatorHandoff, {
    topology: "matched-dissolve-to-derived-successors",
    sourceExit: "collapse-to-point",
    targetEntry: "expand-from-point",
    receptionSynchronization: "closure-coupled",
    correspondenceRecordId: "correspondence.log-product.operator-fission",
    sourceEntityId: "source.log.operator",
    targetEntityIds: [
      "target.left.log.operator",
      "target.right.log.operator"
    ],
    sourceContractionWindow: { start: 0.18, end: 0.28 },
    sourceReleaseWindow: { start: 0.24, end: 0.32 },
    targetPresenceWindow: { start: 0.54, end: 0.62 },
    targetExpansionWindow: { start: 0.55, end: 0.64 }
  });
  assert.deepEqual(handoff.payloadHandoff.transitWindow, {
    start: 0.2,
    end: 0.44
  });
  assert.deepEqual(handoff.enclosureHandoff, {
    topology: "source-scope-clears-before-derived-scopes",
    correspondenceRecordIds: [
      "correspondence.log-product.open-shell-fission",
      "correspondence.log-product.close-shell-fission"
    ],
    sourceEntityIds: ["source.log.open", "source.log.close"],
    targetEntityIds: [
      "target.left.log.open",
      "target.left.log.close",
      "target.right.log.open",
      "target.right.log.close"
    ],
    reception: "horizontal-squeeze",
    sizeBehavior: "native-size",
    targetPresenceWindow: { start: 0.44, end: 0.48 },
    transitWindow: { start: 0.48, end: 0.64 },
    sourceReleaseWindow: { start: 0.12, end: 0.2 }
  });
  assert.equal(handoff.payloadHandoff.topology, "ordered-continuity");
  assert.equal(handoff.enclosureHandoff.reception, "horizontal-squeeze");
  assert.equal(handoff.enclosureHandoff.sizeBehavior, "native-size");
  assert.equal(
    handoff.relationHandoff.synchronization,
    "with-derived-operators"
  );
  assert.equal(
    handoff.relationHandoff.receptionWindow.end,
    handoff.operatorHandoff.targetPresenceWindow.end
  );
  assert.ok(
    handoff.operatorHandoff.sourceContractionWindow.end <
      handoff.operatorHandoff.sourceReleaseWindow.end
  );
  assert.ok(
    handoff.operatorHandoff.targetPresenceWindow.start <
      handoff.operatorHandoff.targetExpansionWindow.start
  );
  assert.ok(
    handoff.operatorHandoff.targetPresenceWindow.start >
      handoff.enclosureHandoff.transitWindow.start
  );
  assert.equal(
    handoff.operatorHandoff.targetExpansionWindow.end,
    handoff.enclosureHandoff.transitWindow.end
  );
  assert.equal(
    handoff.targetHoldWindow.start,
    handoff.enclosureHandoff.transitWindow.end
  );
  assert.ok(
    handoff.relationHandoff.receptionWindow.start >
      handoff.enclosureHandoff.transitWindow.start
  );
  assert.ok(
    handoff.operatorHandoff.targetPresenceWindow.start -
      handoff.operatorHandoff.sourceReleaseWindow.end <= 0.270_001
  );
  assert.deepEqual(
    measureKpBinaryLogProductCarrierCoverage(handoff, 0.48),
    { sourcePresence: 0, targetPresence: 0 }
  );
  assert.throws(
    () => compileKpBinaryLogProductHomomorphicHandoff(
      kpMultiFactorCompiledLogProductOperation
    ),
    /binary visual exemplar/
  );
});

test("multi-factor log-product reuses one function-wrap invocation per target branch", () => {
  const group = compileKpLogProductFunctionWrapInvocationGroup(
    kpMultiFactorCompiledLogProductOperation
  );

  assert.equal(group.branches.length, 3);
  assert.deepEqual(
    group.branches.map(({ targetArgumentEntityIds, functionEntityIds }) => ({
      targetArgumentEntityIds,
      functionEntityIds
    })),
    kpMultiFactorCompiledLogProductOperation.contract.family.factors.map((factor) => ({
      targetArgumentEntityIds: [factor.targetOccurrenceId],
      functionEntityIds: [
        factor.targetWrapperOccurrenceId,
        `${factor.targetWrapperOccurrenceId}.operator`
      ]
    }))
  );
});

test("binary visual proof withdraws its source application while factors persist", () => {
  const relations = projectKpLogProductNativePaintRelations(
    kpCanonicalCompiledLogProductOperation
  );
  assert.equal(relations.length, 2);
  assert.equal(relations.filter(({ relation }) => relation === "split").length, 0);
  assert.equal(relations.filter(({ relation }) => relation === "persist").length, 2);
  assert.equal(relations.some(({ sourceEntityIds }) =>
    sourceEntityIds.includes("source.log.operator") ||
    sourceEntityIds.includes("source.log.open") ||
    sourceEntityIds.includes("source.log.close")
  ), false);
  assert.ok(relations.some(({ sourceEntityIds, targetEntityIds }) =>
    sourceEntityIds.includes("source.product.x") &&
    targetEntityIds.includes("target.left.argument.x")
  ));
  assert.equal(relations.some(({ targetEntityIds }) =>
    targetEntityIds.includes("target.sum.plus")
  ), false);
  for (const factor of ["x", "y"] as const) {
    assert.equal(
      kpLogProductSemanticMotionProjectionPolicy
        .routeByCorrespondenceRecordId[
          `correspondence.log-product.${factor}-argument-continuity`
        ]?.variant,
      "direct"
    );
  }
});

test("multi-factor routing derives symmetric wrapper branches and ordinal argument lanes", () => {
  const policy = createKpLogProductSemanticMotionProjectionPolicy(
    kpMultiFactorCompiledLogProductOperation
  );
  const factors = kpMultiFactorCompiledLogProductOperation.contract.family.factors;
  for (const factor of factors) {
    for (const suffix of ["operator", "open", "close"] as const) {
      const route = policy.routeByTargetEntityId?.[
        `${factor.targetWrapperOccurrenceId}.${suffix}`
      ];
      assert.equal(route?.variant, "direct");
      assert.equal(route?.emergence, undefined);
    }
  }
  assert.equal(
    policy.routeByCorrespondenceRecordId?.[
      "correspondence.log-product.x-argument-continuity"
    ]?.variant,
    "arc-below"
  );
  assert.equal(
    policy.routeByCorrespondenceRecordId?.[
      "correspondence.log-product.y-argument-continuity"
    ]?.variant,
    "direct"
  );
  assert.equal(
    policy.routeByCorrespondenceRecordId?.[
      "correspondence.log-product.z-argument-continuity"
    ]?.variant,
    "arc-above"
  );
  const relations = projectKpLogProductNativePaintRelations(
    kpMultiFactorCompiledLogProductOperation
  );
  assert.equal(relations.filter(({ relation }) => relation === "split").length, 3);
  assert.equal(relations.filter(({ relation }) => relation === "persist").length, 3);
});

test("log-product transit composes generic tracks without importing sibling motifs", () => {
  const transitSource = readFileSync(new URL(
    "../src/rendering/log-product-transit-session.ts",
    import.meta.url
  ), "utf8");
  const projectionSource = readFileSync(new URL(
    "../src/rendering/native-katex-semantic-motion-track-projection.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    transitSource,
    /log-(?:quotient|exponent)|distribution|cancellation/u
  );
  assert.doesNotMatch(
    projectionSource,
    /log-(?:product|quotient|exponent)|distribution|cancellation/u
  );
  assert.match(transitSource, /createKpNativeKatexSemanticMotionTrackProjection/u);
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByCorrespondenceRecordId[
      "correspondence.log-product.operator-fission"
    ]?.variant,
    "direct"
  );
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByTargetEntityId[
      "target.left.log.open"
    ]?.variant,
    "direct"
  );
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByTargetEntityId[
      "target.left.log.operator"
    ]?.emergence,
    undefined
  );
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByTargetEntityId[
      "target.right.log.open"
    ]?.variant,
    "direct"
  );
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByTargetEntityId[
      "target.right.log.operator"
    ]?.emergence,
    undefined
  );
});
