import type {
  KpFractionCompositionAttentionPacingProfile
} from "./fraction-composition-attention-pacing.ts";
import {
  isKpFractionCompositionDistributionAttentionArcRequested,
  kpFractionCompositionDistributionAttentionArcRange,
  projectKpFractionCompositionDistributionAttentionArc,
  projectKpFractionCompositionDistributionGlobalProgress
} from "./fraction-composition-distribution-attention-arc.ts";

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
  readonly prepareRange: (path: string) => void;
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
  const distributionArcRequested =
    isKpFractionCompositionDistributionAttentionArcRequested(
      input.ownerWindow.location.search
    );
  const distributionPassageIndex = passages.findIndex((passage) =>
    passage.dataset["kpAlgebraAttentionBeat"] === "distribute:motion"
  );
  if (distributionArcRequested && distributionPassageIndex < 0) {
    throw new Error("Distribution attention arc requires its compiled passage.");
  }
  const distributionPassage = distributionArcRequested
    ? passages[distributionPassageIndex]!
    : undefined;
  const distributionInstruction = distributionPassage?.querySelector<HTMLElement>(
    "[data-kp-algebra-attention-instruction]"
  );
  const distributionArcInstruction =
    distributionPassage?.querySelector<HTMLElement>(
      "[data-kp-algebra-attention-arc-instruction]"
    );
  const distributionInterpretation = distributionPassage?.querySelector<HTMLElement>(
    "[data-kp-algebra-attention-interpretation]"
  );
  if (distributionArcRequested &&
      (distributionInstruction === null ||
       distributionInstruction === undefined ||
       distributionArcInstruction === null ||
       distributionArcInstruction === undefined ||
       distributionInterpretation === null ||
       distributionInterpretation === undefined)) {
    throw new Error(
      "Distribution attention arc requires instruction and interpretation prose."
    );
  }

  const originalParent = input.stageHost.parentNode;
  const originalNextSibling = input.stageHost.nextSibling;
  let activeIndex = -1;
  let attentionKey = "";
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
    if (!distributionArcRequested) {
      input.setAttention(readWords(
        requiredData(active, "kpAlgebraAttentionPrimary")
      ));
    }
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
    const distributionArc = distributionArcRequested
      ? projectKpFractionCompositionDistributionAttentionArc({
          globalProgress: progress,
          playing
        })
      : undefined;
    select(distributionArcRequested
      ? distributionPassageIndex
      : passageAt(progress, playing));
    if (distributionArc !== undefined) {
      const showInterpretation = distributionArc.passage === "interpretation";
      distributionInstruction!.toggleAttribute("hidden", true);
      distributionInstruction!.setAttribute(
        "aria-hidden",
        "true"
      );
      distributionArcInstruction!.toggleAttribute(
        "hidden",
        showInterpretation
      );
      distributionArcInstruction!.setAttribute(
        "aria-hidden",
        String(showInterpretation)
      );
      distributionInterpretation!.toggleAttribute("hidden", !showInterpretation);
      distributionInterpretation!.setAttribute(
        "aria-hidden",
        String(!showInterpretation)
      );
      const nextAttentionKey = distributionArc.primaryAddresses.join(" ");
      if (nextAttentionKey !== attentionKey) {
        attentionKey = nextAttentionKey;
        input.setAttention(distributionArc.primaryAddresses);
      }
      root.dataset["kpAlgebraAttentionArcPhase"] = distributionArc.phase;
    }
    const displayedProgress = distributionArc?.localProgress ?? progress;
    scrubber.disabled = !ready;
    toggle.disabled = !ready;
    scrubber.value = String(Math.round(displayedProgress * 1_000));
    scrubber.setAttribute(
      "aria-valuetext",
      `${Math.round(displayedProgress * 100)}%`
    );
    root.style.setProperty(
      "--kp-algebra-attention-player-progress",
      `${displayedProgress * 100}%`
    );
    toggle.textContent = playing
      ? "Pause"
      : displayedProgress >= 1
        ? "Replay"
        : "Play";
    toggle.dataset["kpAlgebraAttentionPrimaryState"] = playing
      ? "pause"
      : displayedProgress >= 1
        ? "replay"
        : "play";
    root.dataset["kpAlgebraAttentionMotionState"] = distributionArc === undefined
      ? playing
        ? "acting"
        : progress <= 0
          ? "orient"
          : "inspect"
      : distributionArc.phase;
  };
  const onToggle = (): void => {
    if (toggle.disabled) return;
    if (input.stageHost.dataset["kpAlgebraCanonicalRangeStatus"] === "playing") {
      input.pauseTimeline();
    } else {
      const displayedProgress = distributionArcRequested
        ? Number(scrubber.value) / 1_000
        : globalProgress();
      if (displayedProgress >= 1) {
        input.seekGlobal(distributionArcRequested
          ? projectKpFractionCompositionDistributionGlobalProgress(0)
          : 0);
      }
      input.playTimeline();
    }
    updatePlayer();
  };
  const onScrub = (): void => {
    if (scrubber.disabled) return;
    input.pauseTimeline();
    const localProgress = Number(scrubber.value) / 1_000;
    input.seekGlobal(distributionArcRequested
      ? projectKpFractionCompositionDistributionGlobalProgress(localProgress)
      : localProgress);
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
    String(distributionArcRequested
      ? input.pacing.rangeDurationsMs[
          kpFractionCompositionDistributionAttentionArcRange
        ]
      : input.pacing.fullTimelineDurationMs);
  if (distributionArcRequested) {
    root.dataset["kpAlgebraAttentionVariant"] = "distribution-arc";
    input.prepareRange(kpFractionCompositionDistributionAttentionArcRange);
  }
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
      if (distributionArcRequested) {
        distributionInstruction!.removeAttribute("hidden");
        distributionInstruction!.removeAttribute("aria-hidden");
        distributionArcInstruction!.toggleAttribute("hidden", true);
        distributionArcInstruction!.setAttribute("aria-hidden", "true");
        distributionInterpretation!.toggleAttribute("hidden", true);
        distributionInterpretation!.setAttribute("aria-hidden", "true");
        delete root.dataset["kpAlgebraAttentionVariant"];
        delete root.dataset["kpAlgebraAttentionArcPhase"];
      }
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
