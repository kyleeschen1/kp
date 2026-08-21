import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalFiniteSumExpansionPresentationPlan
} from "./finite-sum-expansion-presentation-plan.ts";
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
  KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
  KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID,
  KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
  KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID,
  kpCanonicalFiniteSumExpansionOperation
} from "../semantic/canonical-finite-sum-expansion.ts";

export const kpFiniteSumExpansionExemplarId =
  "animation.equation.finite-sum-expansion.v1" as const;

export function createKpFiniteSumExpansionExemplarAsset(): KpAnimationAsset {
  const operation = kpCanonicalFiniteSumExpansionOperation;
  const source = operation.source.semantic;
  const sourceReference = source.body.references[0]!;
  const endpointDefinitions = [{
    stateId: KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID,
    stateKind: "source" as const,
    title: "Finite sum notation",
    latex: KP_CANONICAL_FINITE_SUM_SOURCE_LATEX,
    selectors: [
      source.operator,
      source.binder,
      source.lowerBound,
      source.upperBound,
      source.body,
      sourceReference
    ].map(({ id, role }) => ({ id, role }))
  }, {
    stateId: KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID,
    stateKind: "target" as const,
    title: "Expanded finite sum",
    latex: KP_CANONICAL_FINITE_SUM_TARGET_LATEX,
    selectors: [
      ...operation.target.instances.flatMap((instance) => [
        { id: instance.id, role: instance.role },
        {
          id: instance.references[0]!.id,
          role: instance.references[0]!.role
        }
      ]),
      ...operation.target.connectors.map(({ id, role }) => ({ id, role }))
    ]
  }];
  const objects = endpointDefinitions.map((endpoint) =>
    createKpSemanticAssetObject({
      id: endpoint.stateId,
      objectType: "equation",
      title: endpoint.title,
      value: Object.freeze({
        latex: endpoint.latex,
        stateKind: endpoint.stateKind
      }),
      selectors: endpoint.selectors.map((node) => ({
        id: node.id,
        kind: node.role,
        label: node.role,
        metadata: { representation: "native-katex" }
      })),
      metadata: {
        latex: endpoint.latex,
        settledEndpointAuthority: "native-katex"
      }
    })
  );
  const transformation = createKpSemanticTransformation({
    id: "transformation.equation.finite-sum-expand.v1",
    transformType: "finiteBinderExpand",
    title: "Expand a bounded sum into its ordered terms",
    sourceObjectIds: [KP_CANONICAL_FINITE_SUM_SOURCE_STATE_ID],
    targetObjectIds: [KP_CANONICAL_FINITE_SUM_TARGET_STATE_ID],
    preserves: ["value", "structure", "role"],
    correspondenceMap: {
      id: "correspondence.finite-sum-expansion.canonical",
      records: [{
        id: "correspondence.finite-sum.body-template",
        relation: "fan-out",
        sourceSelectorIds: [operation.source.semantic.body.id],
        targetSelectorIds: operation.target.instances.map(({ id }) => id),
        summary: "Instantiate one body template at each ordered range value."
      }, {
        id: "correspondence.finite-sum.bound-reference",
        relation: "fan-out",
        sourceSelectorIds: [sourceReference.id],
        targetSelectorIds: operation.target.instances.map(
          ({ references }) => references[0]!.id
        ),
        summary: "Substitute each integer for the locally bound reference."
      }, {
        id: "correspondence.finite-sum.operator-connectors",
        relation: "fan-out",
        sourceSelectorIds: [operation.source.semantic.operator.id],
        targetSelectorIds: operation.target.connectors.map(({ id }) => id),
        summary: "Resolve summation syntax into additive connectors."
      }]
    },
    correspondence: operation.target.instances.map((instance) => ({
      sourceSelectorId: operation.source.semantic.body.id,
      targetSelectorId: instance.id,
      preserves: ["structure", "role"],
      summary: `Instantiate the body at index ${instance.indexValue}.`
    })),
    assumptions: [
      "The binder has verified local scope.",
      "The inclusive finite range is ordered and capture-free."
    ],
    lawRefs: [{
      id: operation.operation,
      level: "strict",
      summary: "A finite sum expands to one ordered body instance per bound value."
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
  const timelineId = `timeline.${kpFiniteSumExpansionExemplarId}`;
  const renderTargetId = "render.finite-sum-expansion.equation";
  return createKpAnimationAsset({
    id: kpFiniteSumExpansionExemplarId,
    title: "Expand a finite sum",
    bundle: createKpAssetBundle({
      id: "asset.finite-sum-expansion.canonical",
      title: "Sum from one to three of a sub i",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: 6_000,
      beatCount: 120,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.finite-sum-expansion",
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
        "Unfold one finite binder into three ordered body instances."
    }],
    checks: [{
      id: "check.finite-sum-expansion.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpFiniteSumExpansionExemplarId
    }, {
      id: "check.finite-sum-expansion.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.finite-sum-expansion.frames",
      kind: "frame-sequence",
      artifactId: "artifact.finite-sum-expansion.frames"
    }],
    dashboard: {
      rowId: "exemplar-equation-finite-sum-expansion-v1",
      tags: ["algebra", "animation", "equation", "katex", "sum"]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.equation.finite-binder-expansion.v1",
      presentationPlanId:
        kpCanonicalFiniteSumExpansionPresentationPlan.id,
      settledEndpointAuthority: "native-katex",
      maturity: "candidate-local-exemplar"
    }
  });
}
