import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createLinearSolveKpAssetBundle,
  createLinearSolveTeacherZeroKpAssetBundle,
  linearSolveAssetIds,
  type LinearSolveKpAsset
} from "../semantic/linear-solve-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

const linearSolveAnimationId = "animation.linear-solve.solve-x";
const linearSolveTimelineId = "timeline.linear-solve.shared";
const linearSolveRenderTargetId = "render.linear-solve.equation";
const linearSolveTransformationDefinitionIds: Readonly<Record<string, string>> = {
  "transform.linear-solve.subtract-both-sides-3":
    "definition.generated.linear-solve.subtract-both-sides",
  "transform.linear-solve.cancel-left-additive-inverse":
    "definition.generated.linear-solve.cancel-additive-inverses",
  "transform.linear-solve.expose-left-zero":
    "definition.generated.linear-solve.cancel-additive-inverses",
  "transform.linear-solve.simplify-right-difference":
    "definition.generated.linear-solve.simplify-constant-difference"
};

export function createLinearSolveAnimationAsset(): KpAnimationAsset {
  return createLinearSolveAnimationFromSource(createLinearSolveKpAssetBundle(), {
    animationId: linearSolveAnimationId,
    timelineId: linearSolveTimelineId,
    renderTargetId: linearSolveRenderTargetId,
    durationMs: 2400,
    beatCount: 50,
    cancelTransformationId: linearSolveAssetIds.cancel,
    dashboardRowId: "animation-linear-solve-solve-x"
  });
}

export function createLinearSolveTeacherZeroAnimationAsset(): KpAnimationAsset {
  return createLinearSolveAnimationFromSource(
    createLinearSolveTeacherZeroKpAssetBundle(),
    {
      animationId: "animation.linear-solve.solve-x.teacher-zero",
      timelineId: "timeline.linear-solve.teacher-zero",
      renderTargetId: "render.linear-solve.teacher-zero.equation",
      durationMs: 3000,
      beatCount: 62,
      cancelTransformationId: linearSolveAssetIds.exposeZero,
      dashboardRowId: "animation-linear-solve-solve-x-teacher-zero"
    }
  );
}

function createLinearSolveAnimationFromSource(
  source: LinearSolveKpAsset,
  config: {
    readonly animationId: string;
    readonly timelineId: string;
    readonly renderTargetId: string;
    readonly durationMs: number;
    readonly beatCount: number;
    readonly cancelTransformationId: string;
    readonly dashboardRowId: string;
  }
): KpAnimationAsset {
  const canonical = config.animationId === linearSolveAnimationId;
  const transformations = source.transformations.map(
    attachLinearSolveDefinitionId
  );
  const transformationIds = transformations.map((transformation) => transformation.id);
  const objectIds = source.bundle.objects.map((object) => object.id);
  const treeRoot = createSemanticTransformationSequence({
    id: canonical
      ? "diagram.linear-solve.sequence"
      : "diagram.linear-solve.teacher-zero.sequence",
    label: "Linear solve sequence",
    children: transformations.map((transformation) =>
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
    id: config.animationId,
    title: source.bundle.title,
    bundle: source.bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: canonical
            ? "pause.linear-solve.subtract"
            : "pause.linear-solve.teacher-zero.subtract",
          kind: "pause",
          targetNodeId: "transform.linear-solve.subtract-both-sides-3",
          placement: "after",
          durationBeats: 1
        },
        {
          id: canonical
            ? "focus.linear-solve.cancel"
            : "focus.linear-solve.teacher-zero.cancel",
          kind: "focus",
          targetNodeId: config.cancelTransformationId,
          placement: "during",
          selectorIds: [
            "equation.linear-solve.after-subtract.lhs.plus3",
            "equation.linear-solve.after-subtract.lhs.minus3"
          ]
        },
        {
          id: canonical
            ? "pause.linear-solve.cancel"
            : "pause.linear-solve.teacher-zero.cancel",
          kind: "pause",
          targetNodeId: config.cancelTransformationId,
          placement: "after",
          durationBeats: 1
        }
      ]
    }),
    timeline: {
      id: config.timelineId,
      durationMs: config.durationMs,
      beatCount: config.beatCount
    },
    layout: {
      id: canonical
        ? "layout.linear-solve.animation"
        : "layout.linear-solve.teacher-zero.animation",
      kind: "single",
      targetId: config.renderTargetId
    },
    renderTargets: [
      {
        id: config.renderTargetId,
        kind: "equation",
        objectIds,
        transformationIds,
        timelineId: config.timelineId
      }
    ],
    checks: [
      {
        id: canonical
          ? "check.linear-solve.animation.reference-closure"
          : "check.linear-solve.teacher-zero.animation.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: config.animationId
      },
      {
        id: canonical
          ? "check.linear-solve.animation.seek-rewind"
          : "check.linear-solve.teacher-zero.animation.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      }
    ],
    exportTargets: [
      {
        id: canonical
          ? "export.linear-solve.frames"
          : "export.linear-solve.teacher-zero.frames",
        kind: "frame-sequence",
        artifactId: canonical
          ? "artifact.linear-solve.gif.frames"
          : "artifact.linear-solve.teacher-zero.gif.frames"
      }
    ],
    dashboard: {
      rowId: config.dashboardRowId,
      tags: ["animation", "equation", "linear-solve", ...(canonical ? [] : ["teacher-detail"])],
      sourceRefIds: [source.sourceAnimationId]
    },
    metadata: {
      sourceAnimationId: source.sourceAnimationId,
      // Preserve the successful canonical motion while newer material motifs
      // remain available semantically for isolated refinement and promotion.
      equationMotionPresentationRecipe: "continuity-v1",
      equationCancellationPresentationRecipe: "counter-orbit-v1",
      // The compact flagship path omits the optional +0 teaching beat. The
      // recipe remains available for explicit lesson variants.
      equationZeroWitnessPresentationRecipe: "none",
      equationSuccessorPresentationRecipe: "counter-convergence-v1",
      equationDepthPresentationRecipe: "semantic-depth-v1",
      equationContinuantPresentationRecipe: "transit-then-reflow-v1"
    }
  });
}

function attachLinearSolveDefinitionId(
  transformation: KpSemanticTransformation
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: transformation.id,
    definitionId:
      linearSolveTransformationDefinitionIds[transformation.id] ??
      transformation.definitionId,
    transformType: transformation.transformType,
    title: transformation.title,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    ...(transformation.correspondenceMap === undefined
      ? {}
      : { correspondenceMap: transformation.correspondenceMap }),
    correspondence: transformation.correspondence,
    ...(transformation.assumptions === undefined
      ? {}
      : { assumptions: transformation.assumptions }),
    ...(transformation.lawRefs === undefined
      ? {}
      : { lawRefs: transformation.lawRefs })
  });
}
