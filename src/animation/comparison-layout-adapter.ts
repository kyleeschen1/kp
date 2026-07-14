import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createLinearSolveAnimationAsset } from "./linear-solve-adapter.ts";
import { createProgramTraceAnimationAsset } from "./programming-adapter.ts";
import { createKpAssetBundle } from "../semantic/asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationParallel
} from "../semantic/transformation-composition.ts";

const comparisonAnimationId = "animation.comparison.linear-solve-programming";
const comparisonTimelineId = "timeline.comparison.linear-solve-programming.shared";
const comparisonEquationRenderTargetId = "render.comparison.linear-solve.equation";
const comparisonProgrammingRenderTargetId = "render.comparison.programming.trace";

export function createComparisonLayoutAnimationAssets():
  readonly KpAnimationAsset[] {
  return [createLinearSolveProgrammingComparisonAnimationAsset()];
}

export function createLinearSolveProgrammingComparisonAnimationAsset():
  KpAnimationAsset {
  const equation = createLinearSolveAnimationAsset();
  const programming = createProgramTraceAnimationAsset();
  const equationRenderTarget = equation.renderTargets[0];
  const programmingRenderTarget = programming.renderTargets[0];

  if (equationRenderTarget === undefined) {
    throw new Error(`Animation ${equation.id} has no render target.`);
  }

  if (programmingRenderTarget === undefined) {
    throw new Error(`Animation ${programming.id} has no render target.`);
  }

  // A comparison layout is a visual composition: both child animations keep
  // their own phase semantics while the parent gives them one shared progress.
  const root = createSemanticTransformationParallel({
    id: "diagram.comparison.linear-solve-programming.parallel",
    label: "Linear solve and programming trace comparison",
    children: [
      equation.transformationTree.root,
      programming.transformationTree.root
    ],
    summary:
      "Run equation and programming animation phases under one shared progress clock."
  });

  return createKpAnimationAsset({
    id: comparisonAnimationId,
    title: "Linear solve and programming trace comparison",
    bundle: createKpAssetBundle({
      id: "asset.comparison.linear-solve-programming",
      title: "Linear solve and programming trace comparison assets",
      objects: [
        ...equation.bundle.objects,
        ...programming.bundle.objects
      ]
    }),
    transformations: [
      ...equation.transformations,
      ...programming.transformations
    ],
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        ...equation.transformationTree.annotations,
        ...programming.transformationTree.annotations
      ]
    }),
    timeline: {
      id: comparisonTimelineId,
      durationMs: equation.timeline?.durationMs ?? 2400,
      beatCount: equation.timeline?.beatCount ?? 50,
      markerIds: [equation.id, programming.id]
    },
    layout: {
      id: "layout.comparison.linear-solve-programming.row",
      kind: "row",
      childIds: [
        comparisonEquationRenderTargetId,
        comparisonProgrammingRenderTargetId
      ],
      title: "Equation and program trace"
    },
    renderTargets: [
      {
        id: comparisonEquationRenderTargetId,
        kind: "equation",
        objectIds: equationRenderTarget.objectIds,
        selectorIds: equationRenderTarget.selectorIds,
        transformationIds: equationRenderTarget.transformationIds,
        timelineId: comparisonTimelineId,
        summary: "Left pane equation animation render target.",
        metadata: {
          childAnimationId: equation.id,
          pane: "left"
        }
      },
      {
        id: comparisonProgrammingRenderTargetId,
        kind: "programming",
        objectIds: programmingRenderTarget.objectIds,
        selectorIds: programmingRenderTarget.selectorIds,
        transformationIds: programmingRenderTarget.transformationIds,
        timelineId: comparisonTimelineId,
        summary: "Right pane programming trace animation render target.",
        metadata: {
          childAnimationId: programming.id,
          pane: "right"
        }
      }
    ],
    checks: [
      {
        id: "check.comparison.linear-solve-programming.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: comparisonAnimationId
      },
      {
        id: "check.comparison.linear-solve-programming.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    dashboard: {
      rowId: "animation-comparison-linear-solve-programming",
      tags: ["animation", "comparison", "layout", "programming", "equation"],
      sampleTargetIds: [
        comparisonEquationRenderTargetId,
        comparisonProgrammingRenderTargetId
      ],
      sourceRefIds: [equation.id, programming.id]
    },
    metadata: {
      childAnimationIds: `${equation.id} ${programming.id}`,
      compositionKind: "synchronized-comparison",
      clockCoupling: "shared-progress"
    }
  });
}
