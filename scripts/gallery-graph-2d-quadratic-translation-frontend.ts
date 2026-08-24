import type { KpCrossDomainGalleryFrontend } from
  "./cross-domain-gallery-generation-router.ts";
import {
  createKpGraph2DQuadraticTranslationAnimationAsset
} from "../src/animation/graph-2d-quadratic-translation-asset.ts";
import type { KpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import {
  KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
  KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY,
  KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
  KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY,
  kpGraph2DQuadraticTranslationRequest
} from "../src/domain-ir/graph-2d-function-generation-request.ts";
import {
  projectKpGalleryAcceptedGeneration,
  projectKpGalleryGenerationRepair,
  type KpGalleryGenerationDiagnostic,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";
import {
  compileKpGraph2DQuadraticTranslation,
  type KpGraph2DQuadraticTranslationClaim
} from "../src/semantic/graph-2d-quadratic-translation-trace.ts";
import {
  KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID
} from "../src/editor/graph-2d-quadratic-translation-surface-adapter.ts";
import { writeKpAnimationCatalogueRoute } from
  "../src/editor/animation-catalogue-route.ts";

export const KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_FRONTEND_SOURCE =
  "scripts/gallery-graph-2d-quadratic-translation-frontend.ts" as const;
export const KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_SOURCE_KIND =
  "graph-2d.function-parameters" as const;

const canonicalIntentParameters = deepFreeze({
  familyId: KP_GRAPH_2D_MONIC_QUADRATIC_FAMILY,
  operationId: KP_GRAPH_2D_HORIZONTAL_TRANSLATION_OPERATION,
  sourceHorizontalShift: 0,
  targetHorizontalShift: 2,
  preserve: [
    "function-family",
    "curve-identity",
    "axis-context"
  ]
});

const canonicalCompilation = compileKpGraph2DQuadraticTranslation(
  kpGraph2DQuadraticTranslationRequest
);
if (canonicalCompilation.status !== "accepted") throw new Error(
  "The canonical Graph2D gallery request must compile."
);

export const kpGalleryGraph2DQuadraticTranslationExplanationClaims:
readonly KpGraph2DQuadraticTranslationClaim[] =
  canonicalCompilation.trace.claims;

export const kpGalleryGraph2DQuadraticTranslationRequest = deepFreeze({
  schemaVersion: "kp.animation-generation-request.v1" as const,
  kind: "animation-generation-request" as const,
  requestId: "request.graph-2d.quadratic-translate-right-two.gallery.v1",
  domain: "graph-2d" as const,
  source: {
    kind: KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_SOURCE_KIND,
    frontendId: KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
    input: kpGraph2DQuadraticTranslationRequest
  },
  intent: {
    kind: "graph-2d.translate-function-horizontally",
    summary:
      "Translate y = x squared two units right while preserving curve and point identity.",
    parameters: canonicalIntentParameters
  },
  expectedOutputs: [
    "semantic-plan" as const,
    "animation-artifact" as const,
    "typed-diagnostics" as const,
    "coverage-evidence" as const
  ],
  capabilityPins: [KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY]
} satisfies KpAnimationGenerationRequest);

export const kpGalleryGraph2DQuadraticTranslationFrontend = Object.freeze({
  domain: "graph-2d",
  sourceKind: KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_SOURCE_KIND,
  frontendId: KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
  capabilityPins: [KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY],
  authoritySourcePath:
    KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_FRONTEND_SOURCE,
  project: projectGraph2DQuadraticTranslation
} as const satisfies KpCrossDomainGalleryFrontend);

function projectGraph2DQuadraticTranslation(
  request: KpAnimationGenerationRequest
): KpGalleryGenerationResult {
  if (
    request.intent.kind !== "graph-2d.translate-function-horizontally" ||
    !equal(request.intent.parameters, canonicalIntentParameters)
  ) return projectKpGalleryGenerationRepair({
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_FRONTEND_SOURCE,
    diagnostics: [{
      authority: "domain-frontend",
      code: "gallery-generation.graph-2d.intent-unsupported",
      path: "$.intent",
      message:
        "This frontend owns only the reviewed monic-quadratic translation from h = 0 to h = 2.",
      repair:
        "Use the pinned horizontal-translation intent or retain a typed Graph2D repair gap."
    }]
  });

  const compilation = compileKpGraph2DQuadraticTranslation(
    request.source.input
  );
  if (compilation.status !== "accepted") {
    return projectKpGalleryGenerationRepair({
      request,
      frontendAuthoritySourcePath:
        KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_FRONTEND_SOURCE,
      diagnostics: nonEmpty(compilation.diagnostics.map((diagnostic) => ({
        authority: "domain-frontend" as const,
        ...diagnostic
      })))
    });
  }

  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  if (
    asset.trace.id !== compilation.trace.id ||
    asset.animation.timeline === undefined
  ) throw new Error(
    "The Graph2D generation route lost its semantic trace or timeline authority."
  );

  return projectKpGalleryAcceptedGeneration({
    // This asset is deterministically compiled from the accepted request; it
    // does not become an approved existing exemplar before the visual gate.
    status: "compiled-artifact",
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_GRAPH_2D_QUADRATIC_TRANSLATION_FRONTEND_SOURCE,
    semanticTrace: {
      id: compilation.trace.id,
      kind: compilation.trace.schemaVersion,
      authoritySourcePath:
        "src/semantic/graph-2d-quadratic-translation-trace.ts"
    },
    explanationClaimRefs: compilation.trace.claims.map(({ id }) => id),
    evidenceRefs: [
      compilation.trace.operationId,
      compilation.trace.recipeId,
      ...(compilation.trace.transformation.lawRefs ?? []).map(({ id }) => id),
      "animation.reference-closure",
      "graph-runtime.quadratic-horizontal-translation"
    ],
    artifact: {
      artifactId: asset.id,
      artifactSourcePath:
        "src/animation/graph-2d-quadratic-translation-asset.ts",
      timelineId: asset.animation.timeline.id,
      hostId: "editor-animation-player",
      hostSourcePath: "src/editor/animation-player-controller.ts",
      rendererId: KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID,
      rendererSourcePath:
        "src/editor/graph-2d-quadratic-translation-surface-adapter.ts",
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
    "A rejected Graph2D generation request requires diagnostics."
  );
  return diagnostics as readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
