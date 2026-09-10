import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  getGeneratedDistributionTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedDistributionTutorialFixture,
  type GeneratedDistributionTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import { isKpVerifiedCommonFactorRewrite, type KpVerifiedCommonFactorRewrite } from "../semantic/common-factor-rewrite.ts";
import type { KpVerifiedComposedFactoring } from "../semantic/composed-algebra-factoring.ts";
import { projectKpIntegerMultipleFactoring } from "../semantic/integer-multiple-factoring-projection.ts";
import { createKpAssetBundle, type KpAssetMetadataValue } from "../semantic/asset.ts";

export class KpCommonFactorPresentationGap extends Error {
  readonly code = "unsupported-presentation";
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

/** Existing fixture consumers retain their API. Authored factoring enters the
 * same constructor only through the distributive-law proof boundary. */
export function createVerifiedCommonFactorAnimationAsset(proof: KpVerifiedCommonFactorRewrite): KpAnimationAsset {
  if (!isKpVerifiedCommonFactorRewrite(proof)) throw new TypeError("Factoring paint requires an authenticated rewrite, not a candidate.");
  // The established template uses juxtaposition, not an explicit product glyph.
  // Numeric addends would concatenate digits or reverse conventional notation.
  if (proof.addends.some(atom => atom.kind !== "symbol"))
    throw new KpCommonFactorPresentationGap("The existing factoring mechanism requires symbolic addends; numeric addends need an explicit-product presentation mechanism.");
  const spelling = (atom: KpVerifiedCommonFactorRewrite["factor"]) => atom.kind === "symbol" ? atom.name : String(atom.value);
  return createGeneratedDistributionAnimationAsset(createGeneratedDistributionTutorialFixture({
    familyId: "generated.distribution", id: `authored.common-factor.${proof.revisionId.slice(7)}`,
    title: "Factor a common scalar", direction: "factor", factor: spelling(proof.factor),
    leftTerm: spelling(proof.addends[0]), rightTerm: spelling(proof.addends[1])
  }));
}

export const defaultDistributionExpansionFixtureId =
  "generated.distribution.expand-a-sum";

export const defaultDistributionFactoringFixtureId =
  "generated.distribution.factor-common-a";

export function createDistributionExpansionAnimationAsset(
  fixtureId: string = defaultDistributionExpansionFixtureId
): KpAnimationAsset {
  return createDistributionAnimationAsset(fixtureId, "distribute");
}

export function createDistributionFactoringAnimationAsset(
  fixtureId: string = defaultDistributionFactoringFixtureId
): KpAnimationAsset {
  return createDistributionAnimationAsset(fixtureId, "factor");
}

function createDistributionAnimationAsset(
  fixtureId: string,
  direction: "distribute" | "factor"
): KpAnimationAsset {
  const spec = getGeneratedDistributionTutorialFixtureSpec(fixtureId);

  if (spec === undefined) {
    throw new Error(`Unknown generated distribution fixture: ${fixtureId}`);
  }

  if (spec.direction !== direction) {
    throw new Error(
      `Expected generated distribution ${direction} fixture, received ${spec.direction}.`
    );
  }

  return createGeneratedDistributionAnimationAsset(
    createGeneratedDistributionTutorialFixture(spec)
  );
}

function createGeneratedDistributionAnimationAsset(
  fixture: GeneratedDistributionTutorialFixture
): KpAnimationAsset {
  return createDistributionSemanticAnimation({ ...fixture, sourceRefIds: [fixture.id, fixture.trace.id],
    metadata: { sourceFixtureId: fixture.id, sourceFixtureFamilyId: fixture.familyId, sourceTraceId: fixture.trace.id } });
}

function createDistributionSemanticAnimation(
  fixture: Pick<GeneratedDistributionTutorialFixture, "id" | "title" | "bundle" | "transformations"> & {
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
