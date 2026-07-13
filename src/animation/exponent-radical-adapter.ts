import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  getGeneratedExponentTutorialFixtureSpec,
  getGeneratedRadicalTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedExponentTutorialFixture,
  createGeneratedRadicalTutorialFixture,
  type GeneratedExponentTutorialFixture,
  type GeneratedRadicalTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

export const defaultExponentExpansionFixtureId =
  "generated.exponent.square-as-product";

export const defaultExponentRadicalRewriteFixtureId =
  "generated.radical.square-root-as-power";

type GeneratedExponentRadicalFixture =
  | GeneratedExponentTutorialFixture
  | GeneratedRadicalTutorialFixture;

export function createExponentExpansionAnimationAsset(
  fixtureId: string = defaultExponentExpansionFixtureId
): KpAnimationAsset {
  const spec = getGeneratedExponentTutorialFixtureSpec(fixtureId);

  if (spec === undefined) {
    throw new Error(`Unknown generated exponent fixture: ${fixtureId}`);
  }

  return createGeneratedEquationAnimationAsset({
    fixture: createGeneratedExponentTutorialFixture(spec),
    tags: ["animation", "equation", "exponent", "generated"]
  });
}

export function createExponentRadicalRewriteAnimationAsset(
  fixtureId: string = defaultExponentRadicalRewriteFixtureId
): KpAnimationAsset {
  const spec = getGeneratedRadicalTutorialFixtureSpec(fixtureId);

  if (spec === undefined) {
    throw new Error(`Unknown generated radical fixture: ${fixtureId}`);
  }

  return createGeneratedEquationAnimationAsset({
    fixture: createGeneratedRadicalTutorialFixture(spec),
    tags: ["animation", "equation", "radical", "generated"]
  });
}

function createGeneratedEquationAnimationAsset(input: {
  readonly fixture: GeneratedExponentRadicalFixture;
  readonly tags: readonly string[];
}): KpAnimationAsset {
  const { fixture } = input;
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
      tags: input.tags,
      sourceRefIds: [fixture.id, fixture.trace.id]
    },
    metadata: {
      sourceFixtureId: fixture.id,
      sourceFixtureFamilyId: fixture.familyId,
      sourceTraceId: fixture.trace.id
    }
  });
}
