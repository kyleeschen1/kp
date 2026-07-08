import type { Graph3DLightSettings } from "../semantic/graph.ts";

export interface Graph3DRenderCost {
  depthCellCount: number;
  depthTriangleCount: number;
  lightingOperationCount: number;
  overlapCount: number;
  surfaceCount: number;
}

export interface Graph3DRenderBudget {
  maxDepthCellCount: number;
  maxDepthTriangleCount: number;
  maxLightingOperationCount: number;
  maxOverlapCount: number;
  maxSurfaceCount: number;
}

export interface Graph3DRenderBudgetResult {
  budget: Graph3DRenderBudget;
  cost: Graph3DRenderCost;
  issues: readonly string[];
  status: "ok" | "over-budget";
}

export const DEFAULT_GRAPH_3D_RENDER_BUDGET: Graph3DRenderBudget = {
  maxDepthCellCount: 300_000,
  maxDepthTriangleCount: 800,
  maxLightingOperationCount: 8_000,
  maxOverlapCount: 2_000,
  maxSurfaceCount: 3
};

export function estimateGraph3DLightingOperationCount(
  surfaceQuadCount: number,
  light: Graph3DLightSettings
): number {
  const termWeight =
    activeTermWeight(light.ambient, 1) +
    activeTermWeight(light.diffuse, 1) +
    activeTermWeight(light.depthHaze, 1) +
    activeTermWeight(light.specular, 2) +
    activeTermWeight(light.rim, 1);

  return surfaceQuadCount * termWeight;
}

export function evaluateGraph3DRenderBudget(
  cost: Graph3DRenderCost,
  budget: Graph3DRenderBudget = DEFAULT_GRAPH_3D_RENDER_BUDGET
): Graph3DRenderBudgetResult {
  const issues = [
    ...budgetIssue(
      "Depth cell count",
      cost.depthCellCount,
      budget.maxDepthCellCount
    ),
    ...budgetIssue(
      "Depth triangle count",
      cost.depthTriangleCount,
      budget.maxDepthTriangleCount
    ),
    ...budgetIssue(
      "Lighting operation count",
      cost.lightingOperationCount,
      budget.maxLightingOperationCount
    ),
    ...budgetIssue("Surface count", cost.surfaceCount, budget.maxSurfaceCount),
    ...budgetIssue("Overlap count", cost.overlapCount, budget.maxOverlapCount)
  ];

  return {
    budget,
    cost,
    issues,
    status: issues.length === 0 ? "ok" : "over-budget"
  };
}

function budgetIssue(
  label: string,
  actual: number,
  maximum: number
): readonly string[] {
  return actual > maximum
    ? [`${label} ${actual} exceeds budget ${maximum}.`]
    : [];
}

function activeTermWeight(value: number, weight: number): number {
  return value > 0 ? weight : 0;
}
