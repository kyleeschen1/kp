import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationTrace,
  type KpSymbolicEquationIr
} from "../projections/public-api.ts";

import {
  applyConceptRoomThemeRoles,
  structuralConceptRoomTheme,
  type KpConceptRoomStyleRole,
  type KpConceptRoomThemeShape
} from "./concept-room-theme.ts";

export interface KpSymbolicEquationController {
  render(progressPermille: number, focusSemanticIds?: readonly string[]): KpSymbolicEquationIr;
  dispose(): void;
}

export interface KpSymbolicEquationRenderOptions {
  readonly focusSemanticIds?: readonly string[];
  readonly theme?: KpConceptRoomThemeShape;
}

export function createSymbolicEquationController(
  root: HTMLElement,
  trace: KpLinearEquationTrace,
  options: { readonly theme?: KpConceptRoomThemeShape } = {}
): KpSymbolicEquationController {
  let disposed = false;
  return {
    render(progressPermille, focusSemanticIds = []) {
      if (disposed) throw new Error("Symbolic equation controller is disposed.");
      const projection = projectLinearEquationTrace(trace, progressPermille);
      renderSymbolicEquation(root, projection, {
        focusSemanticIds,
        theme: options.theme ?? structuralConceptRoomTheme
      });
      return projection;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.replaceChildren();
    }
  };
}

export function renderSymbolicEquation(
  root: HTMLElement,
  projection: KpSymbolicEquationIr,
  options: KpSymbolicEquationRenderOptions = {}
): void {
  const focusSemanticIds = new Set(options.focusSemanticIds ?? []);
  const theme = options.theme ?? structuralConceptRoomTheme;
  const equation = document.createElement("div");
  equation.dataset["kpSymbolicEquation"] = "true";
  equation.dataset["kpTraceId"] = projection.traceId;
  equation.dataset["kpFrameId"] = projection.frameId;
  equation.dataset["kpEquationSemanticId"] = projection.equationSemanticId;
  equation.dataset["kpSemanticId"] = projection.equationSemanticId;
  equation.dataset["kpProgressPermille"] = String(projection.progressPermille);
  equation.setAttribute("role", "math");
  equation.setAttribute("aria-label", projection.accessibleText);
  applyConceptRoomThemeRoles(equation, ["equation.expression"], theme);
  projection.tokens.forEach((token) => {
    const span = document.createElement("span");
    span.dataset["kpSymbolicToken"] = token.id;
    span.dataset["kpContinuantId"] = token.continuantId;
    span.dataset["kpSemanticId"] = token.semanticId;
    span.dataset["kpSymbolicTokenKind"] = token.kind;
    span.dataset["kpSymbolicSide"] = token.side;
    const roles: KpConceptRoomStyleRole[] = [
      token.kind === "operator" ? "equation.operation" : "equation.expression"
    ];
    if (focusSemanticIds.has(token.semanticId)) roles.push("focus.primary");
    applyConceptRoomThemeRoles(span, roles, theme);
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
