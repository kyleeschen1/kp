import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpCanonicalLogProductContract,
  kpMultiFactorLogProductContract
} from "../src/semantic/log-product-contract.ts";
import {
  kpCanonicalCompiledLogProductSemanticMotion,
  kpCanonicalLogProductSemanticMotionPrecedence,
  kpCanonicalLogProductSemanticMotionRequest,
  kpCanonicalLogProductSemanticMotionStructure,
  kpMultiFactorCompiledLogProductSemanticMotion,
  kpMultiFactorLogProductSemanticMotionBundle
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  sampleKpSemanticMotionChoreography
} from "../src/domain-ir/public-api.ts";
import {
  listKpLogProductExpressionNodes
} from "../src/semantic/log-product-states.ts";
import {
  isKpCompiledLogProductOperation,
  kpCanonicalCompiledLogProductOperation,
  kpMultiFactorCompiledLogProductOperation
} from "../src/semantic/log-product-transformation-compiler.ts";

test("log product owns exact domain, endpoints, and reversible lineage", () => {
  const contract = kpCanonicalLogProductContract;
  const operation = kpCanonicalCompiledLogProductOperation;

  assert.equal(contract.source.latex, "\\ln(xy)");
  assert.equal(contract.target.latex, "\\ln(x)+\\ln(y)");
  assert.deepEqual(contract.assumptionIds, [
    "assumption.log-product.x-positive",
    "assumption.log-product.y-positive",
    "assumption.log-product.natural-base",
    "assumption.log-product.product-positive"
  ]);
  assert.equal(isKpCompiledLogProductOperation(operation), true);
  assert.equal(isKpCompiledLogProductOperation({ ...operation }), false);
  assert.deepEqual(
    operation.rewindRecords.flatMap(({ fromSelectorIds }) => fromSelectorIds).sort(),
    listKpLogProductExpressionNodes(contract.target).map(({ id }) => id).sort()
  );
  assert.deepEqual(
    operation.rewindRecords.flatMap(({ toSelectorIds }) => toSelectorIds).sort(),
    listKpLogProductExpressionNodes(contract.source).map(({ id }) => id).sort()
  );
});

test("three factors pressure the same compiler without false wrapper identity", () => {
  const contract = kpMultiFactorLogProductContract;
  const operation = kpMultiFactorCompiledLogProductOperation;
  assert.equal(contract.source.latex, "\\ln(xyz)");
  assert.equal(contract.target.latex, "\\ln(x)+\\ln(y)+\\ln(z)");
  assert.equal(
    kpMultiFactorCompiledLogProductSemanticMotion.recipeId,
    kpCanonicalCompiledLogProductSemanticMotion.recipeId
  );
  assert.deepEqual(
    kpMultiFactorLogProductSemanticMotionBundle.structure,
    kpCanonicalLogProductSemanticMotionStructure
  );
  const records = operation.transformation.correspondenceMap!.records;
  for (const suffix of [
    "application-fission",
    "operator-fission",
    "open-shell-fission",
    "close-shell-fission"
  ]) {
    const record = records.find(({ id }) => id.endsWith(suffix));
    assert.equal(record?.relation, "fan-out");
    assert.equal(record?.sourceSelectorIds.length, 1);
    assert.equal(record?.targetSelectorIds.length, 3);
  }
  const continuants = records.filter(({ id }) =>
    id.endsWith("argument-continuity")
  );
  assert.equal(continuants.length, 3);
  assert.ok(continuants.every(({ relation, sourceSelectorIds, targetSelectorIds }) =>
    relation === "role-change" &&
    sourceSelectorIds.length === 1 &&
    targetSelectorIds.length === 1
  ));
  const endpointIdentities = new Map(
    [...contract.family.states].flatMap((state) =>
      listKpLogProductExpressionNodes(state).map(({ id, semanticId }) => [id, semanticId])
    )
  );
  for (const record of records.filter(({ relation }) => relation === "fan-out")) {
    const sourceIdentity = endpointIdentities.get(record.sourceSelectorIds[0]!);
    assert.ok(record.targetSelectorIds.every((targetId) =>
      endpointIdentities.get(targetId) !== sourceIdentity
    ));
  }
});

test("log product compiles one renderer-neutral fission recipe", () => {
  assert.equal(
    kpCanonicalCompiledLogProductSemanticMotion.recipeId,
    "recipe.semantic-motion.log-product-fission.v1"
  );
  assert.equal(
    kpCanonicalCompiledLogProductSemanticMotion.clockCoupling,
    "external-shared-progress"
  );
  const source = sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress: 0,
    direction: "forward"
  });
  const target = sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress: 1,
    direction: "forward"
  });
  assert.equal(source.settledStateId, kpCanonicalLogProductContract.source.id);
  assert.equal(target.settledStateId, kpCanonicalLogProductContract.target.id);
  for (const progress of [0, 0.17, 0.5, 0.83, 1]) {
    const forward = sampleKpSemanticMotionChoreography({
      choreography: kpCanonicalCompiledLogProductSemanticMotion,
      progress,
      direction: "forward"
    });
    const rewind = sampleKpSemanticMotionChoreography({
      choreography: kpCanonicalCompiledLogProductSemanticMotion,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.equal(forward.semanticProgress, rewind.semanticProgress);
    assert.deepEqual(forward.tracks, rewind.tracks);
  }
  assert.equal(sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress: 0.49,
    direction: "forward",
    reducedMotion: true
  }).settledStateId, kpCanonicalLogProductContract.source.id);
  assert.equal(sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
    progress: 0.5,
    direction: "forward",
    reducedMotion: true
  }).settledStateId, kpCanonicalLogProductContract.target.id);
});

test("every frontier entity has one semantic role before presentation exists", () => {
  const bindings = kpCanonicalLogProductSemanticMotionRequest.operation.roleBindings;
  const bound = Object.values(bindings).flat();
  const frontier = [
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier.sourceEntityIds,
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier.targetEntityIds
  ];

  assert.equal(new Set(bound).size, bound.length);
  assert.deepEqual([...bound].sort(), [...frontier].sort());
  assert.deepEqual(
    Object.keys(bindings).sort(),
    kpCanonicalLogProductSemanticMotionStructure.roles.map(({ id }) => id).sort()
  );
  assert.equal(
    kpCanonicalLogProductSemanticMotionPrecedence.events.at(-1)?.kind,
    "native-target-ready"
  );
});

test("the semantic caller owns no geometry, timing, or renderer imports", () => {
  const source = readFileSync(new URL(
    "../src/semantic/log-product-semantic-motion.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:rendering|editor)/u);
  assert.doesNotMatch(
    source,
    /\b(?:durationMs|delayMs|easing|translateX|translateY|geometry)\b/u
  );
});
