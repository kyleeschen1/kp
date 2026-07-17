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
  createGeneratedLinearAlgebraProblemFixture,
  createGeneratedLinearAlgebraProblemFixtures
} from "../src/semantic/generated-linear-algebra-problem-fixture.ts";

test("generated linear algebra fixtures cover vector and matrix products", () => {
  const fixtures = createGeneratedLinearAlgebraProblemFixtures();

  assert.deepEqual(fixtures.map((fixture) => fixture.id), [
    "generated.linear-algebra.matrix-vector.two-by-two",
    "generated.linear-algebra.dot-product.three-vector",
    "generated.linear-algebra.matrix-matrix.two-by-two"
  ]);

  const dotProduct = createGeneratedLinearAlgebraProblemFixture(
    "generated.linear-algebra.dot-product.three-vector"
  );
  assert.equal(dotProduct.familyId, "generated.linear-algebra.dot-product");
  assert.deepEqual(
    dotProduct.transformations.map(
      (transformation) => transformation.transformType
    ),
    ["computeDotProduct"]
  );
  assert.deepEqual(linearAlgebraObjectLatex(dotProduct), [
    String.raw`\begin{bmatrix}1 \\ 2 \\ 3\end{bmatrix} \cdot \begin{bmatrix}4 \\ 5 \\ 6\end{bmatrix}`,
    String.raw`1 \times 4 = 4`,
    "4",
    String.raw`2 \times 5 = 10`,
    "4 + 10 = 14",
    String.raw`3 \times 6 = 18`,
    "4 + 10 + 18 = 32",
    "32"
  ]);
  assert.deepEqual(dotProduct.transformations[0]?.lawRefs, [
    {
      id: "law.linear-algebra.dot-product",
      level: "strict"
    }
  ]);

  const matrixMatrix = createGeneratedLinearAlgebraProblemFixture(
    "generated.linear-algebra.matrix-matrix.two-by-two"
  );
  assert.equal(matrixMatrix.familyId, "generated.linear-algebra.matrix-matrix");
  assert.deepEqual(
    matrixMatrix.transformations.map(
      (transformation) => transformation.transformType
    ),
    ["multiplyMatrices"]
  );
  assert.deepEqual(linearAlgebraObjectLatex(matrixMatrix), [
    String.raw`\begin{bmatrix}1 & 2 \\ 3 & 4\end{bmatrix}\begin{bmatrix}2 & 0 \\ 1 & 2\end{bmatrix}`,
    String.raw`1 \times 2 + 2 \times 1 = 4`,
    String.raw`1 \times 0 + 2 \times 2 = 4`,
    String.raw`3 \times 2 + 4 \times 1 = 10`,
    String.raw`3 \times 0 + 4 \times 2 = 8`,
    String.raw`\begin{bmatrix}4 & 4 \\ 10 & 8\end{bmatrix}`
  ]);
  assert.deepEqual(matrixMatrix.transformations[0]?.lawRefs, [
    {
      id: "law.linear-algebra.matrix-matrix-product",
      level: "strict"
    }
  ]);
});

test("generated problem animation catalog imports all linear algebra fixtures", () => {
  const linearAlgebraAnimations = createGeneratedProblemAnimationAssets()
    .filter((animation) =>
      String(animation.metadata?.["sourceFixtureFamilyId"]).startsWith(
        "generated.linear-algebra"
      )
    );

  assert.deepEqual(
    linearAlgebraAnimations.map((animation) => animation.id),
    [
      "animation.generated.linear-algebra.matrix-vector.two-by-two",
      "animation.generated.linear-algebra.dot-product.three-vector",
      "animation.generated.linear-algebra.matrix-matrix.two-by-two"
    ]
  );
  assert.deepEqual(
    linearAlgebraAnimations.flatMap((animation) => [
      checkKpAnimationAssetReferenceClosure(animation).passed,
      checkKpAnimationAssetSeekRewindLaw(animation).passed
    ]),
    [true, true, true, true, true, true]
  );
});

function linearAlgebraObjectLatex(
  fixture: ReturnType<typeof createGeneratedLinearAlgebraProblemFixture>
): readonly string[] {
  return fixture.bundle.objects.map((object) =>
    String((object.value as { readonly latex: string }).latex)
  );
}
