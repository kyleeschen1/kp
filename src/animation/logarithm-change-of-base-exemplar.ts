import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalLogarithmChangeOfBasePresentationPlan
} from "./logarithm-change-of-base-presentation-plan.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  kpCanonicalLogarithmChangeOfBase
} from "../semantic/logarithm-change-of-base.ts";

export const kpLogarithmChangeOfBaseExemplarId =
  "animation.equation.logarithm-change-of-base.v1" as const;

export function createKpLogarithmChangeOfBaseExemplarAsset(): KpAnimationAsset {
  const semantic = kpCanonicalLogarithmChangeOfBase;
  const presentation = kpCanonicalLogarithmChangeOfBasePresentationPlan;
  const sourceSelectors = presentation.sourceSelectorIds.map((id) => ({
    id,
    kind: selectorKind(id),
    label: selectorLabel(id),
    metadata: { representation: "native-katex" }
  }));
  const targetSelectors = presentation.targetSelectorIds.map((id) => ({
    id,
    kind: selectorKind(id),
    label: selectorLabel(id),
    metadata: { representation: "native-katex" }
  }));
  const objects = [
    createKpSemanticAssetObject({
      id: semantic.source.stateId,
      objectType: "equation",
      title: "Logarithm in base two",
      value: Object.freeze({ latex: "\\log_{2}(7)", stateKind: "source" }),
      selectors: sourceSelectors,
      metadata: {
        latex: "\\log_{2}(7)",
        settledEndpointAuthority: "native-katex"
      }
    }),
    createKpSemanticAssetObject({
      id: semantic.target.stateId,
      objectType: "equation",
      title: "Natural-log quotient",
      value: Object.freeze({
        latex: "\\frac{\\ln(7)}{\\ln(2)}",
        stateKind: "target"
      }),
      selectors: targetSelectors,
      metadata: {
        latex: "\\frac{\\ln(7)}{\\ln(2)}",
        settledEndpointAuthority: "native-katex"
      }
    })
  ];
  const transformation = createKpSemanticTransformation({
    id: semantic.id,
    transformType: "changeLogarithmBase",
    title: "Rewrite a base-two logarithm using natural logarithms",
    sourceObjectIds: [semantic.source.stateId],
    targetObjectIds: [semantic.target.stateId],
    preserves: ["identity", "value", "role"],
    correspondenceMap: {
      id: "correspondence.logarithm.change-of-base.two-seven-natural",
      records: [
        ...semantic.correspondence
          .filter((record) =>
            record.id !== "correspondence.change-of-base.quotient"
          )
          .map((record) => ({
          id: record.id,
          relation: record.relation === "derivation"
            ? "fan-out" as const
            : record.relation,
          sourceSelectorIds: record.sourceEntityIds,
          targetSelectorIds: record.targetEntityIds,
          summary: record.summary
        })),
        {
          id: "correspondence.change-of-base.target-enclosures",
          relation: "introduction" as const,
          sourceSelectorIds: [],
          targetSelectorIds: presentation.forwardReception.branches.flatMap(
            ({ enclosureEntityRoles }) => enclosureEntityRoles.map(
              ({ entityId }) => entityId
            )
          ),
          summary: "Each derived natural logarithm receives its own enclosure."
        }
      ]
    },
    correspondence: presentation.identityTransfers.map((transfer) => ({
      sourceSelectorId: transfer.sourceEntityId,
      targetSelectorId: transfer.targetEntityId,
      preserves: ["identity", "value", "role"],
      summary: `Preserve ${transfer.destinationRole}.`
    })),
    assumptions: Object.values(semantic.domainEvidence),
    lawRefs: [{
      id: semantic.lawAuthority.id,
      level: "strict",
      summary: "For b positive and not one, log base b of x equals ln(x) divided by ln(b)."
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
  const timelineId = `timeline.${kpLogarithmChangeOfBaseExemplarId}`;
  const renderTargetId = "render.logarithm.change-of-base.equation";
  return createKpAnimationAsset({
    id: kpLogarithmChangeOfBaseExemplarId,
    title: "Change logarithm base",
    bundle: createKpAssetBundle({
      id: "asset.logarithm.change-of-base.two-seven-natural",
      title: "Change log base two of seven to natural logarithms",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 5_400,
      beatCount: 108,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.logarithm.change-of-base",
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
        "Transfer the argument and base into a native natural-log quotient."
    }],
    checks: [{
      id: "check.logarithm-change-of-base.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpLogarithmChangeOfBaseExemplarId
    }, {
      id: "check.logarithm-change-of-base.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.logarithm-change-of-base.frames",
      kind: "frame-sequence",
      artifactId: "artifact.logarithm-change-of-base.frames"
    }],
    dashboard: {
      rowId: "exemplar-equation-logarithm-change-of-base-v1",
      tags: ["algebra", "animation", "equation", "katex", "logarithm"],
      sourceRefIds: [semantic.lawAuthority.id]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.logarithm-change-of-base",
      presentationPlanId: presentation.id,
      settledEndpointAuthority: "native-katex",
      summary:
        "A checkpoint exemplar for semantic identity across logarithm bases."
    }
  });
}

function selectorKind(id: string): string {
  if (id.endsWith(".division")) return "fraction-bar";
  if (id.endsWith(".open") || id.endsWith(".close")) return "delimiter";
  if (id.endsWith(".operator")) return "function-operator";
  if (id.includes("argument") || id.endsWith(".base")) return "number";
  return "expression";
}

function selectorLabel(id: string): string {
  if (id.endsWith(".division")) return "structural:frac-line";
  if (id.endsWith(".open")) return "(";
  if (id.endsWith(".close")) return ")";
  if (id.endsWith(".operator")) return id.startsWith("source.") ? "log" : "ln";
  if (id.includes("seven")) return "7";
  if (id.endsWith(".base") || id.includes("two")) return "2";
  return id;
}
