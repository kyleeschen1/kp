import assert from "node:assert/strict";
import test from "node:test";

import { evaluateKpTypedMatrix } from "../src/math/authoring/public-api.ts";
import {
  hessian,
  jacobian
} from "./type-fixtures/typed-math-authoring-ergonomic-public-api.ts";

test("the ergonomic public consumer retains Jacobian and Hessian behavior", () => {
  assert.equal(jacobian.id, "public.ergonomic.functions.affine.jacobian");
  assert.equal(hessian.id, "public.ergonomic.functions.quadratic.hessian");
  assert.deepEqual(evaluateKpTypedMatrix(jacobian.matrix, {}), [
    [2, 1],
    [1, -3]
  ]);
  assert.deepEqual(evaluateKpTypedMatrix(hessian.matrix, {}), [
    [2, 1],
    [1, 2]
  ]);
});
