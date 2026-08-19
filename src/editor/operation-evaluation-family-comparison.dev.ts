import {
  isKpOperationEvaluationFamilyId,
  kpOperationEvaluationFamilyExemplarRecipes,
  resolveKpOperationEvaluationFamilyExemplarRecipe,
  type KpOperationEvaluationFamilyId
} from "../animation/operation-evaluation-family-exemplar.ts";
import type {
  KpReaderEquationMeasuredRendererSession
} from "../reader/renderers/equation-scene-compositor-adapter.ts";

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
      ${kpOperationEvaluationFamilyExemplarRecipes.map((recipe) => `
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
  const carrier = input.stage.ownerDocument.createElement("div");
  carrier.className = "kp-operation-evaluation-masked-carrier";
  carrier.dataset["kpOperationEvaluationMaskedCarrier"] = "";
  carrier.setAttribute("aria-hidden", "true");
  input.stage.append(cue, carrier);
  let family = input.initialFamily;

  const clearCue = () => {
    delete input.stage.dataset["kpOperationEvaluationCueKind"];
    cue.style.transform = "scaleX(0)";
  };
  const clearCarrier = () => {
    carrier.style.visibility = "hidden";
    carrier.style.transform = "translate(-50%, -50%) scale(0)";
  };
  const resetMaterialPresentationOverrides = () => {
    input.stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    ).forEach((owner) => {
      owner.style.removeProperty("visibility");
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
    clearCarrier();
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
    if (recipe.family === "masked-carrier-relay") {
      applyMaskedCarrierRelay({
        stage: input.stage,
        carrier,
        progress: bounded,
        sourceClipStartsAt: recipe.sourceClipStartsAt,
        sourceLegibilityEndsAt: recipe.sourceLegibilityEndsAt,
        targetLegibilityStartsAt: recipe.targetLegibilityStartsAt,
        targetRevealEndsAt: recipe.targetRevealEndsAt
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
      family = nextFamily;
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
      carrier.remove();
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
  return value !== null && isKpOperationEvaluationFamilyId(value)
    ? value
    : "masked-carrier-relay";
}

function applyMaskedCarrierRelay(input: {
  readonly stage: HTMLElement;
  readonly carrier: HTMLElement;
  readonly progress: number;
  readonly sourceClipStartsAt: number;
  readonly sourceLegibilityEndsAt: number;
  readonly targetLegibilityStartsAt: number;
  readonly targetRevealEndsAt: number;
}): void {
  const sourceOwners = materialOwners(input.stage, "source");
  const targetOwners = materialOwners(input.stage, "target");
  const sourceIsLegible = input.progress < input.sourceLegibilityEndsAt;
  const targetIsLegible = input.progress >= input.targetLegibilityStartsAt;
  const sourceClip = 50 * smoothstep(
    input.sourceClipStartsAt,
    input.sourceLegibilityEndsAt,
    input.progress
  );
  const targetReveal = smoothstep(
    input.targetLegibilityStartsAt,
    input.targetRevealEndsAt,
    input.progress
  );

  setOwnerCohortVisibility(sourceOwners, sourceIsLegible);
  setOwnerCohortVisibility(targetOwners, targetIsLegible);
  if (sourceIsLegible) {
    setOwnerCohortClip(sourceOwners, sourceClip);
  }
  if (targetIsLegible) {
    setOwnerCohortClip(targetOwners, 50 * (1 - targetReveal));
  }

  const carrierArrival = smoothstep(
    input.sourceClipStartsAt,
    input.sourceLegibilityEndsAt,
    input.progress
  );
  const carrierDeparture = 1 - smoothstep(
    input.targetLegibilityStartsAt,
    input.targetRevealEndsAt,
    input.progress
  );
  const carrierPresence = Math.min(carrierArrival, carrierDeparture);
  if (carrierPresence > 0) {
    positionMaskedCarrier(input.stage, input.carrier);
    input.carrier.style.visibility = "visible";
    input.carrier.style.transform =
      `translate(-50%, -50%) ` +
      `scaleX(${0.35 + carrierPresence * 0.65}) ` +
      `scaleY(${carrierPresence})`;
  }

  const legibilityState = sourceIsLegible
    ? "source"
    : targetIsLegible
      ? "target"
      : "carrier";
  input.stage.dataset["kpOperationEvaluationLegibilityState"] =
    legibilityState;
  input.stage.dataset["kpOperationEvaluationReadableCohortCount"] =
    legibilityState === "carrier" ? "0" : "1";
}

function materialOwners(
  stage: HTMLElement,
  side: "source" | "target"
): readonly HTMLElement[] {
  return [...stage.querySelectorAll<HTMLElement>(
    `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
  )];
}

function setOwnerCohortVisibility(
  owners: readonly HTMLElement[],
  visible: boolean
): void {
  owners.forEach((owner) => {
    owner.style.visibility = visible ? "visible" : "hidden";
  });
}

function setOwnerCohortClip(
  owners: readonly HTMLElement[],
  horizontalInsetPercent: number
): void {
  owners.forEach((owner) => {
    const visual = owner.firstElementChild as HTMLElement | null;
    if (visual !== null) {
      visual.style.clipPath =
        `inset(0 ${horizontalInsetPercent}% 0 ${horizontalInsetPercent}%)`;
    }
  });
}

function positionMaskedCarrier(
  stage: HTMLElement,
  carrier: HTMLElement
): void {
  const target = required(stage, "[data-kp-operation-evaluation-target]");
  const targetPaint = target.querySelector<HTMLElement>("[data-kp-motion-id]")
    ?? target;
  const stageRect = stage.getBoundingClientRect();
  const targetRect = targetPaint.getBoundingClientRect();
  carrier.style.left = `${targetRect.left - stageRect.left + targetRect.width / 2}px`;
  carrier.style.top = `${targetRect.top - stageRect.top + targetRect.height / 2}px`;
  carrier.style.height = `${Math.max(8, targetRect.height * 0.72)}px`;
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
