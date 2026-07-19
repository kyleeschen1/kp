import {
  type KpSymbolicEquationIr,
  type KpSymbolicEquationLayoutIr
} from "../projections/public-api.ts";

import {
  renderSymbolicEquation,
  type KpSymbolicEquationRenderOptions
} from "./symbolic-equation-dom.ts";

export { renderSymbolicEquation } from "./symbolic-equation-dom.ts";

export interface KpLinearEquationSymbolicStage {
  render(
    projection: KpSymbolicEquationIr,
    options?: KpSymbolicEquationRenderOptions
  ): Promise<void>;
  dispose(): void;
}

export function createLinearEquationSymbolicStage(
  root: HTMLElement
): KpLinearEquationSymbolicStage {
  let disposed = false;
  let renderRevision = 0;
  let layoutRevision = 0;
  const observer = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(() => {
        if (disposed) return;
        layoutRevision += 1;
        root.dataset["kpSymbolicMeasurementState"] = "invalidated";
      });
  observer?.observe(root);

  return {
    async render(projection, options = {}) {
      if (disposed) throw new Error("Symbolic motion stage is disposed.");
      const revision = ++renderRevision;
      const transition = projection.transition;
      if (transition === undefined || transition.phase === "source" || transition.phase === "target" ||
        prefersReducedMotion(root)) {
        renderNative(root, projection, options, transition === undefined ? "native" : transition.phase);
        return;
      }

      const stage = document.createElement("div");
      stage.dataset["kpSymbolicMotionStage"] = "true";
      stage.dataset["kpSymbolicMotionPhase"] = transition.phase;
      stage.dataset["kpSymbolicLayoutRevision"] = String(layoutRevision);
      const nativeLayer = layer("native");
      renderSymbolicEquation(nativeLayer, projection, options);
      const measurementLayer = layer("measurement");
      measurementLayer.setAttribute("aria-hidden", "true");
      const sourceMeasure = layer("source-measure");
      const targetMeasure = layer("target-measure");
      renderLayout(sourceMeasure, projection, transition.sourceLayout, options);
      renderLayout(targetMeasure, projection, transition.targetLayout, options);
      measurementLayer.append(sourceMeasure, targetMeasure);
      const overlay = layer("overlay");
      overlay.setAttribute("aria-hidden", "true");
      const sourceVisual = layer("source");
      const targetVisual = layer("target");
      renderLayout(sourceVisual, projection, transition.sourceLayout, options);
      renderLayout(targetVisual, projection, transition.targetLayout, options);
      const progress = transition.progressPermille / 1000;
      sourceVisual.style.opacity = String(1 - progress);
      targetVisual.style.opacity = String(progress);
      overlay.append(sourceVisual, targetVisual);
      stage.append(nativeLayer, measurementLayer, overlay);
      root.replaceChildren(stage);
      await root.ownerDocument.fonts.ready;
      if (disposed || revision !== renderRevision) return;
      const measurements = measureLineage(sourceMeasure, targetMeasure, transition.lineage);
      if (measurements === 0) {
        renderNative(root, projection, options, "native-zero-geometry");
        return;
      }
      stage.dataset["kpSymbolicMeasurementCount"] = String(measurements);
      stage.dataset["kpSymbolicMeasurementState"] = "ready";
      root.dataset["kpSymbolicMeasurementState"] = "ready";
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderRevision += 1;
      observer?.disconnect();
      root.replaceChildren();
      delete root.dataset["kpSymbolicMeasurementState"];
    }
  };
}

function renderNative(
  root: HTMLElement,
  projection: KpSymbolicEquationIr,
  options: KpSymbolicEquationRenderOptions,
  state: string
): void {
  renderSymbolicEquation(root, projection, options);
  root.dataset["kpSymbolicMotionState"] = state;
  root.dataset["kpSymbolicMeasurementState"] = "native";
}

function renderLayout(
  root: HTMLElement,
  projection: KpSymbolicEquationIr,
  layout: KpSymbolicEquationLayoutIr,
  options: KpSymbolicEquationRenderOptions
): void {
  renderSymbolicEquation(root, {
    ...projection,
    frameId: layout.frameId,
    equationSemanticId: layout.equationSemanticId,
    tokens: layout.tokens,
    nativeLayout: layout,
    accessibleText: layout.accessibleText
  }, options);
}

function layer(kind: string): HTMLDivElement {
  const element = document.createElement("div");
  element.dataset["kpSymbolicStageLayer"] = kind;
  return element;
}

function measureLineage(
  source: HTMLElement,
  target: HTMLElement,
  lineage: KpSymbolicEquationIr["transition"] extends infer Transition
    ? Transition extends { readonly lineage: infer Lineage } ? Lineage : never
    : never
): number {
  let measured = 0;
  for (const item of lineage) {
    const sourceToken = tokenFor(source, item.sourceTokenId);
    const targetToken = tokenFor(target, item.targetTokenId);
    const sourceRect = sourceToken?.getBoundingClientRect();
    const targetRect = targetToken?.getBoundingClientRect();
    if ((sourceRect !== undefined && sourceRect.width > 0 && sourceRect.height > 0) ||
      (targetRect !== undefined && targetRect.width > 0 && targetRect.height > 0)) measured += 1;
  }
  return measured;
}

function tokenFor(root: HTMLElement, tokenId: string | undefined): HTMLElement | undefined {
  if (tokenId === undefined) return undefined;
  return [...root.querySelectorAll<HTMLElement>("[data-kp-symbolic-token]")]
    .find((token) => token.dataset["kpSymbolicToken"] === tokenId);
}

function prefersReducedMotion(root: HTMLElement): boolean {
  return root.ownerDocument.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
}
