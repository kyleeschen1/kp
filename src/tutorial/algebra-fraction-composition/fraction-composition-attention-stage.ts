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
  readonly requested?: boolean | undefined;
  readonly seekGlobal: (progress: number) => void;
  readonly playTimeline: () => void;
  readonly pauseTimeline: () => void;
  readonly setAttention: (addresses: readonly string[]) => void;
  readonly pacing: KpFractionCompositionAttentionPacingProfile;
}): KpFractionCompositionAttentionStageController {
  if (!(input.requested ?? isKpFractionCompositionAttentionStageRequested(
    input.ownerWindow.location.search
  ))) {
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
  const toggle = requireElement<HTMLButtonElement>(
    root,
    '[data-kp-algebra-attention-action="toggle"]'
  );
  const scrubber = requireElement<HTMLInputElement>(
    root,
    "[data-kp-algebra-attention-scrubber]"
  );
  if (passages.length === 0) {
    throw new Error("Algebra attention stage requires compiled passages.");
  }

  const originalParent = input.stageHost.parentNode;
  const originalNextSibling = input.stageHost.nextSibling;
  let activeIndex = -1;
  const globalProgress = (): number => Math.max(0, Math.min(1, Number(
    input.stageHost.dataset["kpAlgebraCanonicalGlobalProgress"] ?? "0"
  ) / 1_000));
  const select = (index: number): void => {
    if (index < 0 || index >= passages.length || index === activeIndex) return;
    activeIndex = index;
    passages.forEach((passage, passageIndex) => {
      const active = passageIndex === activeIndex;
      passage.toggleAttribute("hidden", !active);
      passage.setAttribute("aria-hidden", String(!active));
    });
    const active = passages[activeIndex]!;
    input.setAttention(readWords(
      requiredData(active, "kpAlgebraAttentionPrimary")
    ));
    root.dataset["kpAlgebraAttentionActiveBeat"] =
      requiredData(active, "kpAlgebraAttentionBeat");
  };
  const passageAt = (progress: number, playing: boolean): number => {
    if (progress <= 0 && !playing) return 0;
    if (progress >= 1) return passages.length - 1;
    const rangeIndex = passages.findIndex((passage) => {
      const start = Number(passage.dataset["kpAlgebraAttentionStart"]);
      const end = Number(passage.dataset["kpAlgebraAttentionEnd"]);
      return Number.isFinite(start) && Number.isFinite(end) &&
        progress >= start && progress < end;
    });
    return rangeIndex >= 0 ? rangeIndex : 0;
  };
  const updatePlayer = (): void => {
    const ready = input.stageHost.dataset["kpAlgebraCanonicalHostStatus"] ===
      "active";
    const progress = globalProgress();
    const playing = input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"] ===
      "playing";
    select(passageAt(progress, playing));
    scrubber.disabled = !ready;
    toggle.disabled = !ready;
    scrubber.value = String(Math.round(progress * 1_000));
    scrubber.setAttribute("aria-valuetext", `${Math.round(progress * 100)}%`);
    root.style.setProperty(
      "--kp-algebra-attention-player-progress",
      `${progress * 100}%`
    );
    toggle.textContent = playing ? "Pause" : progress >= 1 ? "Replay" : "Play";
    toggle.dataset["kpAlgebraAttentionPrimaryState"] = playing
      ? "pause"
      : progress >= 1
        ? "replay"
        : "play";
    root.dataset["kpAlgebraAttentionMotionState"] = playing
      ? "acting"
      : progress <= 0
        ? "orient"
        : "inspect";
  };
  const onToggle = (): void => {
    if (toggle.disabled) return;
    if (input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"] === "playing") {
      input.pauseTimeline();
    } else {
      if (globalProgress() >= 1) input.seekGlobal(0);
      input.playTimeline();
    }
    updatePlayer();
  };
  const onScrub = (): void => {
    if (scrubber.disabled) return;
    input.pauseTimeline();
    input.seekGlobal(Number(scrubber.value) / 1_000);
    updatePlayer();
  };
  const stageStateObserver = new MutationObserver(updatePlayer);

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
      "data-kp-algebra-canonical-global-progress"
    ]
  });
  toggle.addEventListener("click", onToggle);
  scrubber.addEventListener("input", onScrub);
  updatePlayer();

  return Object.freeze({
    active: true,
    dispose() {
      toggle.removeEventListener("click", onToggle);
      scrubber.removeEventListener("input", onScrub);
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
