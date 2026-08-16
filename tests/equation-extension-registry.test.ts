import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  composeKpEquationExtensionPack,
  createKpEquationFamilyRegistry,
  createKpEquationMotifRegistry,
  createKpEquationOperationRegistry,
  createKpEquationRecipeRegistry,
  createKpEquationRendererCapabilityRegistry,
  getKpEquationRegistryEntry
} from "../src/domain-ir/equation-extension-registry.ts";
import { defineKpMotifSchema } from "../src/domain-ir/equation-motif-invocation.ts";
import { kpCanonicalEquationMotionVocabulary } from "../src/domain-ir/equation-motion-vocabulary.ts";

const vocabulary = kpCanonicalEquationMotionVocabulary;
const fixture = makeRegistries();

test("equation extension packs inject five distinct immutable registries", () => {
  const pack = composeKpEquationExtensionPack({
    id: "equation-pack.function-wrap.v1",
    ...fixture
  });
  assert.deepEqual(
    [
      pack.operations.kind,
      pack.recipes.kind,
      pack.motifs.kind,
      pack.rendererCapabilities.kind,
      pack.families.kind
    ],
    [
      "semantic-operations",
      "recipes",
      "motifs",
      "renderer-capabilities",
      "families"
    ]
  );
  for (const registry of [
    pack.operations,
    pack.recipes,
    pack.motifs,
    pack.rendererCapabilities,
    pack.families
  ]) {
    assert.equal(Object.isFrozen(registry), true);
    assert.equal(Object.isFrozen(registry.entries), true);
    assert.equal(Object.isFrozen(registry.byId), true);
  }
  assert.equal(
    getKpEquationRegistryEntry(
      pack.motifs,
      vocabulary.motifs.functionWrapV1
    )?.schema.id,
    vocabulary.motifs.functionWrapV1
  );
  assert.equal(Object.isFrozen(pack.operations.entries[0]!.recipeIds), true);
  assert.equal(Object.isFrozen(pack.recipes.entries[0]!.motifIds), true);
  assert.equal(
    Object.isFrozen(pack.families.entries[0]!.rendererCapabilityIds),
    true
  );
});

test("registry uniqueness fails at the declaration boundary", () => {
  const entry = fixture.operations.entries[0]!;
  assert.throws(
    () => createKpEquationOperationRegistry([entry, entry]),
    /ids must be unique/
  );
});

test("packs are explicitly composed and cannot leak injected state", () => {
  const first = composeKpEquationExtensionPack({
    id: "equation-pack.first.v1",
    ...fixture
  });
  const second = composeKpEquationExtensionPack({
    id: "equation-pack.second.v1",
    ...fixture,
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([])
  });
  assert.equal(first.rendererCapabilities.entries.length, 1);
  assert.equal(second.rendererCapabilities.entries.length, 0);
  assert.notEqual(first.rendererCapabilities, second.rendererCapabilities);
});

test("registry topology is data-only and does not import presentation owners", () => {
  const source = readFileSync(fileURLToPath(new URL(
    "../src/domain-ir/equation-extension-registry.ts",
    import.meta.url
  )), "utf8");
  assert.doesNotMatch(source, /from "\.\.\/(?:rendering|animation|reader)\//);
  assert.doesNotMatch(source, /export\s+(?:const|let)\s+\w*registry/i);
  assert.doesNotMatch(source, /\.register\s*\(/);
});

function makeRegistries() {
  const schema = defineKpMotifSchema({
    id: vocabulary.motifs.functionWrapV1,
    familyId: vocabulary.families.structuralWrapV1,
    operationKinds: [vocabulary.operations.wrapFunctionV1],
    roles: [
      { id: "continuant", cardinality: "exactly-one", materialKind: "continuant" }
    ],
    requiredRendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
  });
  return {
    operations: createKpEquationOperationRegistry([{
      id: vocabulary.operations.wrapFunctionV1,
      familyId: vocabulary.families.structuralWrapV1,
      recipeIds: [vocabulary.recipes.functionApplicationV1]
    }]),
    recipes: createKpEquationRecipeRegistry([{
      id: vocabulary.recipes.functionApplicationV1,
      familyId: vocabulary.families.structuralWrapV1,
      operationKind: vocabulary.operations.wrapFunctionV1,
      motifIds: [vocabulary.motifs.functionWrapV1]
    }]),
    motifs: createKpEquationMotifRegistry([{
      id: vocabulary.motifs.functionWrapV1,
      familyId: vocabulary.families.structuralWrapV1,
      schema
    }]),
    rendererCapabilities: createKpEquationRendererCapabilityRegistry([{
      id: vocabulary.rendererCapabilities.nativeKatexV1,
      motifIds: [vocabulary.motifs.functionWrapV1]
    }]),
    families: createKpEquationFamilyRegistry([{
      id: vocabulary.families.structuralWrapV1,
      operationKindIds: [vocabulary.operations.wrapFunctionV1],
      recipeIds: [vocabulary.recipes.functionApplicationV1],
      motifIds: [vocabulary.motifs.functionWrapV1],
      rendererCapabilityIds: [vocabulary.rendererCapabilities.nativeKatexV1]
    }])
  };
}
