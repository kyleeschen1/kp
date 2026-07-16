import type { KpAnimationAsset } from "./asset.ts";
import type { KpChoreographyQualityReport } from "./choreography-quality.ts";
import type { KpGestaltRendererCapabilityResolution } from "./gestalt-renderer-capabilities.ts";
import type { KpGestaltStyleRef } from "./gestalt-style.ts";

export const kpGeneratedPromotionHumanReviewRubric = [
  "causal-legibility",
  "semantic-object-constancy",
  "attention-continuity",
  "organic-coherence",
  "typographic-integrity",
  "pacing-and-dwell",
  "visual-restraint",
  "rewind-comprehension",
  "reduced-motion-equivalence"
] as const;

export type KpGeneratedPromotionHumanReviewCriterion =
  (typeof kpGeneratedPromotionHumanReviewRubric)[number];

export interface KpGeneratedPromotionEvidence {
  readonly authoring: {
    readonly semanticOnly: boolean;
    readonly rawMotionFieldPaths: readonly string[];
  };
  readonly choreography: {
    readonly compiled: boolean;
    readonly quality: KpChoreographyQualityReport;
  };
  readonly style: {
    readonly pinnedStyle: KpGestaltStyleRef;
    readonly resolvedFingerprint: string;
    readonly packageCompatibility: KpGestaltRendererCapabilityResolution;
  };
  readonly accessibility: {
    readonly projectionIds: readonly string[];
    readonly valid: boolean;
  };
  readonly humanReview: Readonly<
    Record<KpGeneratedPromotionHumanReviewCriterion, "passed" | "failed" | "pending">
  >;
}

export interface KpGeneratedPromotionDiagnostic {
  readonly code:
    | "promotion.authoring.raw-motion"
    | "promotion.choreography.uncompiled"
    | "promotion.choreography.quality"
    | "promotion.style.unpinned"
    | "promotion.style.fingerprint"
    | "promotion.style.incompatible"
    | "promotion.accessibility.incomplete"
    | "promotion.human-review.incomplete"
    | "promotion.legacy.unaudited";
  readonly severity: "warning" | "error";
  readonly path: string;
  readonly message: string;
  readonly repair: string;
}

export interface KpGeneratedPromotionResult {
  readonly kind: "generated-animation-promotion-result";
  readonly animationId: string;
  readonly status: "promoted" | "blocked" | "legacy-warning";
  readonly promotable: boolean;
  readonly diagnostics: readonly KpGeneratedPromotionDiagnostic[];
}

export function gateKpGeneratedAnimationPromotion(input: {
  readonly animation: KpAnimationAsset;
  readonly evidence?: KpGeneratedPromotionEvidence | undefined;
  readonly legacy?: boolean | undefined;
}): KpGeneratedPromotionResult {
  if (input.evidence === undefined) {
    const diagnostic: KpGeneratedPromotionDiagnostic = {
      code: "promotion.legacy.unaudited",
      severity: input.legacy ? "warning" : "error",
      path: "promotionEvidence",
      message: input.legacy
        ? `Existing generated animation ${input.animation.id} remains visible with warning-first audit status.`
        : `Generated animation ${input.animation.id} has no promotion evidence.`,
      repair:
        "Compile semantic choreography, resolve an exact compatible style, validate accessibility projections, run automated quality gates, and attach the complete human review rubric."
    };
    return {
      kind: "generated-animation-promotion-result",
      animationId: input.animation.id,
      status: input.legacy ? "legacy-warning" : "blocked",
      promotable: false,
      diagnostics: [diagnostic]
    };
  }
  const evidence = input.evidence;
  const diagnostics: KpGeneratedPromotionDiagnostic[] = [];
  if (!evidence.authoring.semanticOnly || evidence.authoring.rawMotionFieldPaths.length > 0) {
    diagnostics.push({
      code: "promotion.authoring.raw-motion",
      severity: "error",
      path: evidence.authoring.rawMotionFieldPaths[0] ?? "authoring.semanticOnly",
      message: "Generated authors may declare semantic choreography intent only.",
      repair:
        "Remove coordinates, paths, keyframes, z values, shadows, per-token delays, and other concrete motion realization; retain operations, roles, lineage, salience, traversal, and disclosure."
    });
  }
  if (!evidence.choreography.compiled) {
    diagnostics.push({
      code: "promotion.choreography.uncompiled",
      severity: "error",
      path: "choreography.compiled",
      message: "Generated output has no complete governed choreography plan.",
      repair:
        "Resolve every lifecycle, lineage, envelope, salience, traversal, layout, and motif gap through trusted compiler inputs."
    });
  }
  if (!evidence.choreography.quality.passedAutomatedGates) {
    diagnostics.push({
      code: "promotion.choreography.quality",
      severity: "error",
      path: "choreography.quality",
      message: "Generated choreography failed automated perceptual conformance.",
      repair:
        "Repair the reported focus, causal order, cohesion, settlement, stillness, or material-continuity diagnostics and rerun the quality sampler."
    });
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(evidence.style.pinnedStyle.version)) {
    diagnostics.push({
      code: "promotion.style.unpinned",
      severity: "error",
      path: "style.pinnedStyle.version",
      message: "Generated animation style versions must be exactly pinned.",
      repair: "Replace ranges or aliases with an immutable exact style package version."
    });
  }
  if (!/^fnv1a64:[a-f0-9]{16}$/.test(evidence.style.resolvedFingerprint)) {
    diagnostics.push({
      code: "promotion.style.fingerprint",
      severity: "error",
      path: "style.resolvedFingerprint",
      message: "Generated animation has no valid resolved style fingerprint.",
      repair: "Resolve the complete style chain and store its deterministic fingerprint."
    });
  }
  if (evidence.style.packageCompatibility.status !== "compatible") {
    diagnostics.push({
      code: "promotion.style.incompatible",
      severity: "error",
      path: "style.packageCompatibility",
      message: "The selected renderer cannot realize every required style capability.",
      repair: "Choose a compatible renderer or style package; optional fallbacks must remain explicit."
    });
  }
  if (
    !evidence.accessibility.valid ||
    evidence.accessibility.projectionIds.length < 8
  ) {
    diagnostics.push({
      code: "promotion.accessibility.incomplete",
      severity: "error",
      path: "accessibility",
      message: "Generated animation lacks the complete validated accessibility family.",
      repair:
        "Provide full, reduced, static, narrated, high-contrast, no-depth, keyboard, and rewind projections without changing semantic phases or traversal."
    });
  }
  const incompleteReview = kpGeneratedPromotionHumanReviewRubric.filter(
    (criterion) => evidence.humanReview[criterion] !== "passed"
  );
  if (incompleteReview.length > 0) {
    diagnostics.push({
      code: "promotion.human-review.incomplete",
      severity: "error",
      path: `humanReview.${incompleteReview[0]}`,
      message: `Generated animation has incomplete perceptual review: ${incompleteReview.join(", ")}.`,
      repair:
        "Review normal speed, slow motion, direct seek, rewind, and reduced motion; mark every rubric criterion passed only with inspectable evidence."
    });
  }
  return {
    kind: "generated-animation-promotion-result",
    animationId: input.animation.id,
    status: diagnostics.length === 0 ? "promoted" : "blocked",
    promotable: diagnostics.length === 0,
    diagnostics
  };
}

export function auditKpGeneratedAnimationCatalog(
  animations: readonly KpAnimationAsset[]
): readonly KpGeneratedPromotionResult[] {
  return animations
    .filter((animation) =>
      animation.dashboard?.tags.includes("llm-authored") ||
      animation.dashboard?.tags.includes("generated")
    )
    .map((animation) =>
      gateKpGeneratedAnimationPromotion({ animation, legacy: true })
    );
}
