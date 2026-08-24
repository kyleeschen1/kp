import {
  checkKpAnimationAssetReferenceClosure,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "./runtime-sampler.ts";
import type { KpLawCheckResult, KpLawFailure } from
  "../semantic/asset-laws.ts";
import { createSemanticTransformationRef } from
  "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";
import {
  compileKpGraph2DQuadraticTranslation,
  type KpGraph2DQuadraticTranslationPoint,
  type KpGraph2DQuadraticTranslationTrace
} from "../semantic/graph-2d-quadratic-translation-trace.ts";
import { kpGraph2DQuadraticTranslationRequest } from
  "../domain-ir/graph-2d-function-generation-request.ts";

export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID =
  "animation.graph-2d.quadratic-translate-right-two" as const;
export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_TIMELINE_ID =
  "timeline.graph-2d.quadratic-translate-right-two" as const;
export const KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID =
  "render.graph-2d.quadratic-translate-right-two" as const;

export interface KpGraph2DQuadraticTranslationAnimationAsset {
  readonly id: typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID;
  readonly animation: KpAnimationAsset;
  readonly trace: KpGraph2DQuadraticTranslationTrace;
  readonly staticEndpoints: Readonly<{
    sourceLatex: string;
    targetLatex: string;
  }>;
  readonly accessibility: Readonly<{
    title: string;
    description: string;
    settledDescription: string;
  }>;
}

export interface KpGraph2DQuadraticTranslationRuntimePoint {
  readonly id: string;
  readonly role: KpGraph2DQuadraticTranslationPoint["role"];
  readonly parameter: number;
  readonly x: number;
  readonly y: number;
}

export interface KpGraph2DQuadraticTranslationRuntimeFrame {
  readonly id: string;
  readonly kind: "graph-2d-quadratic-translation-runtime-frame";
  readonly animationId:
    typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID;
  readonly runtimeFrameId: string;
  readonly renderTargetId:
    typeof KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID;
  readonly semanticTraceId: string;
  readonly curveIdentityId: string;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly translationProgress: number;
  readonly horizontalShift: number;
  readonly verticalShift: 0;
  readonly vertex: KpGraph2DQuadraticTranslationRuntimePoint;
  readonly selectedPoints:
    readonly KpGraph2DQuadraticTranslationRuntimePoint[];
  readonly activeTransformationIds: readonly string[];
}

export function createKpGraph2DQuadraticTranslationAnimationAsset():
KpGraph2DQuadraticTranslationAnimationAsset {
  const compilation = compileKpGraph2DQuadraticTranslation(
    kpGraph2DQuadraticTranslationRequest
  );
  if (compilation.status !== "accepted") throw new Error(
    compilation.diagnostics[0]?.message ??
      "The canonical Graph2D request did not compile."
  );
  const trace = compilation.trace;
  const transformation = trace.transformation;
  const animation = createKpAnimationAsset({
    id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID,
    title: "Translate a quadratic function",
    bundle: trace.bundle,
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({
      root: createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      ),
      annotations: [{
        id: "focus.graph-2d.quadratic-translation.curve-and-points",
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: trace.correspondenceMap.records
          .filter(({ id }) =>
            id === "curve-persists" ||
            id === "left-sample-persists" ||
            id === "vertex-persists" ||
            id === "right-sample-persists"
          )
          .flatMap(({ sourceSelectorIds, targetSelectorIds }) => [
            ...sourceSelectorIds,
            ...targetSelectorIds
          ]),
        summary:
          "Attend to the curve, vertex, and selected points while axes remain context."
      }]
    }),
    timeline: {
      id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_TIMELINE_ID,
      durationMs: 2200,
      beatCount: 44,
      markerIds: [
        "marker.graph-2d.quadratic-translation.source",
        "marker.graph-2d.quadratic-translation.motion",
        "marker.graph-2d.quadratic-translation.target"
      ]
    },
    layout: {
      id: "layout.graph-2d.quadratic-translation",
      kind: "single",
      targetId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID
    },
    renderTargets: [{
      id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID,
      kind: "graph",
      objectIds: trace.bundle.objects.map(({ id }) => id),
      selectorIds: trace.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: [transformation.id],
      timelineId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_TIMELINE_ID,
      summary:
        "Renderer-neutral quadratic translation for a source-native SVG adapter.",
      metadata: {
        graphMotionKind: "quadratic-horizontal-translation",
        semanticTraceId: trace.id,
        contextId: trace.context.id,
        sourceStateId: trace.source.id,
        targetStateId: trace.target.id,
        curveIdentityId: trace.source.curveIdentityId,
        operationId: trace.operationId,
        recipeId: trace.recipeId
      }
    }],
    checks: [{
      id: "check.graph-2d.quadratic-translation.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID
    }, {
      id: "check.graph-2d.quadratic-translation.seek-rewind",
      lawId: "graph-runtime.quadratic-horizontal-translation",
      level: "strict",
      targetId: transformation.id
    }],
    exportTargets: [{
      id: "export.graph-2d.quadratic-translation.static-step",
      kind: "static-step",
      artifactId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID,
      summary: "The source and translated functions remain available without motion."
    }],
    dashboard: {
      rowId: "animation-graph-2d-quadratic-translate-right-two",
      tags: [
        "animation",
        "graph-2d",
        "quadratic",
        "function-translation"
      ],
      sampleTargetIds: [
        KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID
      ],
      sourceRefIds: [trace.requestId, trace.id]
    },
    metadata: {
      domain: "graph-2d",
      graphMotionKind: "quadratic-horizontal-translation",
      semanticAuthority: trace.id,
      visualStatus: "provisional-until-human-checkpoint"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return deepFreeze({
    id: KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID,
    animation,
    trace,
    staticEndpoints: {
      sourceLatex: trace.source.normalizedLatex,
      targetLatex: trace.target.normalizedLatex
    },
    accessibility: {
      title: "A parabola translated two units right",
      description:
        "The graph of y equals x squared moves right while its shape and point identities remain unchanged.",
      settledDescription:
        "The vertex is now at two comma zero, and the equation is y equals the quantity x minus two squared."
    }
  });
}

export function sampleKpGraph2DQuadraticTranslationRuntimeFrame(input: {
  readonly asset: KpGraph2DQuadraticTranslationAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): KpGraph2DQuadraticTranslationRuntimeFrame {
  if (input.runtimeFrame.animationId !== input.asset.animation.id) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} does not belong to ${input.asset.id}.`
    );
  }
  const trace = input.asset.trace;
  const translationProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const horizontalShift = roundCoordinate(
    trace.source.horizontalShift +
      (trace.target.horizontalShift - trace.source.horizontalShift) *
      translationProgress
  );
  const selectedPoints = trace.source.points.map((point) => deepFreeze({
    id: point.id,
    role: point.role,
    parameter: point.parameter,
    x: roundCoordinate(point.parameter + horizontalShift),
    y: point.y
  }));
  const vertex = selectedPoints.find(({ role }) => role === "vertex");
  if (vertex === undefined) throw new Error(
    `Trace ${trace.id} must retain its vertex.`
  );

  return deepFreeze({
    id: `graph-2d-quadratic-frame.${input.runtimeFrame.id}`,
    kind: "graph-2d-quadratic-translation-runtime-frame",
    animationId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: KP_GRAPH_2D_QUADRATIC_TRANSLATION_RENDER_TARGET_ID,
    semanticTraceId: trace.id,
    curveIdentityId: trace.source.curveIdentityId,
    sourceLatex: trace.source.normalizedLatex,
    targetLatex: trace.target.normalizedLatex,
    translationProgress,
    horizontalShift,
    verticalShift: 0,
    vertex,
    selectedPoints,
    activeTransformationIds: [
      ...input.runtimeFrame.activeTransformationIds
    ]
  });
}

export function checkKpGraph2DQuadraticTranslationRuntimeLaw(input: {
  readonly asset: KpGraph2DQuadraticTranslationAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
  readonly epsilon?: number | undefined;
}): KpLawCheckResult {
  const samples = input.sampleProgresses ?? [0, 0.25, 0.5, 0.75, 1];
  const epsilon = input.epsilon ?? 1e-9;
  const failures: KpLawFailure[] = [];
  for (const [index, progress] of samples.entries()) {
    const forward = sampleAt(input.asset, "forward", progress);
    const rewind = sampleAt(input.asset, "rewind", 1 - progress);
    for (const point of forward.selectedPoints) {
      const expectedY = point.parameter ** 2;
      if (!nearlyEqual(point.x, point.parameter + forward.horizontalShift,
          epsilon) || !nearlyEqual(point.y, expectedY, epsilon)) {
        failures.push({
          path: `samples[${index}].points.${point.id}`,
          message:
            "A translated material point lost its exact (u + h, u^2) correspondence."
        });
      }
      const reversePoint = rewind.selectedPoints.find(({ id }) =>
        id === point.id
      );
      if (reversePoint === undefined ||
          !nearlyEqual(point.x, reversePoint.x, epsilon) ||
          !nearlyEqual(point.y, reversePoint.y, epsilon)) {
        failures.push({
          path: `samples[${index}].rewind.${point.id}`,
          message: "Mirrored rewind lost a selected point's semantic state."
        });
      }
    }
    if (!nearlyEqual(forward.horizontalShift, rewind.horizontalShift,
        epsilon)) failures.push({
      path: `samples[${index}].rewind.horizontalShift`,
      message: "Mirrored rewind lost the horizontal translation parameter."
    });
  }

  return {
    lawId: "graph-runtime.quadratic-horizontal-translation",
    passed: failures.length === 0,
    failures
  };
}

function sampleAt(
  asset: KpGraph2DQuadraticTranslationAnimationAsset,
  direction: "forward" | "rewind",
  progress: number
): KpGraph2DQuadraticTranslationRuntimeFrame {
  return sampleKpGraph2DQuadraticTranslationRuntimeFrame({
    asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: asset.animation,
      direction,
      progress
    })
  });
}

function nearlyEqual(left: number, right: number, epsilon: number): boolean {
  return Math.abs(left - right) <= epsilon;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
