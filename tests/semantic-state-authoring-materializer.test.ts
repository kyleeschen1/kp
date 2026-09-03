import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAggregateSemanticSnapshot,
  createKpSemanticSlotAbsence
} from "../src/semantic-state/aggregate-snapshot.ts";
import {
  compileKpSemanticStateSchema,
  type KpCompiledSemanticStateLeaf
} from "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import {
  materializeKpSemanticStateInitialSnapshot,
  KpSemanticStateMaterializationError
} from "../src/semantic-state/authoring-state-materializer.ts";
import {
  createKpSemanticDerivedBindingDeclaration
} from "../src/semantic-state/derived-binding.ts";
import {
  createKpSemanticEntityVersionStore,
  type KpPersistentSemanticValue
} from "../src/semantic-state/entity-version-store.ts";

test("compiled schemas materialize through the exact foundation constructors", () => {
  const mutableSupply = { intercept: 2, slope: 1 };
  const compiled = createCompiledMarket(mutableSupply);
  const supply = readLeaf(compiled.leaves, "market.supply");
  const demand = readLeaf(compiled.leaves, "market.demand");
  const equilibrium = readLeaf(compiled.leaves, "equilibrium");
  const revenue = readLeafByKind(compiled.leaves, "optional-value");
  const actual = materializeKpSemanticStateInitialSnapshot(compiled, {
    derived: [{
      targetSlotId: equilibrium.identities.slotId,
      dependencySlotIds: [demand.identities.slotId, supply.identities.slotId]
    }]
  });
  mutableSupply.intercept = 99;

  const supplyStore = createKpSemanticEntityVersionStore({
    identities: compiled.identityScope,
    entityId: supply.identities.initialEntityId,
    value: supply.descriptor.kind === "required-value"
      ? supply.descriptor.initialValue as KpPersistentSemanticValue
      : neverValue(),
    sourceId: supply.identities.sourceIds.initialValue
  });
  const demandStore = createKpSemanticEntityVersionStore({
    identities: compiled.identityScope,
    entityId: demand.identities.initialEntityId,
    value: demand.descriptor.kind === "required-value"
      ? demand.descriptor.initialValue as KpPersistentSemanticValue
      : neverValue(),
    sourceId: demand.identities.sourceIds.initialValue
  });
  const expected = createKpAggregateSemanticSnapshot({
    identities: compiled.identityScope,
    snapshotId: compiled.identityScope.initialSnapshot(),
    requiredSlotIds: [
      equilibrium.identities.slotId,
      demand.identities.slotId,
      supply.identities.slotId
    ],
    optionalSlotIds: [revenue.identities.slotId],
    bindings: [
      {
        slotId: demand.identities.slotId,
        entityId: demandStore.entityId,
        versionId: demandStore.latestVersionId
      },
      {
        slotId: supply.identities.slotId,
        entityId: supplyStore.entityId,
        versionId: supplyStore.latestVersionId
      }
    ],
    absences: [createKpSemanticSlotAbsence({
      slotId: revenue.identities.slotId,
      reason: "not-introduced",
      sourceId: revenue.identities.sourceIds.initialAbsence
    })],
    derivedBindings: [createKpSemanticDerivedBindingDeclaration({
      identities: compiled.identityScope,
      derivationId: equilibrium.identities.derivationId,
      slotId: equilibrium.identities.slotId,
      dependencySlotIds: [
        demand.identities.slotId,
        supply.identities.slotId
      ],
      sourceId: equilibrium.identities.sourceIds.derivation
    })],
    entityStores: [demandStore, supplyStore]
  });

  assert.deepEqual(actual, expected);
  assert.equal(actual.id, compiled.identityScope.initialSnapshot());
  assert.equal(actual.absences[0]?.reason, "not-introduced");
  assert.equal(actual.derivedBindings[0]?.dependencies.length, 2);
  assert.equal(
    (actual.entityStores[1]?.versions[0]?.value as { intercept: number })
      .intercept,
    2
  );
  assert.ok(Object.isFrozen(actual));
});

test("materialization requires one valid plan for every derived leaf", () => {
  const compiled = createCompiledMarket({ intercept: 2, slope: 1 });
  const supply = readLeaf(compiled.leaves, "market.supply");
  const equilibrium = readLeaf(compiled.leaves, "equilibrium");

  assertMaterializationError(
    () => materializeKpSemanticStateInitialSnapshot(compiled),
    "missing-derived-plan"
  );
  assertMaterializationError(
    () => materializeKpSemanticStateInitialSnapshot(compiled, {
      derived: [{
        targetSlotId: equilibrium.identities.slotId,
        dependencySlotIds: [supply.identities.slotId]
      }, {
        targetSlotId: equilibrium.identities.slotId,
        dependencySlotIds: [supply.identities.slotId]
      }]
    }),
    "duplicate-derived-plan"
  );
  assertMaterializationError(
    () => materializeKpSemanticStateInitialSnapshot(compiled, {
      derived: [{
        targetSlotId: supply.identities.slotId,
        dependencySlotIds: [equilibrium.identities.slotId]
      }]
    }),
    "invalid-derived-target"
  );

  const foreign = createCompiledMarket(
    { intercept: 3, slope: 2 },
    "lesson.foreign-market"
  );
  const foreignSupply = readLeaf(foreign.leaves, "market.supply");
  assertMaterializationError(
    () => materializeKpSemanticStateInitialSnapshot(compiled, {
      derived: [{
        targetSlotId: equilibrium.identities.slotId,
        dependencySlotIds: [foreignSupply.identities.slotId]
      }]
    }),
    "foreign-derived-dependency"
  );
});

function createCompiledMarket(
  supply: { intercept: number; slope: number },
  namespace = "lesson.materialized-market"
) {
  return compileKpSemanticStateSchema(namespace, kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue(supply),
      demand: kpStateValue({ intercept: 12, slope: -1 })
    }),
    equilibrium: kpStateDerived<{ price: number; quantity: number }>(),
    governmentRevenue: kpStateOptional<number>()
  }));
}

function readLeafByKind(
  leaves: readonly KpCompiledSemanticStateLeaf[],
  kind: KpCompiledSemanticStateLeaf["descriptor"]["kind"]
): KpCompiledSemanticStateLeaf {
  const leaf = leaves.find((candidate) => candidate.descriptor.kind === kind);
  assert.notEqual(leaf, undefined);
  return leaf as KpCompiledSemanticStateLeaf;
}

function readLeaf(
  leaves: readonly KpCompiledSemanticStateLeaf[],
  encodedPath: string
): KpCompiledSemanticStateLeaf {
  const leaf = leaves.find((candidate) =>
    candidate.encodedPath === encodedPath
  );
  assert.notEqual(leaf, undefined);
  return leaf as KpCompiledSemanticStateLeaf;
}

function assertMaterializationError(
  run: () => unknown,
  code: KpSemanticStateMaterializationError["code"]
): void {
  assert.throws(run, (error) => {
    assert.ok(error instanceof KpSemanticStateMaterializationError);
    assert.equal(error.code, code);
    return true;
  });
}

function neverValue(): never {
  throw new Error("Unexpected descriptor kind in test fixture.");
}
