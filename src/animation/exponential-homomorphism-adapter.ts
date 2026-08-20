import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createKpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  kpCanonicalExponentialHomomorphismAuthority,
  kpCanonicalExponentialHomomorphismLatex
} from "../semantic/exponential-homomorphism-exemplar.ts";

export const kpExponentialHomomorphismAnimationId =
  "animation.algebra.exponential-homomorphism.sum-to-product" as const;

const KP_EXPONENTIAL_HOMOMORPHISM_DURATION_MS = 4_800;
const KP_EXPONENTIAL_HOMOMORPHISM_BEAT_COUNT = 96;

export function createKpExponentialHomomorphismAnimationAsset():
KpAnimationAsset {
  const authority = kpCanonicalExponentialHomomorphismAuthority;
  const sourceObjectId = "state.exponential.sum-to-product.source";
  const targetObjectId = "state.exponential.sum-to-product.target";
  const objects = [
    equationObject(sourceObjectId, "Power with an additive exponent",
      kpCanonicalExponentialHomomorphismLatex.source, "source",
      authority.sourceOccurrenceIds),
    equationObject(targetObjectId, "Product of powers",
      kpCanonicalExponentialHomomorphismLatex.target, "target",
      authority.targetOccurrenceIds)
  ];
  const transformation = createKpSemanticTransformation({
    id: "transformation.exponential.sum-to-product.xy",
    transformType: "operation.equation.exponential-sum-to-product.v1",
    title: "Distribute a power over an additive exponent",
    sourceObjectIds: [sourceObjectId],
    targetObjectIds: [targetObjectId],
    preserves: ["identity", "structure", "value", "role"],
    correspondenceMap: authority.correspondenceMap,
    lawRefs: [{
      id: authority.lawId,
      level: "strict",
      summary: "b^(x+y) equals b^x b^y for the declared real domain."
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
  const timelineId = `timeline.${kpExponentialHomomorphismAnimationId}`;
  const renderTargetId = "render.exponential.sum-to-product.equation";

  return createKpAnimationAsset({
    id: kpExponentialHomomorphismAnimationId,
    title: "Turn an exponential sum into a product",
    bundle: createKpAssetBundle({
      id: "asset.exponential.sum-to-product.xy",
      title: "Exponential sum-to-product law",
      objects
    }),
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: KP_EXPONENTIAL_HOMOMORPHISM_DURATION_MS,
      beatCount: KP_EXPONENTIAL_HOMOMORPHISM_BEAT_COUNT,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.exponential.sum-to-product",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)),
      transformationIds: [transformation.id],
      timelineId,
      summary:
        "Preserve x and y while one base derives two power applications."
    }],
    checks: [{
      id: "check.exponential.sum-to-product.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpExponentialHomomorphismAnimationId
    }, {
      id: "check.exponential.sum-to-product.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.exponential.sum-to-product.frames",
      kind: "frame-sequence",
      artifactId: "artifact.exponential.sum-to-product.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-exponential-sum-to-product",
      tags: ["algebra", "animation", "equation", "exponential", "katex"],
      sourceRefIds: [authority.lawId]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.equation.exponential-homomorphism.v1",
      settledEndpointAuthority: "native-katex",
      fallbackEndpoint: kpCanonicalExponentialHomomorphismLatex.source,
      summary:
        "A typed Native KaTeX exemplar for exponential homomorphism."
    }
  });
}

function equationObject(
  id: string,
  title: string,
  latex: string,
  endpoint: "source" | "target",
  occurrenceIds: readonly string[]
) {
  const occurrenceById = new Map(
    kpCanonicalExponentialHomomorphismAuthority.occurrences.map(
      (occurrence) => [occurrence.id, occurrence] as const
    )
  );
  return createKpSemanticAssetObject({
    id,
    objectType: "equation",
    title,
    value: Object.freeze({ latex, endpoint }),
    selectors: occurrenceIds.map((occurrenceId) => {
      const occurrence = occurrenceById.get(occurrenceId);
      if (occurrence === undefined) {
        throw new Error(`Missing exponential occurrence ${occurrenceId}.`);
      }
      return {
        id: occurrence.id,
        kind: occurrence.role,
        label: `${occurrence.role} ${occurrence.ordinal + 1}`,
        metadata: {
          semanticId: occurrence.referentId,
          representation: "native-katex"
        }
      };
    }),
    metadata: {
      latex,
      semanticStateId: id,
      settledEndpointAuthority: "native-katex"
    }
  });
}
