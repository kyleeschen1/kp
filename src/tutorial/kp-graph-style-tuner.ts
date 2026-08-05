import {
  formatKpGraphStrokeScale,
  graphStrokeScaleSummary,
  kpGraphStrokeScaleMaximum,
  kpGraphStrokeScaleMinimum,
  kpGraphStrokeScaleStep,
  normalizeKpGraphStrokeScale
} from "./kp-graph-style.ts";

export {
  formatKpGraphStrokeScale,
  graphStrokeScaleSummary,
  kpGraphStrokeScaleDefault,
  kpGraphStrokeScaleMaximum,
  kpGraphStrokeScaleMinimum,
  kpGraphStrokeScaleStep,
  normalizeKpGraphStrokeScale
} from "./kp-graph-style.ts";

export const KP_GRAPH_STYLE_TUNER_TAG = "kp-graph-style-tuner";
export const KP_GRAPH_STYLE_TUNER_CHANGE_EVENT =
  "kp:graph-style-tuner-change";

export interface KpGraphStyleTunerChangeDetail {
  readonly strokeScale: number;
}

const observedAttributes = ["stroke-scale"] as const;

/**
 * Enhances a native details/range fallback without owning graph geometry or
 * theme policy. Hosts translate its one optical multiplier into their tokens.
 */
export class KpGraphStyleTunerElement extends HTMLElement {
  static readonly observedAttributes = observedAttributes;

  private strokeInput: HTMLInputElement | undefined;
  private strokeOutput: HTMLOutputElement | undefined;

  connectedCallback(): void {
    this.strokeInput = requiredElement(
      this,
      "input[data-kp-graph-style-tuner-stroke]"
    );
    this.strokeOutput = requiredElement(
      this,
      "[data-kp-graph-style-tuner-output]"
    );
    this.strokeInput.addEventListener("input", this.handleStrokeInput);
    this.dataset["kpGraphStyleTunerEnhancement"] = "ready";
    this.render();
  }

  disconnectedCallback(): void {
    this.strokeInput?.removeEventListener("input", this.handleStrokeInput);
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private readonly handleStrokeInput = (): void => {
    const strokeScale = normalizeKpGraphStrokeScale(this.strokeInput?.value);
    this.setAttribute("stroke-scale", formatKpGraphStrokeScale(strokeScale));
    this.dispatchEvent(new CustomEvent<KpGraphStyleTunerChangeDetail>(
      KP_GRAPH_STYLE_TUNER_CHANGE_EVENT,
      {
        bubbles: true,
        composed: true,
        detail: { strokeScale }
      }
    ));
  };

  private render(): void {
    if (this.strokeInput === undefined || this.strokeOutput === undefined) {
      return;
    }
    const scale = normalizeKpGraphStrokeScale(
      this.getAttribute("stroke-scale")
    );
    this.strokeInput.min = String(kpGraphStrokeScaleMinimum);
    this.strokeInput.max = String(kpGraphStrokeScaleMaximum);
    this.strokeInput.step = String(kpGraphStrokeScaleStep);
    this.strokeInput.value = formatKpGraphStrokeScale(scale);
    this.strokeOutput.value = graphStrokeScaleSummary(scale);
  }
}

export function defineKpGraphStyleTuner(
  registry: CustomElementRegistry = customElements
): void {
  if (registry.get(KP_GRAPH_STYLE_TUNER_TAG) === undefined) {
    registry.define(KP_GRAPH_STYLE_TUNER_TAG, KpGraphStyleTunerElement);
  }
}

function requiredElement<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Graph style tuner requires ${selector}.`);
  }
  return element;
}
