import {
  createKpExactFractionQuantityAnimationAsset
} from "../animation/exact-fraction-quantity-adapter.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../editor/animation-library-display-catalog.ts";
import {
  createKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime,
  type KpExactFractionQuantityRuntimeFrame,
  type KpExactFractionQuantityRuntimeSession
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
  KP_EXACT_FRACTION_FOLDABLE_NODE_IDS,
  compileKpExactFractionQuantityFoldProjection,
  createKpExactFractionQuantityFoldIntent
} from "../semantic/exact-fraction-quantity-evaluation-tree.ts";
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
  const denseFrames = manifest.browserAudit.denseProgressPermille.map(
    (progressPermille) => sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: progressPermille / 1_000
      }
    })
  );
  const foldProjections = [
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({
        mode: "expanded"
      })
    }),
    compileKpExactFractionQuantityFoldProjection({
      intent: createKpExactFractionQuantityFoldIntent({
        mode: "collapsed"
      })
    }),
    ...(["compact", "balanced", "roomy"] as const).map(
      (detailBudget) => compileKpExactFractionQuantityFoldProjection({
        intent: createKpExactFractionQuantityFoldIntent({
          mode: "automatic"
        }),
        detailBudget
      })
    ),
    ...KP_EXACT_FRACTION_FOLDABLE_NODE_IDS.map((nodeId) =>
      compileKpExactFractionQuantityFoldProjection({
        intent: createKpExactFractionQuantityFoldIntent({
          mode: "pinned",
          pinnedNodeIds: [nodeId]
        })
      })
    )
  ];
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
      hasKpExactFractionExecutableIntegration(session, denseFrames),
      [
        "src/animation/exact-fraction-quantity-presentation-plan.ts",
        "src/rendering/exact-fraction-quantity-runtime.ts",
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
        !/"foldMode"|"activeView"/u.test(serializedExport) &&
        foldProjections.every((projection) =>
          projection.semanticTruth.traceId === session.trace.id &&
          projection.semanticTruth.finalEqualityVerified &&
          projection.beatIds.length === session.trace.beats.length &&
          projection.semanticTruth.beatIds.every(
            (beatId, index) => beatId === session.trace.beats[index]?.id
          )
        ),
      [
        "src/rendering/exact-fraction-quantity-accessible-projection.ts",
        "src/semantic/exact-fraction-quantity-evaluation-tree.ts",
        "src/tutorial/exact-fraction-quantity-static-step-export.ts"
      ]
    ),
    prerequisite(
      "reviewable-animation-library-host",
      animation.metadata?.["canonicalHost"] === manifest.review.host &&
        displayEntry?.availability === "playable" &&
        (displayEntry.canonicalFormat === "partial" ||
          displayEntry.canonicalFormat === "ported") &&
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
      "evidence-derived-release-status",
      displayEntry?.canonicalFormat === "ported" &&
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

function hasKpExactFractionExecutableIntegration(
  session: KpExactFractionQuantityRuntimeSession,
  denseFrames: readonly KpExactFractionQuantityRuntimeFrame[]
): boolean {
  const serializedSymbolic = JSON.stringify(session.symbolic.motionInputs);
  const programClosure =
    session.operationEvaluation.symbolic.length === 3 &&
    session.identityFission.symbolic.length === 1 &&
    session.identityFusion.symbolic.length === 1 &&
    session.operationEvaluation.symbolic.every(({ forward, rewind }) =>
      forward.route === session.operationEvaluation.route &&
      rewind.route === session.operationEvaluation.route &&
      forward.continuityProgram.program ===
        session.operationEvaluation.program &&
      rewind.continuityProgram === forward.continuityProgram
    );
  return (
    programClosure &&
    session.presentation.beats.length === session.trace.beats.length &&
    session.presentation.schedulerVocabulary.length === 1 &&
    !serializedSymbolic.includes("legacyContinuityAuthority") &&
    !serializedSymbolic.includes("pathFamily") &&
    session.presentation.beats.every((beat) =>
      beat.scheduler === "shared-canonical-beat" &&
      beat.paintBindings.every(({ paintOpacity, lifecycle }) =>
        paintOpacity === 1 &&
        session.presentation.lifecycleVocabulary.includes(lifecycle)
      )
    ) &&
    denseFrames.length > 0 &&
    denseFrames.every((frame) => {
      const phase = frame.visibleOperation.programPhase;
      const sharedViewPhase = frame.visibleOperation.viewBindings.every(
        (binding) =>
          binding.invocationId === frame.visibleOperation.invocationId &&
          binding.phase === frame.visibleOperation.phase &&
          binding.programPhase === phase
      );
      const dispatchExecution = (() => {
        switch (frame.symbolicMotion.dispatch) {
          case "identity-fission":
            return frame.identityFission !== undefined &&
              frame.symbolicMotion.identityFissionExecutions !== undefined;
          case "identity-fusion":
            return frame.identityFusion !== undefined &&
              frame.symbolicMotion.identityFusionExecutions !== undefined;
          case "operation-evaluation":
            return frame.operationEvaluation !== undefined &&
              frame.symbolicMotion.operationEvaluationExecution !== undefined;
          case "continuant":
            return frame.symbolicMotion.segment.successorSyntheses.length === 0;
          default:
            return false;
        }
      })();
      return (
        frame.rendererSessionId === session.rendererSessionId &&
        frame.easingApplications === 1 &&
        sharedViewPhase &&
        dispatchExecution
      );
    })
  );
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
