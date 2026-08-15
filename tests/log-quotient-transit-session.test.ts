import assert from "node:assert/strict";
import test from "node:test";

import {
  assertExclusiveKpLogQuotientTransitOwnership,
  projectKpLogQuotientNativePaintRelations
} from "../src/rendering/log-quotient-transit-session.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../src/semantic/log-quotient-transformation-compiler.ts";

test("compiled quotient correspondence projects complete native paint lineage", () => {
  const relations = projectKpLogQuotientNativePaintRelations(
    kpCanonicalCompiledLogQuotientOperation
  );
  assert.equal(relations.length, 3);
  assert.ok(relations.some(({ relation, sourceEntityIds, targetEntityIds }) =>
    relation === "merge" &&
    sourceEntityIds.includes("source.left.log.operator") &&
    sourceEntityIds.includes("source.right.log.operator") &&
    targetEntityIds.includes("target.log.operator")
  ));
  // Native entry/removal stays structural choreography, not fake glyph travel.
  assert.equal(relations.some(({ relation }) =>
    relation !== "persist" && relation !== "merge" && relation !== "split"
  ), false);
  assert.equal(relations.some(({ sourceEntityIds, targetEntityIds }) =>
    sourceEntityIds.includes("source.subtract") &&
    targetEntityIds.length > 0
  ), false);
});

test("quotient transit accepts exactly its declared visual paint owner", () => {
  for (const ownership of [
    owner("source-native", 1, 0, 0),
    owner("material-scene", 0, 1, 0),
    owner("target-native", 0, 0, 1)
  ]) {
    assert.doesNotThrow(() =>
      assertExclusiveKpLogQuotientTransitOwnership(ownership)
    );
  }
  assert.throws(
    () => assertExclusiveKpLogQuotientTransitOwnership(
      owner("material-scene", 1, 1, 0)
    ),
    /disagrees with native paint opacity/
  );
});

function owner(
  visualOwner: "source-native" | "material-scene" | "target-native",
  sourceNativeOpacity: 0 | 1,
  materialSceneOpacity: 0 | 1,
  targetNativeOpacity: 0 | 1
) {
  return {
    visualOwner,
    sourceNativeOpacity,
    materialSceneOpacity,
    targetNativeOpacity,
    frames: []
  };
}
