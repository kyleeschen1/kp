import { strict as assert } from "node:assert";
import test from "node:test";

import {
  interpolateProjectedPoint,
  projectedLineAverageDepth,
  projectedLineMidpoint,
  projectedTrianglesOverlap,
  splitProjectedLineAt,
  splitProjectedQuadToTriangles
} from "../src/rendering/geometry.ts";

test("projected line helpers derive midpoint and average depth", () => {
  const line = {
    from: { x: 0, y: 10, depth: 2 },
    to: { x: 4, y: 6, depth: 6 }
  };

  assert.equal(projectedLineAverageDepth(line), 4);
  assert.deepEqual(projectedLineMidpoint(line), {
    x: 2,
    y: 8,
    depth: 4
  });
});

test("splitProjectedQuadToTriangles emits stable surface triangle winding", () => {
  const quad = {
    points: [
      { x: 0, y: 0, depth: 1 },
      { x: 4, y: 0, depth: 2 },
      { x: 4, y: 4, depth: 3 },
      { x: 0, y: 4, depth: 4 }
    ] as const
  };

  assert.deepEqual(splitProjectedQuadToTriangles(quad), [
    {
      points: [
        { x: 0, y: 0, depth: 1 },
        { x: 4, y: 0, depth: 2 },
        { x: 4, y: 4, depth: 3 }
      ]
    },
    {
      points: [
        { x: 0, y: 0, depth: 1 },
        { x: 4, y: 4, depth: 3 },
        { x: 0, y: 4, depth: 4 }
      ]
    }
  ]);
});

test("interpolateProjectedPoint interpolates screen coordinates and depth", () => {
  assert.deepEqual(
    interpolateProjectedPoint(
      { x: 0, y: 10, depth: 2 },
      { x: 8, y: 2, depth: 6 },
      0.25
    ),
    {
      x: 2,
      y: 8,
      depth: 3
    }
  );
});

test("splitProjectedLineAt returns contiguous projected line segments", () => {
  assert.deepEqual(
    splitProjectedLineAt(
      {
        from: { x: 0, y: 10, depth: 2 },
        to: { x: 8, y: 2, depth: 6 }
      },
      0.25
    ),
    [
      {
        from: { x: 0, y: 10, depth: 2 },
        to: { x: 2, y: 8, depth: 3 }
      },
      {
        from: { x: 2, y: 8, depth: 3 },
        to: { x: 8, y: 2, depth: 6 }
      }
    ]
  );
});

test("projectedTrianglesOverlap detects projected screen-space overlap", () => {
  assert.equal(
    projectedTrianglesOverlap(
      {
        points: [
          { x: 0, y: 0, depth: 1 },
          { x: 4, y: 0, depth: 1 },
          { x: 0, y: 4, depth: 1 }
        ]
      },
      {
        points: [
          { x: 1, y: 1, depth: 2 },
          { x: 5, y: 1, depth: 2 },
          { x: 1, y: 5, depth: 2 }
        ]
      }
    ),
    true
  );
  assert.equal(
    projectedTrianglesOverlap(
      {
        points: [
          { x: 0, y: 0, depth: 1 },
          { x: 4, y: 0, depth: 1 },
          { x: 0, y: 4, depth: 1 }
        ]
      },
      {
        points: [
          { x: 10, y: 10, depth: 2 },
          { x: 14, y: 10, depth: 2 },
          { x: 10, y: 14, depth: 2 }
        ]
      }
    ),
    false
  );
});
