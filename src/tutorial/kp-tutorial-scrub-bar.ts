import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
  type KpTutorialScrubSeekDetail
} from "./kp-tutorial-scrub-bar-events.ts";

export {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
  type KpTutorialScrubSeekDetail
} from "./kp-tutorial-scrub-bar-events.ts";

export const KP_TUTORIAL_SCRUB_BAR_TAG = "kp-tutorial-scrub-bar";

export interface KpTutorialScrubReadingBandProjection {
  readonly distance: number;
  readonly proximity: number;
}

const observedAttributes = [
  "controls-disabled",
  "direction",
  "manual-claimed",
  "next-disabled",
  "playback-status",
  "previous-disabled",
  "progress"
] as const;

/**
 * Framework-neutral playback boundary for prose-led tutorials. The element
 * owns controls and their local presentation, while the host keeps semantic
 * checkpoints, viewport coordination, and the animation clock authoritative.
 */
export class KpTutorialScrubBarElement extends HTMLElement {
  static readonly observedAttributes = observedAttributes;

  private previousLink: HTMLAnchorElement | undefined;
  private toggleButton: HTMLButtonElement | undefined;
  private nextLink: HTMLAnchorElement | undefined;
  private rewindLink: HTMLAnchorElement | undefined;
  private scrubber: HTMLInputElement | undefined;
  private progressOutput: HTMLOutputElement | undefined;
  private manualClaimedInternally = false;
  private reducedMotionQuery: MediaQueryList | undefined;

  connectedCallback(): void {
    this.captureStaticControls();
    this.previousLink!.addEventListener("click", this.handlePrevious);
    this.toggleButton!.addEventListener("click", this.handleToggle);
    this.nextLink!.addEventListener("click", this.handleNext);
    this.rewindLink!.addEventListener("click", this.handleRewind);
    this.scrubber!.addEventListener("input", this.handleSeek);
    const view = this.ownerDocument.defaultView;
    if (view !== null) {
      this.reducedMotionQuery = view.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotionQuery.addEventListener("change", this.handleMotionPreference);
    }
    this.dataset["kpTutorialScrubEnhancement"] = "ready";
    this.render();
  }

  disconnectedCallback(): void {
    this.previousLink?.removeEventListener("click", this.handlePrevious);
    this.toggleButton?.removeEventListener("click", this.handleToggle);
    this.nextLink?.removeEventListener("click", this.handleNext);
    this.rewindLink?.removeEventListener("click", this.handleRewind);
    this.scrubber?.removeEventListener("input", this.handleSeek);
    this.reducedMotionQuery?.removeEventListener(
      "change",
      this.handleMotionPreference
    );
  }

  attributeChangedCallback(): void {
    this.render();
  }

  setReadingBandProjection(
    projection: KpTutorialScrubReadingBandProjection
  ): void {
    const proximity = Math.max(0, Math.min(1, projection.proximity));
    this.style.setProperty(
      "--kp-tutorial-scrub-focus-proximity",
      proximity.toFixed(3)
    );
    this.style.setProperty(
      "--kp-tutorial-scrub-focus-lift",
      `${(-2 * proximity).toFixed(3)}px`
    );
    this.style.setProperty(
      "--kp-tutorial-scrub-focus-scale",
      (1 + 0.018 * proximity).toFixed(4)
    );
    this.dataset["kpTutorialScrubFocus"] = Math.abs(projection.distance) <= 6
      ? "crossing"
      : projection.distance > 0
        ? "approaching"
        : "past";
  }

  releaseManualControl(): void {
    this.manualClaimedInternally = false;
    this.render();
  }

  private readonly handlePrevious = (event: Event): void => {
    event.preventDefault();
    if (this.controlsDisabled || booleanAttribute(this, "previous-disabled")) {
      return;
    }
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT);
  };

  private readonly handleToggle = (): void => {
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_TOGGLE_EVENT);
  };

  private readonly handleNext = (event: Event): void => {
    event.preventDefault();
    if (this.controlsDisabled || booleanAttribute(this, "next-disabled")) return;
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_NEXT_EVENT);
  };

  private readonly handleRewind = (event: Event): void => {
    event.preventDefault();
    if (this.controlsDisabled || normalizeProgress(
      this.getAttribute("progress")
    ) <= 0.001) return;
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_REWIND_EVENT);
  };

  private readonly handleSeek = (): void => {
    const progress = Number(this.scrubber!.value);
    this.claimManualControl();
    this.emit<KpTutorialScrubSeekDetail>(KP_TUTORIAL_SCRUB_SEEK_EVENT, {
      progress
    });
  };

  private readonly handleMotionPreference = (): void => {
    this.render();
  };

  private claimManualControl(): void {
    this.manualClaimedInternally = true;
    this.render();
  }

  private emit<Detail = undefined>(type: string, detail?: Detail): void {
    this.dispatchEvent(new CustomEvent(type, {
      bubbles: true,
      composed: true,
      ...(detail === undefined ? {} : { detail })
    }));
  }

  private render(): void {
    if (
      this.previousLink === undefined ||
      this.toggleButton === undefined ||
      this.nextLink === undefined ||
      this.rewindLink === undefined ||
      this.scrubber === undefined ||
      this.progressOutput === undefined
    ) return;
    const progress = normalizeProgress(this.getAttribute("progress"));
    const direction = this.getAttribute("direction") === "rewind"
      ? "rewind"
      : "forward";
    const playbackStatus = this.getAttribute("playback-status") ?? "idle";
    const disabled = this.controlsDisabled;
    const manualClaimed = this.manualClaimed;
    const reducedMotion = this.reducedMotion;
    const playing = playbackStatus === "playing";

    const scrubberValue = String(progress);
    const progressValue = `${Math.round(progress * 100)}%`;
    if (this.scrubber.value !== scrubberValue) {
      this.scrubber.value = scrubberValue;
    }
    if (this.progressOutput.value !== progressValue) {
      this.progressOutput.value = progressValue;
    }
    this.previousLink.setAttribute("aria-disabled", String(
      disabled || booleanAttribute(this, "previous-disabled")
    ));
    this.nextLink.setAttribute("aria-disabled", String(
      disabled || booleanAttribute(this, "next-disabled")
    ));
    this.toggleButton.disabled = disabled;
    this.rewindLink.setAttribute(
      "aria-disabled",
      String(disabled || progress <= 0.001)
    );
    this.scrubber.disabled = disabled;
    const toggleText = playing
      ? "Pause"
      : direction === "rewind" && playbackStatus === "paused"
        ? "Continue"
        : progress >= 0.999
          ? "Replay"
          : "Play";
    // Hosts commonly set several attributes for one semantic frame. Avoid
    // replacing an unchanged text node on every attribute callback.
    if (this.toggleButton.textContent !== toggleText) {
      this.toggleButton.textContent = toggleText;
    }
    this.toggleButton.setAttribute("aria-label", playing
      ? "Pause animation"
      : direction === "rewind" && playbackStatus === "paused"
        ? "Continue rewind animation"
        : progress >= 0.999
          ? "Replay animation"
          : "Play animation");
    this.dataset["kpTutorialScrubManual"] = String(manualClaimed);
    this.dataset["kpTutorialScrubReducedMotion"] = String(reducedMotion);
    this.setAttribute(
      "aria-label",
      reducedMotion
        ? "Animation timeline. Automatic scroll motion is disabled."
        : "Animation timeline"
    );
  }

  private get controlsDisabled(): boolean {
    return booleanAttribute(this, "controls-disabled");
  }

  private get manualClaimed(): boolean {
    return this.manualClaimedInternally || booleanAttribute(
      this,
      "manual-claimed"
    );
  }

  private get reducedMotion(): boolean {
    return this.reducedMotionQuery?.matches ?? false;
  }

  private captureStaticControls(): void {
    this.previousLink = requiredElement(this, "a[data-action=previous]");
    this.toggleButton = requiredElement(this, "button[data-action=toggle]");
    this.nextLink = requiredElement(this, "a[data-action=next]");
    this.rewindLink = requiredElement(this, "a[data-action=rewind]");
    this.scrubber = requiredElement(this, "input[data-action=seek]");
    this.progressOutput = requiredElement(this, "[data-progress]");
  }
}

export function defineKpTutorialScrubBar(
  registry: CustomElementRegistry = customElements
): void {
  if (registry.get(KP_TUTORIAL_SCRUB_BAR_TAG) === undefined) {
    registry.define(KP_TUTORIAL_SCRUB_BAR_TAG, KpTutorialScrubBarElement);
  }
}

function requiredElement<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Tutorial scrub bar is missing ${selector}.`);
  }
  return element;
}

function booleanAttribute(element: Element, name: string): boolean {
  const value = element.getAttribute(name);
  return value !== null && value !== "false";
}

function normalizeProgress(value: string | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0;
}
