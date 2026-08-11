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
  const progress = requireElement<HTMLProgressElement>(
    root,
    "[data-kp-algebra-attention-progress]"
  );
  const status = requireElement<HTMLElement>(
    root,
    "[data-kp-algebra-attention-status]"
  );
  const back = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="back"]'
  );
  const forward = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="forward"]'
  );
  const playback = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="playback"]'
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
      playback.dataset["kpAlgebraAttentionPlaybackState"] = "unavailable";
      playback.textContent = "Play";
      playback.disabled = true;
      playback.setAttribute("aria-hidden", "true");
      playback.tabIndex = -1;
      forward.disabled = activeIndex === passages.length - 1;
      root.dataset["kpAlgebraAttentionMotionState"] = "static";
      return;
    }
    const progressPermille = localProgress();
    const rangeReady = Number.isFinite(progressPermille) &&
      input.stageHost.dataset["kpAlgebraCanonicalRange"] === range;
    playback.removeAttribute("aria-hidden");
    playback.tabIndex = 0;
    playback.disabled = !rangeReady;
    if (playing) {
      playback.textContent = "Pause";
      playback.dataset["kpAlgebraAttentionPlaybackState"] = "playing";
      root.dataset["kpAlgebraAttentionMotionState"] = "acting";
    } else if (progressPermille >= 1_000) {
      playback.textContent = "Replay";
      playback.dataset["kpAlgebraAttentionPlaybackState"] = "complete";
      root.dataset["kpAlgebraAttentionMotionState"] = "inspect";
    } else if (progressPermille > 0) {
      playback.textContent = "Resume";
      playback.dataset["kpAlgebraAttentionPlaybackState"] = "paused";
      root.dataset["kpAlgebraAttentionMotionState"] = "paused";
    } else {
      playback.textContent = "Play";
      playback.dataset["kpAlgebraAttentionPlaybackState"] = "prepared";
      root.dataset["kpAlgebraAttentionMotionState"] = "orient";
    }
    forward.disabled = playing || !rangeReady || progressPermille < 1_000;
  };
  const updateProgress = (): void => {
    const active = passages[activeIndex]!;
    const isRange = active.dataset["kpAlgebraAttentionRange"] !== undefined;
    const localPermille = Number(
      input.stageHost.dataset["kpAlgebraCanonicalLocalProgress"] ?? "0"
    );
    progress.value = activeIndex + (
      isRange && Number.isFinite(localPermille) ? localPermille / 1_000 : 0
    );
    updateControls();
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
    updateProgress();
    status.textContent = `${activeIndex + 1} / ${passages.length}`;
    root.dataset["kpAlgebraAttentionActiveBeat"] =
      requiredData(active, "kpAlgebraAttentionBeat");
  };
  const onBack = (): void => select(activeIndex - 1);
  const onForward = (): void => select(activeIndex + 1);
  const onPlayback = (): void => {
    const active = passages[activeIndex]!;
    const range = active.dataset["kpAlgebraAttentionRange"];
    if (range === undefined || playback.disabled) return;
    if (input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"] === "playing") {
      input.pauseRange();
    } else {
      if (localProgress() >= 1_000) input.prepareRange(range);
      input.playRange();
    }
    updateProgress();
  };
  const progressObserver = new MutationObserver(updateProgress);

  input.ownerWindow.document.documentElement.dataset["kpAlgebraView"] =
    "attention-stage";
  root.removeAttribute("hidden");
  root.dataset["kpAlgebraAttentionTempo"] = input.pacing.tempo;
  root.dataset["kpAlgebraAttentionOperationMs"] =
    String(input.pacing.millisecondsPerOperation);
  root.dataset["kpAlgebraAttentionDurationMs"] =
    String(input.pacing.fullTimelineDurationMs);
  visual.append(input.stageHost);
  progressObserver.observe(input.stageHost, {
    attributes: true,
    attributeFilter: [
      "data-kp-algebra-canonical-host-status",
      "data-kp-algebra-canonical-range",
      "data-kp-algebra-canonical-range-status",
      "data-kp-algebra-canonical-local-progress"
    ]
  });
  back.addEventListener("click", onBack);
  forward.addEventListener("click", onForward);
  playback.addEventListener("click", onPlayback);
  select(0);

  return Object.freeze({
    active: true,
    dispose() {
      back.removeEventListener("click", onBack);
      forward.removeEventListener("click", onForward);
      playback.removeEventListener("click", onPlayback);
      progressObserver.disconnect();
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
