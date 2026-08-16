import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpLogProductSemanticMotionProjectionPolicy,
  createKpLogProductSemanticMotionProjectionPolicy,
  projectKpLogProductNativePaintRelations
} from "../src/rendering/log-product-transit-session.ts";
import {
  kpCanonicalCompiledLogProductOperation,
  kpMultiFactorCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

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
