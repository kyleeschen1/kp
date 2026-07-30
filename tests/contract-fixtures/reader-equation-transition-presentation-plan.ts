import type {
  KpReaderEquationTransitionPlan,
  KpReaderEquationTransitionPresentationPlan
} from "../../src/reader/renderers/public-api.ts";
import type {
  KpEquationVisualMotifIntent
} from "../../src/animation/structural-succession-presentation.ts";
import type {
  KpCanonicalFormatPromotionEvidence
} from "../../src/editor/animation-library-display-catalog.ts";

declare const visualMotif: KpEquationVisualMotifIntent;

// @ts-expect-error Only the reader-plan compiler can mint presentation authority.
const fabricated: KpReaderEquationTransitionPresentationPlan = {
  schemaVersion: "kp.reader-equation-transition-presentation-plan.v1",
  kind: "reader-equation-transition-presentation-plan",
  transitionId: "transition.fabricated",
  planKind: "visual-motif",
  visualMotif
};

declare const withoutPresentation:
  Omit<KpReaderEquationTransitionPlan, "presentationPlan">;

// @ts-expect-error A reader transition cannot omit its presentation authority.
const missingPresentation: KpReaderEquationTransitionPlan =
  withoutPresentation;

declare const presentation: KpReaderEquationTransitionPresentationPlan;
type KpReaderSuccessorPresentationPlan = Extract<
  KpReaderEquationTransitionPresentationPlan,
  { readonly planKind: "successor-synthesis" }
>;
declare const missingExecutableProgram:
  Omit<KpReaderSuccessorPresentationPlan, "executableProgram">;

// @ts-expect-error Successor plans require minted executable authority.
const incompleteSuccessor: KpReaderSuccessorPresentationPlan =
  missingExecutableProgram;

if (presentation.planKind === "factoring") {
  presentation.factoringMotifBinding;
  // @ts-expect-error Factoring cannot also carry operation choreography.
  presentation.operationChoreography;
}

if (presentation.planKind === "operation-choreography") {
  presentation.operationChoreography;
  // @ts-expect-error Operation choreography cannot also carry successor plans.
  presentation.successorSyntheses;
}

if (presentation.planKind === "successor-synthesis") {
  presentation.executableProgram;
  // @ts-expect-error Successor plans cannot retain an independent motif label.
  presentation.visualMotif;
}

// @ts-expect-error Ported evidence must account for static presentation gaps.
const missingCoverage: KpCanonicalFormatPromotionEvidence = {
  animationId: "animation.fabricated",
  exclusiveCanonicalPaint: true,
  requiredMotifParity: true,
  responsiveRuntimeGates: true,
  humanReviewApproved: true,
  compatibilityPaintRetired: true,
  releaseGatePassed: true,
  evidenceSourceIds: ["evidence.fabricated"]
};

void [
  fabricated,
  missingPresentation,
  presentation,
  incompleteSuccessor,
  missingCoverage
];
