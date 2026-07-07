import { strict as assert } from "node:assert";
import test from "node:test";

import {
  buildDepthScene,
  classifyProjectedPointDepth,
  classifyProjectedLineVisibility,
  detectDepthSurfaceOverlaps,
  findVisibilityBoundary,
  projectedQuadsToDepthTriangles,
  segmentProjectedLineByVisibility
} from "../src/rendering/depth-scene.ts";

test("projectedQuadsToDepthTriangles converts projected quads into depth writers", () => {
  const triangles = projectedQuadsToDepthTriangles([
    {
      points: [
        { x: 0, y: 0, depth: 1 },
        { x: 4, y: 0, depth: 2 },
        { x: 4, y: 4, depth: 3 },
        { x: 0, y: 4, depth: 4 }
      ]
    }
  ]);

  assert.equal(triangles.length, 2);
  assert.deepEqual(triangles[0]?.points, [
    { x: 0, y: 0, depth: 1 },
    { x: 4, y: 0, depth: 2 },
    { x: 4, y: 4, depth: 3 }
  ]);
});

test("buildDepthScene rasterizes projected triangles and classifies lines", () => {
  const scene = buildDepthScene({
    logicalWidth: 6,
    logicalHeight: 6,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 5, y: 0, depth: 2 },
          { x: 0, y: 5, depth: 2 }
        ]
      }
    ]
  });

  assert.equal(scene.buffer.depthAtCell(1, 1), 2);
  assert.equal(scene.triangleCount, 1);
  assert.equal(
    classifyProjectedLineVisibility(scene, {
      from: { x: 1, y: 1, depth: 1.5 },
      to: { x: 1, y: 1, depth: 1.5 }
    }),
    "hidden"
  );
  assert.equal(
    classifyProjectedLineVisibility(scene, {
      from: { x: 1, y: 1, depth: 2.5 },
      to: { x: 1, y: 1, depth: 2.5 }
    }),
    "visible"
  );
});

test("classifyProjectedPointDepth reports signed depth delta against the scene", () => {
  const scene = buildDepthScene({
    logicalWidth: 6,
    logicalHeight: 6,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 5, y: 0, depth: 2 },
          { x: 0, y: 5, depth: 2 }
        ]
      }
    ]
  });

  assert.deepEqual(classifyProjectedPointDepth(scene, { x: 1, y: 1, depth: 1.5 }), {
    surfaceDepth: 2,
    delta: -0.5,
    visibility: "hidden"
  });
  assert.deepEqual(classifyProjectedPointDepth(scene, { x: 1, y: 1, depth: 2.5 }), {
    surfaceDepth: 2,
    delta: 0.5,
    visibility: "visible"
  });
  assert.deepEqual(classifyProjectedPointDepth(scene, { x: 5, y: 5, depth: -100 }), {
    surfaceDepth: undefined,
    delta: undefined,
    visibility: "visible"
  });
});

test("findVisibilityBoundary refines the projected crossing point", () => {
  const scene = buildDepthScene({
    logicalWidth: 8,
    logicalHeight: 8,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 7, y: 0, depth: 2 },
          { x: 0, y: 7, depth: 2 }
        ]
      }
    ]
  });
  const boundary = findVisibilityBoundary(
    scene,
    {
      from: { x: 1, y: 1, depth: 1 },
      to: { x: 3, y: 1, depth: 3 }
    },
    { iterations: 10 }
  );

  assert.equal(boundary.fromVisibility, "hidden");
  assert.equal(boundary.toVisibility, "visible");
  assert.ok(Math.abs(boundary.point.x - 2) < 0.01);
  assert.ok(Math.abs(boundary.point.depth - 2) < 0.01);
});

test("segmentProjectedLineByVisibility subdivides projected lines at visibility changes", () => {
  const scene = buildDepthScene({
    logicalWidth: 8,
    logicalHeight: 8,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 7, y: 0, depth: 2 },
          { x: 0, y: 7, depth: 2 }
        ]
      }
    ]
  });
  const segments = segmentProjectedLineByVisibility(
    scene,
    {
      from: { x: 1, y: 1, depth: 1 },
      to: { x: 4, y: 1, depth: 4 }
    },
    { maxDepth: 4 }
  );

  assert.ok(segments.length > 1);
  assert.equal(segments[0]?.visibility, "hidden");
  assert.equal(segments.at(-1)?.visibility, "visible");
  assert.ok(
    segments.every(
      (segment, index) =>
        index === 0 ||
        segment.from.x === segments[index - 1]?.to.x
    )
  );
});

test("segmentProjectedLineByVisibility uses the refined depth boundary as a split point", () => {
  const scene = buildDepthScene({
    logicalWidth: 8,
    logicalHeight: 8,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 7, y: 0, depth: 2 },
          { x: 0, y: 7, depth: 2 }
        ]
      }
    ]
  });
  const segments = segmentProjectedLineByVisibility(
    scene,
    {
      from: { x: 1, y: 1, depth: 1 },
      to: { x: 4, y: 1, depth: 4 }
    },
    { maxDepth: 4 }
  );
  const splitPoints = segments.slice(0, -1).map((segment) => segment.to);

  assert.ok(splitPoints.some((point) => Math.abs(point.x - 2) < 0.001));
});

test("segmentProjectedLineByVisibility honors a max segment budget", () => {
  const scene = buildDepthScene({
    logicalWidth: 8,
    logicalHeight: 8,
    triangles: [
      {
        points: [
          { x: 0, y: 0, depth: 2 },
          { x: 7, y: 0, depth: 2 },
          { x: 0, y: 7, depth: 2 }
        ]
      }
    ]
  });
  const segments = segmentProjectedLineByVisibility(
    scene,
    {
      from: { x: -1, y: 1, depth: 1 },
      to: { x: 9, y: 1, depth: 1 }
    },
    { maxDepth: 8, maxSegments: 2 }
  );

  assert.ok(segments.length <= 2);
});

test("detectDepthSurfaceOverlaps reports projected overlaps between surface groups", () => {
  const overlaps = detectDepthSurfaceOverlaps([
    {
      surfaceId: "front-surface",
      triangles: [
        {
          points: [
            { x: 0, y: 0, depth: 1 },
            { x: 4, y: 0, depth: 1 },
            { x: 0, y: 4, depth: 1 }
          ]
        }
      ]
    },
    {
      surfaceId: "back-surface",
      triangles: [
        {
          points: [
            { x: 1, y: 1, depth: 2 },
            { x: 5, y: 1, depth: 2 },
            { x: 1, y: 5, depth: 2 }
          ]
        }
      ]
    }
  ]);

  assert.deepEqual(overlaps, [
    {
      surfaceIds: ["front-surface", "back-surface"],
      triangleIndices: [0, 0]
    }
  ]);
});
