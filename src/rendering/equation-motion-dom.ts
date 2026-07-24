import type { KatexTokenRect } from "./katex-transition-types.ts";
import type { KpEquationTransitionIr } from "../domain-ir/public-api.ts";
import type { KpSelectorAnnotatedLatex } from "./selector-annotated-latex.ts";
import type { KpEquationEnclosureChoreographyKind } from "./equation-enclosure-choreography.ts";
import type { KpEquationMotionPathCandidate } from "./equation-motion-path-planner.ts";
import type { KpEquationLinearRearrangementKind } from "./equation-linear-rearrangement.ts";
import type {
  KpEquationCancellationPresentationRecipe,
  KpEquationContinuantPresentationRecipe,
  KpEquationDepthPresentationRecipe,
  KpEquationSuccessorPresentationRecipe,
  KpEquationZeroWitnessPresentationRecipe
} from "./equation-presentation-policy.ts";
import type {
  KpIndependentZeroWitnessPlan
} from "./equation-independent-zero-witness.ts";
import type { KpDotProductRendererPlan } from "./equation-dot-product-traversal.ts";
import type { KpMatrixVectorRendererPlan } from "./equation-matrix-vector-composition.ts";
import type { KpMatrixMatrixRendererPlan } from "./equation-matrix-matrix-composition.ts";
import type {
  KpDerivativePowerChoreographyPlan
} from "../animation/derivative-power-choreography.ts";
import type {
  KpSuccessorSynthesisBinding,
  KpSuccessorSynthesisPlan
} from "../animation/successor-synthesis.ts";
import type {
  KpWitnessedAnnihilationBinding,
  KpWitnessedAnnihilationPlan
} from "../animation/witnessed-annihilation.ts";
import type { KpSemanticBranchSchedule } from "../animation/branch-schedule.ts";

export type KpEquationRepresentationalSuccessionKind =
  "opposite-corner-seed";

export interface AnnotatedMotionToken {
  readonly motionId: string;
  readonly text: string;
  readonly rect: KatexTokenRect;
  readonly localRect: KatexTokenRect;
  readonly element: HTMLElement;
}

export interface KpMeasuredEquationTransitionEndpoint {
  readonly selectorIds: readonly string[];
  readonly motionIds: readonly string[];
  readonly bounds: KatexTokenRect;
}

export interface KpMeasuredEquationTransitionRelationGeometry {
  readonly recordId: string;
  readonly lifecycle: KpEquationTransitionIr["relations"][number]["lifecycle"];
  readonly source?: KpMeasuredEquationTransitionEndpoint | undefined;
  readonly target?: KpMeasuredEquationTransitionEndpoint | undefined;
  readonly delta?: {
    readonly x: number;
    readonly y: number;
    readonly scaleX: number;
    readonly scaleY: number;
  } | undefined;
}

export interface KpMeasuredEquationTransitionGeometry {
  readonly transitionId: string;
  readonly enclosureChoreographyKind?: KpEquationEnclosureChoreographyKind | undefined;
  readonly lineageChoreographyKind?: "copy-fan-out" | "merge-fan-in" | "substitute" | undefined;
  readonly distributionChoreographyKind?: "canonical-fan-out" | undefined;
  readonly factoringChoreographyKind?: "canonical-fan-in" | undefined;
  readonly fractionChoreographyKind?:
    | "split-factors"
    | "separate-common-factor"
    | "simplify-unit-factor"
    | undefined;
  readonly exponentLawChoreographyKind?:
    | "peel-one-factor"
    | "absorb-unit-exponent"
    | undefined;
  readonly identityAbsorptionChoreographyKind?:
    | "absorb-additive-zero"
    | "absorb-multiplicative-one"
    | undefined;
  readonly identityAbsorptionRoleRecordIds?: {
    readonly operatorRecordId: string;
    readonly identityRecordId: string;
    readonly anchorRecordId: string;
  } | undefined;
  readonly inequalityPivotChoreographyKind?:
    "negative-scale-relation-pivot" | undefined;
  readonly representationalSuccessionKind?:
    KpEquationRepresentationalSuccessionKind | undefined;
  readonly linearRearrangementKind?:
    KpEquationLinearRearrangementKind | undefined;
  readonly branchSchedule?: KpSemanticBranchSchedule | undefined;
  readonly cancellationPresentationRecipe?:
    KpEquationCancellationPresentationRecipe | undefined;
  readonly zeroWitnessPresentationRecipe?:
    KpEquationZeroWitnessPresentationRecipe | undefined;
  readonly independentZeroWitnessPlan?:
    KpIndependentZeroWitnessPlan | undefined;
  readonly successorPresentationRecipe?:
    KpEquationSuccessorPresentationRecipe | undefined;
  readonly depthPresentationRecipe?:
    KpEquationDepthPresentationRecipe | undefined;
  readonly continuantPresentationRecipe?:
    KpEquationContinuantPresentationRecipe | undefined;
  readonly successorSynthesisBinding?:
    KpSuccessorSynthesisBinding | undefined;
  readonly successorSynthesisPlan?: KpSuccessorSynthesisPlan | undefined;
  readonly witnessedAnnihilationBinding?:
    KpWitnessedAnnihilationBinding | undefined;
  readonly witnessedAnnihilationPlan?: KpWitnessedAnnihilationPlan | undefined;
  readonly dotProductTraversalPlan?: KpDotProductRendererPlan | undefined;
  readonly matrixVectorCompositionPlan?: KpMatrixVectorRendererPlan | undefined;
  readonly matrixMatrixCompositionPlan?: KpMatrixMatrixRendererPlan | undefined;
  readonly derivativePowerChoreographyPlan?:
    KpDerivativePowerChoreographyPlan | undefined;
  readonly precomputedMotionPathsByMotionId?: Readonly<
    Record<string, KpEquationMotionPathCandidate>
  > | undefined;
  readonly precomputedRelationMotionPathsByRecordId?: Readonly<
    Record<string, KpEquationMotionPathCandidate>
  > | undefined;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
  readonly relations: readonly KpMeasuredEquationTransitionRelationGeometry[];
}

const toTokenRect = (rect: DOMRect): KatexTokenRect => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height
});

const normalizeText = (text: string): string => text.replace(/\s+/g, " ").trim();

export function measureAnnotatedEquationMotionTokens(
  root: HTMLElement
): readonly AnnotatedMotionToken[] {
  const rootRect = root.getBoundingClientRect();
  const seenMotionIds = new Set<string>();
  const tokens: AnnotatedMotionToken[] = [];

  for (const element of root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")) {
    const motionId = element.dataset["kpMotionId"]?.trim();
    if (motionId === undefined || motionId === "") {
      continue;
    }
    if (seenMotionIds.has(motionId)) {
      throw new Error(`Duplicate equation motion id ${motionId}`);
    }
    seenMotionIds.add(motionId);

    const elementRect = element.getBoundingClientRect();
    const rect = toTokenRect(elementRect);
    tokens.push({
      motionId,
      text: normalizeText(element.textContent ?? ""),
      rect,
      localRect: {
        left: elementRect.left - rootRect.left,
        top: elementRect.top - rootRect.top,
        width: elementRect.width,
        height: elementRect.height
      },
      element
    });
  }

  return tokens;
}

export function measureKpEquationTransitionGeometry(input: {
  readonly ir: KpEquationTransitionIr;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly sourceAnnotated: readonly KpSelectorAnnotatedLatex[];
  readonly targetAnnotated: readonly KpSelectorAnnotatedLatex[];
  readonly sourceMotionIdsBySelector?: Readonly<Record<string, string>> | undefined;
  readonly targetMotionIdsBySelector?: Readonly<Record<string, string>> | undefined;
  readonly enclosureChoreographyKind?: KpEquationEnclosureChoreographyKind | undefined;
  readonly lineageChoreographyKind?: "copy-fan-out" | "merge-fan-in" | "substitute" | undefined;
  readonly distributionChoreographyKind?: "canonical-fan-out" | undefined;
  readonly factoringChoreographyKind?: "canonical-fan-in" | undefined;
  readonly fractionChoreographyKind?:
    | "split-factors"
    | "separate-common-factor"
    | "simplify-unit-factor"
    | undefined;
  readonly exponentLawChoreographyKind?:
    | "peel-one-factor"
    | "absorb-unit-exponent"
    | undefined;
  readonly identityAbsorptionChoreographyKind?:
    | "absorb-additive-zero"
    | "absorb-multiplicative-one"
    | undefined;
  readonly identityAbsorptionRoleRecordIds?: {
    readonly operatorRecordId: string;
    readonly identityRecordId: string;
    readonly anchorRecordId: string;
  } | undefined;
  readonly inequalityPivotChoreographyKind?:
    "negative-scale-relation-pivot" | undefined;
  readonly representationalSuccessionKind?:
    KpEquationRepresentationalSuccessionKind | undefined;
  readonly linearRearrangementKind?:
    KpEquationLinearRearrangementKind | undefined;
  readonly branchSchedule?: KpSemanticBranchSchedule | undefined;
  readonly cancellationPresentationRecipe?:
    KpEquationCancellationPresentationRecipe | undefined;
  readonly zeroWitnessPresentationRecipe?:
    KpEquationZeroWitnessPresentationRecipe | undefined;
  readonly successorPresentationRecipe?:
    KpEquationSuccessorPresentationRecipe | undefined;
  readonly depthPresentationRecipe?:
    KpEquationDepthPresentationRecipe | undefined;
  readonly continuantPresentationRecipe?:
    KpEquationContinuantPresentationRecipe | undefined;
  readonly successorSynthesisBinding?:
    KpSuccessorSynthesisBinding | undefined;
  readonly witnessedAnnihilationBinding?:
    KpWitnessedAnnihilationBinding | undefined;
  readonly dotProductTraversalPlan?: KpDotProductRendererPlan | undefined;
  readonly matrixVectorCompositionPlan?: KpMatrixVectorRendererPlan | undefined;
  readonly matrixMatrixCompositionPlan?: KpMatrixMatrixRendererPlan | undefined;
  readonly derivativePowerChoreographyPlan?:
    KpDerivativePowerChoreographyPlan | undefined;
}): KpMeasuredEquationTransitionGeometry {
  const sourceTokens = measureAnnotatedEquationMotionTokens(input.sourceRoot);
  const targetTokens = measureAnnotatedEquationMotionTokens(input.targetRoot);
  const sourceByMotionId = new Map(sourceTokens.map((token) => [token.motionId, token]));
  const targetByMotionId = new Map(targetTokens.map((token) => [token.motionId, token]));
  const sourceMotionIds = motionIdsBySelector(
    input.sourceAnnotated,
    input.sourceMotionIdsBySelector
  );
  const targetMotionIds = motionIdsBySelector(
    input.targetAnnotated,
    input.targetMotionIdsBySelector
  );

  return {
    transitionId: input.ir.id,
    ...(input.enclosureChoreographyKind === undefined
      ? {}
      : { enclosureChoreographyKind: input.enclosureChoreographyKind }),
    ...(input.lineageChoreographyKind === undefined
      ? {}
      : { lineageChoreographyKind: input.lineageChoreographyKind }),
    ...(input.distributionChoreographyKind === undefined
      ? {}
      : { distributionChoreographyKind: input.distributionChoreographyKind }),
    ...(input.factoringChoreographyKind === undefined
      ? {}
      : { factoringChoreographyKind: input.factoringChoreographyKind }),
    ...(input.fractionChoreographyKind === undefined
      ? {}
      : { fractionChoreographyKind: input.fractionChoreographyKind }),
    ...(input.exponentLawChoreographyKind === undefined
      ? {}
      : { exponentLawChoreographyKind: input.exponentLawChoreographyKind }),
    ...(input.identityAbsorptionChoreographyKind === undefined
      ? {}
      : {
          identityAbsorptionChoreographyKind:
            input.identityAbsorptionChoreographyKind
        }),
    ...(input.identityAbsorptionRoleRecordIds === undefined
      ? {}
      : {
          identityAbsorptionRoleRecordIds: {
            ...input.identityAbsorptionRoleRecordIds
          }
        }),
    ...(input.inequalityPivotChoreographyKind === undefined
      ? {}
      : {
          inequalityPivotChoreographyKind:
            input.inequalityPivotChoreographyKind
        }),
    ...(input.representationalSuccessionKind === undefined
      ? {}
      : {
          representationalSuccessionKind:
            input.representationalSuccessionKind
        }),
    ...(input.linearRearrangementKind === undefined
      ? {}
      : { linearRearrangementKind: input.linearRearrangementKind }),
    ...(input.branchSchedule === undefined
      ? {}
      : { branchSchedule: input.branchSchedule }),
    ...(input.cancellationPresentationRecipe === undefined
      ? {}
      : { cancellationPresentationRecipe: input.cancellationPresentationRecipe }),
    ...(input.zeroWitnessPresentationRecipe === undefined
      ? {}
      : { zeroWitnessPresentationRecipe: input.zeroWitnessPresentationRecipe }),
    ...(input.successorPresentationRecipe === undefined
      ? {}
      : { successorPresentationRecipe: input.successorPresentationRecipe }),
    ...(input.depthPresentationRecipe === undefined
      ? {}
      : { depthPresentationRecipe: input.depthPresentationRecipe }),
    ...(input.continuantPresentationRecipe === undefined
      ? {}
      : { continuantPresentationRecipe: input.continuantPresentationRecipe }),
    ...(input.successorSynthesisBinding === undefined
      ? {}
      : { successorSynthesisBinding: input.successorSynthesisBinding }),
    ...(input.witnessedAnnihilationBinding === undefined
      ? {}
      : { witnessedAnnihilationBinding: input.witnessedAnnihilationBinding }),
    ...(input.dotProductTraversalPlan === undefined
      ? {}
      : { dotProductTraversalPlan: input.dotProductTraversalPlan }),
    ...(input.matrixVectorCompositionPlan === undefined
      ? {}
      : { matrixVectorCompositionPlan: input.matrixVectorCompositionPlan }),
    ...(input.matrixMatrixCompositionPlan === undefined
      ? {}
      : { matrixMatrixCompositionPlan: input.matrixMatrixCompositionPlan }),
    ...(input.derivativePowerChoreographyPlan === undefined
      ? {}
      : {
          derivativePowerChoreographyPlan:
            input.derivativePowerChoreographyPlan
        }),
    sourceTokens,
    targetTokens,
    relations: input.ir.relations.map((relation) => {
      const source = measuredEndpoint(
        input.ir.id,
        "source",
        relation.sourceSelectorIds,
        sourceMotionIds,
        sourceByMotionId
      );
      const target = measuredEndpoint(
        input.ir.id,
        "target",
        relation.targetSelectorIds,
        targetMotionIds,
        targetByMotionId
      );
      return {
        recordId: relation.recordId,
        lifecycle: relation.lifecycle,
        ...(source === undefined ? {} : { source }),
        ...(target === undefined ? {} : { target }),
        ...(source === undefined || target === undefined
          ? {}
          : { delta: geometryDelta(source.bounds, target.bounds) })
      };
    })
  };
}

function motionIdsBySelector(
  annotatedStates: readonly KpSelectorAnnotatedLatex[],
  additions: Readonly<Record<string, string>> | undefined
): ReadonlyMap<string, string> {
  return new Map([
    ...annotatedStates.flatMap((state) =>
      state.annotations.map((annotation) => [annotation.selectorId, annotation.motionId] as const)
    ),
    ...Object.entries(additions ?? {})
  ]);
}

function measuredEndpoint(
  transitionId: string,
  side: "source" | "target",
  selectorIds: readonly string[],
  motionIdsBySelector: ReadonlyMap<string, string>,
  tokensByMotionId: ReadonlyMap<string, AnnotatedMotionToken>
): KpMeasuredEquationTransitionEndpoint | undefined {
  if (selectorIds.length === 0) return undefined;
  const motionIds = selectorIds.map((selectorId) => {
    const motionId = motionIdsBySelector.get(selectorId);
    if (motionId === undefined) {
      throw new Error(
        `Equation transition ${transitionId} ${side} selector ${selectorId} has no motion annotation.`
      );
    }
    return motionId;
  });
  const tokens = motionIds.map((motionId) => {
    const token = tokensByMotionId.get(motionId);
    if (token === undefined) {
      throw new Error(
        `Equation transition ${transitionId} ${side} motion id ${motionId} was not measured.`
      );
    }
    return token;
  });
  return {
    selectorIds: [...selectorIds],
    motionIds,
    // Group bounds let fan-in and fan-out use the same geometry contract as identity.
    bounds: unionRects(tokens.map((token) => token.localRect))
  };
}

function unionRects(rects: readonly KatexTokenRect[]): KatexTokenRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function geometryDelta(
  source: KatexTokenRect,
  target: KatexTokenRect
): { x: number; y: number; scaleX: number; scaleY: number } {
  return {
    x: target.left + target.width / 2 - (source.left + source.width / 2),
    y: target.top + target.height / 2 - (source.top + source.height / 2),
    scaleX: source.width === 0 ? 1 : target.width / source.width,
    scaleY: source.height === 0 ? 1 : target.height / source.height
  };
}
