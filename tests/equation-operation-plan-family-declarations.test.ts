import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  findKpWaveAEquationOperationPlanDeclaration,
  kpWaveAEquationOperationPlanDeclarations,
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";
import {
  createKpAlgebraChoreographyCapabilities
} from "../src/animation/algebra-choreography-capabilities.ts";
import {
  kpEquationLinearRearrangementActivatesLegacySurface,
  kpEquationLinearRearrangementDeclarations,
  kpEquationLinearRearrangementKindForTransformType
} from "../src/animation/equation-linear-rearrangement-kind.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion
} from "../src/semantic/cancellation-pressure-semantic-motion.ts";

const expectedWaveAIds = Object.freeze([
  "animation.generated.add-zero",
  "animation.generated.cancellation.additive-inverses",
  "animation.generated.distribution.expand-a-sum",
  "animation.generated.distribution.factor-common-a",
  "animation.generated.linear-solve.linear-68c15d41",
  "animation.linear-solve.solve-x",
  "animation.operation-evaluation.five-plus-two",
  "animation.operation-evaluation.one-plus-two",
  "animation.operation-evaluation.three-sixths",
  "animation.operation-evaluation.two-times-three"
]);

test("wave A has one immutable operation recipe declaration per animation", () => {
  assert.equal(Object.isFrozen(kpWaveAEquationOperationPlanDeclarations), true);
  assert.deepEqual(
    kpWaveAEquationOperationPlanDeclarations
      .map(({ animationId }) => animationId)
      .sort(),
    [...expectedWaveAIds].sort()
  );

  for (const declaration of kpWaveAEquationOperationPlanDeclarations) {
    assert.equal(Object.isFrozen(declaration), true);
    assert.equal(Object.isFrozen(declaration.recipeIds), true);
    assert.equal(Object.isFrozen(declaration.runtimeBindingIds), true);
    assert.equal(Object.isFrozen(declaration.recipeOwnerPaths), true);
    assert.ok(declaration.recipeIds.length > 0);
    assert.equal(new Set(declaration.recipeIds).size, declaration.recipeIds.length);
    assert.ok(declaration.recipeIds.every((id) =>
      /^recipe\.operation-plan\.[a-z0-9-]+\.v[1-9][0-9]*$/.test(id)
    ));
    assert.ok(declaration.recipeOwnerPaths.every((path) => existsSync(path)));

    const projection = projectKpEquationSurfaceFamily(declaration.animationId);
    assert.equal(projection.migrationWave, "wave-a-operation-plan");
    assert.deepEqual(projection.operationPlanRecipeIds, declaration.recipeIds);
    assert.deepEqual(projection.runtimeBindingIds, declaration.runtimeBindingIds);
  }
});

test("wave A runtime bindings resolve from declarations without asset branches", () => {
  const capabilities = createKpAlgebraChoreographyCapabilities();
  const cancellation = capabilities.semanticMotion.sampleForAnimationId({
    animationId: "animation.generated.cancellation.additive-inverses",
    progress: 0.68,
    direction: "forward"
  });
  assert.equal(
    cancellation?.choreographyId,
    kpCanonicalCompiledCancellationPressureSemanticMotion.id
  );
  assert.equal(
    capabilities.distributionChoreography.bindingForAnimationId(
      "animation.generated.distribution.expand-a-sum"
    )?.id,
    "binding.distribution.expand-a-sum.pressure"
  );
  assert.equal(
    capabilities.semanticMotion.sampleForAnimationId({
      animationId: "animation.generated.distribution.factor-common-a",
      progress: 0.5,
      direction: "forward"
    }),
    undefined
  );
  assert.equal(
    capabilities.distributionChoreography.bindingForAnimationId(
      "animation.generated.distribution.factor-common-a"
    ),
    undefined
  );
});

test("linear rearrangement routing is data-owned and preserves legacy triggers", () => {
  assert.equal(Object.isFrozen(kpEquationLinearRearrangementDeclarations), true);
  assert.equal(
    new Set(kpEquationLinearRearrangementDeclarations.map(
      ({ transformType }) => transformType
    )).size,
    kpEquationLinearRearrangementDeclarations.length
  );
  assert.equal(
    kpEquationLinearRearrangementKindForTransformType("subtractBothSides"),
    "balanced-introduction"
  );
  assert.equal(
    kpEquationLinearRearrangementKindForTransformType(
      "cancelMultiplicativeInverses"
    ),
    "cancel-multiplicative-inverses"
  );
  assert.equal(
    kpEquationLinearRearrangementKindForTransformType("unknown-operation"),
    undefined
  );
  assert.deepEqual(
    kpEquationLinearRearrangementDeclarations
      .filter(({ activatesLegacySurfaceSequence }) =>
        activatesLegacySurfaceSequence
      )
      .map(({ transformType }) => transformType),
    [
      "subtractBothSides",
      "cancelAdditiveInverses",
      "simplifyConstantDifference"
    ]
  );
  assert.equal(
    kpEquationLinearRearrangementActivatesLegacySurface("divideBothSides"),
    false
  );
});

test("declaration lookup fails closed for non-wave-A animations", () => {
  assert.equal(
    findKpWaveAEquationOperationPlanDeclaration(
      "animation.generated.radical.square-root-as-power"
    ),
    undefined
  );
  assert.deepEqual(
    projectKpEquationSurfaceFamily(
      "animation.generated.radical.square-root-as-power"
    ).operationPlanRecipeIds,
    []
  );
});
