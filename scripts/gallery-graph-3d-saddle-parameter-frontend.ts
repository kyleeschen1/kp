import type { KpAnimationGenerationRequest } from "../src/domain-ir/animation-generation-request.ts";
import { KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_SOURCE_KIND, canonicalIntentParameters } from "./gallery-graph-3d-saddle-parameter-request.ts";
export { KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_SOURCE_KIND,
  kpGalleryGraph3DSaddleParameterRequest } from "./gallery-graph-3d-saddle-parameter-request.ts";
import type { KpCrossDomainGalleryFrontend } from
  "./cross-domain-gallery-generation-router.ts";
import {
  createKpGraph3DSaddleParameterAnimationAsset
} from "../src/animation/graph-3d-saddle-parameter-asset.ts";
import {
  KP_GRAPH_3D_SCENE_FRONTEND_ID,
  KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY,
  kpGraph3DSaddleParameterRequest
} from "../src/domain-ir/graph-3d-scene-generation-request.ts";
import {
  projectKpGalleryAcceptedGeneration,
  projectKpGalleryGenerationRepair,
  type KpGalleryGenerationDiagnostic,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";
import {
  compileKpGraph3DSaddleParameterTrace,
  type KpGraph3DSaddleParameterClaim
} from "../src/semantic/graph-3d-saddle-parameter-trace.ts";
import {
  KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID
} from "../src/editor/graph-3d-saddle-adapter-identity.ts";
import { writeKpAnimationCatalogueRoute } from
  "../src/editor/animation-catalogue-route.ts";

export const KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_FRONTEND_SOURCE =
  "scripts/gallery-graph-3d-saddle-parameter-frontend.ts" as const;
const canonicalCompilation = compileKpGraph3DSaddleParameterTrace(
  kpGraph3DSaddleParameterRequest
);
if (canonicalCompilation.status !== "accepted") throw new Error(
  "The canonical Graph3D gallery request must compile."
);

export const kpGalleryGraph3DSaddleParameterExplanationClaims:
readonly KpGraph3DSaddleParameterClaim[] = canonicalCompilation.trace.claims;

export const kpGalleryGraph3DSaddleParameterFrontend = Object.freeze({
  domain: "graph-3d",
  sourceKind: KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_SOURCE_KIND,
  frontendId: KP_GRAPH_3D_SCENE_FRONTEND_ID,
  capabilityPins: [KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY],
  authoritySourcePath: KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_FRONTEND_SOURCE,
  project: projectGraph3DSaddleParameter
} as const satisfies KpCrossDomainGalleryFrontend);

function projectGraph3DSaddleParameter(
  request: KpAnimationGenerationRequest
): KpGalleryGenerationResult {
  if (
    request.intent.kind !== "graph-3d.increase-saddle-denominator" ||
    !equal(request.intent.parameters, canonicalIntentParameters)
  ) return projectKpGalleryGenerationRepair({
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_FRONTEND_SOURCE,
    diagnostics: [{
      authority: "domain-frontend",
      code: "gallery-generation.graph-3d.intent-unsupported",
      path: "$.intent",
      message:
        "This frontend owns only the reviewed fixed-camera saddle denominator change from four to eight.",
      repair:
        "Use the pinned saddle-parameter intent or retain a typed Graph3D repair gap."
    }]
  });

  const compilation = compileKpGraph3DSaddleParameterTrace(
    request.source.input
  );
  if (compilation.status !== "accepted") {
    return projectKpGalleryGenerationRepair({
      request,
      frontendAuthoritySourcePath:
        KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_FRONTEND_SOURCE,
      diagnostics: nonEmpty(compilation.diagnostics.map((diagnostic) => ({
        authority: "domain-frontend" as const,
        ...diagnostic
      })))
    });
  }

  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  if (
    asset.trace.id !== compilation.trace.id ||
    asset.animation.timeline === undefined
  ) throw new Error(
    "The Graph3D generation route lost its semantic trace or timeline authority."
  );

  return projectKpGalleryAcceptedGeneration({
    // The compiled asset remains provisional until its dedicated visual gate.
    status: "compiled-artifact",
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_GRAPH_3D_SADDLE_PARAMETER_FRONTEND_SOURCE,
    semanticTrace: {
      id: compilation.trace.id,
      kind: compilation.trace.schemaVersion,
      authoritySourcePath:
        "src/semantic/graph-3d-saddle-parameter-trace.ts"
    },
    explanationClaimRefs: compilation.trace.claims.map(({ id }) => id),
    evidenceRefs: [
      compilation.trace.operationId,
      compilation.trace.recipeId,
      ...(compilation.trace.transformation.lawRefs ?? []).map(({ id }) => id),
      "animation.reference-closure",
      "graph-runtime.saddle-denominator-transition"
    ],
    artifact: {
      artifactId: asset.id,
      artifactSourcePath:
        "src/animation/graph-3d-saddle-parameter-asset.ts",
      timelineId: asset.animation.timeline.id,
      hostId: "editor-animation-player",
      hostSourcePath: "src/editor/animation-player-controller.ts",
      rendererId: KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID,
      rendererSourcePath:
        "src/editor/graph-3d-saddle-parameter-surface-adapter.ts",
      directUrl: `/${writeKpAnimationCatalogueRoute("", {
        artifactId: asset.id
      })}`,
      directUrlSourcePath: "src/editor/animation-catalogue-route.ts"
    }
  });
}

function nonEmpty(
  diagnostics: readonly KpGalleryGenerationDiagnostic[]
): readonly [KpGalleryGenerationDiagnostic, ...KpGalleryGenerationDiagnostic[]] {
  if (diagnostics.length === 0) throw new Error(
    "A rejected Graph3D generation request requires diagnostics."
  );
  return diagnostics as readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}

function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => equal(value, right[index]));
  if (!isRecord(left) || !isRecord(right)) return false;
  // JSON object order is not a semantic edit; array order and every pin are.
  const keys = Object.keys(right);
  return Object.keys(left).length === keys.length && keys.every(key => Object.hasOwn(left, key) && equal(left[key], right[key]));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
