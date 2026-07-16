import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createGeneratedProblemAnimationAssets
} from "../src/animation/catalog.ts";
import {
  createGeneratedCalculusProblemFixture,
  createGeneratedCalculusProblemFixtures
} from "../src/semantic/generated-calculus-problem-fixture.ts";

test("generated calculus fixtures cover derivative and integral rules", () => {
  const fixtures = createGeneratedCalculusProblemFixtures();

  assert.deepEqual(fixtures.map((fixture) => fixture.id), [
    "generated.calculus.derivative.power-rule-x-cubed",
    "generated.calculus.derivative.sum-rule-polynomial",
    "generated.calculus.integral.power-rule-quadratic"
  ]);

  const derivative = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  assert.deepEqual(
    derivative.bundle.objects.map((object) =>
      object.selectors.map((selector) => selector.id)
    ),
    [
      [
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.operator",
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.operator-variable",
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.base",
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.exponent"
      ],
      [
        "expression.generated.calculus.derivative.power-rule-x-cubed.derived.coefficient",
        "expression.generated.calculus.derivative.power-rule-x-cubed.derived.base",
        "expression.generated.calculus.derivative.power-rule-x-cubed.derived.exponent"
      ]
    ]
  );

  const derivativeSum = createGeneratedCalculusProblemFixture(
    "generated.calculus.derivative.sum-rule-polynomial"
  );
  assert.equal(derivativeSum.familyId, "generated.calculus.derivative");
  assert.deepEqual(
    derivativeSum.transformations.map(
      (transformation) => transformation.transformType
    ),
    ["applyDerivativeSumRule"]
  );
  assert.deepEqual(calculusObjectLatex(derivativeSum), [
    "\\frac{d}{dx}(x^{3} + 2x)",
    "3x^{2} + 2"
  ]);
  assert.deepEqual(derivativeSum.transformations[0]?.lawRefs, [
    {
      id: "law.calculus.derivative.sum-rule",
      level: "strict"
    }
  ]);

  const integral = createGeneratedCalculusProblemFixture(
    "generated.calculus.integral.power-rule-quadratic"
  );
  assert.equal(integral.familyId, "generated.calculus.integral");
  assert.deepEqual(
    integral.transformations.map((transformation) => transformation.transformType),
    ["applyAntiderivativePowerRule"]
  );
  assert.deepEqual(calculusObjectLatex(integral), [
    "\\int 6x^{2}\\,dx",
    "2x^{3} + C"
  ]);
  assert.deepEqual(integral.transformations[0]?.lawRefs, [
    {
      id: "law.calculus.integral.power-rule",
      level: "strict"
    }
  ]);
});

test("generated problem animation catalog imports all calculus fixtures", () => {
  const calculusAnimations = createGeneratedProblemAnimationAssets()
    .filter(
      (animation) =>
        animation.metadata?.["sourceFixtureFamilyId"] ===
          "generated.calculus.derivative" ||
        animation.metadata?.["sourceFixtureFamilyId"] ===
          "generated.calculus.integral"
    );

  assert.deepEqual(
    calculusAnimations.map((animation) => animation.id),
    [
      "animation.generated.calculus.derivative.power-rule-x-cubed",
      "animation.generated.calculus.derivative.sum-rule-polynomial",
      "animation.generated.calculus.integral.power-rule-quadratic"
    ]
  );
  assert.deepEqual(
    calculusAnimations.flatMap((animation) => [
      checkKpAnimationAssetReferenceClosure(animation).passed,
      checkKpAnimationAssetSeekRewindLaw(animation).passed
    ]),
    [true, true, true, true, true, true]
  );
});

function calculusObjectLatex(
  fixture: ReturnType<typeof createGeneratedCalculusProblemFixture>
): readonly string[] {
  return fixture.bundle.objects.map((object) =>
    String((object.value as { readonly latex: string }).latex)
  );
}
