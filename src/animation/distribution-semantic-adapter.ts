import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createEditableSemanticTransformationTree, createSemanticTransformationLeaf, createSemanticTransformationSequence } from "../semantic/transformation-composition.ts";
import { createKpSemanticMaterialEquationPresentationProfileV1 } from "./equation-presentation-profile.ts";
import { createKpAssetBundle, type KpAssetBundle, type KpAssetMetadataValue } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import type { KpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import { projectKpIntegerMultipleFactoring } from "../semantic/integer-multiple-factoring-projection.ts";
import type { KpVerifiedComposedDistribution } from "../semantic/composed-algebra-distribution.ts";
import { projectKpComposedDistribution } from "../semantic/composed-algebra-distribution-projection.ts";
import { projectKpDistributionBeforeCollection, type KpDistributionBeforeCollection } from "../semantic/distribute-collect.ts";

// Proof-driven callers and historical fixtures share this exact asset/profile/
// timeline constructor. Fixture selection belongs to the compatibility adapter.
export function createDistributionBeforeCollectionAnimation(proof: KpDistributionBeforeCollection): KpAnimationAsset {
  const projection = projectKpDistributionBeforeCollection(proof), id = `authored.distribute-collect.${proof.revisionId.slice(7)}`;
  return createDistributionSemanticAnimation({ id, title: "Distribute to both occurrences",
    bundle: createKpAssetBundle({ id: `asset.${id}`, title: "Distribute then collect", objects: projection.endpoints.map(e => e.object) }),
    transformations: [projection.transformation], sourceRefIds: [proof.revisionId], metadata: { sourceProofRevision: proof.revisionId } });
}

export function createVerifiedComposedDistributionAnimationAsset(proof: KpVerifiedComposedDistribution): KpAnimationAsset {
  const projection = projectKpComposedDistribution(proof), id = `authored.distribution.${proof.revisionId.slice(7)}`;
  return createDistributionSemanticAnimation({ id, title: "Account for every contribution",
    bundle: createKpAssetBundle({ id: `asset.${id}`, title: "Distribute a counted group", objects: projection.endpoints.map(e => e.object) }),
    transformations: [projection.transformation], sourceRefIds: [proof.revisionId], metadata: { sourceProofRevision: proof.revisionId } });
}

/** New proof families enter the same asset/profile/timeline constructor. The
 * semantic owner supplies lineage; this adapter supplies no alternate motif. */
export function createVerifiedIntegerMultipleFactoringAnimationAsset(proof: KpVerifiedComposedFactoring): KpAnimationAsset {
  const projection = projectKpIntegerMultipleFactoring(proof);
  const id = `authored.integer-multiple.${proof.revisionId.slice(7)}`;
  return createDistributionSemanticAnimation({ id, title: "Factor integer multiples",
    bundle: createKpAssetBundle({ id: `asset.${id}`, title: "Factor integer multiples", objects: projection.endpoints.map(e => e.object) }),
    transformations: [projection.transformation], sourceRefIds: [proof.revisionId],
    metadata: { sourceProofRevision: proof.revisionId } });
}

export function createDistributionSemanticAnimation(
  fixture: { readonly id: string; readonly title: string; readonly bundle: KpAssetBundle; readonly transformations: readonly KpSemanticTransformation[] } & {
    readonly sourceRefIds: readonly string[];
    readonly metadata: Readonly<Record<string, KpAssetMetadataValue>>;
  }
): KpAnimationAsset {
  const animationId = `animation.${fixture.id}`;
  const timelineId = `timeline.${fixture.id}.shared`;
  const renderTargetId = `render.${fixture.id}.expression`;
  const transformationIds = fixture.transformations.map(
    (transformation) => transformation.id
  );
  const objectIds = fixture.bundle.objects.map((object) => object.id);
  const treeRoot = createSemanticTransformationSequence({
    id: `diagram.${fixture.id}.animation-sequence`,
    label: `${fixture.title} animation sequence`,
    children: fixture.transformations.map((transformation) =>
      createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      )
    )
  });

  return createKpAnimationAsset({
    id: animationId,
    title: fixture.title,
    bundle: fixture.bundle,
    transformations: fixture.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot
    }),
    timeline: {
      id: timelineId,
      durationMs: 2400,
      beatCount: 50
    },
    layout: {
      id: `layout.${fixture.id}.animation`,
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [
      {
        id: renderTargetId,
        kind: "equation",
        objectIds,
        transformationIds,
        timelineId
      }
    ],
    checks: [
      {
        id: `check.${fixture.id}.animation.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: `check.${fixture.id}.animation.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      }
    ],
    exportTargets: [
      {
        id: `export.${fixture.id}.frames`,
        kind: "frame-sequence",
        artifactId: `artifact.${fixture.id}.gif.frames`
      }
    ],
    dashboard: {
      rowId: `animation-${fixture.id.replaceAll(".", "-")}`,
      tags: ["animation", "equation", "distribution", "generated"],
      sourceRefIds: fixture.sourceRefIds
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      ...fixture.metadata
    }
  });
}
