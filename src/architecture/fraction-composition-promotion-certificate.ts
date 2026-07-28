import {
  createKpFractionCompositionEquationAnimationAsset
} from "../animation/fraction-composition-equation-adapter.ts";
import {
  createKpFractionCompositionVisualMotifTimeline
} from "../animation/fraction-composition-visual-motifs.ts";
import {
  checkTransformTreeVisualMotifRewindLaw
} from "../animation/motifs/visual-motif-composition.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../editor/animation-library-display-catalog.ts";
import {
  createKpLearnerExperienceLibrary
} from "../editor/learner-experience-library.ts";
import {
  fractionCompositionDescriptor
} from "../reader/app/equation-lesson-descriptors/fraction-composition.ts";
import {
  compileKpReaderCanonicalTransitionPolicy
} from "../reader/app/equation-lesson-descriptor.ts";
import {
  planKpFractionCompositionLayout
} from "../reader/runtime/fraction-composition-layout.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../semantic/fraction-solve-macro.ts";
import {
  createKpFractionCompositionStaticStepExport
} from "../tutorial/fraction-composition-static-step-export.ts";
import {
  compileKpFractionCompositionEquationLesson
} from "../reader/compiler/fraction-composition-equation-lesson.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "../reader/compiler/fraction-composition-preservation-manifest.ts";
import {
  kpFractionCompositionPromotionInventory
} from "../reader/compiler/fraction-composition-promotion-inventory.ts";
import {
  kpReaderRouteManifest
} from "../reader/compiler/reader-route-manifest.ts";
import {
  kpFractionCompositionPromotionPrerequisiteIds,
  type KpFractionCompositionPromotionPrerequisiteEvidence,
  type KpFractionCompositionPromotionPrerequisiteId,
  type KpFractionCompositionPromotionReadinessInput,
  type KpVerifiedFractionCompositionPromotionReadiness
} from "./fraction-composition-promotion-types.ts";

export {
  kpFractionCompositionPromotionPrerequisiteIds
} from "./fraction-composition-promotion-types.ts";
export type {
  KpFractionCompositionPromotionPrerequisiteEvidence,
  KpFractionCompositionPromotionPrerequisiteId,
  KpFractionCompositionPromotionReadinessInput,
  KpVerifiedFractionCompositionPromotionReadiness
} from "./fraction-composition-promotion-types.ts";

export function certifyKpFractionCompositionPromotionReadiness(
  input: KpFractionCompositionPromotionReadinessInput
): KpVerifiedFractionCompositionPromotionReadiness {
  const macro = createKpLawfulFractionSolveMacro();
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const motifTimeline = createKpFractionCompositionVisualMotifTimeline();
  const lesson = compileKpFractionCompositionEquationLesson(input.markdown);
  const policy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: fractionCompositionDescriptor,
    animation
  });
  const routes = kpReaderRouteManifest.filter(
    ({ conformance }) => conformance.documentId === manifest.document.id
  );
  const inventory = kpFractionCompositionPromotionInventory.find(
    ({ id }) => id === "fraction.composition-canonical-reader"
  );
  const staticExport = createKpFractionCompositionStaticStepExport();
  const libraryEntry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) => animationId === manifest.libraryEntryId
  );
  const learnerExperience = createKpLearnerExperienceLibrary().find(
    ({ id }) => id === "fraction-composition-scroll-lesson"
  );

  const prerequisiteEvidence = Object.freeze([
    verifyPrerequisite(
      "verified-semantic-trace",
      macro.verification.stateCount === manifest.stateIds.length &&
        macro.verification.stepCount === manifest.steps.length &&
        macro.verification.solution.numerator ===
          manifest.exactSolution.numerator &&
        macro.verification.solution.denominator ===
          manifest.exactSolution.denominator &&
        animation.metadata?.["sourceTraceId"] === manifest.macroId,
      [
        "src/semantic/fraction-solve-macro.ts",
        "src/animation/fraction-composition-equation-adapter.ts"
      ]
    ),
    verifyPrerequisite(
      "canonical-motif-closure",
      motifTimeline.segments.length === manifest.steps.length &&
        motifTimeline.segments.every((segment) =>
          (segment.canonicalOperationIds?.length ?? 0) > 0 &&
          (segment.trustedMotifIds?.length ?? 0) > 0 &&
          !(manifest.motifContract.forbiddenMotifKinds as readonly string[])
            .includes(segment.motifKind)
        ) &&
        checkTransformTreeVisualMotifRewindLaw(motifTimeline).passed,
      [
        "src/animation/fraction-composition-visual-motifs.ts",
        "src/animation/motifs/visual-motif-composition.ts"
      ]
    ),
    verifyPrerequisite(
      "exclusive-reader-ownership",
      policy?.presentationIntent === "exclusive-native-scene" &&
        policy.transitionIds.length === manifest.steps.length &&
        lesson.html.match(
          /data-kp-reader-equation-material-layer="true"/g
        )?.length === 1 &&
        !/whole-equation-fade|source-out-target-in|crossfade/.test(
          lesson.html
        ),
      [
        "src/reader/app/equation-lesson-descriptors/fraction-composition.ts",
        "src/reader/compiler/fraction-composition-equation-lesson.ts"
      ]
    ),
    verifyPrerequisite(
      "certified-responsive-layout",
      (["wide", "phone"] as const).every((viewport) => {
        const layout = planKpFractionCompositionLayout({ viewport });
        return (
          layout.phases.length === manifest.steps.length &&
          layout.geometryAuthority === "native-measurement" &&
          layout.operationSpecificCoordinates === false &&
          layout.phases.every(({ rows }) =>
            rows.length === (viewport === "wide" ? 1 : 2)
          )
        );
      }),
      [
        "src/reader/runtime/fraction-composition-layout.ts",
        "src/reader/app/fraction-composition-stage-layout.ts"
      ]
    ),
    verifyPrerequisite(
      "compatibility-route-retired",
      routes.length === 1 &&
        routes[0]?.route === manifest.route &&
        routes[0]?.presentation.kind === "shared-certified-runtime" &&
        inventory?.paintOwner === "canonical" &&
        inventory.productRoute === manifest.route,
      [
        "src/reader/compiler/reader-route-manifest.ts",
        "src/reader/compiler/fraction-composition-promotion-inventory.ts"
      ]
    ),
    verifyPrerequisite(
      "accessible-product-seams",
      manifest.accessibility.liveStructuredMath &&
        manifest.accessibility.staticNativeMathml &&
        manifest.accessibility.movingPaintAriaHidden &&
        lesson.html.match(
          /data-kp-reader-accessible-equation-state=/g
        )?.length === manifest.stateIds.length &&
        lesson.html.includes('role="math"') &&
        lesson.html.includes("data-kp-reader-fold-node="),
      [
        "src/reader/compiler/fraction-composition-preservation-manifest.ts",
        "content/lessons/fraction-composition.md"
      ]
    ),
    verifyPrerequisite(
      "static-export-closure",
      staticExport.diagnostics.length === 0 &&
        staticExport.artifact.id ===
          manifest.learningArtifacts.staticExportArtifactId &&
        staticExport.steps.length === manifest.stateIds.length &&
        staticExport.steps.at(-1)?.frame.completedOperationIds.length ===
          manifest.steps.length,
      [
        "src/tutorial/fraction-composition-static-step-export.ts"
      ]
    ),
    verifyPrerequisite(
      "review-host-readiness",
      libraryEntry?.availability === "playable" &&
        (libraryEntry.canonicalFormat === "partial" ||
          libraryEntry.canonicalFormat === "ported") &&
        libraryEntry.representations.length === 1 &&
        libraryEntry.representations[0]?.role === "canonical-host" &&
        libraryEntry.representations[0]?.href === manifest.route &&
        (learnerExperience?.status === "prototype" ||
          learnerExperience?.status === "exemplar"),
      [
        "src/editor/animation-library-display-catalog.ts",
        "src/editor/learner-experience-library.ts",
        "src/dev-review/animation-library-capture-provider.ts"
      ]
    )
  ] satisfies readonly KpFractionCompositionPromotionPrerequisiteEvidence[]);

  if (
    prerequisiteEvidence.length !==
      kpFractionCompositionPromotionPrerequisiteIds.length ||
    prerequisiteEvidence.some(
      (evidence, index) =>
        evidence.id !== kpFractionCompositionPromotionPrerequisiteIds[index]
    )
  ) {
    throw new Error(
      "Fraction composition promotion prerequisites are incomplete or reordered."
    );
  }

  // The public nominal brand is declared in the lightweight type module; this
  // runtime verifier is the only boundary allowed to assert the hidden mark.
  return Object.freeze({
    schemaVersion:
      "kp.verified-fraction-composition-promotion-readiness.v1" as const,
    animationId:
      "animation.fraction-composition.two-thirds-solve" as const,
    status: "ready-for-human-review" as const,
    prerequisiteEvidence,
    remainingGate: "human-perceptual-review" as const
  }) as KpVerifiedFractionCompositionPromotionReadiness;
}

function verifyPrerequisite<
  const TId extends KpFractionCompositionPromotionPrerequisiteId
>(
  id: TId,
  passed: boolean,
  evidenceSourceIds: readonly string[]
): KpFractionCompositionPromotionPrerequisiteEvidence & { readonly id: TId } {
  if (!passed) {
    throw new Error(
      `Fraction composition promotion prerequisite ${id} did not pass.`
    );
  }
  if (evidenceSourceIds.length === 0) {
    throw new Error(
      `Fraction composition promotion prerequisite ${id} lacks evidence.`
    );
  }
  return Object.freeze({
    id,
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}
