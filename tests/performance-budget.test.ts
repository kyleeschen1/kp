import { strict as assert } from "node:assert";
import test from "node:test";

import {
  DEFAULT_GRAPH_3D_RENDER_BUDGET,
  evaluateGraph3DRenderBudget
} from "../src/rendering/performance-budget.ts";

test("evaluateGraph3DRenderBudget accepts the default 3D renderer scale", () => {
  assert.deepEqual(
    evaluateGraph3DRenderBudget({
      depthCellCount: 235_200,
      depthTriangleCount: 288,
      overlapCount: 0,
      surfaceCount: 1
    }),
    {
      budget: DEFAULT_GRAPH_3D_RENDER_BUDGET,
      cost: {
        depthCellCount: 235_200,
        depthTriangleCount: 288,
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
    overlapCount: 0,
    surfaceCount: 1
  });

  assert.equal(result.status, "over-budget");
  assert.deepEqual(result.issues, [
    "Depth cell count 400000 exceeds budget 300000.",
    "Depth triangle count 1200 exceeds budget 800."
  ]);
});
