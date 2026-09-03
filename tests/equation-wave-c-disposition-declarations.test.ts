import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  findKpWaveCEquationDispositionDeclaration,
  kpWaveCEquationDispositionDeclarations,
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";

const expectedWaveCIds = Object.freeze([
  "animation.algebra.log-product.equivalence-frame",
  "animation.algebra.log-product.product-to-sum",
  "animation.algebra.log-product.three-factors-to-sum",
  "animation.comparison.jacobian-hessian",
  "animation.comparison.linear-solve-programming",
  "animation.equation.finite-product-expansion.v1",
  "animation.equation.finite-sum-expansion.v1",
  "animation.equation.fraction-equivalence.common-denominator-pressure.v1",
  "animation.generated.calculus.derivative.power-rule-x-cubed",
  "animation.generated.calculus.derivative.sum-rule-polynomial",
  "animation.generated.calculus.integral.power-rule-quadratic",
  "animation.generated.substitute-three",
  "animation.generated.substitute-three.provisional-incorrect",
  "animation.inequality.sign-flip.basic",
  "animation.operation-evaluation.two-times-one-carrier",
  "animation.sample.fourier-transform-pair",
  "animation.sample.fundamental-theorem-calculus"
]);

test("wave C classifies every current remainder exactly once", () => {
  assert.equal(Object.isFrozen(kpWaveCEquationDispositionDeclarations), true);
  assert.deepEqual(
    kpWaveCEquationDispositionDeclarations
      .map(({ animationId }) => animationId)
      .sort(),
    [...expectedWaveCIds].sort()
  );
  assert.equal(
    new Set(kpWaveCEquationDispositionDeclarations.map(
      ({ animationId }) => animationId
    )).size,
    kpWaveCEquationDispositionDeclarations.length
  );

  for (const declaration of kpWaveCEquationDispositionDeclarations) {
    assert.equal(Object.isFrozen(declaration), true);
    assert.equal(existsSync(declaration.authoritySourcePath), true);
    assert.ok(declaration.rationale.length > 20);
    const projection = projectKpEquationSurfaceFamily(declaration.animationId);
    assert.equal(
      projection.migrationWave,
      "wave-c-generated-bespoke-diagnostic-static"
    );
    assert.equal(projection.disposition, declaration.disposition);
    assert.equal(projection.presentationRoute, declaration.presentationRoute);
    assert.equal(projection.waveCClassification, declaration.classification);
    assert.equal(
      projection.genericLayerTransition,
      declaration.genericLayerTransition
    );
  }
});

test("specialized, static, diagnostic, and retirement routes remain distinct", () => {
  assert.equal(
    findKpWaveCEquationDispositionDeclaration(
      "animation.algebra.log-product.product-to-sum"
    )?.genericLayerTransition,
    "forbidden"
  );
  assert.equal(
    findKpWaveCEquationDispositionDeclaration(
      "animation.comparison.jacobian-hessian"
    )?.presentationRoute,
    "declared-static-layer-transition"
  );
  assert.equal(
    findKpWaveCEquationDispositionDeclaration(
      "animation.generated.substitute-three"
    )?.classification,
    "diagnostic"
  );
  assert.deepEqual(
    projectKpEquationSurfaceFamily(
      "animation.generated.substitute-three.provisional-incorrect"
    ),
    {
      selectedCapabilityIds: ["equation-katex"],
      primaryCapabilityId: "equation-katex",
      rendererAdapterId: "editor-animation-surface.equation.katex",
      rendererSourcePath: "src/editor/equation-surface-adapter.ts",
      disposition: "retirement-candidate",
      migrationWave: "wave-c-generated-bespoke-diagnostic-static",
      presentationRoute: "retirement-negative-fixture",
      waveCClassification: "retirement-candidate",
      genericLayerTransition: "declared",
      operationPlanRecipeIds: [],
      structuralRecipeIds: [],
      runtimeBindingIds: []
    }
  );
});

test("unknown equation rows fail closed instead of inheriting generic motion", () => {
  const projection = projectKpEquationSurfaceFamily(
    "animation.generated.future-unknown-equation"
  );
  assert.equal(projection.disposition, "unsupported");
  assert.equal(projection.presentationRoute, "unsupported-static-hold");
  assert.equal(projection.genericLayerTransition, "forbidden");
  assert.equal(
    findKpWaveCEquationDispositionDeclaration(
      "animation.generated.future-unknown-equation"
    ),
    undefined
  );
});
