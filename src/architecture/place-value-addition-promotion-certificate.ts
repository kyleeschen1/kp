import {
  createKpPlaceValueAdditionAnimationAsset
} from "../animation/place-value-addition-adapter.ts";
import {
  kpAnimationCatalogPackId
} from "../animation/catalog-loader.ts";
import {
  validateKpAnimationAsset
} from "../animation/asset.ts";
import {
  kpPlaceValueAdditionRuntimeControllerPolicy
} from "../rendering/place-value-addition-runtime-controller.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../rendering/place-value-addition-runtime.ts";
import {
  createKpPlaceValueAdditionStaticStepExport
} from "../tutorial/place-value-addition-static-step-export.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  isKpVerifiedPlaceValueSemanticFoundation
} from "./place-value-addition-semantic-foundation.ts";
import {
  kpPlaceValueAdditionPromotionPrerequisiteIds,
  type KpPlaceValueAdditionPromotionEvidenceIssue,
  type KpPlaceValueAdditionPromotionPrerequisiteEvidence,
  type KpPlaceValueAdditionPromotionPrerequisiteId,
  type KpVerifiedPlaceValueAdditionPromotionReadiness
} from "./place-value-addition-promotion-types.ts";

export {
  kpPlaceValueAdditionPromotionPrerequisiteIds
} from "./place-value-addition-promotion-types.ts";
export type {
  KpPlaceValueAdditionPromotionEvidenceIssue,
  KpPlaceValueAdditionPromotionPrerequisiteEvidence,
  KpPlaceValueAdditionPromotionPrerequisiteId,
  KpVerifiedPlaceValueAdditionPromotionReadiness
} from "./place-value-addition-promotion-types.ts";

const sealedReadinessCertificates = new WeakSet<object>();

export function certifyKpPlaceValueAdditionPromotionReadiness():
KpVerifiedPlaceValueAdditionPromotionReadiness {
  const runtime = createKpPlaceValueAdditionRuntimeSession();
  const animation = createKpPlaceValueAdditionAnimationAsset();
  const staticExport = createKpPlaceValueAdditionStaticStepExport();
  const presentation = runtime.foundation.presentation;
  const evidence = Object.freeze([
    prerequisite(
      "verified-place-value-trace",
      isKpVerifiedPlaceValueSemanticFoundation(runtime.foundation) &&
        runtime.foundation.trace.verification.exactResultVerified &&
        runtime.foundation.trace.verification.carryIdentityVerified &&
        runtime.foundation.trace.beats.length === reference.beats.length,
      [
        "src/semantic/place-value-addition-trace.ts",
        "src/architecture/place-value-addition-semantic-foundation.ts"
      ]
    ),
    prerequisite(
      "canonical-motif-closure",
      presentation.beats.length === reference.beats.length &&
        presentation.schedulerVocabulary.length === 1 &&
        presentation.beats.every((beat) =>
          beat.programs.length > 0 &&
          beat.programs.every(
            ({ opacityPolicy, scheduler }) =>
              scheduler === "shared-canonical-beat" &&
              opacityPolicy === "opaque"
          )
        ),
      [
        "src/animation/place-value-addition-presentation-plan.ts",
        "tests/place-value-addition-presentation-plan.test.ts"
      ]
    ),
    prerequisite(
      "synchronized-written-and-base-ten-runtime",
      runtime.mountedViews.join(",") === "written,base-ten" &&
        runtime.written.traceId === runtime.foundation.trace.id &&
        runtime.baseTen.traceId === runtime.foundation.trace.id,
      [
        "src/rendering/place-value-addition-runtime.ts",
        "src/rendering/place-value-addition-shared-dom.ts"
      ]
    ),
    prerequisite(
      "exclusive-runtime-ownership",
      runtime.rendererSessionCount === 1 &&
        runtime.clockAuthority === "reader-playback-clock" &&
        runtime.rendererSessionId ===
          "renderer-session.place-value-addition.278-plus-156",
      [
        "src/rendering/place-value-addition-runtime.ts",
        "src/rendering/place-value-addition-runtime-controller.ts"
      ]
    ),
    prerequisite(
      "responsive-and-resource-policy",
      kpPlaceValueAdditionRuntimeControllerPolicy.schedulerAuthority ===
        "reader-frame-scheduler" &&
        kpPlaceValueAdditionRuntimeControllerPolicy.webglLeaseCount === 0 &&
        reference.secondaryViewBoundary.primaryAlwaysAvailable &&
        !reference.secondaryViewBoundary.mayReducePrimaryReadability,
      [
        "src/rendering/place-value-addition-responsive-surface.ts",
        "tests/place-value-addition-runtime-controller.browser.spec.ts"
      ]
    ),
    prerequisite(
      "accessible-static-export",
      staticExport.diagnostics.length === 0 &&
        staticExport.steps.length === reference.beats.length &&
        animation.exportTargets.length === 1 &&
        animation.exportTargets[0]?.kind === "static-step",
      [
        "src/rendering/place-value-addition-accessible-projection.ts",
        "src/tutorial/place-value-addition-static-step-export.ts"
      ]
    ),
    prerequisite(
      "lazy-animation-library-host",
      validateKpAnimationAsset(animation).length === 0 &&
        animation.metadata?.["canonicalHost"] ===
          "editor-animation-library" &&
        animation.metadata?.["lazyCapabilityPack"] === "place-value" &&
        kpAnimationCatalogPackId(animation.id) === "place-value",
      [
        "src/animation/catalog-packs/place-value.ts",
        "src/editor/place-value-addition-surface-adapter.ts"
      ]
    ),
    prerequisite(
      "three-browser-review-contract",
      reference.review.requiredProfiles.join(",") === "wide,phone" &&
        reference.review.requiredDirections.join(",") ===
          "forward,rewind" &&
        reference.review.denseBoundariesPermille.at(0) === 0 &&
        reference.review.denseBoundariesPermille.at(-1) === 1_000,
      [
        "playwright.place-value-addition.config.ts",
        "tests/place-value-addition-animation-library.browser.spec.ts"
      ]
    )
  ] satisfies readonly
    KpPlaceValueAdditionPromotionPrerequisiteEvidence[]);
  const issues = checkKpPlaceValueAdditionPromotionEvidence(evidence);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }

  const certificate = Object.freeze({
    schemaVersion:
      "kp.verified-place-value-addition-promotion-readiness.v1" as const,
    animationId: reference.animationId,
    status: "ready-for-human-review" as const,
    prerequisiteEvidence: evidence,
    remainingGate: "human-perceptual-review" as const
  });
  sealedReadinessCertificates.add(certificate);
  return certificate as KpVerifiedPlaceValueAdditionPromotionReadiness;
}

export function isKpVerifiedPlaceValueAdditionPromotionReadiness(
  value: unknown
): value is KpVerifiedPlaceValueAdditionPromotionReadiness {
  return typeof value === "object" &&
    value !== null &&
    sealedReadinessCertificates.has(value);
}

export function checkKpPlaceValueAdditionPromotionEvidence(
  evidence:
    readonly KpPlaceValueAdditionPromotionPrerequisiteEvidence[]
): readonly KpPlaceValueAdditionPromotionEvidenceIssue[] {
  const issues: KpPlaceValueAdditionPromotionEvidenceIssue[] = [];
  for (const id of kpPlaceValueAdditionPromotionPrerequisiteIds) {
    const matching = evidence.filter((candidate) => candidate.id === id);
    if (matching.length === 0) {
      issues.push({
        code: "promotion-evidence.missing",
        prerequisiteId: id,
        message: `Place-value promotion evidence is missing ${id}.`
      });
    } else if (matching.length > 1) {
      issues.push({
        code: "promotion-evidence.duplicate",
        prerequisiteId: id,
        message: `Place-value promotion evidence repeats ${id}.`
      });
    } else if (matching[0]!.evidenceSourceIds.length === 0) {
      issues.push({
        code: "promotion-evidence.empty-source",
        prerequisiteId: id,
        message: `Place-value promotion evidence ${id} has no source.`
      });
    }
  }
  return Object.freeze(issues.map((issue) => Object.freeze(issue)));
}

function prerequisite(
  id: KpPlaceValueAdditionPromotionPrerequisiteId,
  passed: boolean,
  evidenceSourceIds: readonly string[]
): KpPlaceValueAdditionPromotionPrerequisiteEvidence {
  if (!passed) {
    throw new Error(
      `Place-value promotion prerequisite ${id} did not pass.`
    );
  }
  return Object.freeze({
    id,
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}
