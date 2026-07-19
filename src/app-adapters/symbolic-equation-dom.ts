import "katex/dist/katex.min.css";
import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationTrace,
  type KpSymbolicEquationIr
} from "../projections/public-api.ts";

export interface KpSymbolicEquationController {
  render(progressPermille: number): KpSymbolicEquationIr;
  dispose(): void;
}

export function createSymbolicEquationController(
  root: HTMLElement,
  trace: KpLinearEquationTrace
): KpSymbolicEquationController {
  let disposed = false;
  return {
    render(progressPermille) {
      if (disposed) throw new Error("Symbolic equation controller is disposed.");
      const projection = projectLinearEquationTrace(trace, progressPermille);
      renderSymbolicEquation(root, projection);
      return projection;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.replaceChildren();
    }
  };
}

export function renderSymbolicEquation(root: HTMLElement, projection: KpSymbolicEquationIr): void {
  const equation = document.createElement("div");
  equation.dataset["kpSymbolicEquation"] = "true";
  equation.dataset["kpTraceId"] = projection.traceId;
  equation.dataset["kpFrameId"] = projection.frameId;
  equation.dataset["kpEquationSemanticId"] = projection.equationSemanticId;
  equation.dataset["kpProgressPermille"] = String(projection.progressPermille);
  equation.setAttribute("role", "math");
  equation.setAttribute("aria-label", projection.accessibleText);
  projection.tokens.forEach((token) => {
    const span = document.createElement("span");
    span.dataset["kpSymbolicToken"] = token.id;
    span.dataset["kpSemanticId"] = token.semanticId;
    span.dataset["kpSymbolicTokenKind"] = token.kind;
    span.dataset["kpSymbolicSide"] = token.side;
    katex.render(token.latex, span, {
      displayMode: false,
      output: "htmlAndMathml",
      throwOnError: true,
      trust: false
    });
    equation.append(span);
  });
  root.replaceChildren(equation);
}
