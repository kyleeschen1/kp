import assert from "node:assert/strict";
import test from "node:test";

import { projectKpEigenvectorEquation } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-equations.ts";
import {
  kpEigenvectorScalarControl,
  projectKpEigenvectorScalarManipulation,
  sampleKpEigenvectorScalarTransition
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-manipulation.ts";

test("scalar manipulation always derives both arrows from the matrix", () => {
  assert.deepEqual(projectKpEigenvectorScalarManipulation(2), {
    coefficient: 2,
    input: [2, 2],
    output: [6, 6],
    isInEigenspace: true,
    isEigenvector: true,
    semanticObjectIds: [
      "eigenvector-demo/vector/v",
      "eigenvector-demo/eigenspace/lambda-3"
    ],
    explanation: "Every nonzero multiple stays on this line and is an eigenvector."
  });
  assert.deepEqual(
    projectKpEigenvectorScalarManipulation(-1.5).output,
    [-4.5, -4.5]
  );
});

test("zero reveals the precise eigenspace/eigenvector distinction", () => {
  const zero = projectKpEigenvectorScalarManipulation(0);

  assert.equal(zero.isInEigenspace, true);
  assert.equal(zero.isEigenvector, false);
  assert.match(zero.explanation, /not an eigenvector/);
});

test("the bounded control clamps and snaps without a second state authority", () => {
  assert.equal(
    projectKpEigenvectorScalarManipulation(99).coefficient,
    kpEigenvectorScalarControl.maximum
  );
  assert.equal(projectKpEigenvectorScalarManipulation(0.61).coefficient, 0.5);
  assert.equal(
    projectKpEigenvectorScalarManipulation(Number.NaN).coefficient,
    kpEigenvectorScalarControl.initial
  );
});

test("verification and eigenspace equations are exact semantic endpoints", () => {
  assert.equal(
    projectKpEigenvectorEquation("A(2v)=6v").latex,
    String.raw`A(2\mathbf{v})=6\mathbf{v}`
  );
  assert.equal(
    projectKpEigenvectorEquation("E3=span-v").latex,
    String.raw`E_3=\operatorname{span}(\mathbf{v})`
  );
});

test("scalar retargeting interpolates from the currently painted point", () => {
  const middle = sampleKpEigenvectorScalarTransition({
    from: [3, 3],
    to: [0, 0],
    progress: 0.5
  });
  const finish = sampleKpEigenvectorScalarTransition({
    from: middle.output,
    to: [-4.5, -4.5],
    progress: 1
  });

  assert.deepEqual(middle.output, [1.5, 1.5]);
  assert.equal(middle.settled, false);
  assert.deepEqual(finish.output, [-4.5, -4.5]);
  assert.equal(finish.settled, true);
});
