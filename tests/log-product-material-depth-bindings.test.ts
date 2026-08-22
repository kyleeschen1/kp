import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpCanonicalHomomorphicCausalPhaseGrammar
} from "../src/domain-ir/homomorphic-causal-phases.ts";
import {
  kpCanonicalLogProductSemanticMotionRequest
} from "../src/semantic/log-product-semantic-motion.ts";
import {
  kpCanonicalLogProductMaterialRoleBindings
} from "../src/animation/log-product-material-depth-bindings.ts";
import {
  kpLogProductMaterialRoleDefinitions,
  type KpLogProductMaterialRoleDefinition,
  type KpLogProductMaterialRoleId
} from "../src/animation/log-product-material-depth-roles.ts";

test("material bindings cover every local role with authored semantic entities", () => {
  const roleIds = kpLogProductMaterialRoleDefinitions.map(({ id }) => id);
  assert.deepEqual(
    kpCanonicalLogProductMaterialRoleBindings.map(({ roleId }) => roleId),
    roleIds
  );

  const frontier = new Set([
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier
      .sourceEntityIds,
    ...kpCanonicalLogProductSemanticMotionRequest.rewriteFrontier
      .targetEntityIds
  ]);
  for (const binding of kpCanonicalLogProductMaterialRoleBindings) {
    assert.ok(binding.entityIds.length > 0);
    assert.equal(new Set(binding.entityIds).size, binding.entityIds.length);
    assert.ok(binding.entityIds.every((entityId) => frontier.has(entityId)));
  }
});

test("material instructions reuse canonical phases and permitted verbs", () => {
  const phaseIds = new Set(
    kpCanonicalHomomorphicCausalPhaseGrammar.phases.map(({ id }) => id)
  );
  const roles = new Map<
    KpLogProductMaterialRoleId,
    KpLogProductMaterialRoleDefinition
  >(kpLogProductMaterialRoleDefinitions.map(
    (definition) => [definition.id, definition]
  ));

  for (const binding of kpCanonicalLogProductMaterialRoleBindings) {
    const role = roles.get(binding.roleId);
    assert.ok(role !== undefined);
    assert.ok(binding.phaseInstructions.length > 0);
    assert.ok(binding.phaseInstructions.every(({ phaseId, verb }) =>
      phaseIds.has(phaseId) && role.physicalVerbs.includes(verb)
    ));
  }
});

test("persistent factor bindings pair canonical source and target occurrences", () => {
  const persistent = kpCanonicalLogProductMaterialRoleBindings.find(
    ({ roleId }) => roleId === "role.material.log-product.persistent-factor"
  );
  assert.ok(persistent !== undefined);
  assert.deepEqual(persistent.entityIds, [
    ...kpCanonicalLogProductSemanticMotionRequest.operation
      .roleBindings["source-arguments"]!,
    ...kpCanonicalLogProductSemanticMotionRequest.operation
      .roleBindings["target-arguments"]!
  ]);
});

test("material bindings contain no DOM or geometry inference", () => {
  const source = readFileSync(new URL(
    "../src/animation/log-product-material-depth-bindings.ts",
    import.meta.url
  ), "utf8");
  for (const forbidden of [
    "querySelector",
    "HTMLElement",
    "getBoundingClientRect",
    "textContent",
    "translate",
    "opacity"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
