import type {
  KpGraph2DQuadraticTranslationRuntimeFrame,
  KpGraph2DQuadraticTranslationRuntimePoint
} from "../animation/graph-2d-quadratic-translation-asset.ts";
import {
  renderKpDimensionalContinuityInlineLatex
} from "./dimensional-continuity-inline-latex.ts";
import type { KpGraph2DRuntimeSession } from
  "./graph-2d-runtime-session.ts";

export const kpGraph2DQuadraticTranslationPresentationProfile =
  Object.freeze({
    id: "kp.graph.function-translation.quadratic.v1",
    languageId: "kp.graph.function-translation.v1",
    rendererId: "renderer.graph-2d.quadratic-translation.svg.v1"
  });

export interface KpGraph2DQuadraticTranslationSvgPoint {
  readonly id: string;
  readonly role: KpGraph2DQuadraticTranslationRuntimePoint["role"];
  readonly x: number;
  readonly y: number;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

export interface KpGraph2DQuadraticTranslationViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
  readonly xAxisY: number;
  readonly yAxisX: number;
}

export interface KpGraph2DQuadraticTranslationSvgProjection {
  readonly schemaVersion:
    "kp.graph-2d-quadratic-translation-svg-projection.v1";
  readonly frameId: string;
  readonly curveIdentityId: string;
  readonly curvePath: string;
  readonly horizontalShift: number;
  readonly translationProgress: number;
  readonly points: readonly KpGraph2DQuadraticTranslationSvgPoint[];
  readonly vertex: KpGraph2DQuadraticTranslationSvgPoint;
  readonly vertexLabelLatex: string;
  readonly vertexLabelX: number;
  readonly vertexLabelY: number;
  readonly sourceEquationSalience: number;
  readonly targetEquationSalience: number;
  readonly ticks: readonly Readonly<{
    value: number;
    x: number;
    y: number;
  }>[];
  readonly accessibilityDescription: string;
}

export type KpGraph2DQuadraticTranslationSvgRuntimeSession =
  KpGraph2DRuntimeSession<
    SVGGElement,
    KpGraph2DQuadraticTranslationRuntimeFrame,
    KpGraph2DQuadraticTranslationViewport
  >;

const curveParameterDomain = Object.freeze([-2, 2] as const);
const curveSampleCount = 81;

export function projectKpGraph2DQuadraticTranslationSvgFrame(input: {
  readonly frame: KpGraph2DQuadraticTranslationRuntimeFrame;
  readonly viewport: KpGraph2DQuadraticTranslationViewport;
}): KpGraph2DQuadraticTranslationSvgProjection {
  const { frame, viewport } = input;
  const curvePoints = Array.from({ length: curveSampleCount }, (_, index) => {
    const parameter = curveParameterDomain[0] +
      index / (curveSampleCount - 1) *
      (curveParameterDomain[1] - curveParameterDomain[0]);
    return graphPoint(viewport, {
      x: parameter + frame.horizontalShift,
      y: parameter ** 2
    });
  });
  const points = frame.selectedPoints.map((point) => {
    const projected = graphPoint(viewport, point);
    return Object.freeze({
      id: point.id,
      role: point.role,
      x: point.x,
      y: point.y,
      cx: projected.x,
      cy: projected.y,
      radius: point.role === "vertex" ? 3.5 : 2.5
    });
  });
  const vertex = points.find(({ role }) => role === "vertex");
  if (vertex === undefined) throw new Error(
    `Frame ${frame.id} must project a vertex.`
  );
  const ticks = [0, 2].map((value) => {
    const projected = graphPoint(viewport, { x: value, y: 0 });
    return Object.freeze({
      value,
      x: projected.x,
      y: projected.y
    });
  });

  return deepFreeze({
    schemaVersion:
      "kp.graph-2d-quadratic-translation-svg-projection.v1" as const,
    frameId: frame.id,
    curveIdentityId: frame.curveIdentityId,
    curvePath: curvePoints.map((point, index) =>
      `${index === 0 ? "M" : "L"}${format(point.x)} ${format(point.y)}`
    ).join(" "),
    horizontalShift: frame.horizontalShift,
    translationProgress: frame.translationProgress,
    points,
    vertex,
    vertexLabelLatex:
      `\\operatorname{vertex}\\,(${format(frame.vertex.x)},0)`,
    vertexLabelX: vertex.cx + 9,
    vertexLabelY: vertex.cy - 31,
    sourceEquationSalience: roundOpacity(
      1 - 0.65 * frame.translationProgress
    ),
    targetEquationSalience: roundOpacity(
      0.35 + 0.65 * frame.translationProgress
    ),
    ticks,
    accessibilityDescription:
      `The parabola has moved ${format(frame.horizontalShift)} of 2 units ` +
      `to the right. Its vertex is at ` +
      `${format(frame.vertex.x)}, 0; the axes remain fixed.`
  });
}

export function renderKpGraph2DQuadraticTranslationSvgContent(input: {
  readonly frame: KpGraph2DQuadraticTranslationRuntimeFrame;
  readonly viewport: KpGraph2DQuadraticTranslationViewport;
}): string {
  const projection = projectKpGraph2DQuadraticTranslationSvgFrame(input);
  const descriptionId = "kp-graph-2d-quadratic-translation-description";
  return `<desc id="${descriptionId}" data-kp-graph2d-quadratic-description>${escapeHtml(projection.accessibilityDescription)}</desc>
    <g data-kp-graph2d-quadratic-context aria-hidden="true">
      ${projection.ticks.map((tick) => `<g data-kp-graph2d-quadratic-tick="${tick.value}"><line class="editor-graph-stage__quadratic-tick" x1="${format(tick.x)}" y1="${format(tick.y - 4)}" x2="${format(tick.x)}" y2="${format(tick.y + 4)}" />${renderMathLabel({
        role: `tick-${tick.value}`,
        latex: String(tick.value),
        x: tick.x - 18,
        y: tick.y + 7,
        width: 36,
        height: 24,
        className: "editor-graph-stage__quadratic-tick-label"
      })}</g>`).join("")}
      ${renderMathLabel({
        role: "axis-x",
        latex: "x",
        x: input.viewport.width - 43,
        y: input.viewport.xAxisY - 33,
        width: 28,
        height: 28,
        className: "editor-graph-stage__quadratic-axis-label"
      })}
      ${renderMathLabel({
        role: "axis-y",
        latex: "y",
        x: input.viewport.yAxisX + 8,
        y: 18,
        width: 28,
        height: 28,
        className: "editor-graph-stage__quadratic-axis-label"
      })}
    </g>
    <foreignObject class="editor-graph-stage__quadratic-equation-foreign-object" x="${input.viewport.width - 278}" y="14" width="254" height="48">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__quadratic-equation-strip" data-kp-graph2d-quadratic-equations>
        <span class="editor-graph-stage__quadratic-equation editor-graph-stage__quadratic-equation--source" data-kp-graph2d-quadratic-equation="source" data-kp-latex="${escapeHtml(input.frame.sourceLatex)}" style="opacity:${projection.sourceEquationSalience}">${renderKpDimensionalContinuityInlineLatex(input.frame.sourceLatex)}</span>
        <span class="editor-graph-stage__quadratic-equation-arrow" data-kp-latex="\\longrightarrow" aria-hidden="true">${renderKpDimensionalContinuityInlineLatex("\\longrightarrow")}</span>
        <span class="editor-graph-stage__quadratic-equation editor-graph-stage__quadratic-equation--target" data-kp-graph2d-quadratic-equation="target" data-kp-latex="${escapeHtml(input.frame.targetLatex)}" style="opacity:${projection.targetEquationSalience}">${renderKpDimensionalContinuityInlineLatex(input.frame.targetLatex)}</span>
      </div>
    </foreignObject>
    <path class="editor-graph-stage__quadratic-curve" data-kp-graph2d-quadratic-curve data-kp-semantic-entity-id="${escapeHtml(projection.curveIdentityId)}" d="${projection.curvePath}" />
    <g data-kp-graph2d-quadratic-points>
      ${projection.points.map((point) => `<circle class="editor-graph-stage__quadratic-point editor-graph-stage__quadratic-point--${point.role}" data-kp-graph2d-quadratic-point="${escapeHtml(point.id)}" data-kp-graph2d-quadratic-point-role="${point.role}" cx="${format(point.cx)}" cy="${format(point.cy)}" r="${point.radius}" />`).join("")}
    </g>
    ${renderMathLabel({
      role: "point-vertex",
      latex: projection.vertexLabelLatex,
      x: projection.vertexLabelX,
      y: projection.vertexLabelY,
      width: 128,
      height: 28,
      className: "editor-graph-stage__quadratic-vertex-label"
    })}`;
}

export function createKpGraph2DQuadraticTranslationSvgRuntimeSession(input: {
  readonly content: SVGGElement;
  readonly frame: KpGraph2DQuadraticTranslationRuntimeFrame;
  readonly viewport: KpGraph2DQuadraticTranslationViewport;
}): KpGraph2DQuadraticTranslationSvgRuntimeSession {
  input.content.innerHTML = renderKpGraph2DQuadraticTranslationSvgContent(input);
  const curve = required<SVGPathElement>(
    input.content,
    "[data-kp-graph2d-quadratic-curve]"
  );
  const description = required<SVGDescElement>(
    input.content,
    "[data-kp-graph2d-quadratic-description]"
  );
  const sourceEquation = required<HTMLElement>(
    input.content,
    "[data-kp-graph2d-quadratic-equation='source']"
  );
  const targetEquation = required<HTMLElement>(
    input.content,
    "[data-kp-graph2d-quadratic-equation='target']"
  );
  const vertexLabel = required<SVGForeignObjectElement>(
    input.content,
    '[data-kp-graph2d-quadratic-math-label="point-vertex"]'
  );
  const vertexLabelOwner = required<HTMLElement>(
    vertexLabel,
    "[data-kp-latex]"
  );
  const pointElements = new Map(
    Array.from(input.content.querySelectorAll<SVGCircleElement>(
      "[data-kp-graph2d-quadratic-point]"
    )).map((element) => [
      element.dataset["kpGraph2dQuadraticPoint"] ?? "",
      element
    ])
  );
  let status: KpGraph2DQuadraticTranslationSvgRuntimeSession["status"] =
    "mounted";

  const session: KpGraph2DQuadraticTranslationSvgRuntimeSession = {
    content: input.content,
    get status() {
      return status;
    },
    apply(next) {
      if (status !== "mounted") throw new Error(
        "Cannot apply a disposed Graph2D quadratic translation session."
      );
      const projection = projectKpGraph2DQuadraticTranslationSvgFrame(next);
      input.content.dataset["kpGraph2dQuadraticProgress"] =
        String(projection.translationProgress);
      input.content.dataset["kpGraph2dQuadraticHorizontalShift"] =
        String(projection.horizontalShift);
      curve.setAttribute("d", projection.curvePath);
      curve.dataset["kpGraph2dQuadraticHorizontalShift"] =
        String(projection.horizontalShift);
      description.textContent = projection.accessibilityDescription;
      sourceEquation.style.opacity =
        String(projection.sourceEquationSalience);
      targetEquation.style.opacity =
        String(projection.targetEquationSalience);
      for (const point of projection.points) {
        const element = pointElements.get(point.id);
        if (element === undefined) throw new Error(
          `Graph2D quadratic point ${point.id} lost its SVG owner.`
        );
        element.setAttribute("cx", format(point.cx));
        element.setAttribute("cy", format(point.cy));
        element.dataset["kpGraphX"] = format(point.x);
        element.dataset["kpGraphY"] = format(point.y);
      }
      vertexLabel.setAttribute("x", format(projection.vertexLabelX));
      vertexLabel.setAttribute("y", format(projection.vertexLabelY));
      vertexLabelOwner.dataset["kpLatex"] = projection.vertexLabelLatex;
      vertexLabelOwner.innerHTML = renderKpDimensionalContinuityInlineLatex(
        projection.vertexLabelLatex
      );
    },
    dispose() {
      if (status === "disposed") return;
      status = "disposed";
      input.content.replaceChildren();
    }
  };
  // The generic lifecycle delegates initial paint to the domain factory.
  session.apply({ frame: input.frame, viewport: input.viewport });
  return session;
}

function graphPoint(
  viewport: KpGraph2DQuadraticTranslationViewport,
  point: Readonly<{ x: number; y: number }>
): Readonly<{ x: number; y: number }> {
  return Object.freeze({
    x: scaleCoordinate(
      point.x,
      viewport.xDomain,
      [36, viewport.width - 20]
    ),
    y: scaleCoordinate(
      point.y,
      viewport.yDomain,
      [viewport.height - 28, 20]
    )
  });
}

function scaleCoordinate(
  value: number,
  from: readonly [number, number],
  to: readonly [number, number]
): number {
  return to[0] + (value - from[0]) / (from[1] - from[0]) *
    (to[1] - to[0]);
}

function renderMathLabel(input: {
  readonly role: string;
  readonly latex: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly className: string;
}): string {
  return `<foreignObject class="editor-graph-stage__quadratic-math-foreign-object" data-kp-graph2d-quadratic-math-label="${escapeHtml(input.role)}" x="${format(input.x)}" y="${format(input.y)}" width="${input.width}" height="${input.height}" aria-hidden="true">
    <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__quadratic-math-label ${input.className}" data-kp-latex="${escapeHtml(input.latex)}">${renderKpDimensionalContinuityInlineLatex(input.latex)}</div>
  </foreignObject>`;
}

function required<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) throw new Error(
    `Graph2D quadratic SVG shell is missing ${selector}.`
  );
  return element;
}

function roundOpacity(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

function format(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
