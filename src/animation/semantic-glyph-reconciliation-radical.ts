import {
  createExponentRadicalRewriteAnimationAsset,
  defaultExponentRadicalRewriteFixtureId
} from "./exponent-radical-adapter.ts";
import { createKpRadicalFragmentLineage } from "./radical-fragment-lineage.ts";
import type { KpInteractivePresentationCapability } from "./presentation-constraints.ts";
import { resolveKpRadicalFragmentSemantics } from "../semantic/radical-fragment-semantics.ts";
import type { KpCanonicalOperationExecutionResult } from "../semantic/transformation-definition-binding.ts";

const requiredCapabilities = [
  "accessibility",
  "annotation",
  "direct-seek",
  "hover",
  "responsive",
  "rewind"
] as const satisfies readonly KpInteractivePresentationCapability[];

export function createKpRadicalSuccessionGlyphReconciliationAudit() {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "rewritePowerAsRoot"
  );
  if (transformation?.correspondenceMap === undefined) {
    throw new Error("Canonical exponent-to-radical correspondence is unavailable.");
  }
  const sourceObjectId = transformation.sourceObjectIds[0];
  const targetObjectId = transformation.targetObjectIds[0];
  if (sourceObjectId === undefined || targetObjectId === undefined) {
    throw new Error("Canonical exponent-to-radical endpoints are unavailable.");
  }
  const semantics = resolveKpRadicalFragmentSemantics(transformation);
  const fragmentLineage = createKpRadicalFragmentLineage(animation);
  const execution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: transformation.id,
    operationSpecId: "kp.algebra.rewrite-power-as-root",
    roleBindings: {
      "base-before": semantics.baseRecord.sourceSelectorIds,
      "radicand-after": semantics.baseRecord.targetSelectorIds,
      "notation-before": semantics.notationRecords.flatMap(
        ({ sourceSelectorIds }) => sourceSelectorIds
      ),
      "notation-after": semantics.notationRecords.flatMap(
        ({ targetSelectorIds }) => targetSelectorIds
      )
    },
    lineageGraph: fragmentLineage.graph,
    correspondenceMap: transformation.correspondenceMap
  };

  return Object.freeze({
    kind: "radical-succession-glyph-reconciliation-audit" as const,
    id: "audit.glyph-reconciliation.radical.square-root-as-power",
    fixtureId: defaultExponentRadicalRewriteFixtureId,
    animationId: animation.id,
    sourceObjectId,
    targetObjectId,
    transformation,
    semantics,
    fragmentLineage,
    execution: Object.freeze(execution),
    requiredCapabilities,
    preservationBoundary: Object.freeze([
      "canonical radical selector identity",
      "correspondence and reverse laws",
      "native KaTeX endpoint authority",
      "renderer-session state remains ephemeral"
    ])
  });
}
