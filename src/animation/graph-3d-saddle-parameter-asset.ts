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
  compileKpGraph3DSaddleParameterTrace,
  type KpGraph3DSaddleParameterTrace,
  type KpGraph3DSaddleWitness
} from "../semantic/graph-3d-saddle-parameter-trace.ts";
import { kpGraph3DSaddleParameterRequest } from
  "../domain-ir/graph-3d-scene-generation-request.ts";

export const KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID =
  "animation.graph-3d.saddle-denominator-four-to-eight" as const;
export const KP_GRAPH_3D_SADDLE_PARAMETER_TIMELINE_ID =
  "timeline.graph-3d.saddle-denominator-four-to-eight" as const;
export const KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID =
  "render.graph-3d.saddle-denominator-four-to-eight" as const;

export interface KpGraph3DSaddleParameterAnimationAsset {
  readonly id: typeof KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID;
  readonly animation: KpAnimationAsset;
  readonly trace: KpGraph3DSaddleParameterTrace;
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

export interface KpGraph3DSaddleRuntimeWitness {
  readonly id: string;
  readonly role: KpGraph3DSaddleWitness["role"];
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface KpGraph3DSaddleParameterRuntimeFrame {
  readonly id: string;
  readonly kind: "graph-3d-saddle-parameter-runtime-frame";
  readonly animationId: typeof KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID;
  readonly runtimeFrameId: string;
  readonly renderTargetId:
    typeof KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID;
  readonly semanticTraceId: string;
  readonly graphIdentityId: string;
  readonly surfaceIdentityId: string;
  readonly cameraStateId: string;
  readonly cameraPolicy: "fixed";
  readonly topology: "height-field-over-rectangle";
  readonly domain: Readonly<{
    x: readonly [-3, 3];
    y: readonly [-3, 3];
  }>;
  readonly sourceLatex: string;
  readonly targetLatex: string;
  readonly surfaceProgress: number;
  readonly denominator: number;
  readonly witnesses: readonly KpGraph3DSaddleRuntimeWitness[];
  readonly activeTransformationIds: readonly string[];
  readonly accessibilityDescription: string;
}

export function createKpGraph3DSaddleParameterAnimationAsset():
KpGraph3DSaddleParameterAnimationAsset {
  const compilation = compileKpGraph3DSaddleParameterTrace(
    kpGraph3DSaddleParameterRequest
  );
  if (compilation.status !== "accepted") throw new Error(
    compilation.diagnostics[0]?.message ??
      "The canonical Graph3D request did not compile."
  );
  const trace = compilation.trace;
  const transformation = trace.transformation;
  const animation = createKpAnimationAsset({
    id: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
    title: "Flatten a saddle by changing its denominator",
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
        id: "focus.graph-3d.saddle-parameter.surface",
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: trace.correspondenceMap.records
          .filter(({ id }) =>
            id === "surface-persists" || id.endsWith("-persists") &&
              (id.startsWith("x-ridge") || id.startsWith("y-valley"))
          )
          .flatMap(({ sourceSelectorIds, targetSelectorIds }) => [
            ...sourceSelectorIds,
            ...targetSelectorIds
          ]),
        summary:
          "Attend to the persistent saddle and its ridge and valley while axes and camera remain context."
      }]
    }),
    timeline: {
      id: KP_GRAPH_3D_SADDLE_PARAMETER_TIMELINE_ID,
      durationMs: 2600,
      beatCount: 52,
      markerIds: [
        "marker.graph-3d.saddle-parameter.source",
        "marker.graph-3d.saddle-parameter.flatten",
        "marker.graph-3d.saddle-parameter.target"
      ]
    },
    layout: {
      id: "layout.graph-3d.saddle-parameter",
      kind: "single",
      targetId: KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID
    },
    renderTargets: [{
      id: KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID,
      kind: "graph",
      objectIds: trace.bundle.objects.map(({ id }) => id),
      selectorIds: trace.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: [transformation.id],
      timelineId: KP_GRAPH_3D_SADDLE_PARAMETER_TIMELINE_ID,
      summary:
        "Renderer-neutral saddle parameter transition for Graph3D ports.",
      metadata: {
        graphMotionKind: "saddle-denominator-transition",
        semanticTraceId: trace.id,
        contextId: trace.context.id,
        sourceStateId: trace.source.id,
        targetStateId: trace.target.id,
        graphIdentityId: trace.context.graphIdentityId,
        surfaceIdentityId: trace.source.surfaceIdentityId,
        cameraStateId: trace.context.camera.id,
        operationId: trace.operationId,
        recipeId: trace.recipeId
      }
    }],
    checks: [{
      id: "check.graph-3d.saddle-parameter.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID
    }, {
      id: "check.graph-3d.saddle-parameter.seek-rewind",
      lawId: "graph-runtime.saddle-denominator-transition",
      level: "strict",
      targetId: transformation.id
    }],
    exportTargets: [{
      id: "export.graph-3d.saddle-parameter.static-step",
      kind: "static-step",
      artifactId: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
      summary:
        "The source and flattened saddle remain available without motion."
    }],
    dashboard: {
      rowId: "animation-graph-3d-saddle-denominator-four-to-eight",
      tags: ["animation", "graph-3d", "saddle", "parameter-change"],
      sampleTargetIds: [KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID],
      sourceRefIds: [trace.requestId, trace.id]
    },
    metadata: {
      domain: "graph-3d",
      graphMotionKind: "saddle-denominator-transition",
      semanticAuthority: trace.id,
      summary:
        "Follow one fixed-camera saddle as its denominator increases from four to eight.",
      visualStatus: "provisional-until-human-checkpoint"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return deepFreeze({
    id: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
    animation,
    trace,
    staticEndpoints: {
      sourceLatex: trace.source.normalizedLatex,
      targetLatex: trace.target.normalizedLatex
    },
    accessibility: {
      title: "A saddle surface flattening under a fixed camera",
      description:
        "The denominator increases from four to eight while the surface identity, coordinate domain, topology, axes, and camera remain fixed.",
      settledDescription:
        "The saddle is flatter: every height and depth is half its source value."
    }
  });
}

export function sampleKpGraph3DSaddleParameterRuntimeFrame(input: {
  readonly asset: KpGraph3DSaddleParameterAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): KpGraph3DSaddleParameterRuntimeFrame {
  if (input.runtimeFrame.animationId !== input.asset.animation.id) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} does not belong to ${input.asset.id}.`
    );
  }
  const trace = input.asset.trace;
  const surfaceProgress = input.runtimeFrame.clock.direction === "rewind"
    ? 1 - input.runtimeFrame.clock.progress
    : input.runtimeFrame.clock.progress;
  const denominator = roundCoordinate(
    trace.source.denominator +
      (trace.target.denominator - trace.source.denominator) * surfaceProgress
  );
  const witnesses = trace.source.witnesses.map((point) => deepFreeze({
    id: point.id,
    role: point.role,
    x: point.x,
    y: point.y,
    z: roundCoordinate((point.x ** 2 - point.y ** 2) / denominator)
  }));

  return deepFreeze({
    id: `graph-3d-saddle-frame.${input.runtimeFrame.id}`,
    kind: "graph-3d-saddle-parameter-runtime-frame",
    animationId: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
    runtimeFrameId: input.runtimeFrame.id,
    renderTargetId: KP_GRAPH_3D_SADDLE_PARAMETER_RENDER_TARGET_ID,
    semanticTraceId: trace.id,
    graphIdentityId: trace.context.graphIdentityId,
    surfaceIdentityId: trace.source.surfaceIdentityId,
    cameraStateId: trace.context.camera.id,
    cameraPolicy: "fixed",
    topology: trace.source.topology,
    domain: trace.source.domain,
    sourceLatex: trace.source.normalizedLatex,
    targetLatex: trace.target.normalizedLatex,
    surfaceProgress,
    denominator,
    witnesses,
    activeTransformationIds: [
      ...input.runtimeFrame.activeTransformationIds
    ],
    accessibilityDescription:
      `Saddle denominator ${formatNumber(denominator)} of 8; ` +
      `${Math.round(surfaceProgress * 100)} percent flattened under a fixed camera.`
  });
}

export function checkKpGraph3DSaddleParameterRuntimeLaw(input: {
  readonly asset: KpGraph3DSaddleParameterAnimationAsset;
  readonly sampleProgresses?: readonly number[] | undefined;
  readonly epsilon?: number | undefined;
}): KpLawCheckResult {
  const samples = input.sampleProgresses ?? [0, 0.25, 0.5, 0.75, 1];
  // Runtime frames use six-decimal transport coordinates; the law compares
  // that representation without pretending it retained infinite precision.
  const epsilon = input.epsilon ?? 1e-6;
  const failures: KpLawFailure[] = [];
  for (const [index, progress] of samples.entries()) {
    const forward = sampleAt(input.asset, "forward", progress);
    const rewind = sampleAt(input.asset, "rewind", 1 - progress);
    const expectedDenominator = 4 + 4 * progress;
    if (!nearlyEqual(forward.denominator, expectedDenominator, epsilon)) {
      failures.push({
        path: `samples[${index}].denominator`,
        message: "The runtime frame lost its governed denominator parameter."
      });
    }
    for (const point of forward.witnesses) {
      const sourcePoint = input.asset.trace.source.witnesses.find(({ id }) =>
        id === point.id
      );
      const reversePoint = rewind.witnesses.find(({ id }) => id === point.id);
      const expectedZ = (point.x ** 2 - point.y ** 2) / forward.denominator;
      if (sourcePoint === undefined || point.x !== sourcePoint.x ||
          point.y !== sourcePoint.y ||
          !nearlyEqual(point.z, expectedZ, epsilon)) failures.push({
        path: `samples[${index}].witnesses.${point.id}`,
        message:
          "A saddle witness lost its fixed (x, y) identity or exact z-value."
      });
      if (reversePoint === undefined ||
          !nearlyEqual(point.z, reversePoint.z, epsilon)) failures.push({
        path: `samples[${index}].rewind.${point.id}`,
        message: "Mirrored rewind lost a saddle witness's semantic state."
      });
    }
    if (
      !nearlyEqual(forward.denominator, rewind.denominator, epsilon) ||
      forward.cameraStateId !== rewind.cameraStateId ||
      forward.topology !== rewind.topology
    ) failures.push({
      path: `samples[${index}].rewind.context`,
      message:
        "Mirrored rewind changed the denominator, camera identity, or topology."
    });
  }

  return {
    lawId: "graph-runtime.saddle-denominator-transition",
    passed: failures.length === 0,
    failures
  };
}

function sampleAt(
  asset: KpGraph3DSaddleParameterAnimationAsset,
  direction: "forward" | "rewind",
  progress: number
): KpGraph3DSaddleParameterRuntimeFrame {
  return sampleKpGraph3DSaddleParameterRuntimeFrame({
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
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
