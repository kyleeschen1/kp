import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import {
  createNumeratorSplitMergeEquationKpAsset,
  numeratorSplitMergeEquationAssetIds
} from "../semantic/numerator-split-merge-equation-asset.ts";
import { createKpQuadraticBranchChoreography } from "./quadratic-branch-choreography.ts";
import type { KpGlyphReconciliationCaseInput } from "./semantic-glyph-reconciliation-compiler.ts";
import type { KpCanonicalOperationExecutionResult } from "../semantic/transformation-definition-binding.ts";

export function createKpSolveXGlyphReconciliationCase(): KpGlyphReconciliationCaseInput {
  const asset = createLinearSolveAnimationAsset();
  const transformation = asset.transformations.find(({ id }) =>
    id === "transform.linear-solve.cancel-left-additive-inverse"
  );
  const record = transformation?.correspondenceMap?.records.find(({ id }) =>
    id.endsWith("x-persists")
  );
  if (transformation === undefined || record === undefined) {
    throw new Error("Canonical solve-x persistence correspondence is unavailable.");
  }
  const sourceEntityId = record.sourceSelectorIds[0]!;
  const targetEntityId = record.targetSelectorIds[0]!;
  const execution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: transformation.id,
    operationSpecId: "kp.core.persist",
    roleBindings: { before: [sourceEntityId], after: [targetEntityId] },
    lineageGraph: {
      kind: "semantic-lineage-graph",
      id: `${transformation.id}.glyph-experiment-lineage`,
      sourceEntityIds: [sourceEntityId],
      targetEntityIds: [targetEntityId],
      edges: [{
        id: record.id,
        relation: "persist",
        sourceEntityIds: [sourceEntityId],
        targetEntityIds: [targetEntityId],
        summary: record.summary
      }]
    },
    correspondenceMap: {
      id: `${transformation.id}.glyph-experiment-correspondence`,
      records: [record]
    }
  };
  return Object.freeze({
    id: "case.solve-x.one-to-one",
    execution,
    viewport: { x: 0, y: 0, width: 640, height: 240 },
    sourceGlyphs: [{
      id: "solve-x.source.x",
      entityId: sourceEntityId,
      glyphKey: "x",
      ordinal: 0
    }],
    targetGlyphs: [{
      id: "solve-x.target.x",
      entityId: targetEntityId,
      glyphKey: "x",
      ordinal: 0
    }],
    sourceMetrics: [{
      glyphId: "solve-x.source.x",
      bounds: { x: 116, y: 100, width: 15, height: 25 }
    }],
    targetMetrics: [{
      glyphId: "solve-x.target.x",
      bounds: { x: 248, y: 100, width: 15, height: 25 }
    }],
    requiredCapabilities: [
      "accessibility",
      "annotation",
      "direct-seek",
      "hover",
      "responsive",
      "rewind"
    ] as const,
    durationMs: 600
  });
}

export function createKpFractionMergeGlyphReconciliationCase(): KpGlyphReconciliationCaseInput {
  const asset = createNumeratorSplitMergeEquationKpAsset();
  const transformation = asset.transformations.find(({ id }) =>
    id === numeratorSplitMergeEquationAssetIds.mergeTransform
  );
  const record = transformation?.correspondenceMap?.records.find(({ id }) =>
    id === "denominators-merge"
  );
  if (transformation === undefined || record === undefined) {
    throw new Error("Canonical fraction denominator merge correspondence is unavailable.");
  }
  const execution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: transformation.id,
    operationSpecId: "kp.core.merge",
    roleBindings: {
      sources: record.sourceSelectorIds,
      result: record.targetSelectorIds
    },
    lineageGraph: {
      kind: "semantic-lineage-graph",
      id: `${transformation.id}.glyph-experiment-lineage`,
      sourceEntityIds: record.sourceSelectorIds,
      targetEntityIds: record.targetSelectorIds,
      edges: [{
        id: record.id,
        relation: "merge",
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: record.summary
      }]
    },
    correspondenceMap: {
      id: `${transformation.id}.glyph-experiment-correspondence`,
      records: [record]
    }
  };
  return Object.freeze({
    id: "case.fraction.denominator-merge",
    execution,
    viewport: { x: 0, y: 0, width: 640, height: 260 },
    sourceGlyphs: record.sourceSelectorIds.map((entityId, index) => ({
      id: `fraction.source.denominator.${index}`,
      entityId,
      glyphKey: "2",
      ordinal: 0
    })),
    targetGlyphs: [{
      id: "fraction.target.denominator",
      entityId: record.targetSelectorIds[0]!,
      glyphKey: "2",
      ordinal: 0
    }],
    sourceMetrics: [
      { glyphId: "fraction.source.denominator.0", bounds: { x: 186, y: 154, width: 14, height: 22 } },
      { glyphId: "fraction.source.denominator.1", bounds: { x: 386, y: 154, width: 14, height: 22 } }
    ],
    targetMetrics: [{
      glyphId: "fraction.target.denominator",
      bounds: { x: 286, y: 154, width: 14, height: 22 }
    }],
    requiredCapabilities: [
      "accessibility",
      "annotation",
      "cloze",
      "direct-seek",
      "hover",
      "responsive",
      "rewind"
    ] as const,
    durationMs: 720
  });
}

export function createKpQuadraticPlusMinusGlyphReconciliationCase(): KpGlyphReconciliationCaseInput {
  const choreography = createKpQuadraticBranchChoreography(
    "method.quadratic.completing-square"
  );
  const edge = {
    id: choreography.fission.lineageEdgeId,
    relation: "split" as const,
    sourceEntityIds: choreography.fission.sourceEntityIds,
    targetEntityIds: choreography.fission.targetEntityIds,
    summary: "One semantic plus-minus origin creates two exact root branches."
  };
  const execution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: "operation.quadratic.branch-plus-minus",
    operationSpecId: "kp.core.fan-out",
    roleBindings: {
      source: edge.sourceEntityIds,
      destinations: edge.targetEntityIds
    },
    lineageGraph: {
      kind: "semantic-lineage-graph",
      id: choreography.fission.lineageGraphId,
      sourceEntityIds: edge.sourceEntityIds,
      targetEntityIds: edge.targetEntityIds,
      edges: [edge]
    },
    correspondenceMap: {
      id: `${choreography.fission.lineageGraphId}.correspondence`,
      records: [{
        id: edge.id,
        relation: "fan-out",
        sourceSelectorIds: edge.sourceEntityIds,
        targetSelectorIds: edge.targetEntityIds,
        summary: edge.summary
      }]
    }
  };
  return Object.freeze({
    id: "case.quadratic.plus-minus-branch",
    execution,
    viewport: { x: 0, y: 0, width: 640, height: 300 },
    sourceGlyphs: [{
      id: "quadratic.source.plus-minus",
      entityId: edge.sourceEntityIds[0]!,
      glyphKey: "±",
      ordinal: 0
    }],
    targetGlyphs: [
      {
        id: "quadratic.target.minus",
        entityId: edge.targetEntityIds[0]!,
        glyphKey: "−",
        ordinal: 0
      },
      {
        id: "quadratic.target.plus",
        entityId: edge.targetEntityIds[1]!,
        glyphKey: "+",
        ordinal: 0
      }
    ],
    sourceMetrics: [{
      glyphId: "quadratic.source.plus-minus",
      bounds: { x: 310, y: 134, width: 20, height: 28 }
    }],
    targetMetrics: [
      { glyphId: "quadratic.target.minus", bounds: { x: 238, y: 188, width: 20, height: 28 } },
      { glyphId: "quadratic.target.plus", bounds: { x: 382, y: 188, width: 20, height: 28 } }
    ],
    requiredCapabilities: [
      "accessibility",
      "annotation",
      "branching",
      "direct-seek",
      "hover",
      "responsive",
      "rewind"
    ] as const,
    durationMs: 760
  });
}
