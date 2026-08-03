export const KP_TUTORIAL_SCRUB_BAR_TAG = "kp-tutorial-scrub-bar";
export const KP_TUTORIAL_SCRUB_TOGGLE_EVENT = "kp:tutorial-scrub-toggle";
export const KP_TUTORIAL_SCRUB_REWIND_EVENT = "kp:tutorial-scrub-rewind";
export const KP_TUTORIAL_SCRUB_PREVIOUS_EVENT = "kp:tutorial-scrub-previous";
export const KP_TUTORIAL_SCRUB_NEXT_EVENT = "kp:tutorial-scrub-next";
export const KP_TUTORIAL_SCRUB_SEEK_EVENT = "kp:tutorial-scrub-seek";
export const KP_TUTORIAL_SCRUB_AUTO_EVENT = "kp:tutorial-scrub-auto";

export interface KpTutorialScrubSeekDetail {
  readonly progress: number;
}

export interface KpTutorialScrubAutoDetail {
  readonly direction: "forward" | "rewind";
}

const observedAttributes = [
  "controls-disabled",
  "direction",
  "label",
  "manual-claimed",
  "next-disabled",
  "playback-status",
  "previous-disabled",
  "progress",
  "retained-context"
] as const;

/**
 * Framework-neutral playback boundary for prose-led tutorials. The element
 * owns controls and scroll-crossing intent, while the host keeps semantic
 * checkpoints and the animation clock authoritative.
 */
export class KpTutorialScrubBarElement extends HTMLElement {
  static readonly observedAttributes = observedAttributes;

  private readonly root: ShadowRoot;
  private readonly titleElement: HTMLElement;
  private readonly retainedContext: HTMLElement;
  private readonly status: HTMLOutputElement;
  private readonly previousButton: HTMLButtonElement;
  private readonly toggleButton: HTMLButtonElement;
  private readonly nextButton: HTMLButtonElement;
  private readonly rewindButton: HTMLButtonElement;
  private readonly scrubber: HTMLInputElement;
  private readonly progressOutput: HTMLOutputElement;
  private scrollFrame: number | undefined;
  private previousTop: number | undefined;
  private previousScrollY: number | undefined;
  private manualClaimedInternally = false;
  private reducedMotionQuery: MediaQueryList | undefined;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.root.innerHTML = template;
    this.titleElement = requiredElement(this.root, "[data-title]");
    this.retainedContext = requiredElement(this.root, "[data-retained-context]");
    this.status = requiredElement(this.root, "[data-status]");
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
      view.addEventListener("scroll", this.scheduleScrollProjection, {
        passive: true
      });
      view.addEventListener("resize", this.resetScrollProjection);
      this.reducedMotionQuery = view.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotionQuery.addEventListener("change", this.handleMotionPreference);
      this.previousTop = this.getBoundingClientRect().top;
      this.previousScrollY = view.scrollY;
    }
    this.render();
  }

  disconnectedCallback(): void {
    this.previousButton.removeEventListener("click", this.handlePrevious);
    this.toggleButton.removeEventListener("click", this.handleToggle);
    this.nextButton.removeEventListener("click", this.handleNext);
    this.rewindButton.removeEventListener("click", this.handleRewind);
    this.scrubber.removeEventListener("input", this.handleSeek);
    const view = this.ownerDocument.defaultView;
    view?.removeEventListener("scroll", this.scheduleScrollProjection);
    view?.removeEventListener("resize", this.resetScrollProjection);
    this.reducedMotionQuery?.removeEventListener(
      "change",
      this.handleMotionPreference
    );
    if (this.scrollFrame !== undefined && view !== null) {
      view.cancelAnimationFrame(this.scrollFrame);
    }
    this.scrollFrame = undefined;
  }

  attributeChangedCallback(): void {
    this.render();
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

  private readonly resetScrollProjection = (): void => {
    const view = this.ownerDocument.defaultView;
    if (view === null) return;
    this.previousTop = this.getBoundingClientRect().top;
    this.previousScrollY = view.scrollY;
    this.render();
  };

  private readonly scheduleScrollProjection = (): void => {
    const view = this.ownerDocument.defaultView;
    if (view === null || this.scrollFrame !== undefined) return;
    this.scrollFrame = view.requestAnimationFrame(() => {
      this.scrollFrame = undefined;
      this.projectScrollCrossing(view);
    });
  };

  private projectScrollCrossing(view: Window): void {
    const top = this.getBoundingClientRect().top;
    const scrollY = view.scrollY;
    const previousTop = this.previousTop;
    const previousScrollY = this.previousScrollY;
    this.previousTop = top;
    this.previousScrollY = scrollY;
    if (
      previousTop === undefined ||
      previousScrollY === undefined ||
      this.manualClaimed ||
      this.reducedMotion ||
      this.controlsDisabled
    ) return;

    const readingBand = view.innerHeight * 0.38;
    if (
      scrollY > previousScrollY &&
      previousTop > readingBand &&
      top <= readingBand + 2
    ) {
      this.emit<KpTutorialScrubAutoDetail>(KP_TUTORIAL_SCRUB_AUTO_EVENT, {
        direction: "forward"
      });
    } else if (
      scrollY < previousScrollY &&
      previousTop < readingBand &&
      top >= readingBand - 2
    ) {
      this.emit<KpTutorialScrubAutoDetail>(KP_TUTORIAL_SCRUB_AUTO_EVENT, {
        direction: "rewind"
      });
    }
  }

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

    this.titleElement.textContent = this.getAttribute("label") ?? "Animation";
    this.retainedContext.textContent = this.getAttribute("retained-context") ?? "";
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
    this.status.value = reducedMotion
      ? "Scroll motion is off. Use the controls when ready."
      : manualClaimed
        ? "Manual control"
        : playing && direction === "rewind"
          ? "Rewinding as you move up"
          : playing
            ? "Playing as you move down"
            : "Scroll down to play · scroll up to rewind";
    this.dataset["kpTutorialScrubManual"] = String(manualClaimed);
    this.dataset["kpTutorialScrubReducedMotion"] = String(reducedMotion);
    this.setAttribute(
      "aria-label",
      `Animation playback controls: ${this.titleElement.textContent}`
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
      display: block;
      margin: 0.2rem 0 1.25rem;
      color: #294653;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    }
    .boundary {
      display: grid;
      gap: 0.72rem;
      border-block: 1px solid rgb(91 122 133 / 0.28);
      padding: 0.82rem 0.1rem 0.9rem;
    }
    .heading {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 1rem;
      align-items: end;
    }
    .copy {
      display: grid;
      gap: 0.12rem;
    }
    .eyebrow,
    .context,
    output {
      color: #607983;
      font-size: 0.67rem;
      line-height: 1.4;
    }
    .eyebrow {
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    strong {
      font-size: 0.82rem;
      line-height: 1.4;
    }
    output {
      font-variant-numeric: tabular-nums;
      font-weight: 750;
    }
    .controls {
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
      border-color: #365e6a;
      color: #fff;
      background: #365e6a;
    }
    button:disabled {
      cursor: default;
      opacity: 0.42;
    }
    input {
      width: 100%;
      min-width: 0;
      accent-color: #496f7b;
    }
    .progress {
      text-align: right;
    }
    @media (max-width: 560px) {
      .heading {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
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
    }
  </style>
  <div class="boundary">
    <div class="heading">
      <div class="copy">
        <span class="eyebrow">Animation boundary</span>
        <strong data-title>Animation</strong>
        <span class="context" data-retained-context></span>
      </div>
      <output data-status aria-live="polite"></output>
    </div>
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
