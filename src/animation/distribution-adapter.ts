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
      sourceRefIds: [fixture.id, fixture.trace.id]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceFixtureId: fixture.id,
      sourceFixtureFamilyId: fixture.familyId,
      sourceTraceId: fixture.trace.id
    }
  });
}
