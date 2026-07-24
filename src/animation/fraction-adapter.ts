import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createGeneratedFractionExpressionTutorialFixture,
  type GeneratedFractionExpressionTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  getGeneratedFractionExpressionTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";

export const defaultFractionSimplificationFixtureId =
  "generated.fraction-expression.two-fourths";

export function createFractionSimplificationAnimationAsset(
  fixtureId: string = defaultFractionSimplificationFixtureId
): KpAnimationAsset {
  const fixture = createFractionExpressionFixture(fixtureId);
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
  const mergeTransformationId = `transform.${fixture.id}.merge-common-factor`;

  return createKpAnimationAsset({
    id: animationId,
    title: fixture.title,
    bundle: fixture.bundle,
    transformations: fixture.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: `focus.${fixture.id}.common-factor`,
          kind: "focus",
          targetNodeId: mergeTransformationId,
          placement: "during",
          selectorIds: [
            `expression.${fixture.id}.factored.common-numerator-factor`,
            `expression.${fixture.id}.factored.common-denominator-factor`
          ]
        },
        {
          id: `pause.${fixture.id}.merge-common-factor`,
          kind: "pause",
          targetNodeId: mergeTransformationId,
          placement: "after",
          durationBeats: 1
        }
      ]
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
      tags: ["animation", "equation", "fraction", "generated"],
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

function createFractionExpressionFixture(
  fixtureId: string
): GeneratedFractionExpressionTutorialFixture {
  const spec = getGeneratedFractionExpressionTutorialFixtureSpec(fixtureId);

  if (spec === undefined) {
    throw new Error(
      `Unknown generated fraction-expression fixture: ${fixtureId}`
    );
  }

  return createGeneratedFractionExpressionTutorialFixture(spec);
}
