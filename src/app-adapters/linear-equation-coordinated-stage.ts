import type {
  KpBalanceSceneIr,
  KpSymbolicEquationIr
} from "../projections/public-api.ts";

import type { KpConceptRoomThemeShape } from "./concept-room-theme.ts";
import type { KpLinearEquationSymbolicStage } from "./linear-equation-symbolic-stage.ts";

export interface KpLinearEquationCoordinatedStage {
  render(
    symbolic: KpSymbolicEquationIr,
    balance: KpBalanceSceneIr,
    options?: { readonly focusSemanticIds?: readonly string[] }
  ): Promise<void>;
  dispose(): void;
}

export interface KpLinearEquationCoordinatedRenderers {
  readonly createSymbolicStage?: (root: HTMLElement) => KpLinearEquationSymbolicStage;
  readonly renderSymbolicEquation: (
    root: HTMLElement,
    projection: KpSymbolicEquationIr,
    options?: { readonly focusSemanticIds?: readonly string[] }
  ) => void;
  readonly renderBalanceScene: (
    root: HTMLElement,
    projection: KpBalanceSceneIr,
    options?: {
      readonly focusSemanticIds?: readonly string[];
      readonly theme?: KpConceptRoomThemeShape;
    }
  ) => void;
}

export function createLinearEquationCoordinatedStage(
  root: HTMLElement,
  renderers: KpLinearEquationCoordinatedRenderers
): KpLinearEquationCoordinatedStage {
  let disposed = false;
  let renderRevision = 0;
  const stage = document.createElement("div");
  stage.dataset["kpLinearEquationCoordinatedStage"] = "true";
  stage.setAttribute("role", "group");
  stage.setAttribute("aria-label", "Equation and balance synchronized together");
  const symbolicRoot = projectionRegion("symbolic", "Equation");
  const balanceRoot = projectionRegion("balance", "Balance diagram");
  stage.append(symbolicRoot, balanceRoot);
  root.replaceChildren(stage);
  const symbolicStage = renderers.createSymbolicStage?.(symbolicRoot);

  return {
    async render(symbolic, balance, options = {}) {
      if (disposed) throw new Error("Coordinated linear-equation stage is disposed.");
      if (symbolic.traceId !== balance.traceId || symbolic.progressPermille !== balance.progressPermille) {
        throw new Error("Coordinated projections must be sampled from one trace and one clock.");
      }
      const revision = ++renderRevision;
      const progress = String(symbolic.progressPermille);
      stage.dataset["kpCoordinatedTraceId"] = symbolic.traceId;
      stage.dataset["kpCoordinatedTimePermille"] = progress;
      symbolicRoot.dataset["kpCoordinatedTimePermille"] = progress;
      balanceRoot.dataset["kpCoordinatedTimePermille"] = progress;
      const renderOptions = options.focusSemanticIds === undefined
        ? {}
        : { focusSemanticIds: options.focusSemanticIds };
      const symbolicRender = symbolicStage === undefined
        ? Promise.resolve(renderers.renderSymbolicEquation(symbolicRoot, symbolic, renderOptions))
        : symbolicStage.render(symbolic, renderOptions);
      renderers.renderBalanceScene(balanceRoot, balance, renderOptions);
      // A later seek owns both surfaces; an older async measurement pass must never declare settlement.
      await symbolicRender;
      if (!disposed && revision === renderRevision) {
        stage.dataset["kpCoordinatedSettledTimePermille"] = progress;
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderRevision += 1;
      symbolicStage?.dispose();
      if (stage.parentElement === root) root.replaceChildren();
    }
  };
}

function projectionRegion(
  projection: "symbolic" | "balance",
  label: string
): HTMLElement {
  const region = document.createElement("section");
  region.dataset["kpCoordinatedProjection"] = projection;
  region.setAttribute("aria-label", label);
  return region;
}
