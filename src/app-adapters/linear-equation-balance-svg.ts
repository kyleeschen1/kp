import "katex/dist/katex.min.css";
import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationBalanceExemplar,
  type KpBalanceSceneIr,
  type KpBalanceSideIr
} from "../projections/public-api.ts";

import {
  applyConceptRoomThemeRoles,
  structuralConceptRoomTheme,
  type KpConceptRoomStyleRole,
  type KpConceptRoomThemeShape
} from "./concept-room-theme.ts";

const svgNamespace = "http://www.w3.org/2000/svg";

export interface KpBalanceSceneController {
  render(progressPermille: number, focusSemanticIds?: readonly string[]): KpBalanceSceneIr;
  dispose(): void;
}

export function createBalanceSceneController(
  root: HTMLElement,
  trace: KpLinearEquationTrace,
  options: {
    readonly diagramSemanticId: string;
    readonly theme?: KpConceptRoomThemeShape;
  }
): KpBalanceSceneController {
  let disposed = false;
  return {
    render(progressPermille, focusSemanticIds = []) {
      if (disposed) throw new Error("Balance scene controller is disposed.");
      const projection = projectLinearEquationBalanceExemplar(trace, progressPermille, options);
      renderBalanceScene(root, projection, {
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

export function renderBalanceScene(
  root: HTMLElement,
  projection: KpBalanceSceneIr,
  options: {
    readonly focusSemanticIds?: readonly string[];
    readonly theme?: KpConceptRoomThemeShape;
  } = {}
): void {
  const focusSemanticIds = new Set(options.focusSemanticIds ?? []);
  const theme = options.theme ?? structuralConceptRoomTheme;
  const svg = svgElement("svg");
  svg.dataset["kpBalanceScene"] = "true";
  svg.dataset["kpTraceId"] = projection.traceId;
  svg.dataset["kpFrameId"] = projection.frameId;
  svg.dataset["kpEquationSemanticId"] = projection.equationSemanticId;
  svg.dataset["kpDiagramSemanticId"] = projection.diagramSemanticId;
  svg.dataset["kpProgressPermille"] = String(projection.progressPermille);
  svg.setAttribute("viewBox", "0 0 640 320");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", projection.accessibleText);
  applyConceptRoomThemeRoles(svg, rolesFor(projection.diagramSemanticId, "diagram.balance", focusSemanticIds), theme);

  const title = svgElement("title");
  title.textContent = projection.accessibleText;
  svg.append(title, structuralBalance());
  projection.sides.forEach((side) => {
    svg.append(renderSide(side, focusSemanticIds, theme));
  });
  projection.operationApplications.forEach((application) => {
    const label = svgElement("text");
    label.dataset["kpBalanceOperationApplication"] = application.id;
    label.dataset["kpOperationSemanticId"] = application.operationSemanticId;
    label.dataset["kpBalanceSide"] = application.side;
    label.setAttribute("x", application.side === "left" ? "190" : "450");
    label.setAttribute("y", "72");
    label.setAttribute("text-anchor", "middle");
    label.textContent = application.spoken;
    applyConceptRoomThemeRoles(
      label,
      rolesFor(application.operationSemanticId, "equation.operation", focusSemanticIds),
      theme
    );
    svg.append(label);
  });
  root.replaceChildren(svg);
}

function structuralBalance(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceStructure"] = "true";
  const beam = svgElement("line");
  beam.setAttribute("x1", "80");
  beam.setAttribute("x2", "560");
  beam.setAttribute("y1", "200");
  beam.setAttribute("y2", "200");
  beam.setAttribute("stroke", "currentColor");
  const fulcrum = svgElement("path");
  fulcrum.setAttribute("d", "M 320 200 L 278 280 L 362 280 Z");
  fulcrum.setAttribute("fill", "none");
  fulcrum.setAttribute("stroke", "currentColor");
  const leftPan = pan("80", "190", "300");
  const rightPan = pan("340", "450", "560");
  group.append(beam, fulcrum, leftPan, rightPan);
  return group;
}

function pan(left: string, center: string, right: string): SVGPathElement {
  const path = svgElement("path");
  path.setAttribute("d", `M ${center} 200 L ${left} 250 L ${right} 250 Z`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  return path;
}

function renderSide(
  side: KpBalanceSideIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceSide"] = side.side;
  group.dataset["kpBalanceSideId"] = side.id;
  side.terms.forEach((term, index) => {
    const label = svgElement("foreignObject");
    const center = side.side === "left" ? 190 : 450;
    const firstLabelX = center - ((side.terms.length - 1) * 90) / 2 - 45;
    label.dataset["kpBalanceTerm"] = term.id;
    label.dataset["kpSemanticId"] = term.semanticId;
    label.dataset["kpBalanceTermKind"] = term.kind;
    label.setAttribute("x", String(firstLabelX + index * 90));
    label.setAttribute("y", "205");
    label.setAttribute("width", "90");
    label.setAttribute("height", "44");
    applyConceptRoomThemeRoles(
      label,
      rolesFor(term.semanticId, "equation.expression", focusSemanticIds),
      theme
    );
    const math = document.createElement("span");
    math.setAttribute("aria-hidden", "true");
    katex.render(term.latex, math, {
      displayMode: false,
      output: "htmlAndMathml",
      throwOnError: true,
      trust: false
    });
    label.append(math);
    group.append(label);
  });
  return group;
}

function rolesFor(
  semanticId: string,
  baseRole: KpConceptRoomStyleRole,
  focusSemanticIds: ReadonlySet<string>
): KpConceptRoomStyleRole[] {
  return focusSemanticIds.has(semanticId) ? [baseRole, "focus.primary"] : [baseRole];
}

function svgElement<TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
): SVGElementTagNameMap[TagName] {
  return document.createElementNS(svgNamespace, tagName);
}
