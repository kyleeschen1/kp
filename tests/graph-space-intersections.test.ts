import { strict as assert } from "node:assert";
import test from "node:test";

import {
  add,
  negate,
  power,
  variable
} from "../src/math/expression.ts";
import {
  compileLineSurfaceDepthFunction,
  signedLineSurfaceDepthAt
} from "../src/rendering/graph-space-intersections.ts";

const surfaceExpression = add(power(variable("x"), 2), negate(variable("y")));
const line = {
  from: { x: -1, y: 0, z: 2 },
  to: { x: 1, y: 0, z: -1 }
};

test("signedLineSurfaceDepthAt samples signed z-depth against an explicit surface", () => {
  assert.deepEqual(signedLineSurfaceDepthAt(line, surfaceExpression, 0), {
    point: { x: -1, y: 0, z: 2 },
    surfaceZ: 1,
    signedDepth: 1
  });
  assert.deepEqual(signedLineSurfaceDepthAt(line, surfaceExpression, 0.5), {
    point: { x: 0, y: 0, z: 0.5 },
    surfaceZ: 0,
    signedDepth: 0.5
  });
  assert.deepEqual(signedLineSurfaceDepthAt(line, surfaceExpression, 1), {
    point: { x: 1, y: 0, z: -1 },
    surfaceZ: 1,
    signedDepth: -2
  });
});

test("compileLineSurfaceDepthFunction reuses the surface evaluator", () => {
  const depthAt = compileLineSurfaceDepthFunction(line, surfaceExpression);

  assert.equal(depthAt(0).signedDepth, 1);
  assert.equal(depthAt(0.5).signedDepth, 0.5);
  assert.equal(depthAt(1).signedDepth, -2);
});
