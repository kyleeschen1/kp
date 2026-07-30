import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
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
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  kpPlaceValueAdditionPreservationManifest as manifest
} from "../reader/compiler/place-value-addition-preservation-manifest.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  createKpPlaceValueAdditionTrace
} from "../semantic/place-value-addition-trace.ts";

export const kpPlaceValueAdditionAnimationId =
  "animation.place-value-addition.278-plus-156";

/**
 * Projects the sealed place-value trace into the generic asset catalog. The
 * asset describes identity and sequencing only; the lazy surface adapter owns
 * no mathematical or choreography authority of its own.
 */
export function createKpPlaceValueAdditionAnimationAsset():
KpAnimationAsset {
  const trace = createKpPlaceValueAdditionTrace();
  const objects = trace.states.map((state, stateIndex) => {
    const beat = trace.beats[stateIndex]!;
    return createKpSemanticAssetObject({
      id: state.id,
      objectType: "place-value-addition-state",
      title: reference.beats[stateIndex]!.primaryAction,
      value: Object.freeze({
        traceId: trace.id,
        stage: state.stage,
        exactValue: state.resolvedExactValue.toString()
      }),
      selectors: [...new Set([
        ...beat.contributorIds,
        ...beat.outputIds
      ])].map((entityId) => ({
        id: `${state.id}.${entityId}`,
        kind: "place-value-entity",
        label: entityId
      }))
    });
  });
  const transformations = trace.beats.slice(1).map((beat, beatIndex) => {
    const sourceObjectId = beat.fromStateId;
    if (sourceObjectId === undefined) {
      throw new Error(
        `Place-value transition ${beat.id} requires a source state.`
      );
    }
    return createKpSemanticTransformation({
      id: beat.id,
      transformType: beat.operation,
      title: reference.beats[beatIndex + 1]!.primaryAction,
      sourceObjectIds: [sourceObjectId],
      targetObjectIds: [beat.toStateId],
      preserves: ["identity", "value", "structure"],
      lawRefs: [{
        id: "place-value-addition.exact-conservation",
        level: "strict",
        summary:
          "Column evaluation and adjacent-place exchange preserve 278 + 156."
      }]
    });
  });
  const root = createSemanticTransformationSequence({
    id: "animation-tree.place-value-addition.278-plus-156",
    label: "Add 278 and 156 by place value",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      }))
    )
  });
  const timelineId =
    "timeline.place-value-addition.278-plus-156.shared";
  const renderTargetId =
    "render.place-value-addition.278-plus-156.synchronized";

  return createKpAnimationAsset({
    id: kpPlaceValueAdditionAnimationId,
    title: "Add 278 + 156 by place value",
    bundle: createKpAssetBundle({
      id: "bundle.place-value-addition.278-plus-156",
      title: "Place-value addition: 278 + 156",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: reference.defaultDurationMs,
      beatCount: reference.beats.length,
      markerIds: reference.beats.map(({ id }) => id)
    },
    layout: {
      id: "layout.place-value-addition.278-plus-156",
      kind: "grid",
      targetId: renderTargetId,
      metadata: {
        widePolicy: "written-and-base-ten",
        phonePolicy: "select-one-view"
      }
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "diagram",
      objectIds: objects.map(({ id }) => id),
      transformationIds: transformations.map(({ id }) => id),
      timelineId,
      summary:
        "One synchronized written algorithm and base-ten projection."
    }],
    checks: [
      {
        id: "check.place-value-addition.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: kpPlaceValueAdditionAnimationId
      },
      {
        id: "check.place-value-addition.exact-conservation",
        lawId: "place-value-addition.exact-conservation",
        level: "strict",
        targetId: kpPlaceValueAdditionAnimationId
      }
    ],
    exportTargets: [{
      id: "export.place-value-addition.static-step",
      kind: "static-step",
      artifactId: "artifact.place-value-addition.static-checkpoints"
    }],
    dashboard: {
      rowId: "animation-place-value-addition-278-plus-156",
      tags: [
        "animation",
        "arithmetic",
        "place-value",
        "regrouping",
        "multi-representation",
        "reviewable"
      ],
      sourceRefIds: [trace.id, manifest.stablePromotionId]
    },
    metadata: {
      sourceTraceId: trace.id,
      summary:
        "Add 278 and 156 column by column, carrying regrouped units into the next place.",
      canonicalHost: "editor-animation-library",
      lazyCapabilityPack: "place-value"
    }
  });
}
