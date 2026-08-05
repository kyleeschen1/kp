import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpConstantForceWorkEnergyFrameV1
} from "../../domains/physics/constant-force-work-energy-frame.ts";
import type {
  KpConstantForceWorkEnergyRuntimeFrame
} from "../animation/constant-force-work-energy-runtime-frame.ts";
import {
  createKpConstantForceWorkEnergySynchronizedView,
  type KpConstantForceWorkEnergySynchronizedView
} from "../animation/constant-force-work-energy-synchronized-view.ts";
import {
  formatKpDimensionalContinuityDynamicDisplay,
  kpDimensionalContinuityDynamicDisplayDecimals,
  kpDimensionalContinuityDynamicDisplayRelation
} from "../animation/dimensional-continuity-dynamic-display.ts";
import {
  createKpDimensionalContinuityGraphPresentationProfile
} from "./dimensional-continuity-graph-profile.ts";
import {
  renderKpDimensionalContinuityInlineLatex
} from "./dimensional-continuity-inline-latex.ts";

export interface KpPhysicsGraphViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export const kpPhysicsGraphPresentationProfile =
  createKpDimensionalContinuityGraphPresentationProfile("physics");

export function renderKpConstantForceWorkEnergyStaticContent(input: {
  readonly frame: KpConstantForceWorkEnergyFrameV1;
  readonly viewport: KpPhysicsGraphViewport;
}): string {
  return renderPhysicsContent({
    frame: input.frame,
    viewport: input.viewport,
    stage: "establish",
    workAreaOpacity: 0.18,
    forceArrowEmphasis: 0.76,
    unitIdentityOpacity: 0.12
  });
}

export function renderKpConstantForceWorkEnergyRuntimeContent(input: {
  readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
  readonly viewport: KpPhysicsGraphViewport;
}): string {
  return renderPhysicsContent({
    frame: input.frame.semanticFrame,
    viewport: input.viewport,
    stage: input.frame.stage,
    workAreaOpacity: input.frame.workAreaOpacity,
    forceArrowEmphasis: input.frame.forceArrowEmphasis,
    unitIdentityOpacity: input.frame.unitIdentityOpacity,
    synchronizedView:
      createKpConstantForceWorkEnergySynchronizedView(input.frame)
  });
}

function renderPhysicsContent(input: {
  readonly frame: KpConstantForceWorkEnergyFrameV1;
  readonly viewport: KpPhysicsGraphViewport;
  readonly stage: KpConstantForceWorkEnergyRuntimeFrame["stage"];
  readonly workAreaOpacity: number;
  readonly forceArrowEmphasis: number;
  readonly unitIdentityOpacity: number;
  readonly synchronizedView?:
    | KpConstantForceWorkEnergySynchronizedView
    | undefined;
}): string {
  const graphBounds = {
    left: 46,
    right: Math.min(430, input.viewport.width - 290),
    top: 106,
    bottom: input.viewport.height - 70
  };
  const graphPoint = (position: number, force: number) => [
    scale(position, input.viewport.xDomain, [graphBounds.left, graphBounds.right]),
    scale(force, input.viewport.yDomain, [graphBounds.bottom, graphBounds.top])
  ] as const;
  const position = exactNumber(input.frame.state.position);
  const displacement = exactNumber(input.frame.state.displacement);
  const force = exactNumber(input.frame.state.netForceMagnitude);
  const work = exactNumber(input.frame.state.accumulatedWork);
  const intervalEnd = 4;
  const graphOrigin = graphPoint(0, 0);
  const forceStart = graphPoint(0, force);
  const forceEnd = graphPoint(intervalEnd, force);
  const currentTop = graphPoint(position, force);
  const currentBase = graphPoint(position, 0);
  const areaWidth = Math.max(0, currentTop[0] - graphOrigin[0]);
  const areaHeight = Math.max(0, graphOrigin[1] - currentTop[1]);
  const blockStartX = input.viewport.width - 240;
  const blockEndX = input.viewport.width - 142;
  const blockX = scale(displacement, [0, intervalEnd], [blockStartX, blockEndX]);
  const blockY = 184;
  const blockWidth = 50;
  const blockHeight = 42;
  const forceArrowLength = 42 + force * 8;
  const displacementStart = blockStartX + blockWidth / 2;
  const displacementCurrent = blockX + blockWidth / 2;
  const initialKineticEnergy = 4;
  const maximumEnergy = 24;
  const energyX = input.viewport.width - 248;
  const energyY = 306;
  const energyWidth = 210;
  const initialEnergyWidth = energyWidth * initialKineticEnergy / maximumEnergy;
  const workEnergyWidth = energyWidth * work / maximumEnergy;

  return `<g data-kp-physics-work-energy-view data-kp-physics-work-energy-phase="${input.frame.phase}" data-kp-physics-choreography-stage="${input.stage}" data-kp-physics-display-precision="${kpDimensionalContinuityDynamicDisplayDecimals}" data-kp-physics-position="${exactText(input.frame.state.position)}" data-kp-physics-net-force="${exactText(input.frame.state.netForceMagnitude)}" style="--kp-physics-unit-opacity:${input.unitIdentityOpacity}">
    ${renderPhysicsGrid(input.viewport, graphBounds, graphPoint)}
    <line class="editor-graph-stage__physics-axis" data-kp-physics-axis="position" x1="${graphBounds.left}" y1="${graphBounds.bottom}" x2="${graphBounds.right + 8}" y2="${graphBounds.bottom}" marker-end="url(#kp-editor-graph-axis-arrow)" />
    <line class="editor-graph-stage__physics-axis" data-kp-physics-axis="force" x1="${graphBounds.left}" y1="${graphBounds.bottom}" x2="${graphBounds.left}" y2="${graphBounds.top - 8}" marker-end="url(#kp-editor-graph-axis-arrow)" />
    <rect class="editor-graph-stage__physics-work-area" data-kp-physics-work-area="${exactText(input.frame.state.accumulatedWork)}" x="${graphOrigin[0]}" y="${currentTop[1]}" width="${areaWidth}" height="${areaHeight}" style="opacity:${input.workAreaOpacity}" />
    <line class="editor-graph-stage__physics-force-line" data-kp-physics-constant-force-line data-kp-physics-force-value="${exactText(input.frame.state.netForceMagnitude)}" x1="${forceStart[0]}" y1="${forceStart[1]}" x2="${forceEnd[0]}" y2="${forceEnd[1]}" />
    <line class="editor-graph-stage__physics-work-boundary" data-kp-physics-work-boundary data-kp-physics-position-value="${exactText(input.frame.state.position)}" x1="${currentBase[0]}" y1="${currentBase[1]}" x2="${currentTop[0]}" y2="${currentTop[1]}" />
    ${renderMathLabel({
      role: "force-line",
      latex: `F_x = ${exactLatex(input.frame.state.netForceMagnitude)}\\,\\mathrm{N}`,
      x: forceEnd[0] - 94,
      y: forceEnd[1] - 30,
      width: 96,
      height: 28,
      className: "editor-graph-stage__physics-math-label--force"
    })}
    ${renderMathLabel({
      role: "axis-position",
      latex: "x\\;(\\mathrm{m})",
      x: graphBounds.right - 34,
      y: graphBounds.bottom + 14,
      width: 68,
      height: 26,
      className: "editor-graph-stage__physics-math-label--axis"
    })}
    ${renderMathLabel({
      role: "axis-force",
      latex: "F_x\\;(\\mathrm{N})",
      x: graphBounds.left + 8,
      y: graphBounds.top - 20,
      width: 86,
      height: 26,
      className: "editor-graph-stage__physics-math-label--axis"
    })}
    <g class="editor-graph-stage__physics-diagram" data-kp-physics-motion-diagram>
      <line class="editor-graph-stage__physics-surface" x1="${blockStartX - 18}" y1="236" x2="${input.viewport.width - 24}" y2="236" />
      <rect class="editor-graph-stage__physics-object" data-kp-physics-object-position="${exactText(input.frame.state.position)}" x="${blockX}" y="${blockY}" width="${blockWidth}" height="${blockHeight}" rx="8" />
      <line class="editor-graph-stage__physics-force-arrow" data-kp-physics-net-force-arrow="${exactText(input.frame.state.netForceMagnitude)}" x1="${blockX + blockWidth}" y1="${blockY + blockHeight / 2}" x2="${blockX + blockWidth + forceArrowLength}" y2="${blockY + blockHeight / 2}" marker-end="url(#kp-editor-graph-arrow)" style="opacity:${input.forceArrowEmphasis}" />
      <line class="editor-graph-stage__physics-displacement" data-kp-physics-displacement="${exactText(input.frame.state.displacement)}" x1="${displacementStart}" y1="258" x2="${displacementCurrent}" y2="258" marker-end="url(#kp-editor-graph-arrow)" />
      ${renderMathLabel({
        role: "diagram-force",
        latex: "\\vec F_{\\mathrm{net}}",
        x: blockX + blockWidth + 10,
        y: blockY - 4,
        width: 90,
        height: 28,
        className: "editor-graph-stage__physics-math-label--force"
      })}
      ${renderMathLabel({
        role: "diagram-displacement",
        latex: `\\Delta x ${kpDimensionalContinuityDynamicDisplayRelation(input.stage === "accumulate")} ${formatKpDimensionalContinuityDynamicDisplay(input.frame.state.displacement)}\\,\\mathrm{m}`,
        x: input.viewport.width - 230,
        y: 262,
        width: 182,
        height: 28,
        className: "editor-graph-stage__physics-math-label--diagram"
      })}
    </g>
    <g class="editor-graph-stage__physics-energy" data-kp-physics-energy-total="${exactText(input.frame.state.kineticEnergy)}">
      <rect class="editor-graph-stage__physics-energy-track" x="${energyX}" y="${energyY}" width="${energyWidth}" height="22" rx="5" />
      <rect class="editor-graph-stage__physics-energy-initial" x="${energyX}" y="${energyY}" width="${initialEnergyWidth}" height="22" rx="5" />
      <rect class="editor-graph-stage__physics-energy-work" data-kp-physics-energy-work="${exactText(input.frame.state.accumulatedWork)}" x="${energyX + initialEnergyWidth}" y="${energyY}" width="${workEnergyWidth}" height="22" rx="5" />
      ${renderMathLabel({
        role: "energy-total",
        latex: `K ${kpDimensionalContinuityDynamicDisplayRelation(input.stage === "accumulate")} ${formatKpDimensionalContinuityDynamicDisplay(input.frame.state.kineticEnergy)}\\,\\mathrm{J}`,
        x: energyX,
        y: energyY + 30,
        width: energyWidth,
        height: 28,
        className: "editor-graph-stage__physics-math-label--energy"
      })}
    </g>
    ${renderMathLabel({
      role: "unit-identity",
      latex: "\\mathrm{N}\\!\\cdot\\!\\mathrm{m}=\\mathrm{J}",
      x: input.viewport.width - 224,
      y: 360,
      width: 174,
      height: 30,
      opacity: input.unitIdentityOpacity,
      className: "editor-graph-stage__physics-math-label--unit"
    })}
    ${input.synchronizedView === undefined
      ? ""
      : renderSynchronizedView(input.synchronizedView, input.viewport)}
  </g>`;
}

function renderPhysicsGrid(
  viewport: KpPhysicsGraphViewport,
  bounds: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number },
  point: (position: number, force: number) => readonly [number, number]
): string {
  const positionTicks = [0, 1, 2, 3, 4, 5];
  const forceTicks = [0, 2, 4, 6];
  const vertical = positionTicks.map((value) => {
    const [x] = point(value, 0);
    return `${value === 0 ? "" : `<line class="editor-graph-stage__physics-grid-line" data-kp-physics-grid-axis="position" data-kp-physics-grid-value="${value}" x1="${x}" y1="${bounds.top}" x2="${x}" y2="${bounds.bottom}" />`}
      <line class="editor-graph-stage__physics-tick" data-kp-physics-tick-axis="position" x1="${x}" y1="${bounds.bottom - 4}" x2="${x}" y2="${bounds.bottom + 4}" />
      ${renderMathLabel({
        role: `tick-position-${value}`,
        latex: String(value),
        x: x - 16,
        y: bounds.bottom + 5,
        width: 32,
        height: 22,
        className: "editor-graph-stage__physics-math-label--tick"
      })}`;
  }).join("");
  const horizontal = forceTicks.map((value) => {
    const [, y] = point(0, value);
    return `${value === 0 ? "" : `<line class="editor-graph-stage__physics-grid-line" data-kp-physics-grid-axis="force" data-kp-physics-grid-value="${value}" x1="${bounds.left}" y1="${y}" x2="${bounds.right}" y2="${y}" />`}
      <line class="editor-graph-stage__physics-tick" data-kp-physics-tick-axis="force" x1="${bounds.left - 4}" y1="${y}" x2="${bounds.left + 4}" y2="${y}" />
      ${renderMathLabel({
        role: `tick-force-${value}`,
        latex: String(value),
        x: bounds.left - 34,
        y: y - 11,
        width: 26,
        height: 22,
        className: "editor-graph-stage__physics-math-label--tick editor-graph-stage__physics-math-label--tick-force"
      })}`;
  }).join("");
  return `<g class="editor-graph-stage__physics-grid" aria-hidden="true" data-kp-physics-grid-width="${viewport.width}">${vertical}${horizontal}</g>`;
}

function renderSynchronizedView(
  view: KpConstantForceWorkEnergySynchronizedView,
  viewport: KpPhysicsGraphViewport
): string {
  return `<desc id="kp-physics-work-energy-description" data-kp-physics-nonvisual-summary>${escapeHtml(view.nonvisualSummary)}</desc>
    <foreignObject class="editor-graph-stage__physics-explanation-foreign-object" x="34" y="12" width="${viewport.width - 68}" height="82">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__physics-explanation" data-kp-physics-synchronized-view data-kp-physics-narrative-id="${view.narrative.id}" data-kp-physics-claim-ids="${view.narrative.claimIds.join(" ")}">
        <div class="editor-graph-stage__physics-equations">
          ${renderInlineEquation("force", view.equations.forceLatex)}
          ${renderInlineEquation("work", view.equations.workLatex)}
          ${renderInlineEquation("energy", view.equations.energyLatex)}
          <span class="editor-graph-stage__physics-equation editor-graph-stage__physics-equation--unit" style="opacity:var(--kp-physics-unit-opacity, 1)" data-kp-physics-equation-role="unit" data-kp-latex="${escapeHtml(view.equations.unitLatex)}">${renderKpDimensionalContinuityInlineLatex(view.equations.unitLatex)}</span>
        </div>
        <p data-kp-physics-narrative>${escapeHtml(view.narrative.text)}</p>
      </div>
    </foreignObject>`;
}

function renderInlineEquation(role: string, latex: string): string {
  return `<span class="editor-graph-stage__physics-equation editor-graph-stage__physics-equation--${role}" data-kp-physics-equation-role="${role}" data-kp-latex="${escapeHtml(latex)}">${renderKpDimensionalContinuityInlineLatex(latex)}</span>`;
}

function renderMathLabel(input: {
  readonly role: string;
  readonly latex: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly opacity?: number | undefined;
  readonly className: string;
}): string {
  return `<foreignObject class="editor-graph-stage__physics-math-foreign-object" data-kp-physics-math-label="${input.role}" x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" aria-hidden="true"${input.opacity === undefined ? "" : ` style="opacity:${input.opacity}"`}>
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__physics-math-label ${input.className}" data-kp-latex="${escapeHtml(input.latex)}">${renderKpDimensionalContinuityInlineLatex(input.latex)}</div>
    </foreignObject>`;
}

function exactLatex(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function exactNumber(value: ExactRationalDto): number {
  return Number(value.numerator) / Number(value.denominator);
}

function exactText(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `${value.numerator}/${value.denominator}`;
}

function scale(
  value: number,
  from: readonly [number, number],
  to: readonly [number, number]
): number {
  return to[0] + ((value - from[0]) / (from[1] - from[0])) * (to[1] - to[0]);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
