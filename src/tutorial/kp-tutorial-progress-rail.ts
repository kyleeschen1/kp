export const KP_TUTORIAL_PROGRESS_RAIL_TAG = "kp-tutorial-progress-rail";

export interface KpTutorialProgressRailProjection {
  readonly progress: number;
  readonly percent: number;
  readonly statusText: string;
}

export function projectKpTutorialProgressRail(input: {
  readonly progress: number;
  readonly label: string;
}): KpTutorialProgressRailProjection {
  const progress = Number.isFinite(input.progress)
    ? Math.max(0, Math.min(1, input.progress))
    : 0;
  const percent = Math.round(progress * 100);
  const label = input.label.trim();
  return Object.freeze({
    progress,
    percent,
    statusText: label.length > 0 ? `${percent}% — ${label}` : `${percent}%`
  });
}

/** Enhances published light DOM in place; it never inserts rail geometry. */
export class KpTutorialProgressRailElement extends HTMLElement {
  static readonly observedAttributes = ["progress", "progress-label"];

  connectedCallback(): void {
    this.dataset["kpTutorialProgressEnhancement"] = "ready";
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const status = this.querySelector<HTMLElement>(
      "[data-kp-tutorial-progress-status]"
    );
    if (status === null) return;
    const projection = projectKpTutorialProgressRail({
      progress: Number(this.getAttribute("progress") ?? 0),
      label: this.getAttribute("progress-label") ?? ""
    });
    this.style.setProperty(
      "--kp-tutorial-progress",
      projection.progress.toFixed(4)
    );
    this.setAttribute("aria-valuenow", String(projection.percent));
    this.setAttribute(
      "aria-valuetext",
      this.getAttribute("progress-label") ?? `${projection.percent}%`
    );
    // Progress and label attributes may settle in the same host transaction;
    // retaining equal text prevents duplicate child-list churn.
    if (status.textContent !== projection.statusText) {
      status.textContent = projection.statusText;
    }
  }
}

export function defineKpTutorialProgressRail(
  registry: CustomElementRegistry = customElements
): void {
  if (registry.get(KP_TUTORIAL_PROGRESS_RAIL_TAG) === undefined) {
    registry.define(
      KP_TUTORIAL_PROGRESS_RAIL_TAG,
      KpTutorialProgressRailElement
    );
  }
}
