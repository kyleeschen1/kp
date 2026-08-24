import type {
  KpCrossDomainGalleryFrontend
} from "./cross-domain-gallery-generation-router.ts";
import { createKpLogExponentAnimationAsset } from
  "../src/animation/log-exponent-adapter.ts";
import { createKpEquationSurfaceInventory } from
  "../src/architecture/equation-surface-inventory.ts";
import { kpLogExponentExemplarIdentity } from
  "../src/architecture/log-exponent-exemplar-contract.ts";
import type { KpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import {
  projectKpGalleryAcceptedGeneration,
  projectKpGalleryGenerationRepair,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";
import { kpCanonicalLogExponentAuthoredProgram } from
  "../src/semantic/log-exponent-authored-operations.ts";
import { kpCanonicalLogExponentSolveStates } from
  "../src/semantic/log-exponent-solve-states.ts";
import { kpCanonicalLogExponentTransformationTree } from
  "../src/semantic/log-exponent-transformation-tree.ts";

export const KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_ID =
  "frontend.equation.logarithmic-solve-exemplar.v1" as const;
export const KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_SOURCE =
  "scripts/gallery-logarithmic-solve-frontend.ts" as const;

export const kpGalleryLogarithmicSolveCapabilityPins = Object.freeze([
  "capability.equation.transform-series",
  "capability.equation.balanced-operations",
  "capability.equation.power-and-exponent-transformations"
]);

export const kpGalleryLogarithmicSolveExplanationClaims = deepFreeze([{
  id: "claim.equation.logarithmic-solve.apply-log-both-sides",
  statement:
    "Natural logarithms enter on both sides under the positive-domain assumptions.",
  authorityIds: [
    "operation.log-exponent.apply-log-both-sides",
    "assumption.log-exponent.power-positive",
    "assumption.log-exponent.right-positive"
  ]
}, {
  id: "claim.equation.logarithmic-solve.extract-exponent",
  statement:
    "The logarithm power law moves x into coefficient position while 2 stays the log argument.",
  authorityIds: [
    "operation.log-exponent.extract-exponent",
    "law.logarithm.power"
  ]
}, {
  id: "claim.equation.logarithmic-solve.isolate-x",
  statement:
    "Dividing both sides by nonzero ln 2 isolates x with an exact symbolic quotient.",
  authorityIds: [
    "operation.log-exponent.divide-by-log-base",
    "law.equation.divide-both-sides",
    "assumption.log-exponent.log-base-nonzero"
  ]
}] as const);

const canonicalSourceInput = deepFreeze({
  schemaVersion: "kp.gallery-logarithmic-solve-source.v1",
  programId: kpCanonicalLogExponentAuthoredProgram.id,
  transformationTreeId: kpCanonicalLogExponentTransformationTree.id,
  states: kpCanonicalLogExponentSolveStates.map(({ id, latex }) => ({
    id,
    latex
  }))
});

const canonicalIntentParameters = deepFreeze({
  operationIds: kpCanonicalLogExponentAuthoredProgram.operations.map(
    ({ id }) => id
  ),
  terminalForm: "exact-symbolic-quotient"
});

export const kpGalleryLogarithmicSolveRequest = deepFreeze({
  schemaVersion: "kp.animation-generation-request.v1" as const,
  kind: "animation-generation-request" as const,
  requestId: "request.equation.logarithmic-solve.two-power-x.v1",
  domain: "equation" as const,
  source: {
    kind: "equation.canonical-logarithmic-solve",
    frontendId: KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_ID,
    input: canonicalSourceInput
  },
  intent: {
    kind: "equation.solve-exponential-with-logarithms",
    summary: "Solve 2^x = 7 exactly by applying logarithms.",
    parameters: canonicalIntentParameters
  },
  expectedOutputs: [
    "semantic-plan" as const,
    "animation-artifact" as const,
    "typed-diagnostics" as const,
    "coverage-evidence" as const
  ],
  capabilityPins: kpGalleryLogarithmicSolveCapabilityPins
} satisfies KpAnimationGenerationRequest);

export const kpGalleryLogarithmicSolveFrontend = Object.freeze({
  domain: "equation",
  sourceKind: "equation.canonical-logarithmic-solve",
  frontendId: KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_ID,
  capabilityPins: kpGalleryLogarithmicSolveCapabilityPins,
  authoritySourcePath: KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_SOURCE,
  project: projectCanonicalLogarithmicSolve
} as const satisfies KpCrossDomainGalleryFrontend);

function projectCanonicalLogarithmicSolve(
  request: KpAnimationGenerationRequest
): KpGalleryGenerationResult {
  if (
    !equal(request.source.input, canonicalSourceInput) ||
    !equal(request.intent.parameters, canonicalIntentParameters)
  ) return projectKpGalleryGenerationRepair({
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_SOURCE,
    diagnostics: [{
      authority: "domain-frontend",
      code: "gallery-generation.equation.exact-exemplar-required",
      path: "$.source.input",
      message:
        "This frontend resolves only the reviewed 2^x = 7 logarithmic solve.",
      repair:
        "Use the canonical states and operations or request a semantic plan from a supported equation frontend."
    }]
  });

  const asset = createKpLogExponentAnimationAsset();
  const surface = createKpEquationSurfaceInventory().entries.find(
    ({ animationId }) => animationId === kpLogExponentExemplarIdentity.animationId
  );
  if (surface === undefined || asset.timeline === undefined ||
      asset.id !== kpLogExponentExemplarIdentity.animationId) {
    throw new Error(
      "The canonical logarithmic solve lost its asset, timeline, or Catalogue surface authority."
    );
  }

  return projectKpGalleryAcceptedGeneration({
    status: "existing-artifact",
    request,
    frontendAuthoritySourcePath:
      KP_GALLERY_LOGARITHMIC_SOLVE_FRONTEND_SOURCE,
    semanticTrace: {
      id: kpCanonicalLogExponentTransformationTree.id,
      kind: kpCanonicalLogExponentTransformationTree.schemaVersion,
      authoritySourcePath:
        "src/semantic/log-exponent-transformation-tree.ts"
    },
    explanationClaimRefs:
      kpGalleryLogarithmicSolveExplanationClaims.map(({ id }) => id),
    evidenceRefs: [
      "evidence.equation.logarithmic-solve.exemplar-contract",
      "evidence.equation.logarithmic-solve.surface-preservation"
    ],
    artifact: {
      artifactId: asset.id,
      artifactSourcePath: surface.semanticOwner.sourcePath,
      timelineId: asset.timeline.id,
      hostId: surface.clockAuthority.ownerId,
      hostSourcePath: surface.clockAuthority.sourcePath,
      rendererId: surface.catalogueSurface.rendererAdapterId,
      rendererSourcePath: surface.catalogueSurface.rendererSourcePath,
      directUrl: surface.currentPresentationAuthority.href,
      directUrlSourcePath:
        surface.currentPresentationAuthority.sourcePath
    }
  });
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
