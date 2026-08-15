import assert from "node:assert/strict";
import test from "node:test";

import {
  assertExclusiveKpLogExponentTransitOwnership,
  projectKpLogExponentNativePaintRelations
} from "../src/rendering/log-exponent-transit-session.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../src/semantic/log-exponent-transformation-tree.ts";

test("compiled log-exponent correspondence projects into native paint relations", () => {
  const relations = kpCanonicalLogExponentTransformationTree.operations.map(
    projectKpLogExponentNativePaintRelations
  );
  assert.deepEqual(relations.map((entries) => entries.length), [5, 8, 8]);
  assert.ok(relations[0]!.some(({ sourceEntityIds, targetEntityIds }) =>
    sourceEntityIds.includes("source.exponent") &&
    targetEntityIds.includes("logged.exponent")
  ));
  assert.ok(relations[1]!.some(({ sourceEntityIds, targetEntityIds }) =>
    sourceEntityIds.includes("logged.exponent") &&
    targetEntityIds.includes("extracted.coefficient")
  ));
  assert.equal(
    relations.flat().some(({ id }) => id.includes("introduce") || id.includes("retire")),
    false
  );
});

test("transit ownership accepts exactly one visible source, material, or target", () => {
  for (const ownership of [
    owner("source-native", 1, 0, 0),
    owner("material-scene", 0, 1, 0),
    owner("target-native", 0, 0, 1)
  ]) {
    assert.doesNotThrow(() =>
      assertExclusiveKpLogExponentTransitOwnership(ownership)
    );
  }
  assert.throws(
    () => assertExclusiveKpLogExponentTransitOwnership(
      owner("material-scene", 1, 1, 0)
    ),
    /exactly one visible paint owner/
  );
  assert.throws(
    () => assertExclusiveKpLogExponentTransitOwnership(
      owner("target-native", 0, 1, 0)
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
