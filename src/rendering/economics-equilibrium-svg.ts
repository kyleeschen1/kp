import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpSupplyDemandEquilibriumFrameV1
} from "../../domains/economics/supply-demand-equilibrium-frame.ts";
import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  createKpEconomicsEquilibriumSynchronizedView,
  formatKpEconomicsDynamicDisplay,
  kpEconomicsDynamicDisplayDecimals,
  kpEconomicsDynamicDisplayRelation,
  type KpEconomicsEquilibriumSynchronizedView
} from "../animation/economics-equilibrium-synchronized-view.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";

export interface KpEconomicsGraphViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export const kpEconomicsGraphPresentationProfile = Object.freeze({
  schemaVersion: "kp.economics-graph-presentation-profile.v1" as const,
  id: "kp.graph.dimensional-continuity.economics.v1",
  renderer: "svg" as const,
  projection: "orthographic-xy" as const,
  mathTypography: "katex" as const,
  visualRoles: Object.freeze({
    stable: "teal",
    changing: "rust",
    focal: "ink",
    construction: "quiet-blue",
    plane: "warm"
  })
});

const economicsLatexHtmlCache = new Map<string, string>();
const economicsLatexHtmlCacheLimit = 256;

export function renderKpEconomicsEquilibriumStaticContent(input: {
  readonly frame: KpSupplyDemandEquilibriumFrameV1;
  readonly viewport: KpEconomicsGraphViewport;
}): string {
  return renderEconomicsContent({
    frame: input.frame,
    viewport: input.viewport,
    stage: "establish",
    initialDemandReferenceOpacity: 0,
    initialEquilibriumReferenceOpacity: 0,
    initialEquilibrium: input.frame.equilibrium
  });
}

export function renderKpEconomicsEquilibriumRuntimeContent(input: {
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): string {
  const synchronizedView =
    createKpEconomicsEquilibriumSynchronizedView(input.frame);
  return renderEconomicsContent({
    frame: input.frame.semanticFrame,
    viewport: input.viewport,
    stage: input.frame.stage,
    initialDemandReferenceOpacity: input.frame.initialDemandReferenceOpacity,
    initialEquilibriumReferenceOpacity:
      input.frame.initialEquilibriumReferenceOpacity,
    initialEquilibrium: input.frame.initialEquilibrium,
    synchronizedView
  });
}

function renderEconomicsContent(input: {
  readonly frame: KpSupplyDemandEquilibriumFrameV1;
  readonly viewport: KpEconomicsGraphViewport;
  readonly stage: KpEconomicsEquilibriumRuntimeFrame["stage"];
  readonly initialDemandReferenceOpacity: number;
  readonly initialEquilibriumReferenceOpacity: number;
  readonly initialEquilibrium: {
    readonly quantity: ExactRationalDto;
    readonly price: ExactRationalDto;
  };
  readonly synchronizedView?:
    | KpEconomicsEquilibriumSynchronizedView
    | undefined;
}): string {
  const point = (quantity: number, price: number) => [
    scale(quantity, input.viewport.xDomain, [36, input.viewport.width - 20]),
    scale(price, input.viewport.yDomain, [input.viewport.height - 28, 20])
  ] as const;
  const [minimumQuantity, maximumQuantity] = input.viewport.xDomain;
  const supplyIntercept = exactNumber(input.frame.supply.priceIntercept);
  const supplySlope = exactNumber(input.frame.supply.priceChangePerQuantity);
  const demandIntercept = exactNumber(
    input.frame.demand.priceInterceptCurrent
  );
  const initialDemandIntercept = exactNumber(
    input.frame.demand.priceInterceptBefore
  );
  const demandSlope = exactNumber(
    input.frame.demand.priceChangePerQuantity
  );
  const supplyStart = point(
    minimumQuantity,
    supplyIntercept + supplySlope * minimumQuantity
  );
  const supplyEnd = point(
    maximumQuantity,
    supplyIntercept + supplySlope * maximumQuantity
  );
  const demandStart = point(
    minimumQuantity,
    demandIntercept - demandSlope * minimumQuantity
  );
  const demandEnd = point(
    maximumQuantity,
    demandIntercept - demandSlope * maximumQuantity
  );
  const demandLabelPoint = point(
    Math.min(maximumQuantity, minimumQuantity + 0.75),
    demandIntercept - demandSlope *
      Math.min(maximumQuantity, minimumQuantity + 0.75)
  );
  const initialDemandStart = point(
    minimumQuantity,
    initialDemandIntercept - demandSlope * minimumQuantity
  );
  const initialDemandEnd = point(
    maximumQuantity,
    initialDemandIntercept - demandSlope * maximumQuantity
  );
  const equilibriumQuantity = exactNumber(input.frame.equilibrium.quantity);
  const equilibriumPrice = exactNumber(input.frame.equilibrium.price);
  const equilibrium = point(equilibriumQuantity, equilibriumPrice);
  const quantityAxis = point(equilibriumQuantity, 0);
  const priceAxis = point(0, equilibriumPrice);
  const initialEquilibrium = point(
    exactNumber(input.initialEquilibrium.quantity),
    exactNumber(input.initialEquilibrium.price)
  );
  const demandRole = input.stage === "establish"
    ? "D_0"
    : input.stage === "shift"
      ? "D_t"
      : "D_1";
  const equilibriumRole = input.stage === "establish"
    ? "E_0"
    : input.stage === "shift"
      ? "E_t"
      : "E_1";
  const equilibriumRelation = kpEconomicsDynamicDisplayRelation(input.stage);
  const equilibriumLatex = `${equilibriumRole} ${equilibriumRelation} (` +
    `${formatKpEconomicsDynamicDisplay(input.frame.equilibrium.quantity)}, ` +
    `${formatKpEconomicsDynamicDisplay(input.frame.equilibrium.price)})`;

  return `<g data-kp-economics-equilibrium-view data-kp-economics-equilibrium-phase="${input.frame.phase}" data-kp-economics-choreography-stage="${input.stage}" data-kp-economics-display-precision="${kpEconomicsDynamicDisplayDecimals}" data-kp-economics-demand-intercept="${exactText(input.frame.demand.priceInterceptCurrent)}">
    ${renderEconomicsGrid(input.viewport, point)}
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--demand-reference" data-kp-economics-initial-demand-reference x1="${initialDemandStart[0]}" y1="${initialDemandStart[1]}" x2="${initialDemandEnd[0]}" y2="${initialDemandEnd[1]}" style="opacity:${input.initialDemandReferenceOpacity}" />
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--supply" data-kp-economics-supply-line data-kp-economics-equation="${supplyEquation(input.frame)}" x1="${supplyStart[0]}" y1="${supplyStart[1]}" x2="${supplyEnd[0]}" y2="${supplyEnd[1]}" />
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--demand" data-kp-economics-demand-line data-kp-economics-equation="${demandEquation(input.frame)}" x1="${demandStart[0]}" y1="${demandStart[1]}" x2="${demandEnd[0]}" y2="${demandEnd[1]}" />
    <line class="editor-graph-stage__economics-guide" data-kp-economics-equilibrium-quantity-guide x1="${equilibrium[0]}" y1="${equilibrium[1]}" x2="${quantityAxis[0]}" y2="${quantityAxis[1]}" />
    <line class="editor-graph-stage__economics-guide" data-kp-economics-equilibrium-price-guide x1="${equilibrium[0]}" y1="${equilibrium[1]}" x2="${priceAxis[0]}" y2="${priceAxis[1]}" />
    <circle class="editor-graph-stage__economics-equilibrium" data-kp-economics-equilibrium-point data-kp-economics-equilibrium-quantity="${exactText(input.frame.equilibrium.quantity)}" data-kp-economics-equilibrium-price="${exactText(input.frame.equilibrium.price)}" cx="${equilibrium[0]}" cy="${equilibrium[1]}" r="4.5" />
    <circle class="editor-graph-stage__economics-equilibrium editor-graph-stage__economics-equilibrium--reference" data-kp-economics-initial-equilibrium-reference cx="${initialEquilibrium[0]}" cy="${initialEquilibrium[1]}" r="4" style="opacity:${input.initialEquilibriumReferenceOpacity}" />
    ${renderMathLabel({
      role: "curve-supply",
      latex: "S",
      x: supplyEnd[0] - 42,
      y: supplyEnd[1] - 34,
      width: 38,
      height: 28,
      className: "editor-graph-stage__economics-math-label--supply"
    })}
    ${renderMathLabel({
      role: "curve-demand-current",
      latex: demandRole,
      x: demandLabelPoint[0] + 4,
      y: demandLabelPoint[1] - 30,
      width: 58,
      height: 28,
      className: "editor-graph-stage__economics-math-label--demand"
    })}
    ${input.initialDemandReferenceOpacity <= 0 ? "" : renderMathLabel({
      role: "curve-demand-reference",
      latex: "D_0",
      x: initialDemandEnd[0] - 52,
      y: initialDemandEnd[1] - 28,
      width: 46,
      height: 26,
      opacity: input.initialDemandReferenceOpacity,
      className: "editor-graph-stage__economics-math-label--reference"
    })}
    ${renderMathLabel({
      role: "equilibrium-current",
      latex: equilibriumLatex,
      x: equilibrium[0] + 10,
      y: equilibrium[1] - 38,
      width: 164,
      height: 30,
      className: "editor-graph-stage__economics-math-label--equilibrium"
    })}
    ${input.initialEquilibriumReferenceOpacity <= 0 ? "" : renderMathLabel({
      role: "equilibrium-reference",
      latex: "E_0",
      x: initialEquilibrium[0] - 48,
      y: initialEquilibrium[1] + 8,
      width: 42,
      height: 26,
      opacity: input.initialEquilibriumReferenceOpacity,
      className: "editor-graph-stage__economics-math-label--reference"
    })}
    ${renderMathLabel({
      role: "axis-quantity",
      latex: "Q",
      x: input.viewport.width - 44,
      y: input.viewport.height - 50,
      width: 28,
      height: 28,
      className: "editor-graph-stage__economics-math-label--axis"
    })}
    ${renderMathLabel({
      role: "axis-price",
      latex: "P",
      x: 42,
      y: 18,
      width: 28,
      height: 28,
      className: "editor-graph-stage__economics-math-label--axis"
    })}
    ${input.synchronizedView === undefined ? "" : renderSynchronizedView(input.synchronizedView, input.viewport)}
  </g>`;
}

function renderEconomicsGrid(
  viewport: KpEconomicsGraphViewport,
  point: (quantity: number, price: number) => readonly [number, number]
): string {
  const quantityTicks = [2, 4, 6, 8, 10];
  const priceTicks = [4, 8, 12, 16];
  const vertical = quantityTicks.map((value) => {
    const [x] = point(value, 0);
    return `<line class="editor-graph-stage__economics-grid-line" data-kp-economics-grid-axis="quantity" data-kp-economics-grid-value="${value}" x1="${x}" y1="20" x2="${x}" y2="${viewport.height - 28}" />
      <line class="editor-graph-stage__economics-tick" data-kp-economics-tick-axis="quantity" x1="${x}" y1="${viewport.height - 32}" x2="${x}" y2="${viewport.height - 24}" />
      ${renderMathLabel({
        role: `tick-quantity-${value}`,
        latex: String(value),
        x: x - 18,
        y: viewport.height - 23,
        width: 36,
        height: 22,
        className: "editor-graph-stage__economics-math-label--tick"
      })}`;
  }).join("");
  const horizontal = priceTicks.map((value) => {
    const [, y] = point(0, value);
    return `<line class="editor-graph-stage__economics-grid-line" data-kp-economics-grid-axis="price" data-kp-economics-grid-value="${value}" x1="36" y1="${y}" x2="${viewport.width - 20}" y2="${y}" />
      <line class="editor-graph-stage__economics-tick" data-kp-economics-tick-axis="price" x1="32" y1="${y}" x2="40" y2="${y}" />
      ${renderMathLabel({
        role: `tick-price-${value}`,
        latex: String(value),
        x: 0,
        y: y - 11,
        width: 28,
        height: 22,
        className: "editor-graph-stage__economics-math-label--tick editor-graph-stage__economics-math-label--tick-price"
      })}`;
  }).join("");
  return `<g class="editor-graph-stage__economics-grid" aria-hidden="true">${vertical}${horizontal}</g>`;
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
  return `<foreignObject class="editor-graph-stage__economics-math-foreign-object" data-kp-economics-math-label="${input.role}" x="${input.x}" y="${input.y}" width="${input.width}" height="${input.height}" aria-hidden="true"${input.opacity === undefined ? "" : ` style="opacity:${input.opacity}"`}>
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__economics-math-label ${input.className}" data-kp-latex="${escapeHtml(input.latex)}">${renderCachedInlineLatex(input.latex)}</div>
    </foreignObject>`;
}

function supplyEquation(frame: KpSupplyDemandEquilibriumFrameV1): string {
  const intercept = formatNumber(exactNumber(frame.supply.priceIntercept));
  const slope = formatNumber(exactNumber(frame.supply.priceChangePerQuantity));
  return `P=${intercept}+${slope === "1" ? "" : slope}Q`;
}

function demandEquation(frame: KpSupplyDemandEquilibriumFrameV1): string {
  const intercept = formatNumber(
    exactNumber(frame.demand.priceInterceptCurrent)
  );
  const slope = formatNumber(
    exactNumber(frame.demand.priceChangePerQuantity)
  );
  return `P=${intercept}-${slope === "1" ? "" : slope}Q`;
}

function renderSynchronizedView(
  view: KpEconomicsEquilibriumSynchronizedView,
  viewport: KpEconomicsGraphViewport
): string {
  return `<desc id="kp-economics-graph-description" data-kp-economics-nonvisual-summary>${escapeHtml(view.nonvisualSummary)}</desc>
    <foreignObject class="editor-graph-stage__economics-explanation-foreign-object" x="${Math.max(104, viewport.width / 2 - 180)}" y="16" width="360" height="88">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__economics-explanation" data-kp-economics-synchronized-view data-kp-economics-narrative-id="${view.narrative.id}" data-kp-economics-claim-ids="${view.narrative.claimIds.join(" ")}">
        <div class="editor-graph-stage__economics-equations">
          ${renderInlineEquation("supply", view.equations.supplyLatex)}
          ${renderInlineEquation("demand", view.equations.demandLatex)}
          ${renderInlineEquation("equilibrium", view.equations.equilibriumLatex)}
        </div>
        <p data-kp-economics-narrative>${escapeHtml(view.narrative.text)}</p>
      </div>
    </foreignObject>`;
}

function renderInlineEquation(role: string, latex: string): string {
  return `<span class="editor-graph-stage__economics-equation editor-graph-stage__economics-equation--${role}" data-kp-economics-equation-role="${role}" data-kp-latex="${escapeHtml(latex)}">${renderCachedInlineLatex(latex)}</span>`;
}

function renderCachedInlineLatex(latex: string): string {
  const cached = economicsLatexHtmlCache.get(latex);
  if (cached !== undefined) return cached;
  const rendered = renderLatexToHtml(latex, { displayMode: false });
  // Direct-seek exploration can create many exact intermediate labels. Keep
  // the renderer cache bounded while avoiding KaTeX work in the frame loop.
  if (economicsLatexHtmlCache.size >= economicsLatexHtmlCacheLimit) {
    const oldest = economicsLatexHtmlCache.keys().next().value as
      | string
      | undefined;
    if (oldest !== undefined) economicsLatexHtmlCache.delete(oldest);
  }
  economicsLatexHtmlCache.set(latex, rendered);
  return rendered;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function exactNumber(value: ExactRationalDto): number {
  return Number(value.numerator) / Number(value.denominator);
}

function exactText(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `${value.numerator}/${value.denominator}`;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function scale(
  value: number,
  from: readonly [number, number],
  to: readonly [number, number]
): number {
  return to[0] + ((value - from[0]) / (from[1] - from[0])) * (to[1] - to[0]);
}
