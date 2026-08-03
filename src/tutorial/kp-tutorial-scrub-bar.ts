export const KP_TUTORIAL_SCRUB_BAR_TAG = "kp-tutorial-scrub-bar";
export const KP_TUTORIAL_SCRUB_TOGGLE_EVENT = "kp:tutorial-scrub-toggle";
export const KP_TUTORIAL_SCRUB_REWIND_EVENT = "kp:tutorial-scrub-rewind";
export const KP_TUTORIAL_SCRUB_PREVIOUS_EVENT = "kp:tutorial-scrub-previous";
export const KP_TUTORIAL_SCRUB_NEXT_EVENT = "kp:tutorial-scrub-next";
export const KP_TUTORIAL_SCRUB_SEEK_EVENT = "kp:tutorial-scrub-seek";

export interface KpTutorialScrubSeekDetail {
  readonly progress: number;
}

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

  private readonly root: ShadowRoot;
  private readonly previousButton: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly rewindButton: HTMLButtonElement;
  private readonly scrubber: HTMLInputElement;
  private readonly progressOutput: HTMLOutputElement;
  private manualClaimedInternally = false;
  private reducedMotionQuery: MediaQueryList | undefined;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = template;
    this.previousButton = requiredElement(this.root, "[data-action=previous]");
    this.toggleButton = requiredElement(this.root, "[data-action=toggle]");
    this.nextButton = requiredElement(this.root, "[data-action=next]");
    this.rewindButton = requiredElement(this.root, "[data-action=rewind]");
    this.scrubber = requiredElement(this.root, "[data-action=seek]");
    this.progressOutput = requiredElement(this.root, "[data-progress]");
  }

  connectedCallback(): void {
    this.previousButton.addEventListener("click", this.handlePrevious);
    this.toggleButton.addEventListener("click", this.handleToggle);
    this.nextButton.addEventListener("click", this.handleNext);
    this.rewindButton.addEventListener("click", this.handleRewind);
    this.scrubber.addEventListener("input", this.handleSeek);
    const view = this.ownerDocument.defaultView;
    if (view !== null) {
      this.reducedMotionQuery = view.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotionQuery.addEventListener("change", this.handleMotionPreference);
    }
    this.render();
  }

  disconnectedCallback(): void {
    this.previousButton.removeEventListener("click", this.handlePrevious);
    this.toggleButton.removeEventListener("click", this.handleToggle);
    this.nextButton.removeEventListener("click", this.handleNext);
    this.rewindButton.removeEventListener("click", this.handleRewind);
    this.scrubber.removeEventListener("input", this.handleSeek);
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

  private readonly handlePrevious = (): void => {
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT);
  };

  private readonly handleToggle = (): void => {
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_TOGGLE_EVENT);
  };

  private readonly handleNext = (): void => {
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_NEXT_EVENT);
  };

  private readonly handleRewind = (): void => {
    this.claimManualControl();
    this.emit(KP_TUTORIAL_SCRUB_REWIND_EVENT);
  };

  private readonly handleSeek = (): void => {
    const progress = Number(this.scrubber.value);
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
    const progress = normalizeProgress(this.getAttribute("progress"));
    const direction = this.getAttribute("direction") === "rewind"
      ? "rewind"
      : "forward";
    const playbackStatus = this.getAttribute("playback-status") ?? "idle";
    const disabled = this.controlsDisabled;
    const manualClaimed = this.manualClaimed;
    const reducedMotion = this.reducedMotion;
    const playing = playbackStatus === "playing";

    this.scrubber.value = String(progress);
    this.progressOutput.value = `${Math.round(progress * 100)}%`;
    this.previousButton.disabled = disabled || booleanAttribute(
      this,
      "previous-disabled"
    );
    this.nextButton.disabled = disabled || booleanAttribute(
      this,
      "next-disabled"
    );
    this.toggleButton.disabled = disabled;
    this.rewindButton.disabled = disabled || progress <= 0.001;
    this.scrubber.disabled = disabled;
    this.toggleButton.textContent = playing
      ? "Pause"
      : direction === "rewind" && playbackStatus === "paused"
        ? "Continue rewind"
        : progress >= 0.999
          ? "Replay"
          : "Play";
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
}

export function defineKpTutorialScrubBar(
  registry: CustomElementRegistry = customElements
): void {
  if (registry.get(KP_TUTORIAL_SCRUB_BAR_TAG) === undefined) {
    registry.define(KP_TUTORIAL_SCRUB_BAR_TAG, KpTutorialScrubBarElement);
  }
}

function requiredElement<ElementType extends Element>(
  root: ShadowRoot,
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

const template = String.raw`
  <style>
    :host {
      --kp-tutorial-scrub-focus-proximity: 0;
      --kp-tutorial-scrub-focus-lift: 0px;
      --kp-tutorial-scrub-focus-scale: 1;
      display: block;
      margin: 0.8rem 0 1rem;
      color: #294653;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    .boundary {
      position: relative;
      padding: 0.55rem 0.1rem;
    }
    .boundary::before,
    .boundary::after {
      position: absolute;
      top: 50%;
      right: 0;
      left: 0;
      height: 1px;
      content: "";
      pointer-events: none;
      transform: translateY(-50%);
    }
    .boundary::before {
      background: rgb(91 122 133 / 0.24);
    }
    .boundary::after {
      background: #608692;
      opacity: var(--kp-tutorial-scrub-focus-proximity);
      transition: opacity 180ms ease-out;
    }
    output {
      color: #607983;
      font-size: 0.67rem;
      line-height: 1.4;
      font-variant-numeric: tabular-nums;
      font-weight: 750;
    }
    .controls {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: auto auto auto auto minmax(8rem, 1fr) 2.7rem;
      gap: 0.42rem;
      align-items: center;
    }
    button {
      border: 1px solid #b7c2c4;
      border-radius: 7px;
      padding: 0.42rem 0.58rem;
      color: #334e59;
      background: #fffefa;
      cursor: pointer;
      font-size: 0.68rem;
      font-weight: 800;
      white-space: nowrap;
    }
    button[data-action="toggle"] {
      position: relative;
      isolation: isolate;
      border-color: #365e6a;
      color: #fff;
      background: #365e6a;
      box-shadow: 0 1px 2px rgb(38 56 66 / 0.16);
      transform:
        translateY(var(--kp-tutorial-scrub-focus-lift))
        scale(var(--kp-tutorial-scrub-focus-scale));
      transition: transform 280ms cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    button[data-action="toggle"]::after {
      /* Fade a pre-rendered shadow layer; interpolating box-shadow would repaint. */
      position: absolute;
      z-index: -1;
      inset: 0;
      border-radius: inherit;
      box-shadow: 0 7px 18px rgb(38 56 66 / 0.3);
      content: "";
      opacity: var(--kp-tutorial-scrub-focus-proximity);
      pointer-events: none;
      transition: opacity 280ms cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    button[data-action="toggle"]:is(:hover, :focus-visible) {
      transform: translateY(-2px) scale(1.018);
    }
    button[data-action="toggle"]:is(:hover, :focus-visible)::after {
      opacity: 1;
    }
    button[data-action="toggle"]:active {
      transform: translateY(0) scale(0.985);
    }
    button:disabled {
      cursor: default;
      opacity: 0.42;
    }
    input {
      width: 100%;
      min-width: 0;
      background: #fffdf8;
      accent-color: #496f7b;
    }
    .progress {
      background: #fffdf8;
      text-align: right;
    }
    @media (max-width: 560px) {
      .controls {
        grid-template-columns: repeat(4, auto) minmax(4.5rem, 1fr);
      }
      .progress {
        display: none;
      }
      button {
        padding-inline: 0.42rem;
        font-size: 0.62rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        scroll-behavior: auto !important;
        transition: none !important;
      }
      button[data-action="toggle"] {
        transform: none !important;
      }
    }
  </style>
  <div class="boundary">
    <div class="controls" role="group" aria-label="Animation timeline">
      <button type="button" data-action="rewind" aria-label="Rewind animation">Rewind</button>
      <button type="button" data-action="previous" aria-label="Previous semantic checkpoint" aria-keyshortcuts="Alt+ArrowLeft">Previous</button>
      <button type="button" data-action="toggle">Play</button>
      <button type="button" data-action="next" aria-label="Next semantic checkpoint" aria-keyshortcuts="Alt+ArrowRight">Next</button>
      <input data-action="seek" type="range" min="0" max="1" step="0.001" value="0" aria-label="Scrub animation progress" list="kp-tutorial-scrub-marks" />
      <output class="progress" data-progress>0%</output>
      <datalist id="kp-tutorial-scrub-marks">
        <option value="0" label="Before"></option>
        <option value="0.72" label="Handoff"></option>
        <option value="1" label="After"></option>
      </datalist>
    </div>
  </div>
`;
