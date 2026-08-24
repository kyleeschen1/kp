import {
  createKpGraph3DSaddleParameterAnimationAsset,
  sampleKpGraph3DSaddleParameterRuntimeFrame,
  KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
  type KpGraph3DSaddleParameterRuntimeFrame
} from "../animation/graph-3d-saddle-parameter-asset.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpAnimationRuntimeFrame } from
  "../animation/runtime-sampler.ts";
import type {
  KpGraph3DSaddleParameterContext,
  KpGraph3DSaddleParameterState
} from "../semantic/graph-3d-saddle-parameter-trace.ts";
import { KP_WEBGL_CONTEXT_LEASE_LIMIT } from
  "../rendering/webgl-context-lease-pool.ts";

export const KP_EDITOR_GRAPH_3D_SADDLE_HOST_SCHEMA =
  "kp.editor-animation.graph-3d-saddle-host.v1" as const;

export interface KpEditorGraph3DSaddleHostContract {
  readonly schemaVersion: typeof KP_EDITOR_GRAPH_3D_SADDLE_HOST_SCHEMA;
  readonly animationId: typeof KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID;
  readonly slotKind: "graph";
  readonly graphId: string;
  readonly surfaceId: string;
  readonly cameraStateId: string;
  readonly sourceDenominator: 4;
  readonly targetDenominator: 8;
  readonly capability: Readonly<{
    modulePath: "../rendering/graph-3d-saddle-parameter-ports.ts";
    loadWhen: "selected-and-visible";
    backend: "three";
  }>;
  readonly resource: Readonly<{
    pool: "kp-webgl-context-lease-pool";
    contextLimit: number;
    leasesPerMountedSurface: 1;
    releaseWhen: readonly [
      "selection-replaced",
      "player-disposed",
      "context-lost"
    ];
  }>;
  readonly fallback: Readonly<{
    kind: "semantic-svg";
    ownsPaintUntilWebglReady: true;
    tracksContinuousSemanticFrame: true;
  }>;
  readonly accessibility: Readonly<{
    role: "img";
    canvasHiddenFromAccessibilityTree: true;
    descriptionTracksRuntimeFrame: true;
  }>;
}

export interface KpGraph3DSaddleSemanticScene {
  readonly graphId: string;
  readonly surface: KpGraph3DSaddleParameterState;
  readonly context: KpGraph3DSaddleParameterContext;
}

export interface KpEditorGraph3DSaddleHostFrame {
  readonly animationId: typeof KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID;
  readonly runtimeFrameId: string;
  readonly direction: KpAnimationRuntimeFrame["clock"]["direction"];
  readonly requestedProgress: number;
  readonly visualProgress: number;
  readonly source: KpGraph3DSaddleSemanticScene;
  readonly target: KpGraph3DSaddleSemanticScene;
  readonly semanticFrame: KpGraph3DSaddleParameterRuntimeFrame;
  readonly description: string;
}

export function supportsKpEditorGraph3DSaddleAnimation(
  animationId: string
): animationId is typeof KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID {
  return animationId === KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID;
}

export function createKpEditorGraph3DSaddleHostContract(
  animation: KpAnimationAsset
): KpEditorGraph3DSaddleHostContract {
  if (!supportsKpEditorGraph3DSaddleAnimation(animation.id)) {
    throw new Error(
      `Animation ${animation.id} is not the bounded saddle parameter exemplar.`
    );
  }
  const target = animation.renderTargets.find((candidate) =>
    candidate.kind === "graph" &&
    candidate.metadata?.["graphMotionKind"] ===
      "saddle-denominator-transition"
  );
  if (
    target === undefined ||
    target.metadata?.["semanticTraceId"] !==
      "trace.graph-3d.saddle-denominator-four-to-eight.v1" ||
    target.metadata?.["graphIdentityId"] !==
      "graph.graph-3d.saddle-parameter.primary" ||
    target.metadata?.["surfaceIdentityId"] !==
      "surface.graph-3d.saddle-parameter.primary" ||
    target.metadata?.["cameraStateId"] !==
      "camera.graph-3d.saddle-parameter.fixed"
  ) throw new Error(
    `Animation ${animation.id} must retain its exact Graph3D saddle target authority.`
  );

  return deepFreeze({
    schemaVersion: KP_EDITOR_GRAPH_3D_SADDLE_HOST_SCHEMA,
    animationId: KP_GRAPH_3D_SADDLE_PARAMETER_ANIMATION_ID,
    slotKind: "graph",
    graphId: "graph.graph-3d.saddle-parameter.primary",
    surfaceId: "surface.graph-3d.saddle-parameter.primary",
    cameraStateId: "camera.graph-3d.saddle-parameter.fixed",
    sourceDenominator: 4,
    targetDenominator: 8,
    capability: {
      modulePath: "../rendering/graph-3d-saddle-parameter-ports.ts",
      loadWhen: "selected-and-visible",
      backend: "three"
    },
    resource: {
      pool: "kp-webgl-context-lease-pool",
      contextLimit: KP_WEBGL_CONTEXT_LEASE_LIMIT,
      leasesPerMountedSurface: 1,
      releaseWhen: [
        "selection-replaced",
        "player-disposed",
        "context-lost"
      ]
    },
    fallback: {
      kind: "semantic-svg",
      ownsPaintUntilWebglReady: true,
      tracksContinuousSemanticFrame: true
    },
    accessibility: {
      role: "img",
      canvasHiddenFromAccessibilityTree: true,
      descriptionTracksRuntimeFrame: true
    }
  });
}

export function projectKpEditorGraph3DSaddleHostFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
}): KpEditorGraph3DSaddleHostFrame {
  const contract = createKpEditorGraph3DSaddleHostContract(input.animation);
  if (input.runtimeFrame.animationId !== contract.animationId) {
    throw new Error(
      `Runtime frame ${input.runtimeFrame.id} belongs to ${input.runtimeFrame.animationId}, not ${contract.animationId}.`
    );
  }
  const canonical = createKpGraph3DSaddleParameterAnimationAsset();
  const semanticFrame = sampleKpGraph3DSaddleParameterRuntimeFrame({
    asset: canonical,
    runtimeFrame: input.runtimeFrame
  });
  const source = deepFreeze({
    graphId: contract.graphId,
    surface: canonical.trace.source,
    context: canonical.trace.context
  });
  const target = deepFreeze({
    graphId: contract.graphId,
    surface: canonical.trace.target,
    context: canonical.trace.context
  });

  return deepFreeze({
    animationId: contract.animationId,
    runtimeFrameId: input.runtimeFrame.id,
    direction: input.runtimeFrame.clock.direction,
    requestedProgress: input.runtimeFrame.clock.progress,
    visualProgress: semanticFrame.surfaceProgress,
    source,
    target,
    semanticFrame,
    description: semanticFrame.accessibilityDescription
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
