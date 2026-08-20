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
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import { kpExponentialQuotientPressureAuthority,
  kpExponentialQuotientPressureLatex } from
  "../semantic/exponential-quotient-pressure.ts";

export const kpExponentialQuotientPressureAnimationId =
  "animation.algebra.exponential-homomorphism.difference-to-quotient" as const;

const DURATION_MS = 4_800;
const BEAT_COUNT = 96;

export function createKpExponentialQuotientPressureAnimationAsset():
KpAnimationAsset {
  const authority = kpExponentialQuotientPressureAuthority;
  const sourceObjectId = "state.exponential.difference-to-quotient.source";
  const targetObjectId = "state.exponential.difference-to-quotient.target";
  const objects = [
    equationObject(sourceObjectId, "Power with a subtractive exponent",
      kpExponentialQuotientPressureLatex.source, "source",
      authority.sourceOccurrenceIds),
    equationObject(targetObjectId, "Quotient of powers",
      kpExponentialQuotientPressureLatex.target, "target",
      authority.targetOccurrenceIds)
  ];
  const transformation = createKpSemanticTransformation({
    id: "transformation.exponential.difference-to-quotient.ab",
    transformType:
      "operation.equation.exponential-difference-to-quotient.v1",
    title: "Distribute a power over a subtractive exponent",
    sourceObjectIds: [sourceObjectId],
    targetObjectIds: [targetObjectId],
    preserves: ["identity", "structure", "value", "role"],
    correspondenceMap: authority.correspondenceMap,
    lawRefs: [{
      id: authority.lawId,
      level: "strict",
      summary: "e^(a-b) equals e^a/e^b for the declared real domain."
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
  const timelineId = `timeline.${kpExponentialQuotientPressureAnimationId}`;
  const renderTargetId = "render.exponential.difference-to-quotient.equation";

  return createKpAnimationAsset({
    id: kpExponentialQuotientPressureAnimationId,
    title: "Turn an exponential difference into a quotient",
    bundle: createKpAssetBundle({
      id: "asset.exponential.difference-to-quotient.ab",
      title: "Exponential difference-to-quotient law",
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
      id: "layout.exponential.difference-to-quotient",
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
        "Preserve a and b while one base derives numerator and denominator powers."
    }],
    checks: [{
      id: "check.exponential.difference-to-quotient.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpExponentialQuotientPressureAnimationId
    }, {
      id: "check.exponential.difference-to-quotient.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.exponential.difference-to-quotient.frames",
      kind: "frame-sequence",
      artifactId: "artifact.exponential.difference-to-quotient.frames"
    }],
    dashboard: {
      rowId: "animation-algebra-exponential-difference-to-quotient",
      tags: ["algebra", "animation", "equation", "exponential", "katex",
        "quotient", "pressure"],
      sourceRefIds: [authority.lawId]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.equation.exponential-homomorphism.v1",
      settledEndpointAuthority: "native-katex",
      fallbackEndpoint: kpExponentialQuotientPressureLatex.source,
      reviewStatus: "pressure-caller",
      summary:
        "A typed Native KaTeX pressure caller for exponential quotient duality."
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
  const authority = kpExponentialQuotientPressureAuthority;
  const occurrenceById = new Map(authority.occurrences.map(
    (occurrence) => [occurrence.id, occurrence] as const
  ));
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
