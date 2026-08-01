import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpSupplyDemandEquilibriumFrameV1
} from "../../domains/economics/supply-demand-equilibrium-frame.ts";
import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";

export interface KpEconomicsGraphViewport {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}

export function renderKpEconomicsEquilibriumStaticContent(input: {
  readonly frame: KpSupplyDemandEquilibriumFrameV1;
  readonly viewport: KpEconomicsGraphViewport;
}): string {
  return renderEconomicsContent({
    frame: input.frame,
    viewport: input.viewport,
    stage: "establish",
    initialDemandReferenceOpacity: 0,
    initialEquilibriumReferenceOpacity: 0
  });
}

export function renderKpEconomicsEquilibriumRuntimeContent(input: {
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): string {
  return renderEconomicsContent({
    frame: input.frame.semanticFrame,
    viewport: input.viewport,
    stage: input.frame.stage,
    initialDemandReferenceOpacity: input.frame.initialDemandReferenceOpacity,
    initialEquilibriumReferenceOpacity:
      input.frame.initialEquilibriumReferenceOpacity
  });
}

function renderEconomicsContent(input: {
  readonly frame: KpSupplyDemandEquilibriumFrameV1;
  readonly viewport: KpEconomicsGraphViewport;
  readonly stage: string;
  readonly initialDemandReferenceOpacity: number;
  readonly initialEquilibriumReferenceOpacity: number;
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
  const initialEquilibrium = point(6, 8);

  return `<g data-kp-economics-equilibrium-view data-kp-economics-equilibrium-phase="${input.frame.phase}" data-kp-economics-choreography-stage="${input.stage}" data-kp-economics-demand-intercept="${exactText(input.frame.demand.priceInterceptCurrent)}">
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--demand-reference" data-kp-economics-initial-demand-reference x1="${initialDemandStart[0]}" y1="${initialDemandStart[1]}" x2="${initialDemandEnd[0]}" y2="${initialDemandEnd[1]}" style="opacity:${input.initialDemandReferenceOpacity}" />
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--supply" data-kp-economics-supply-line data-kp-economics-equation="${supplyEquation(input.frame)}" x1="${supplyStart[0]}" y1="${supplyStart[1]}" x2="${supplyEnd[0]}" y2="${supplyEnd[1]}" />
    <line class="editor-graph-stage__economics-curve editor-graph-stage__economics-curve--demand" data-kp-economics-demand-line data-kp-economics-equation="P=${formatNumber(demandIntercept)}-Q" x1="${demandStart[0]}" y1="${demandStart[1]}" x2="${demandEnd[0]}" y2="${demandEnd[1]}" />
    <line class="editor-graph-stage__economics-guide" data-kp-economics-equilibrium-quantity-guide x1="${equilibrium[0]}" y1="${equilibrium[1]}" x2="${quantityAxis[0]}" y2="${quantityAxis[1]}" />
    <line class="editor-graph-stage__economics-guide" data-kp-economics-equilibrium-price-guide x1="${equilibrium[0]}" y1="${equilibrium[1]}" x2="${priceAxis[0]}" y2="${priceAxis[1]}" />
    <circle class="editor-graph-stage__economics-equilibrium" data-kp-economics-equilibrium-point data-kp-economics-equilibrium-quantity="${exactText(input.frame.equilibrium.quantity)}" data-kp-economics-equilibrium-price="${exactText(input.frame.equilibrium.price)}" cx="${equilibrium[0]}" cy="${equilibrium[1]}" r="6" />
    <circle class="editor-graph-stage__economics-equilibrium editor-graph-stage__economics-equilibrium--reference" data-kp-economics-initial-equilibrium-reference cx="${initialEquilibrium[0]}" cy="${initialEquilibrium[1]}" r="6" style="opacity:${input.initialEquilibriumReferenceOpacity}" />
    <text class="editor-graph-stage__economics-label editor-graph-stage__economics-label--supply" x="${supplyEnd[0] - 24}" y="${supplyEnd[1] - 10}">S</text>
    <text class="editor-graph-stage__economics-label editor-graph-stage__economics-label--demand" x="${demandStart[0] + 12}" y="${demandStart[1] - 10}">D</text>
    <text class="editor-graph-stage__economics-label editor-graph-stage__economics-label--equilibrium" data-kp-economics-equilibrium-label x="${equilibrium[0] + 12}" y="${equilibrium[1] - 12}">E · Q=${formatNumber(equilibriumQuantity)}, P=${formatNumber(equilibriumPrice)}</text>
    <text class="editor-graph-stage__economics-axis-label" data-kp-economics-quantity-axis-label x="${input.viewport.width - 24}" y="${input.viewport.height - 34}">Q</text>
    <text class="editor-graph-stage__economics-axis-label" data-kp-economics-price-axis-label x="44" y="32">P</text>
  </g>`;
}

function supplyEquation(frame: KpSupplyDemandEquilibriumFrameV1): string {
  const intercept = formatNumber(exactNumber(frame.supply.priceIntercept));
  const slope = formatNumber(exactNumber(frame.supply.priceChangePerQuantity));
  return `P=${intercept}+${slope === "1" ? "" : slope}Q`;
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
