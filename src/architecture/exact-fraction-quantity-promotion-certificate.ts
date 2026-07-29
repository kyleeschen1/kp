import {
  createKpExactFractionQuantityAnimationAsset
} from "../animation/exact-fraction-quantity-adapter.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../editor/animation-library-display-catalog.ts";
import {
  createKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime
} from "../rendering/exact-fraction-quantity-runtime.ts";
import {
  isKpExactFractionQuantitySynchronizedFrame
} from "../rendering/exact-fraction-quantity-synchronized-projection.ts";
import {
  isKpExactFractionQuantityViewBundle
} from "../semantic/exact-fraction-quantity-view-obligations.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  certifyKpExactFractionQuantityResponsiveLayout,
  checkKpExactFractionQuantityResponsiveLayout
} from "../reader/runtime/exact-fraction-quantity-responsive-layout.ts";
import {
  createKpExactFractionQuantityStaticStepExport
} from "../tutorial/exact-fraction-quantity-static-step-export.ts";
import {
  kpExactFractionQuantityPromotionPrerequisiteIds,
  type KpExactFractionQuantityPromotionEvidenceIssue,
  type KpExactFractionQuantityPromotionPrerequisiteEvidence,
  type KpExactFractionQuantityPromotionPrerequisiteId,
  type KpVerifiedExactFractionQuantityPromotionReadiness
} from "./exact-fraction-quantity-promotion-types.ts";

export {
  kpExactFractionQuantityPromotionPrerequisiteIds
} from "./exact-fraction-quantity-promotion-types.ts";
export type {
  KpExactFractionQuantityPromotionEvidenceIssue,
  KpExactFractionQuantityPromotionPrerequisiteEvidence,
  KpExactFractionQuantityPromotionPrerequisiteId,
  KpVerifiedExactFractionQuantityPromotionReadiness
} from "./exact-fraction-quantity-promotion-types.ts";

export function certifyKpExactFractionQuantityPromotionReadiness():
KpVerifiedExactFractionQuantityPromotionReadiness {
  const session = createKpExactFractionQuantityRuntimeSession();
  const checkpointFrames = manifest.checkpoints.map(
    ({ progressPermille }) => sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: progressPermille / 1_000
      }
    })
  );
  const animation = createKpExactFractionQuantityAnimationAsset();
  const staticExport = createKpExactFractionQuantityStaticStepExport();
  const displayEntry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === manifest.animationId
  );
  const reviewLayouts = manifest.presentation.reviewViewports.flatMap(
    (viewport) => manifest.viewObligations.map((activeView) =>
      certifyKpExactFractionQuantityResponsiveLayout({
        runtimeFrame: checkpointFrames[3]!,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor,
        activeView
      })
    )
  );
  const serializedExport = JSON.stringify(staticExport);
  const evidence = Object.freeze([
    prerequisite(
      "verified-exact-semantic-trace",
      session.trace.verification.finalEqualityVerified &&
        session.trace.states.length === manifest.checkpoints.length &&
        session.trace.beats.length === manifest.checkpoints.length &&
        session.trace.unitId === manifest.exactUnit.id,
      [
        "src/semantic/exact-fraction-quantity-trace.ts",
        "tests/exact-fraction-quantity-trace.test.ts"
      ]
    ),
    prerequisite(
      "sealed-four-view-correspondence",
      checkpointFrames.every(({ projection }) =>
        isKpExactFractionQuantitySynchronizedFrame(projection) &&
        isKpExactFractionQuantityViewBundle(projection.viewObligations) &&
        Object.keys(projection.viewObligations.projections).length ===
          manifest.preservationBoundary.requiredViewCount &&
        projection.atomicCorrespondences.length ===
          manifest.atomicPartIds.length
      ),
      [
        "src/rendering/exact-fraction-quantity-synchronized-projection.ts",
        "src/semantic/exact-fraction-quantity-view-obligations.ts"
      ]
    ),
    prerequisite(
      "canonical-motif-closure",
      session.presentation.beats.length === session.trace.beats.length &&
        session.presentation.schedulerVocabulary.length === 1 &&
        session.presentation.beats.every((beat) =>
          beat.scheduler === "shared-canonical-beat" &&
          beat.paintBindings.every(({ paintOpacity, lifecycle }) =>
            paintOpacity === 1 &&
            session.presentation.lifecycleVocabulary.includes(lifecycle)
          )
        ),
      [
        "src/animation/exact-fraction-quantity-presentation-plan.ts",
        "tests/exact-fraction-quantity-presentation-plan.test.ts"
      ]
    ),
    prerequisite(
      "exclusive-paint-ownership",
      session.rendererSessionCount ===
        manifest.authorityContract.canonicalRendererSessionCount &&
        checkpointFrames.every((frame) =>
          frame.ownershipPhase === "target-native" &&
          frame.settlementPolicy === "reuse-native-endpoint-geometry" &&
          frame.viewPaintOwnership.every(({ nativeOpacity, transientOpacity }) =>
            nativeOpacity === 1 && transientOpacity === 0
          )
        ),
      [
        "src/rendering/exact-fraction-quantity-runtime.ts",
        "tests/exact-fraction-quantity-runtime.test.ts"
      ]
    ),
    prerequisite(
      "certified-responsive-layout",
      reviewLayouts.length > 0 &&
        reviewLayouts.every((layout) =>
          checkKpExactFractionQuantityResponsiveLayout(layout).length === 0 &&
          layout.readabilityFloorSatisfied &&
          layout.slots.every(({ scale }) => scale === 1)
        ),
      [
        "src/reader/runtime/exact-fraction-quantity-responsive-layout.ts",
        "tests/exact-fraction-quantity-responsive-layout.test.ts"
      ]
    ),
    prerequisite(
      "accessible-static-export",
      animation.exportTargets.length === 1 &&
        animation.exportTargets[0]?.kind === "static-step" &&
        staticExport.diagnostics.length === 0 &&
        staticExport.steps.length === session.accessibility.steps.length &&
        staticExport.steps.length === manifest.checkpoints.length &&
        serializedExport.includes(
          "<math xmlns=\\\"http://www.w3.org/1998/Math/MathML\\\""
        ) &&
        (serializedExport.match(/role=\\"img\\"/gu) ?? []).length === 15 &&
        !/"foldMode"|"activeView"/u.test(serializedExport),
      [
        "src/rendering/exact-fraction-quantity-accessible-projection.ts",
        "src/tutorial/exact-fraction-quantity-static-step-export.ts"
      ]
    ),
    prerequisite(
      "reviewable-animation-library-host",
      animation.metadata?.["canonicalHost"] === manifest.review.host &&
        displayEntry?.availability === "playable" &&
        displayEntry.canonicalFormat === "partial" &&
        displayEntry.representations.filter(
          ({ role }) => role === "canonical-host"
        ).length === 1 &&
        manifest.review.captureAtomic &&
        manifest.review.lazyContactSheetHydration &&
        !manifest.review.addsDisplayPage,
      [
        "src/editor/exact-fraction-quantity-surface-adapter.ts",
        "src/dev-review/editor-animation-library-capture-provider.ts",
        "tests/exact-fraction-quantity-animation-library.browser.spec.ts"
      ]
    ),
    prerequisite(
      "three-browser-resource-contract",
      manifest.browserAudit.browsers.join(",") ===
        "chromium,firefox,webkit" &&
        manifest.browserAudit.denseProgressPermille.at(0) === 0 &&
        manifest.browserAudit.denseProgressPermille.at(-1) === 1_000 &&
        manifest.browserAudit.deviceScaleFactors.includes(2) &&
        manifest.browserAudit.maximumSymbolicSessionCount === 1 &&
        manifest.browserAudit.maximumWebglLeaseCount === 0,
      [
        "tests/exact-fraction-quantity-determinism.browser.spec.ts",
        "package.json"
      ]
    ),
    prerequisite(
      "evidence-derived-partial-status",
      displayEntry?.canonicalFormat === "partial" &&
        !JSON.stringify(displayEntry).includes(
          "humanReviewApproved\":true"
        ),
      [
        "src/editor/animation-library-display-catalog.ts",
        "scripts/check-animation-promotion-memory.ts"
      ]
    )
  ] satisfies readonly KpExactFractionQuantityPromotionPrerequisiteEvidence[]);
  const issues = checkKpExactFractionQuantityPromotionEvidence(evidence);
  if (issues.length > 0) {
    throw new Error(issues.map(({ message }) => message).join("\n"));
  }

  // The nominal brand is declared in the lightweight type module; this
  // verifier is the only boundary allowed to assert the hidden mark.
  return Object.freeze({
    schemaVersion:
      "kp.verified-exact-fraction-quantity-promotion-readiness.v1" as const,
    animationId: manifest.animationId,
    status: "ready-for-human-review" as const,
    prerequisiteEvidence: evidence,
    remainingGate: "human-perceptual-review" as const
  }) as KpVerifiedExactFractionQuantityPromotionReadiness;
}

export function checkKpExactFractionQuantityPromotionEvidence(
  evidence:
    readonly KpExactFractionQuantityPromotionPrerequisiteEvidence[]
): readonly KpExactFractionQuantityPromotionEvidenceIssue[] {
  const issues: KpExactFractionQuantityPromotionEvidenceIssue[] = [];
  for (const id of kpExactFractionQuantityPromotionPrerequisiteIds) {
    const matching = evidence.filter((candidate) => candidate.id === id);
    if (matching.length === 0) {
      issues.push({
        code: "promotion-evidence.missing",
        prerequisiteId: id,
        message: `Exact-fraction promotion evidence is missing ${id}.`
      });
    } else if (matching.length > 1) {
      issues.push({
        code: "promotion-evidence.duplicate",
        prerequisiteId: id,
        message: `Exact-fraction promotion evidence repeats ${id}.`
      });
    } else if (matching[0]!.evidenceSourceIds.length === 0) {
      issues.push({
        code: "promotion-evidence.empty-source",
        prerequisiteId: id,
        message: `Exact-fraction promotion evidence ${id} has no source.`
      });
    }
  }
  return Object.freeze(issues);
}

function prerequisite<
  const TId extends KpExactFractionQuantityPromotionPrerequisiteId
>(
  id: TId,
  passed: boolean,
  evidenceSourceIds: readonly string[]
): KpExactFractionQuantityPromotionPrerequisiteEvidence & {
  readonly id: TId;
} {
  if (!passed) {
    throw new Error(
      `Exact-fraction promotion prerequisite ${id} did not pass.`
    );
  }
  if (evidenceSourceIds.length === 0) {
    throw new Error(
      `Exact-fraction promotion prerequisite ${id} lacks evidence.`
    );
  }
  return Object.freeze({
    id,
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}
