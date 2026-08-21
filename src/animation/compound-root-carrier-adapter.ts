import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpAnimationPresentationConstraintsV1
} from "./presentation-constraints.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from
  "../semantic/animation.ts";
import {
  createKpCompoundRootCarrierExemplar
} from "../semantic/compound-root-carrier-exemplar.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

export const kpCompoundRootCarrierAnimationId =
  "animation.algebra.radical.compound-carrier-normalization" as const;

const DURATION_MS = 4_800;
const BEAT_COUNT = 96;

export function createKpCompoundRootCarrierAnimationAsset():
  KpAnimationAsset {
  const exemplar = createKpCompoundRootCarrierExemplar();
  const [source, target] = exemplar.states;
  const objects = exemplar.states.map((state) =>
    createKpSemanticAssetObject({
      id: state.id,
      objectType: "equation",
      title: state.kind === "radical-perfect-square"
        ? "Compound perfect square under a radical"
        : "Absolute value of the compound carrier",
      value: Object.freeze({ latex: state.latex, stateKind: state.kind }),
      selectors: state.kind === "radical-perfect-square"
        ? [
            selector(state.radical.entityId, "radical", "\\sqrt{}",
              state.radical.semanticId),
            selector(state.grouping.entityId, "enclosure", "(\\ldots)",
              state.grouping.semanticId),
            selector(state.exponent.entityId, "exponent", "2",
              state.exponent.semanticId),
            ...carrierSelectors(state.carrier)
          ]
        : [
            selector(state.leadingDelimiter.entityId, "enclosure-leading",
              "\\lvert", state.leadingDelimiter.semanticId),
            ...carrierSelectors(state.carrier),
            selector(state.trailingDelimiter.entityId, "enclosure-trailing",
              "\\rvert", state.trailingDelimiter.semanticId)
          ],
      metadata: {
        latex: state.latex,
        semanticStateId: state.id,
        settledEndpointAuthority: "native-katex"
      }
    })
  );
  const transformation = createKpSemanticTransformation({
    id: exemplar.plan.id,
    transformType: exemplar.plan.operationClass,
    title: "Normalize an even root while preserving its compound carrier",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["identity", "structure", "value", "role"],
    correspondence: [
      correspondence(source.carrier.occurrence.entityId,
        target.carrier.occurrence.entityId),
      ...source.carrier.children.map((child, index) =>
        correspondence(
          child.occurrence.entityId,
          target.carrier.children[index]!.occurrence.entityId
        )
      )
    ],
    lawRefs: [{
      id: exemplar.lawAuthority.id,
      level: "strict",
      summary:
        "For a real carrier u, the principal square root of u squared is |u|."
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
  const timelineId = `timeline.${kpCompoundRootCarrierAnimationId}`;
  const renderTargetId =
    "render.root.compound-carrier-normalization.equation";

  return createKpAnimationAsset({
    id: kpCompoundRootCarrierAnimationId,
    title: "Preserve x + 1 through an even root",
    bundle: createKpAssetBundle({
      id: "asset.root.compound-carrier-normalization",
      title: "Compound root carrier normalization exemplar",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: DURATION_MS,
      beatCount: BEAT_COUNT,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.root.compound-carrier-normalization",
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
        "Withdraw the evaluated root syntax, keep x + 1 opaque and intact, " +
        "then receive it inside absolute-value bars."
    }],
    checks: [{
      id: "check.root.compound-carrier.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpCompoundRootCarrierAnimationId
    }, {
      id: "check.root.compound-carrier.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: transformation.id
    }],
    exportTargets: [{
      id: "export.root.compound-carrier.frames",
      kind: "frame-sequence",
      artifactId: "artifact.root.compound-carrier.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-radical-compound-carrier-normalization",
      tags: [
        "absolute-value", "algebra", "animation", "compound", "katex",
        "radical", "root"
      ],
      sourceRefIds: [exemplar.lawAuthority.id, exemplar.plan.id]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    presentationConstraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: [
        "accessibility", "direct-seek", "responsive", "rewind"
      ]
    }),
    metadata: {
      semanticExemplarId: exemplar.id,
      settledEndpointAuthority: "native-katex",
      fallbackEndpoint: source.latex,
      rootRewriteClass: exemplar.plan.operationClass,
      reviewStatus: "visual-checkpoint-candidate",
      summary:
        "A compound-carrier checkpoint for sqrt((x+1)^2) to |x+1|."
    }
  });
}

function carrierSelectors(
  carrier: ReturnType<typeof createKpCompoundRootCarrierExemplar>["states"][number]["carrier"]
) {
  return [
    selector(carrier.occurrence.entityId, "carrier", "x+1",
      carrier.occurrence.semanticId),
    ...carrier.children.map((child) => selector(
      child.occurrence.entityId,
      child.occurrence.subtreeKind,
      child.occurrence.semanticId === "semantic.variable.x"
        ? "x"
        : child.occurrence.semanticId === "semantic.operator.plus"
          ? "+"
          : "1",
      child.occurrence.semanticId
    ))
  ];
}

function selector(
  id: string,
  kind: string,
  label: string,
  semanticId: string
) {
  return Object.freeze({
    id,
    kind,
    label,
    metadata: Object.freeze({ semanticId, representation: "native-katex" })
  });
}

function correspondence(sourceSelectorId: string, targetSelectorId: string) {
  return Object.freeze({
    sourceSelectorId,
    targetSelectorId,
    preserves: ["identity", "structure", "value", "role"] as const
  });
}
