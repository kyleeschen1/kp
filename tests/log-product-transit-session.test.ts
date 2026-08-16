import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpLogProductSemanticMotionProjectionPolicy,
  projectKpLogProductNativePaintRelations
} from "../src/rendering/log-product-transit-session.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("compiled product correspondence projects complete native paint lineage", () => {
  const relations = projectKpLogProductNativePaintRelations(
    kpCanonicalCompiledLogProductOperation
  );
  assert.equal(relations.length, 5);
  assert.equal(relations.filter(({ relation }) => relation === "split").length, 3);
  assert.equal(relations.filter(({ relation }) => relation === "persist").length, 2);
  assert.ok(relations.some(({ relation, sourceEntityIds, targetEntityIds }) =>
    relation === "split" &&
    sourceEntityIds.includes("source.log.operator") &&
    targetEntityIds.includes("target.left.log.operator") &&
    targetEntityIds.includes("target.right.log.operator")
  ));
  assert.ok(relations.some(({ sourceEntityIds, targetEntityIds }) =>
    sourceEntityIds.includes("source.product.x") &&
    targetEntityIds.includes("target.left.argument.x")
  ));
  assert.equal(relations.some(({ targetEntityIds }) =>
    targetEntityIds.includes("target.sum.plus")
  ), false);
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
      "target.right.log.open"
    ]?.variant,
    "direct"
  );
  assert.equal(
    kpLogProductSemanticMotionProjectionPolicy.routeByTargetEntityId[
      "target.right.log.operator"
    ]?.emergence,
    "branch-from-source"
  );
});
