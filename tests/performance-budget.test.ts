import { strict as assert } from "node:assert";
import test from "node:test";

import {
  DEFAULT_GRAPH_3D_RENDER_BUDGET,
  estimateGraph3DLightingOperationCount,
  evaluateGraph3DRenderBudget
} from "../src/rendering/performance-budget.ts";
import { DEFAULT_GRAPH_3D_LIGHT_SETTINGS } from "../src/semantic/graph.ts";

test("estimateGraph3DLightingOperationCount counts active per-quad lighting work", () => {
  assert.equal(
    estimateGraph3DLightingOperationCount(
      400,
      DEFAULT_GRAPH_3D_LIGHT_SETTINGS
    ),
    2400
  );
  assert.equal(
    estimateGraph3DLightingOperationCount(400, {
      ...DEFAULT_GRAPH_3D_LIGHT_SETTINGS,
      specular: 0,
      rim: 0
    }),
    1200
  );
});

test("evaluateGraph3DRenderBudget accepts the default 3D renderer scale", () => {
  assert.deepEqual(
    evaluateGraph3DRenderBudget({
      depthCellCount: 235_200,
      depthTriangleCount: 800,
      lightingOperationCount: 2400,
      overlapCount: 0,
      surfaceCount: 1
    }),
    {
      budget: DEFAULT_GRAPH_3D_RENDER_BUDGET,
      cost: {
        depthCellCount: 235_200,
        depthTriangleCount: 800,
        lightingOperationCount: 2400,
        overlapCount: 0,
        surfaceCount: 1
      },
      issues: [],
      status: "ok"
    }
  );
});

test("evaluateGraph3DRenderBudget reports over-budget depth work", () => {
  const result = evaluateGraph3DRenderBudget({
    depthCellCount: 400_000,
    depthTriangleCount: 1_200,
    lightingOperationCount: 9_000,
    overlapCount: 0,
    surfaceCount: 1
  });

  assert.equal(result.status, "over-budget");
  assert.deepEqual(result.issues, [
    "Depth cell count 400000 exceeds budget 300000.",
    "Depth triangle count 1200 exceeds budget 800.",
    "Lighting operation count 9000 exceeds budget 8000."
  ]);
});
