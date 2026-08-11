import type {
  KpFractionCompositionAttentionPacingProfile
} from "./fraction-composition-attention-pacing.ts";

export interface KpFractionCompositionAttentionStageController {
  readonly active: boolean;
  dispose(): void;
}

export function isKpFractionCompositionAttentionStageRequested(
  search: string
): boolean {
  return new URLSearchParams(search).get("view") === "attention-stage";
}

/**
 * The controller only selects compiled beats. Canonical stage time and paint
 * remain behind the callbacks supplied by the retained equation session.
 */
export function mountKpFractionCompositionAttentionStage(input: {
  readonly ownerWindow: Window;
  readonly publication: HTMLElement;
  readonly stageHost: HTMLElement;
  readonly selectCheckpoint: (path: string) => void;
  readonly prepareRange: (path: string) => void;
  readonly playRange: () => void;
  readonly pauseRange: () => void;
  readonly setAttention: (addresses: readonly string[]) => void;
  readonly pacing: KpFractionCompositionAttentionPacingProfile;
}): KpFractionCompositionAttentionStageController {
  if (!isKpFractionCompositionAttentionStageRequested(
    input.ownerWindow.location.search
  )) {
    return Object.freeze({ active: false, dispose() {} });
  }
  const root = requireElement<HTMLElement>(
    input.publication,
    "[data-kp-algebra-attention-stage]"
  );
  const visual = requireElement<HTMLElement>(
    root,
    "[data-kp-algebra-attention-visual]"
  );
  const passages = [...root.querySelectorAll<HTMLElement>(
    "[data-kp-algebra-attention-beat]"
  )];
  const back = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="back"]'
  );
  const primary = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="continue"]'
  );
  if (passages.length === 0) {
    throw new Error("Algebra attention stage requires compiled passages.");
  }

  const originalParent = input.stageHost.parentNode;
  const originalNextSibling = input.stageHost.nextSibling;
  let activeIndex = 0;
  const localProgress = (): number => Number(
    input.stageHost.dataset["kpAlgebraCanonicalLocalProgress"] ?? "NaN"
  );
  const updateControls = (): void => {
    const active = passages[activeIndex]!;
    const range = active.dataset["kpAlgebraAttentionRange"];
    const rangeStatus =
      input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"];
    const playing = rangeStatus === "playing";
    back.disabled = playing || activeIndex === 0;
    if (range === undefined) {
      primary.textContent = "Continue";
      primary.dataset["kpAlgebraAttentionPrimaryState"] = "advance";
      primary.disabled = activeIndex === passages.length - 1;
      root.dataset["kpAlgebraAttentionMotionState"] = "static";
      return;
    }
    const progressPermille = localProgress();
    const rangeReady = Number.isFinite(progressPermille) &&
      input.stageHost.dataset["kpAlgebraCanonicalRange"] === range;
    primary.disabled = !rangeReady;
    if (playing) {
      primary.textContent = "Pause";
      primary.dataset["kpAlgebraAttentionPrimaryState"] = "pause";
      root.dataset["kpAlgebraAttentionMotionState"] = "acting";
    } else if (progressPermille >= 1_000) {
      primary.textContent = "Continue";
      primary.dataset["kpAlgebraAttentionPrimaryState"] = "advance";
      root.dataset["kpAlgebraAttentionMotionState"] = "inspect";
    } else if (progressPermille > 0) {
      primary.textContent = "Continue";
      primary.dataset["kpAlgebraAttentionPrimaryState"] = "resume";
      root.dataset["kpAlgebraAttentionMotionState"] = "paused";
    } else {
      primary.textContent = "Continue";
      primary.dataset["kpAlgebraAttentionPrimaryState"] = "play";
      root.dataset["kpAlgebraAttentionMotionState"] = "orient";
    }
  };
  const select = (index: number): void => {
    if (index < 0 || index >= passages.length) return;
    activeIndex = index;
    passages.forEach((passage, passageIndex) => {
      const active = passageIndex === activeIndex;
      passage.toggleAttribute("hidden", !active);
      passage.setAttribute("aria-hidden", String(!active));
    });
    const active = passages[activeIndex]!;
    const checkpoint = active.dataset["kpAlgebraAttentionCheckpoint"];
    const range = active.dataset["kpAlgebraAttentionRange"];
    input.setAttention(readWords(
      requiredData(active, "kpAlgebraAttentionPrimary")
    ));
    if (checkpoint !== undefined) input.selectCheckpoint(checkpoint);
    else if (range !== undefined) input.prepareRange(range);
    else throw new Error("Algebra attention beat lacks a temporal anchor.");
    updateControls();
    root.dataset["kpAlgebraAttentionActiveBeat"] =
      requiredData(active, "kpAlgebraAttentionBeat");
  };
  const onBack = (): void => select(activeIndex - 1);
  const onPrimary = (): void => {
    const active = passages[activeIndex]!;
    const range = active.dataset["kpAlgebraAttentionRange"];
    if (primary.disabled) return;
    if (range === undefined) {
      select(activeIndex + 1);
      return;
    }
    if (input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"] === "playing") {
      input.pauseRange();
    } else if (localProgress() >= 1_000) {
      select(activeIndex + 1);
    } else {
      input.playRange();
    }
    updateControls();
  };
  const stageStateObserver = new MutationObserver(updateControls);

  input.ownerWindow.document.documentElement.dataset["kpAlgebraView"] =
    "attention-stage";
  root.removeAttribute("hidden");
  root.dataset["kpAlgebraAttentionTempo"] = input.pacing.tempo;
  root.dataset["kpAlgebraAttentionOperationMs"] =
    String(input.pacing.millisecondsPerOperation);
  root.dataset["kpAlgebraAttentionDurationMs"] =
    String(input.pacing.fullTimelineDurationMs);
  visual.append(input.stageHost);
  stageStateObserver.observe(input.stageHost, {
    attributes: true,
    attributeFilter: [
      "data-kp-algebra-canonical-host-status",
      "data-kp-algebra-canonical-range",
      "data-kp-algebra-canonical-range-status",
      "data-kp-algebra-canonical-local-progress"
    ]
  });
  back.addEventListener("click", onBack);
  primary.addEventListener("click", onPrimary);
  select(0);

  return Object.freeze({
    active: true,
    dispose() {
      back.removeEventListener("click", onBack);
      primary.removeEventListener("click", onPrimary);
      stageStateObserver.disconnect();
      input.setAttention([]);
      if (originalParent !== null) {
        originalParent.insertBefore(input.stageHost, originalNextSibling);
      }
      root.toggleAttribute("hidden", true);
      delete input.ownerWindow.document.documentElement.dataset["kpAlgebraView"];
    }
  });
}

function readWords(value: string): readonly string[] {
  return Object.freeze(value.split(/\s+/u).filter(Boolean));
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing algebra attention-stage ${selector}.`);
  return element;
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing algebra attention-stage data ${key}.`);
  }
  return value;
}
