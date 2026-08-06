import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpSemanticVisualRoleRegistry,
  kpSemanticVisualRoleDefinitions,
  kpSemanticVisualRoles
} from "../src/animation/semantic-visual-role.ts";

test("semantic visual roles are closed and completely defined", () => {
  assert.deepEqual(kpSemanticVisualRoles, [
    "page", "ink", "structure", "data-series", "relation", "warning", "focus"
  ]);
  assert.deepEqual(Object.keys(kpSemanticVisualRoleDefinitions), [
    ...kpSemanticVisualRoles
  ]);
  for (const role of kpSemanticVisualRoles) {
    assert.notEqual(kpSemanticVisualRoleDefinitions[role].intent.trim(), "");
  }
});

test("semantic role registry rejects duplicates unknowns and omissions", () => {
  const definitions = Object.values(kpSemanticVisualRoleDefinitions);
  assert.throws(() => createKpSemanticVisualRoleRegistry([
    ...definitions,
    definitions[0]!
  ]), /Duplicate semantic visual role page/);
  assert.throws(() => createKpSemanticVisualRoleRegistry(
    definitions.slice(1)
  ), /Missing semantic visual roles: page/);
  assert.throws(() => createKpSemanticVisualRoleRegistry([
    ...definitions.slice(0, -1),
    { id: "decoration", intent: "Unbounded caller styling." }
  ] as never), /Unknown semantic visual role decoration/);
});
