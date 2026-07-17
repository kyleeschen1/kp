import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import type {
  GeneratedProblemAnimationFixture
} from "../semantic/generated-problem-fixture.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import { matrixVectorSemanticDurationMs } from "./matrix-vector-duration-contract.ts";

export function createGeneratedProblemAnimationAsset(
  fixture: GeneratedProblemAnimationFixture
): KpAnimationAsset {
  const animationId = `animation.${fixture.id}`;
  const timelineId = `timeline.${fixture.id}.shared`;
  const renderTargetId = `render.${fixture.id}.equation`;
  const transformationIds = fixture.transformations.map(
    (transformation) => transformation.id
  );
  const objectIds = fixture.bundle.objects.map((object) => object.id);
  const durationMs = generatedProblemDurationMs(fixture);
  const treeRoot = createSemanticTransformationSequence({
    id: `diagram.${fixture.id}.generated-problem-animation`,
    label: `${fixture.title} generated problem animation`,
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
    ),
    summary:
      "Generated solution steps become a seekable AnimationAsset without changing semantic fixture identity."
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
      durationMs,
      beatCount: 50
    },
    layout: {
      id: `layout.${fixture.id}.generated-problem-animation`,
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
        id: `check.${fixture.id}.generated-problem-animation.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: `check.${fixture.id}.generated-problem-animation.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      }
    ],
    exportTargets: [
      {
        id: `export.${fixture.id}.generated-problem-frames`,
        kind: "frame-sequence",
        artifactId: `artifact.${fixture.id}.generated-problem.frames`
      }
    ],
    dashboard: {
      rowId: `animation-${fixture.id.replaceAll(".", "-")}`,
      tags: ["animation", "generated-problem", fixture.familyId],
      sourceRefIds: [fixture.id, fixture.trace.id]
    },
    metadata: {
      generatedProblemImport: true,
      sourceFixtureId: fixture.id,
      sourceFixtureFamilyId: fixture.familyId,
      sourceTraceId: fixture.trace.id
    }
  });
}

function generatedProblemDurationMs(fixture: GeneratedProblemAnimationFixture): number {
  const rowCount = generatedProblemMatrixVectorRowCount(fixture);
  return rowCount === undefined ? 2_400 : matrixVectorSemanticDurationMs(rowCount);
}

export function generatedProblemMatrixVectorRowCount(
  fixture: GeneratedProblemAnimationFixture
): number | undefined {
  const transformation = fixture.transformations.find(
    (candidate) => candidate.transformType === "multiplyMatrixVector"
  );
  if (transformation === undefined) return undefined;
  const source = fixture.bundle.objects.find(
    (object) => object.id === transformation.sourceObjectIds[0]
  );
  const rows = typeof source?.value === "object" && source.value !== null
    ? (source.value as Record<string, unknown>)["matrixRows"]
    : undefined;
  if (!Array.isArray(rows)) {
    throw new Error("Matrix-vector animation duration requires authored matrix rows.");
  }
  return rows.length;
}
