import {
  createKpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityCategory,
  type KpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityRow
} from "./equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceInventory,
  type KpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";
import {
  createKpEquationSurfacePreservationMatrix,
  type KpEquationSurfaceFamilyId,
  type KpEquationSurfacePreservationMatrix
} from "./equation-surface-preservation-matrix.ts";

export interface KpEquationSurfaceCostFamilyPlan {
  readonly familyId: KpEquationSurfaceFamilyId;
  readonly animationId: string;
  readonly route: string;
  readonly expectedPackId: string;
  readonly authorityNodeIds: readonly string[];
  readonly sourcePaths: readonly string[];
}

export interface KpEquationSurfaceCostCategoryPlan {
  readonly category: KpEquationSurfaceAuthorityCategory;
  readonly sourcePaths: readonly string[];
}

export interface KpEquationSurfaceCompatibilityCounts {
  readonly equationSurfaceCount: number;
  readonly familyCount: number;
  readonly genericCompatibilityRows: number;
  readonly specializedAdapterRows: number;
  readonly rowsWithNonSemanticTransitions: number;
  readonly nonSemanticTransitionCount: number;
  readonly wholeEquationFallbackRows: number;
  readonly privateClockRows: number;
  readonly cssAnimationAuthorityRows: number;
  readonly uniqueLocalSamplerNodes: number;
}

export interface KpEquationSurfaceCostPlan {
  readonly schemaVersion: "kp.equation-surface-cost-plan.v1";
  readonly families: readonly KpEquationSurfaceCostFamilyPlan[];
  readonly sourceCategories: readonly KpEquationSurfaceCostCategoryPlan[];
  readonly compatibility: KpEquationSurfaceCompatibilityCounts;
}

export function createKpEquationSurfaceCostPlan(): KpEquationSurfaceCostPlan {
  return compileKpEquationSurfaceCostPlan({
    inventory: createKpEquationSurfaceInventory(),
    authority: createKpEquationSurfaceAuthorityGraph(),
    preservation: createKpEquationSurfacePreservationMatrix()
  });
}

export function compileKpEquationSurfaceCostPlan(input: {
  readonly inventory: KpEquationSurfaceInventory;
  readonly authority: KpEquationSurfaceAuthorityGraph;
  readonly preservation: KpEquationSurfacePreservationMatrix;
}): KpEquationSurfaceCostPlan {
  const inventoryById = new Map(input.inventory.entries.map((entry) => [
    entry.animationId,
    entry
  ]));
  const authorityById = new Map(input.authority.rows.map((row) => [
    row.animationId,
    row
  ]));
  const nodeById = new Map(input.authority.nodes.map((node) => [node.id, node]));
  const families = input.preservation.families.map((family) => {
    const animationId = family.representativeAnimationId;
    const inventory = inventoryById.get(animationId);
    const authority = authorityById.get(animationId);
    if (inventory === undefined || authority === undefined) {
      throw new Error(`Incomplete equation cost authority for ${animationId}.`);
    }
    const authorityNodeIds = idsForRow(authority);
    const authorityPaths = authorityNodeIds.map((nodeId) => {
      const node = nodeById.get(nodeId);
      if (node === undefined) {
        throw new Error(`Missing equation cost authority node ${nodeId}.`);
      }
      return node.sourcePath;
    });
    return Object.freeze({
      familyId: family.familyId,
      animationId,
      route: `/?artifact=${encodeURIComponent(animationId)}`,
      expectedPackId: inventory.lazyCapability.packId,
      authorityNodeIds: Object.freeze(authorityNodeIds),
      sourcePaths: Object.freeze(unique([
        inventory.semanticOwner.sourcePath,
        inventory.lazyCapability.loaderSourcePath,
        inventory.lazyCapability.packSourcePath,
        inventory.catalogueSurface.rendererSourcePath,
        inventory.clockAuthority.sourcePath,
        ...authorityPaths
      ]).sort())
    });
  });
  const categories = unique(input.authority.nodes.map(({ category }) =>
    category)).sort();
  const sourceCategories = categories.map((category) => Object.freeze({
    category,
    sourcePaths: Object.freeze(unique(input.authority.nodes
      .filter((node) => node.category === category)
      .map(({ sourcePath }) => sourcePath)).sort())
  }));
  const rowsWithNonSemanticTransitions = input.authority.rows.filter((row) =>
    row.semanticCompilerCoverage.nonSemantic > 0);

  return Object.freeze({
    schemaVersion: "kp.equation-surface-cost-plan.v1" as const,
    families: Object.freeze(families),
    sourceCategories: Object.freeze(sourceCategories),
    compatibility: Object.freeze({
      equationSurfaceCount: input.authority.rows.length,
      familyCount: families.length,
      genericCompatibilityRows: input.authority.rows.filter(({ pathClass }) =>
        pathClass === "generic-semantic-equation").length,
      specializedAdapterRows: input.authority.rows.filter(({ pathClass }) =>
        pathClass !== "generic-semantic-equation").length,
      rowsWithNonSemanticTransitions: rowsWithNonSemanticTransitions.length,
      nonSemanticTransitionCount: rowsWithNonSemanticTransitions.reduce(
        (total, row) => total + row.semanticCompilerCoverage.nonSemantic,
        0
      ),
      wholeEquationFallbackRows: input.authority.rows.filter((row) =>
        row.fallbackNodeIds.includes("fallback.generic-whole-equation"))
        .length,
      privateClockRows: input.authority.rows.filter((row) =>
        row.privateClockAuthority !== "none").length,
      cssAnimationAuthorityRows: input.authority.rows.filter((row) =>
        row.cssAnimationAuthority !== "none").length,
      uniqueLocalSamplerNodes: unique(input.authority.rows.flatMap((row) =>
        row.directSamplerNodeIds.filter((nodeId) =>
          nodeById.get(nodeId)?.authority === "local"))).length
    })
  });
}

function idsForRow(row: KpEquationSurfaceAuthorityRow): readonly string[] {
  return unique([
    ...row.compilerNodeIds,
    ...row.registryNodeIds,
    ...row.motifNodeIds,
    ...row.localTimingNodeIds,
    ...row.rendererInferenceNodeIds,
    row.sharedClockNodeId,
    ...row.fallbackNodeIds,
    ...row.directSamplerNodeIds
  ]);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
