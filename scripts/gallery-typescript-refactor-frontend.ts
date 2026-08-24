import { orchestrateKpCodeGeneration } from
  "./code-generation-orchestrator.ts";
import type { KpCrossDomainGalleryFrontend } from
  "./cross-domain-gallery-generation-router.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import {
  KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
  KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY
} from "../src/domain-ir/code-extract-helper-authorities.ts";
import type {
  KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";
import {
  projectKpGalleryAcceptedGeneration,
  projectKpGalleryGenerationRepair,
  type KpGalleryGenerationDiagnostic,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";
import { writeKpAnimationCatalogueRoute } from
  "../src/editor/animation-catalogue-route.ts";

export const KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE =
  "scripts/typescript-code-generation-frontend.ts" as const;

export const kpGalleryTypeScriptExplanationClaims = deepFreeze([{
  id: "claim.code.typescript.extract-helper.legality",
  statement:
    "The TypeScript frontend proves one equivalent repeated decision and preserves required bindings.",
  authorityIds: [
    KP_TYPESCRIPT_EXTRACT_HELPER_OPERATION_AUTHORITY,
    "kp.typescript-extract-helper-legality.v1"
  ]
}, {
  id: "claim.code.typescript.extract-helper.causal-change",
  statement:
    "The shared decision becomes one helper and each former contributor becomes a call.",
  authorityIds: [
    KP_CODE_EXTRACT_HELPER_RECIPE_AUTHORITY,
    "kp.extract-helper-causal-contract.v1"
  ]
}, {
  id: "claim.code.typescript.extract-helper.behavior-cases",
  statement:
    "The canonical before and after revisions agree on every declared boundary case.",
  authorityIds: [
    kpTypeScriptFreeShippingRefactorContract.id,
    "kp.typescript-refactor-behavior-certificate.v1"
  ]
}] as const);

export const kpGalleryTypeScriptRefactorRequest = deepFreeze({
  schemaVersion: "kp.animation-generation-request.v1" as const,
  kind: "animation-generation-request" as const,
  requestId: "request.code.typescript.extract-helper.gallery.v1",
  domain: "code" as const,
  source: {
    kind: "code.source-revisions",
    frontendId: "frontend.code.typescript-compiler.v1",
    input: {
      schemaVersion: "kp.code-refactor-generation-request.v1" as const,
      kind: "code-refactor-generation-request" as const,
      requestId: "request.code.typescript.extract-helper.v1",
      language: "typescript" as const,
      revisions: [{
        revisionId: kpTypeScriptFreeShippingRefactorContract.before.revisionId,
        role: "before" as const,
        path: kpTypeScriptFreeShippingRefactorContract.before.path,
        sourceText: kpTypeScriptFreeShippingRefactorContract.before.source
      }, {
        revisionId: kpTypeScriptFreeShippingRefactorContract.after.revisionId,
        role: "after" as const,
        path: kpTypeScriptFreeShippingRefactorContract.after.path,
        sourceText: kpTypeScriptFreeShippingRefactorContract.after.source
      }],
      intent: {
        kind: "extract-helper" as const,
        preserve: ["behavior", "program-identity"] as const
      }
    }
  },
  intent: {
    kind: "code.extract-helper",
    summary: "Extract the duplicated free-shipping predicate into one helper.",
    parameters: { operation: "extract-helper" }
  },
  expectedOutputs: [
    "semantic-plan" as const,
    "animation-artifact" as const,
    "typed-diagnostics" as const,
    "coverage-evidence" as const
  ],
  capabilityPins: ["capability.code.typescript-refactoring"]
} satisfies KpAnimationGenerationRequest);

export const kpGalleryTypeScriptRefactorFrontend = Object.freeze({
  domain: "code",
  sourceKind: "code.source-revisions",
  frontendId: "frontend.code.typescript-compiler.v1",
  capabilityPins: ["capability.code.typescript-refactoring"],
  authoritySourcePath: KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE,
  project: projectTypeScriptRefactor
} as const satisfies KpCrossDomainGalleryFrontend);

function projectTypeScriptRefactor(
  request: KpAnimationGenerationRequest
): KpGalleryGenerationResult {
  const orchestration = orchestrateKpCodeGeneration(request);
  if (orchestration.status !== "accepted") {
    return projectKpGalleryGenerationRepair({
      request,
      frontendAuthoritySourcePath: KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE,
      diagnostics: nonEmpty(orchestration.diagnostics.map(toDiagnostic))
    });
  }

  const semanticTrace = {
    id: orchestration.semanticPlan.causalContract.contractId,
    kind: orchestration.semanticPlan.causalContract.schemaVersion,
    authoritySourcePath: KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE
  };
  const semanticClaimRefs = kpGalleryTypeScriptExplanationClaims
    .slice(0, 2).map(({ id }) => id);
  const semanticEvidenceRefs = [
    orchestration.semanticPlan.schemaVersion,
    orchestration.semanticPlan.legality.schemaVersion,
    orchestration.semanticPlan.causalContract.schemaVersion
  ];
  if (orchestration.target.status === "semantic-plan-only") {
    return projectKpGalleryAcceptedGeneration({
      status: "semantic-plan-only",
      request,
      frontendAuthoritySourcePath: KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE,
      semanticTrace,
      explanationClaimRefs: semanticClaimRefs,
      evidenceRefs: semanticEvidenceRefs,
      reason: orchestration.target.reason
    });
  }

  const asset = createKpTypeScriptFreeShippingAnimationAsset();
  if (
    orchestration.target.artifactId !== asset.id ||
    orchestration.target.timelineId !== asset.score.timeline.id
  ) throw new Error(
    "The TypeScript generation target lost canonical artifact or clock authority."
  );
  return projectKpGalleryAcceptedGeneration({
    status: "existing-artifact",
    request,
    frontendAuthoritySourcePath: KP_GALLERY_TYPESCRIPT_FRONTEND_SOURCE,
    semanticTrace,
    explanationClaimRefs: kpGalleryTypeScriptExplanationClaims.map(
      ({ id }) => id
    ),
    evidenceRefs: [
      ...semanticEvidenceRefs,
      asset.operations.id,
      asset.behavior.schemaVersion
    ],
    artifact: {
      artifactId: asset.id,
      artifactSourcePath:
        "src/semantic/typescript-free-shipping-animation-asset.ts",
      timelineId: orchestration.target.timelineId,
      hostId: "editor-animation-player",
      hostSourcePath: "src/editor/animation-player-controller.ts",
      rendererId: "adapter.programming.typescript-free-shipping-refactor",
      rendererSourcePath: "src/editor/typescript-refactor-surface-adapter.ts",
      directUrl: `/${writeKpAnimationCatalogueRoute("", {
        artifactId: asset.id
      })}`,
      directUrlSourcePath: "src/editor/animation-catalogue-route.ts",
      vignetteId: "vignette.programming.typescript-free-shipping",
      vignetteSourcePath:
        "src/article/vignettes/typescript-free-shipping-vignette.ts"
    }
  });
}

function toDiagnostic(value: unknown): KpGalleryGenerationDiagnostic {
  const diagnostic = value as Record<string, unknown>;
  const repair = diagnostic["repair"];
  return Object.freeze({
    authority: "domain-frontend" as const,
    code: typeof diagnostic["code"] === "string"
      ? diagnostic["code"]
      : "code-generation.unknown-repair",
    path: typeof diagnostic["path"] === "string" ? diagnostic["path"] : "$",
    message: typeof diagnostic["message"] === "string"
      ? diagnostic["message"]
      : "The TypeScript frontend rejected the request.",
    repair: typeof repair === "string"
      ? repair
      : isRecord(repair) && typeof repair["summary"] === "string"
        ? repair["summary"]
        : "Repair the request using the domain frontend diagnostic."
  });
}

function nonEmpty(
  values: readonly KpGalleryGenerationDiagnostic[]
): readonly [KpGalleryGenerationDiagnostic, ...KpGalleryGenerationDiagnostic[]] {
  if (values.length === 0) throw new Error(
    "A rejected TypeScript generation result requires diagnostics."
  );
  return values as readonly [
    KpGalleryGenerationDiagnostic,
    ...KpGalleryGenerationDiagnostic[]
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
