import type { KpAnimationGenerationRequest } from "../src/domain-ir/animation-generation-request.ts";
import { KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION, KP_GRAPH_3D_SADDLE_SURFACE_FAMILY,
  KP_GRAPH_3D_SCENE_FRONTEND_ID, KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY,
  kpGraph3DSaddleParameterRequest } from "../src/domain-ir/graph-3d-scene-generation-request.ts";
export const KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_SOURCE_KIND =
  "graph-3d.scene-parameters" as const;

export const canonicalIntentParameters = deepFreeze({
  familyId: KP_GRAPH_3D_SADDLE_SURFACE_FAMILY,
  operationId: KP_GRAPH_3D_FLATTEN_SADDLE_OPERATION,
  sourceDenominator: 4,
  targetDenominator: 8,
  preserve: [
    "surface-family",
    "surface-identity",
    "xy-domain",
    "topology",
    "axis-context",
    "camera-state"
  ]
});

export const kpGalleryGraph3DSaddleParameterRequest = deepFreeze({
  schemaVersion: "kp.animation-generation-request.v1" as const,
  kind: "animation-generation-request" as const,
  requestId: "request.graph-3d.saddle-parameter.gallery.v1",
  domain: "graph-3d" as const,
  source: {
    kind: KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_SOURCE_KIND,
    frontendId: KP_GRAPH_3D_SCENE_FRONTEND_ID,
    input: kpGraph3DSaddleParameterRequest
  },
  intent: {
    kind: "graph-3d.increase-saddle-denominator",
    summary:
      "Increase the saddle denominator from four to eight while preserving the surface, domain, topology, axes, and fixed camera.",
    parameters: canonicalIntentParameters
  },
  expectedOutputs: [
    "semantic-plan" as const,
    "animation-artifact" as const,
    "typed-diagnostics" as const,
    "coverage-evidence" as const
  ],
  capabilityPins: [KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY]
} satisfies KpAnimationGenerationRequest);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
