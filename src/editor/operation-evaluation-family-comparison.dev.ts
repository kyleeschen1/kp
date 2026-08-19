import {
  isKpOperationEvaluationFamilyId,
  isKpOperationEvaluationFamilyReviewSelectable,
  kpOperationEvaluationFamilyExemplarRecipes,
  resolveKpOperationEvaluationFamilyExemplarRecipe,
  type KpOperationEvaluationFamilyId
} from "../animation/operation-evaluation-family-exemplar.ts";
import type {
  KpReaderEquationMeasuredRendererSession
} from "../reader/renderers/equation-scene-compositor-adapter.ts";
import {
  applyKpNativeKatexContributorFusion,
  kpNativeKatexContributorFusionOpticalProfile
} from "../rendering/native-katex-operation-evaluation-contributor-fusion.ts";
import {
  kpContributorFusionEvaluationFamilyProfile
} from "../animation/operation-evaluation-family-profile.ts";

const familyQueryParameter = "evaluationFamily";

export interface KpOperationEvaluationFamilyComparisonSession {
  readonly root: HTMLElement;
  readonly currentStageHost: HTMLElement;
  readonly selectedFamily: KpOperationEvaluationFamilyId;
  bindCurrentStage(stage: HTMLElement): void;
  onFamilyChange(
    listener: (family: KpOperationEvaluationFamilyId) => void
  ): () => void;
  apply(progress: number): void;
  dispose(): void;
}

export interface KpOperationEvaluationFamilyPlaybackSession
extends KpReaderEquationMeasuredRendererSession {
  readonly family: KpOperationEvaluationFamilyId;
  selectFamily(family: KpOperationEvaluationFamilyId): void;
}

/**
 * Development-only checkpoint: one semantic expression, one renderer, and one
 * candidate at a time. Candidate selection changes only the attentional
 * handoff; it never reconstructs or remeasures the native KaTeX endpoints.
 */
export function mountKpOperationEvaluationFamilyComparison(input: {
  readonly slot: HTMLElement;
  readonly measurementHostId: string;
}): KpOperationEvaluationFamilyComparisonSession {
  const document = input.slot.ownerDocument;
  const root = document.createElement("section");
  root.className = "kp-operation-evaluation-family-review";
  root.dataset["kpOperationEvaluationFamilyReview"] = "";
  root.innerHTML = `
    <header class="kp-operation-evaluation-family-review__header">
      <p class="kp-operation-evaluation-family-review__eyebrow">
        Provisional evaluation family
      </p>
      <h3>How should an operation become its result?</h3>
      <p data-kp-operation-evaluation-family-summary></p>
    </header>
    <div class="kp-operation-evaluation-family-review__choices"
      role="group" aria-label="Evaluation choreography">
      ${kpOperationEvaluationFamilyExemplarRecipes
        .filter(({ family }) =>
          isKpOperationEvaluationFamilyReviewSelectable(family))
        .map((recipe) => `
        <button type="button" data-kp-operation-evaluation-family-choice
          data-family="${recipe.family}" aria-pressed="false">
          ${recipe.label}
        </button>`).join("")}
    </div>
    <div class="kp-operation-evaluation-family-review__stage-shell">
      <div data-kp-operation-evaluation-family-stage-host></div>
    </div>
    <div class="kp-operation-evaluation-family-review__progress"
      aria-hidden="true">
      <span data-kp-operation-evaluation-family-progress></span>
    </div>`;
  const currentStageHost = required(
    root,
    "[data-kp-operation-evaluation-family-stage-host]"
  );
  currentStageHost.dataset["kpOperationEvaluationMeasurementHostId"] =
    input.measurementHostId;
  input.slot.replaceChildren(root);

  let selectedFamily = readSelectedFamily(document.defaultView);
  let currentStage: HTMLElement | undefined;
  let familyListener:
    ((family: KpOperationEvaluationFamilyId) => void) | undefined;
  const summary = required(
    root,
    "[data-kp-operation-evaluation-family-summary]"
  );
  const progressBar = required(
    root,
    "[data-kp-operation-evaluation-family-progress]"
  );
  const choiceButtons = [
    ...root.querySelectorAll<HTMLButtonElement>(
      "[data-kp-operation-evaluation-family-choice]"
    )
  ];

  const select = (
    family: KpOperationEvaluationFamilyId,
    writeUrl: boolean
  ) => {
    selectedFamily = family;
    const recipe = resolveKpOperationEvaluationFamilyExemplarRecipe(family);
    root.dataset["kpOperationEvaluationFamily"] = family;
    root.dataset["kpOperationEvaluationHandoff"] = recipe.handoff;
    summary.textContent = recipe.summary;
    choiceButtons.forEach((button) => {
      const selected = button.dataset["family"] === family;
      button.setAttribute("aria-pressed", String(selected));
    });
    if (writeUrl) writeSelectedFamily(document.defaultView, family);
    familyListener?.(family);
  };
  choiceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const family = button.dataset["family"] ?? "";
      if (isKpOperationEvaluationFamilyId(family)) select(family, true);
    });
  });
  select(selectedFamily, false);

  return Object.freeze({
    root,
    currentStageHost,
    get selectedFamily() {
      return selectedFamily;
    },
    bindCurrentStage(stage: HTMLElement) {
      currentStage = stage;
      stage.dataset["kpOperationEvaluationFamily"] = selectedFamily;
    },
    onFamilyChange(
      listener: (family: KpOperationEvaluationFamilyId) => void
    ) {
      familyListener = listener;
      return () => {
        if (familyListener === listener) familyListener = undefined;
      };
    },
    apply(progress: number) {
      const bounded = clamp01(progress);
      progressBar.style.transform = `scaleX(${bounded})`;
      if (currentStage !== undefined) {
        currentStage.dataset["kpOperationEvaluationReviewProgress"] =
          String(bounded);
      }
    },
    dispose() {
      familyListener = undefined;
      root.remove();
    }
  });
}

/**
 * The canonical compositor remains sole paint authority. This wrapper only
 * remaps its clock for an honest cut or adds a non-paint attentional cue at a
 * measured endpoint; switching families therefore cannot create dual owners.
 */
export function createKpOperationEvaluationFamilyPlayback(input: {
  readonly stage: HTMLElement;
  readonly base: KpReaderEquationMeasuredRendererSession;
  readonly initialFamily: KpOperationEvaluationFamilyId;
}): KpOperationEvaluationFamilyPlaybackSession {
  const cue = input.stage.ownerDocument.createElement("div");
  cue.className = "kp-operation-evaluation-family-cue";
  cue.dataset["kpOperationEvaluationFamilyCue"] = "";
  cue.setAttribute("aria-hidden", "true");
  input.stage.append(cue);
  let family = requireReviewSelectable(input.initialFamily);

  const clearCue = () => {
    delete input.stage.dataset["kpOperationEvaluationCueKind"];
    cue.style.transform = "scaleX(0)";
  };
  const resetMaterialPresentationOverrides = () => {
    input.stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    ).forEach((owner) => {
      owner.style.removeProperty("visibility");
      owner.style.removeProperty("opacity");
      const visual = owner.firstElementChild as HTMLElement | null;
      visual?.style.removeProperty("clip-path");
    });
    delete input.stage.dataset["kpOperationEvaluationLegibilityState"];
    delete input.stage.dataset["kpOperationEvaluationReadableCohortCount"];
  };
  const positionCue = (endpoint: HTMLElement) => {
    const stageRect = input.stage.getBoundingClientRect();
    const endpointRect = endpoint.getBoundingClientRect();
    cue.style.left = `${endpointRect.left - stageRect.left}px`;
    cue.style.top = `${endpointRect.bottom - stageRect.top + 6}px`;
    cue.style.width = `${endpointRect.width}px`;
  };
  const apply = (progress: number) => {
    const bounded = clamp01(progress);
    const recipe = resolveKpOperationEvaluationFamilyExemplarRecipe(family);
    input.stage.dataset["kpOperationEvaluationFamily"] = family;
    input.stage.dataset["kpOperationEvaluationHandoff"] = recipe.handoff;
    clearCue();
    resetMaterialPresentationOverrides();
    if (recipe.family === "punctuated-substitution") {
      const source = required(
        input.stage,
        "[data-kp-operation-evaluation-source]"
      );
      positionCue(source);
      const cueProgress = punctuatedCueProgress({
        progress: bounded,
        start: recipe.punctuationStart,
        peak: recipe.punctuationPeak,
        end: recipe.replacementAt
      });
      input.stage.dataset["kpOperationEvaluationCueKind"] = "punctuation";
      cue.style.transform = `scaleX(${cueProgress})`;
      return input.base.apply(bounded < recipe.replacementAt ? 0 : 1);
    }
    const frame = input.base.apply(bounded);
    if (recipe.family === "contributor-fusion") {
      applyKpNativeKatexContributorFusion({
        stage: input.stage,
        progress: bounded,
        familyProfile: kpContributorFusionEvaluationFamilyProfile,
        opticalProfile: kpNativeKatexContributorFusionOpticalProfile
      });
      return frame;
    }
    if (recipe.family === "result-reception") {
      const target = required(
        input.stage,
        "[data-kp-operation-evaluation-target]"
      );
      positionCue(target);
      const cueStart = recipe.sourceProgressRange[1] - recipe.resultLead;
      const cueProgress = smoothstep(cueStart, 1, bounded);
      input.stage.dataset["kpOperationEvaluationCueKind"] =
        "result-reception";
      cue.style.transform = `scaleX(${cueProgress})`;
    }
    return frame;
  };

  return Object.freeze({
    ...input.base,
    get family() {
      return family;
    },
    selectFamily(nextFamily: KpOperationEvaluationFamilyId) {
      family = requireReviewSelectable(nextFamily);
    },
    sample(progress: number) {
      const recipe = resolveKpOperationEvaluationFamilyExemplarRecipe(family);
      return input.base.sample(
        recipe.family === "punctuated-substitution"
          ? clamp01(progress) < recipe.replacementAt ? 0 : 1
          : progress
      );
    },
    apply,
    retire(
      retirement: Parameters<
        KpReaderEquationMeasuredRendererSession["retire"]
      >[0]
    ) {
      cue.remove();
      input.base.retire(retirement);
    }
  });
}

function readSelectedFamily(
  window: Window | null
): KpOperationEvaluationFamilyId {
  const value = window === null
    ? null
    : new URL(window.location.href).searchParams.get(familyQueryParameter);
  if (value === "masked-carrier-relay") return "contributor-fusion";
  return value !== null &&
    isKpOperationEvaluationFamilyId(value) &&
    isKpOperationEvaluationFamilyReviewSelectable(value)
    ? value
    : "contributor-fusion";
}

function writeSelectedFamily(
  window: Window | null,
  family: KpOperationEvaluationFamilyId
): void {
  if (window === null) return;
  const url = new URL(window.location.href);
  url.searchParams.set(familyQueryParameter, family);
  window.history.replaceState(window.history.state, "", url);
}

function requireReviewSelectable(
  family: KpOperationEvaluationFamilyId
): KpOperationEvaluationFamilyId {
  if (!isKpOperationEvaluationFamilyReviewSelectable(family)) {
    throw new Error(
      `Operation-evaluation family ${family} has no reviewable renderer yet.`
    );
  }
  return family;
}

function punctuatedCueProgress(input: {
  readonly progress: number;
  readonly start: number;
  readonly peak: number;
  readonly end: number;
}): number {
  if (input.progress <= input.peak) {
    return smoothstep(input.start, input.peak, input.progress);
  }
  return 1 - smoothstep(input.peak, input.end, input.progress);
}

function smoothstep(start: number, end: number, value: number): number {
  if (end <= start) return value >= end ? 1 : 0;
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function required(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Operation-evaluation family review is missing ${selector}.`);
  }
  return element;
}
