import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
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
