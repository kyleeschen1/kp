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
  findLineSurfaceIntersections,
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

test("findLineSurfaceIntersections locates sign-change roots by bisection", () => {
  const intersections = findLineSurfaceIntersections(
    {
      from: { x: -2, y: 0, z: 1 },
      to: { x: 2, y: 0, z: 1 }
    },
    power(variable("x"), 2),
    {
      iterations: 24,
      sampleCount: 16
    }
  );

  assert.equal(intersections.length, 2);
  assert.ok(Math.abs((intersections[0]?.t ?? 0) - 0.25) < 0.000_001);
  assert.ok(Math.abs((intersections[1]?.t ?? 0) - 0.75) < 0.000_001);
  assert.deepEqual(
    intersections.map((intersection) => ({
      point: {
        x: Number(intersection.point.x.toFixed(6)),
        y: intersection.point.y,
        z: intersection.point.z
      },
      signedDepth: Number(intersection.signedDepth.toFixed(6)),
      surfaceZ: Number(intersection.surfaceZ.toFixed(6))
    })),
    [
      {
        point: { x: -1, y: 0, z: 1 },
        signedDepth: 0,
        surfaceZ: 1
      },
      {
        point: { x: 1, y: 0, z: 1 },
        signedDepth: 0,
        surfaceZ: 1
      }
    ]
  );
});

test("findLineSurfaceIntersections returns no roots when the line stays on one side", () => {
  assert.deepEqual(
    findLineSurfaceIntersections(
      {
        from: { x: -1, y: 0, z: 3 },
        to: { x: 1, y: 0, z: 3 }
      },
      power(variable("x"), 2)
    ),
    []
  );
});
