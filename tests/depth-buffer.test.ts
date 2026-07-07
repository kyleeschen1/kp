import { strict as assert } from "node:assert";
import test from "node:test";

import {
  DepthBuffer,
  interpolateTriangleDepthAtPoint,
  isPointVisibleAgainstDepth,
  rasterizeDepthTriangle
} from "../src/rendering/depth-buffer.ts";

test("interpolateTriangleDepthAtPoint returns barycentric depth inside a triangle", () => {
  const depth = interpolateTriangleDepthAtPoint(
    { x: 1, y: 1 },
    {
      points: [
        { x: 0, y: 0, depth: 0 },
        { x: 4, y: 0, depth: 4 },
        { x: 0, y: 4, depth: 8 }
      ]
    }
  );

  assert.equal(depth, 3);
  assert.equal(
    interpolateTriangleDepthAtPoint(
      { x: 5, y: 5 },
      {
        points: [
          { x: 0, y: 0, depth: 0 },
          { x: 4, y: 0, depth: 4 },
          { x: 0, y: 4, depth: 8 }
        ]
      }
    ),
    undefined
  );
});

test("rasterizeDepthTriangle writes nearest depth into covered cells", () => {
  const buffer = new DepthBuffer({
    logicalWidth: 6,
    logicalHeight: 6,
    scale: 1
  });

  rasterizeDepthTriangle(buffer, {
    points: [
      { x: 0, y: 0, depth: 1 },
      { x: 5, y: 0, depth: 1 },
      { x: 0, y: 5, depth: 1 }
    ]
  });
  rasterizeDepthTriangle(buffer, {
    points: [
      { x: 0, y: 0, depth: 3 },
      { x: 5, y: 0, depth: 3 },
      { x: 0, y: 5, depth: 3 }
    ]
  });

  assert.equal(buffer.width, 6);
  assert.equal(buffer.height, 6);
  assert.equal(buffer.depthAtCell(1, 1), 3);
  assert.equal(buffer.depthAtCell(5, 5), undefined);
});

test("isPointVisibleAgainstDepth classifies projected points with epsilon", () => {
  const buffer = new DepthBuffer({
    logicalWidth: 6,
    logicalHeight: 6,
    scale: 1
  });

  rasterizeDepthTriangle(buffer, {
    points: [
      { x: 0, y: 0, depth: 2 },
      { x: 5, y: 0, depth: 2 },
      { x: 0, y: 5, depth: 2 }
    ]
  });

  assert.equal(
    isPointVisibleAgainstDepth(buffer, { x: 1, y: 1, depth: 2.1 }),
    true
  );
  assert.equal(
    isPointVisibleAgainstDepth(buffer, { x: 1, y: 1, depth: 1.9 }),
    false
  );
  assert.equal(
    isPointVisibleAgainstDepth(buffer, { x: 5, y: 5, depth: -100 }),
    true
  );
});
