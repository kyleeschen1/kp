import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAnimationGovernanceInventory
} from "../src/architecture/animation-governance-inventory.ts";
import {
  compileKpTerminalEquationMigrationV2
} from "../src/domain-ir/terminal-equation-migration-v2.ts";
import {
  requireKpGenericEquationMigrationV2
} from "../src/domain-ir/equation-generic-v2-migration-dispatch.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";

const expected = Object.freeze(new Map<string, readonly string[]>([
  ["animation.equation.finite-sum-expansion.v1",
    ["operation.equation.finite-binder-expand.v1"]],
  ["animation.equation.finite-product-expansion.v1",
    ["operation.equation.finite-binder-expand.v1"]],
  ["animation.inequality.sign-flip.basic",
    ["kp.semantic-motion.multiply-negative-inequality"]],
  ["animation.generated.substitute-three",
    ["kp.semantic-motion.substitute-value"]],
  ["animation.generated.calculus.derivative.sum-rule-polynomial", [
    "kp.semantic-motion.derivative-sum-rule",
    "kp.semantic-motion.resolve-derivative-terms"
  ]],
  ["animation.generated.calculus.integral.power-rule-quadratic", [
    "kp.semantic-motion.antiderivative-power-rule",
    "kp.semantic-motion.resolve-antiderivative"
  ]],
  ["animation.generated.linear-algebra.dot-product.three-vector",
    ["kp.semantic-motion.dot-product"]],
  ["animation.generated.linear-algebra.matrix-vector.two-by-two",
    ["kp.semantic-motion.matrix-vector"]],
  ["animation.generated.linear-algebra.matrix-matrix.two-by-two",
    ["kp.semantic-motion.matrix-matrix"]],
  ["animation.comparison.linear-solve-programming", [
    "kp.algebra.subtract-both-sides",
    "kp.algebra.cancel-additive-inverses",
    "kp.algebra.simplify-constant-difference"
  ]],
  ["animation.comparison.jacobian-hessian", [
    "kp.equation.present-latex-form",
    "kp.equation.present-latex-form",
    "kp.equation.compare-latex-forms"
  ]],
  ["animation.sample.fundamental-theorem-calculus", [
    "kp.equation.present-latex-form",
    "kp.equation.present-latex-form",
    "kp.equation.compare-latex-forms"
  ]],
  ["animation.sample.fourier-transform-pair", [
    "kp.equation.present-latex-form",
    "kp.equation.present-latex-form",
    "kp.equation.compare-latex-forms"
  ]]
]));

function assets() {
  return createKpAnimationAssets();
}

test("terminal equation families compile with exact operation authority", () => {
  const byId = new Map(assets().map((asset) => [asset.id, asset]));
  expected.forEach((operationIds, assetId) => {
    const asset = byId.get(assetId);
    assert.ok(asset, assetId);
    const migration = compileKpTerminalEquationMigrationV2(asset);
    assert.deepEqual(migration.operationIds, operationIds, assetId);
    assert.equal(
      migration.presentationPlan.transitions.length,
      operationIds.length,
      assetId
    );
  });
});

test("matrix intermediates are explicit governed target context", () => {
  const byId = new Map(assets().map((asset) => [asset.id, asset]));
  const cases = [
    ["animation.generated.linear-algebra.dot-product.three-vector",
      "products", 3],
    ["animation.generated.linear-algebra.dot-product.three-vector",
      "partial-sums", 3],
    ["animation.generated.linear-algebra.matrix-vector.two-by-two",
      "row-products", 2],
    ["animation.generated.linear-algebra.matrix-matrix.two-by-two",
      "cell-products", 4]
  ] as const;
  cases.forEach(([assetId, roleId, count]) => {
    const migration = compileKpTerminalEquationMigrationV2(byId.get(assetId)!);
    assert.equal(
      migration.grammar.transitions[0]!.operation.roleBindings[roleId]?.length,
      count,
      `${assetId}:${roleId}`
    );
  });
});

test("generic equation dispatch consumes every generic terminal caller", () => {
  const genericIds = [...expected.keys()].filter((id) =>
    !id.startsWith("animation.equation.finite-"));
  const byId = new Map(assets().map((asset) => [asset.id, asset]));
  genericIds.forEach((assetId) => {
    const migration = requireKpGenericEquationMigrationV2(byId.get(assetId)!);
    assert.equal(migration?.assetId, assetId);
  });
});

test("diagnostic invalid motion is explicit and only derivative remains unmigrated", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const inventory = compileKpAnimationGovernanceInventory({
    assets: assets(),
    catalogue: createKpAnimationCatalogueProjection({ descriptors }),
    descriptors,
    capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
  });
  const diagnostic = inventory.entries.find(({ assetId }) => assetId ===
    "animation.generated.substitute-three.provisional-incorrect");
  assert.deepEqual(diagnostic?.bypasses, [
    "diagnostic-equation-authority-rejected"
  ]);
  assert.deepEqual(inventory.entries.filter(({ bypasses }) =>
    bypasses.includes("equation-grammar-v2-missing")
  ).map(({ assetId }) => assetId), [
    "animation.generated.calculus.derivative.power-rule-x-cubed"
  ]);
});
