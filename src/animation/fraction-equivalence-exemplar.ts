import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalCompactFractionEquivalencePresentationPlan,
  kpCanonicalFractionEquivalencePresentationPlan,
  type KpFractionEquivalencePresentationMode
} from "./fraction-equivalence-presentation-plan.ts";
import {
  createKpAssetBundle
} from "../semantic/asset.ts";
import { createKpImmutableSemanticAssetObject } from "../semantic/immutable-asset.ts";
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
export const kpCompactFractionEquivalenceExemplarId =
  "animation.equation.fraction-equivalence.compact.v1" as const;

export function createKpFractionEquivalenceExemplarAsset(
  mode: KpFractionEquivalencePresentationMode = "explain-unit-factor"
): KpAnimationAsset {
  const semantic = kpCanonicalFractionEquivalence;
  const presentation = mode === "explain-unit-factor"
    ? kpCanonicalFractionEquivalencePresentationPlan
    : kpCanonicalCompactFractionEquivalencePresentationPlan;
  const animationId = mode === "explain-unit-factor"
    ? kpFractionEquivalenceExemplarId
    : kpCompactFractionEquivalenceExemplarId;
  const sourceEquation = createKpImmutableSemanticAssetObject({
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
  const scaleFactor = createKpImmutableSemanticAssetObject({
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
  const targetEquation = createKpImmutableSemanticAssetObject({
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
  const timelineId = `timeline.${animationId}`;
  const renderTargetId = "render.fraction-equivalence.equation";
  return createKpAnimationAsset({
    id: animationId,
    title: mode === "explain-unit-factor"
      ? "Multiply a fraction by two over two"
      : "Scale numerator and denominator together",
    bundle: createKpAssetBundle({
      id: `asset.fraction-equivalence.symbolic-times-two.${mode}`,
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
        mode === "explain-unit-factor"
          ? "Join a visible unit factor with the original fraction."
          : "Introduce matched factors into numerator and denominator together."
    }],
    checks: [{
      id: "check.fraction-equivalence.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: animationId
    }, {
      id: "check.fraction-equivalence.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: `export.fraction-equivalence.frames.${mode}`,
      kind: "frame-sequence",
      artifactId: `artifact.fraction-equivalence.frames.${mode}`
    }],
    dashboard: {
      rowId: `exemplar-equation-fraction-equivalence-${mode}-v1`,
      tags: ["algebra", "animation", "equation", "fraction", "katex"],
      sourceRefIds: [semantic.lawAuthority.id]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.fraction-equivalence",
      presentationPlanId: presentation.id,
      presentationMode: mode,
      settledEndpointAuthority: "native-katex",
      summary:
        "A reversible checkpoint exemplar for equivalent-fraction identity."
    }
  });
}

export function createKpFractionEquivalenceExemplarAssets():
readonly KpAnimationAsset[] {
  return Object.freeze([
    createKpFractionEquivalenceExemplarAsset("explain-unit-factor"),
    createKpFractionEquivalenceExemplarAsset("compact-paired-operation")
  ]);
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
