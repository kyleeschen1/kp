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
import type { KpChoreographyLifecycle } from "./choreography-lifecycle.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";
import {
  compileKpRepresentationalLineageGraph
} from "./representational-lineage-compiler.ts";
import { resolveKpRadicalFragmentSemantics } from "../semantic/radical-fragment-semantics.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";

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

export function createExponentRadicalRepresentationalLineageFixture() {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const transformation = animation.transformations[0]!;
  const fragments = resolveKpRadicalFragmentSemantics(transformation);
  const sourceSelectorIds = fragments.notationRecords.flatMap(
    (record) => record.sourceSelectorIds
  );
  const targetSelectorIds = fragments.notationRecords.flatMap(
    (record) => record.targetSelectorIds
  );
  const sourceRepresentationId = `${transformation.sourceObjectIds[0]}.root-notation`;
  const targetRepresentationId = `${transformation.targetObjectIds[0]}.root-notation`;
  const lineageId = `${transformation.id}.representational-lineage`;
  const vocabulary: KpChoreographyVocabulary = {
    id: `${animation.id}.choreography-vocabulary`,
    continuants: [],
    representationalLineages: [{
      id: lineageId,
      meaning: "Rational exponent notation becomes radical notation without semantic identity.",
      sourceRepresentation: {
        entityId: sourceRepresentationId,
        selectorIds: sourceSelectorIds
      },
      targetRepresentation: {
        entityId: targetRepresentationId,
        selectorIds: targetSelectorIds
      },
      cause: {
        kind: "transformation",
        transformationId: transformation.id,
        correspondenceRecordIds: fragments.notationRecords.map((record) => record.id)
      }
    }],
    objectConstancy: [],
    materialContinuity: [{
      id: `${lineageId}.material-continuity`,
      mode: "shared-reconciliation",
      sourceEntityIds: sourceSelectorIds,
      targetEntityIds: targetSelectorIds,
      authorityRef: {
        kind: "representational-lineage",
        lineageId
      },
      summary: "Exponent material reconciles into the successor radical representation."
    }],
    motionClassifications: []
  };
  const lifecycle: KpChoreographyLifecycle = {
    id: `${animation.id}.choreography-lifecycle`,
    records: [{
      id: `${transformation.id}.root-notation-successor`,
      kind: "successor",
      representationalLineageId: lineageId,
      sourceEntityIds: sourceSelectorIds,
      targetEntityIds: targetSelectorIds,
      summary: "The rational exponent causally succeeds into radical notation."
    }]
  };
  return {
    animation,
    vocabulary,
    lifecycle,
    graph: compileKpRepresentationalLineageGraph({
      id: `${animation.id}.representational-lineage-graph`,
      vocabulary,
      lifecycle
    })
  };
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
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceFixtureId: fixture.id,
      sourceFixtureFamilyId: fixture.familyId,
      sourceTraceId: fixture.trace.id
    }
  });
}
