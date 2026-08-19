import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalFractionEquivalencePresentationPlan
} from "./fraction-equivalence-presentation-plan.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  kpCanonicalFractionEquivalence
} from "../semantic/fraction-equivalence.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export const kpFractionEquivalenceExemplarId =
  "animation.equation.fraction-equivalence.v1" as const;

export function createKpFractionEquivalenceExemplarAsset(): KpAnimationAsset {
  const semantic = kpCanonicalFractionEquivalence;
  const presentation = kpCanonicalFractionEquivalencePresentationPlan;
  const sourceEquation = createKpSemanticAssetObject({
    id: semantic.source.stateId,
    objectType: "equation",
    title: "Source fraction",
    value: Object.freeze({ latex: "\\frac{a}{b}", stateKind: "source" }),
    selectors: presentation.sourceSelectorIds.map(selector),
    metadata: {
      latex: "\\frac{a}{b}",
      settledEndpointAuthority: "native-katex"
    }
  });
  const scaleFactor = createKpSemanticAssetObject({
    id: "object.fraction-equivalence.scale-factor",
    objectType: "parameter",
    title: "Shared nonzero scale factor",
    value: Object.freeze({ latex: "2", nonzero: true }),
    selectors: presentation.operationMaterialSelectorIds.map(selector),
    metadata: {
      latex: "2",
      semanticRole: "operation-material"
    }
  });
  const targetEquation = createKpSemanticAssetObject({
    id: semantic.target.stateId,
    objectType: "equation",
    title: "Equivalent scaled fraction",
    value: Object.freeze({
      latex: "\\frac{2a}{2b}",
      stateKind: "target"
    }),
    selectors: presentation.targetSelectorIds.map(selector),
    metadata: {
      latex: "\\frac{2a}{2b}",
      settledEndpointAuthority: "native-katex"
    }
  });
  const objects = [sourceEquation, scaleFactor, targetEquation];
  const transformation = createKpSemanticTransformation({
    id: semantic.id,
    transformType: "scaleFractionEquivalently",
    title: "Scale numerator and denominator by one nonzero factor",
    sourceObjectIds: [sourceEquation.id, scaleFactor.id],
    targetObjectIds: [targetEquation.id],
    preserves: ["identity", "value", "role"],
    correspondenceMap: {
      id: "correspondence.fraction-equivalence.exemplar",
      records: [
        record(
          "correspondence.fraction-equivalence.division",
          "identity",
          [semantic.source.divisionEntityId],
          [semantic.target.divisionEntityId],
          "The native fraction structure persists."
        ),
        record(
          "correspondence.fraction-equivalence.numerator",
          "identity",
          [semantic.source.numerator.entityId],
          [semantic.target.numeratorSourceOccurrenceEntityId],
          "The numerator persists inside its target product."
        ),
        record(
          "correspondence.fraction-equivalence.denominator",
          "identity",
          [semantic.source.denominator.entityId],
          [semantic.target.denominatorSourceOccurrenceEntityId],
          "The denominator persists inside its target product."
        ),
        record(
          "correspondence.fraction-equivalence.factor",
          "fan-out",
          [semantic.factor.entityId],
          [
            semantic.target.numeratorFactorOccurrenceEntityId,
            semantic.target.denominatorFactorOccurrenceEntityId
          ],
          "One scale factor derives synchronized numerator and denominator copies."
        )
      ]
    },
    correspondence: presentation.operandTransfers.map((transfer) => ({
      sourceSelectorId: transfer.sourceEntityId,
      targetSelectorId: transfer.targetEntityId,
      preserves: ["identity", "value", "role"],
      summary: `Preserve ${transfer.role}.`
    })),
    assumptions: Object.values(semantic.nonzeroEvidence),
    lawRefs: [{
      id: semantic.lawAuthority.id,
      level: "strict",
      summary:
        "Scaling numerator and denominator by the same nonzero factor preserves a defined fraction."
    }]
  });
  const root = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );
  const timelineId = `timeline.${kpFractionEquivalenceExemplarId}`;
  const renderTargetId = "render.fraction-equivalence.equation";
  return createKpAnimationAsset({
    id: kpFractionEquivalenceExemplarId,
    title: "Scale a fraction equivalently",
    bundle: createKpAssetBundle({
      id: "asset.fraction-equivalence.symbolic-times-two",
      title: "Scale a symbolic fraction by two over two",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 4_800,
      beatCount: 96,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.fraction-equivalence",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: [transformation.id],
      timelineId,
      summary:
        "Copy one nonzero factor into both branches while fraction material persists."
    }],
    checks: [{
      id: "check.fraction-equivalence.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpFractionEquivalenceExemplarId
    }, {
      id: "check.fraction-equivalence.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.fraction-equivalence.frames",
      kind: "frame-sequence",
      artifactId: "artifact.fraction-equivalence.frames"
    }],
    dashboard: {
      rowId: "exemplar-equation-fraction-equivalence-v1",
      tags: ["algebra", "animation", "equation", "fraction", "katex"],
      sourceRefIds: [semantic.lawAuthority.id]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.fraction-equivalence",
      presentationPlanId: presentation.id,
      settledEndpointAuthority: "native-katex",
      summary:
        "A reversible checkpoint exemplar for equivalent-fraction identity."
    }
  });
}

function selector(id: string) {
  return {
    id,
    kind: selectorKind(id),
    label: selectorLabel(id),
    metadata: { representation: "native-katex" }
  };
}

function record(
  id: string,
  relation: "identity" | "fan-out",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  summary: string
) {
  return { id, relation, sourceSelectorIds, targetSelectorIds, summary };
}

function selectorKind(id: string): string {
  if (id.includes("division")) return "fraction-bar";
  if (id.includes("product")) return "product";
  if (id.includes("factor")) return "factor";
  if (id.includes("numerator")) return "numerator";
  if (id.includes("denominator")) return "denominator";
  return "expression";
}

function selectorLabel(id: string): string {
  if (id.includes("division")) return "structural:frac-line";
  if (id.includes("factor")) return "2";
  if (id.includes("numerator")) return "a";
  if (id.includes("denominator")) return "b";
  return id;
}
