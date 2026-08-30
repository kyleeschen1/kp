import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import {
  createKpPerUnitTaxWelfareAsset,
  type KpPerUnitTaxWelfareAssetV1,
  type KpSupplyTaxCurveEntityV1
} from "../../../domains/economics/per-unit-tax-welfare-asset.ts";
import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";

export const kpSupplyTaxGraphViewport = Object.freeze({
  width: 680,
  height: 380,
  left: 64,
  right: 30,
  top: 24,
  bottom: 54
});

export interface KpSupplyTaxSvgPointV1 {
  readonly x: number;
  readonly y: number;
}

export interface KpSupplyTaxBaselineSvgProjectionV1 {
  readonly demand: Readonly<{
    entityId: string;
    start: KpSupplyTaxSvgPointV1;
    end: KpSupplyTaxSvgPointV1;
  }>;
  readonly supply: Readonly<{
    entityId: string;
    start: KpSupplyTaxSvgPointV1;
    end: KpSupplyTaxSvgPointV1;
  }>;
  readonly equilibrium: Readonly<{
    entityId: string;
    point: KpSupplyTaxSvgPointV1;
  }>;
}

export function projectKpSupplyTaxBaselineSvg(
  semantics: KpPerUnitTaxWelfareAssetV1 = createKpPerUnitTaxWelfareAsset()
): KpSupplyTaxBaselineSvgProjectionV1 {
  const demand = requiredCurve(semantics, "demand");
  const supply = requiredCurve(semantics, "marginal-cost-supply");
  const qMin = exactNumber(semantics.model.input.axes.quantity.minimum);
  const qMax = exactNumber(semantics.model.input.axes.quantity.maximum);
  return Object.freeze({
    demand: Object.freeze({
      entityId: demand.id,
      start: graphPoint(semantics, qMin, curvePrice(demand, qMin)),
      end: graphPoint(semantics, qMax, curvePrice(demand, qMax))
    }),
    supply: Object.freeze({
      entityId: supply.id,
      start: graphPoint(semantics, qMin, curvePrice(supply, qMin)),
      end: graphPoint(semantics, qMax, curvePrice(supply, qMax))
    }),
    equilibrium: Object.freeze({
      entityId: semantics.model.states.untaxed.id,
      point: graphPoint(
        semantics,
        exactNumber(semantics.model.states.untaxed.quantity),
        exactNumber(semantics.model.states.untaxed.consumerPrice)
      )
    })
  });
}

export function renderKpSupplyTaxBaselineSvg(
  semantics: KpPerUnitTaxWelfareAssetV1 = createKpPerUnitTaxWelfareAsset()
): string {
  const projection = projectKpSupplyTaxBaselineSvg(semantics);
  const input = semantics.model.input;
  const qMin = exactNumber(input.axes.quantity.minimum);
  const qMax = exactNumber(input.axes.quantity.maximum);
  const pMin = exactNumber(input.axes.price.minimum);
  const pMax = exactNumber(input.axes.price.maximum);
  const qTicks = ticks(qMin, qMax, exactNumber(input.axes.quantity.tickStep));
  const pTicks = ticks(pMin, pMax, exactNumber(input.axes.price.tickStep))
    .filter((value) => value > pMin && value % 2 === 0);
  const plotLeft = kpSupplyTaxGraphViewport.left;
  const plotRight = kpSupplyTaxGraphViewport.width - kpSupplyTaxGraphViewport.right;
  const plotTop = kpSupplyTaxGraphViewport.top;
  const plotBottom = kpSupplyTaxGraphViewport.height - kpSupplyTaxGraphViewport.bottom;
  const equilibrium = projection.equilibrium.point;

  return `<svg class="kp-supply-tax-graph" viewBox="0 0 ${kpSupplyTaxGraphViewport.width} ${kpSupplyTaxGraphViewport.height}" role="img" aria-labelledby="kp-supply-tax-graph-title kp-supply-tax-graph-description" data-kp-supply-tax-svg-state="baseline-market">
    <title id="kp-supply-tax-graph-title">Untaxed supply and demand equilibrium</title>
    <desc id="kp-supply-tax-graph-description">Demand P equals 12 minus Q and supply P equals 2 plus Q intersect at quantity 5 and price 7.</desc>
    <g class="kp-supply-tax-graph__grid" aria-hidden="true">
      ${qTicks.filter((value) => value > qMin).map((value) => `<line x1="${format(mapQuantity(semantics, value))}" y1="${format(plotTop)}" x2="${format(mapQuantity(semantics, value))}" y2="${format(plotBottom)}"/>`).join("")}
      ${pTicks.map((value) => `<line x1="${format(plotLeft)}" y1="${format(mapPrice(semantics, value))}" x2="${format(plotRight)}" y2="${format(mapPrice(semantics, value))}"/>`).join("")}
    </g>
    <g class="kp-supply-tax-graph__axes" data-kp-supply-tax-presentation="axes">
      <line x1="${format(plotLeft)}" y1="${format(plotBottom)}" x2="${format(plotRight)}" y2="${format(plotBottom)}"/>
      <line x1="${format(plotLeft)}" y1="${format(plotTop)}" x2="${format(plotLeft)}" y2="${format(plotBottom)}"/>
    </g>
    <g class="kp-supply-tax-graph__ticks" aria-hidden="true">
      ${qTicks.map((value) => mathLabel(String(value), mapQuantity(semantics, value) - 18, plotBottom + 9, 36, 26, `quantity-tick-${value}`)).join("")}
      ${pTicks.map((value) => mathLabel(String(value), plotLeft - 42, mapPrice(semantics, value) - 13, 34, 26, `price-tick-${value}`)).join("")}
      ${mathLabel("Q", plotRight - 7, plotBottom + 23, 34, 28, "quantity-axis")}
      ${mathLabel("P", plotLeft - 36, plotTop - 10, 34, 28, "price-axis")}
    </g>
    <g class="kp-supply-tax-graph__curve kp-supply-tax-graph__curve--demand" data-kp-supply-tax-entity="${escapeAttribute(projection.demand.entityId)}">
      <line x1="${format(projection.demand.start.x)}" y1="${format(projection.demand.start.y)}" x2="${format(projection.demand.end.x)}" y2="${format(projection.demand.end.y)}"/>
      ${mathLabel("D", projection.demand.end.x - 4, projection.demand.end.y + 7, 36, 30, "demand")}
    </g>
    <g class="kp-supply-tax-graph__curve kp-supply-tax-graph__curve--supply" data-kp-supply-tax-entity="${escapeAttribute(projection.supply.entityId)}">
      <line x1="${format(projection.supply.start.x)}" y1="${format(projection.supply.start.y)}" x2="${format(projection.supply.end.x)}" y2="${format(projection.supply.end.y)}"/>
      ${mathLabel("S", projection.supply.end.x - 4, projection.supply.end.y - 29, 36, 30, "supply")}
    </g>
    <g class="kp-supply-tax-graph__equilibrium" data-kp-supply-tax-entity="${escapeAttribute(projection.equilibrium.entityId)}">
      <line class="kp-supply-tax-graph__guide" x1="${format(plotLeft)}" y1="${format(equilibrium.y)}" x2="${format(equilibrium.x)}" y2="${format(equilibrium.y)}"/>
      <line class="kp-supply-tax-graph__guide" x1="${format(equilibrium.x)}" y1="${format(equilibrium.y)}" x2="${format(equilibrium.x)}" y2="${format(plotBottom)}"/>
      <circle cx="${format(equilibrium.x)}" cy="${format(equilibrium.y)}" r="4"/>
      ${mathLabel("E_0=(5,7)", equilibrium.x + 8, equilibrium.y - 34, 104, 32, "untaxed-equilibrium")}
    </g>
  </svg>`;
}

function graphPoint(semantics: KpPerUnitTaxWelfareAssetV1, quantity: number, price: number): KpSupplyTaxSvgPointV1 {
  return Object.freeze({ x: mapQuantity(semantics, quantity), y: mapPrice(semantics, price) });
}

function mapQuantity(semantics: KpPerUnitTaxWelfareAssetV1, quantity: number): number {
  const axis = semantics.model.input.axes.quantity;
  return mapRange(quantity, exactNumber(axis.minimum), exactNumber(axis.maximum), kpSupplyTaxGraphViewport.left, kpSupplyTaxGraphViewport.width - kpSupplyTaxGraphViewport.right);
}

function mapPrice(semantics: KpPerUnitTaxWelfareAssetV1, price: number): number {
  const axis = semantics.model.input.axes.price;
  return mapRange(price, exactNumber(axis.minimum), exactNumber(axis.maximum), kpSupplyTaxGraphViewport.height - kpSupplyTaxGraphViewport.bottom, kpSupplyTaxGraphViewport.top);
}

function mapRange(value: number, sourceMin: number, sourceMax: number, targetMin: number, targetMax: number): number {
  return targetMin + ((value - sourceMin) / (sourceMax - sourceMin)) * (targetMax - targetMin);
}

function curvePrice(curve: KpSupplyTaxCurveEntityV1, quantity: number): number {
  const intercept = exactNumber(curve.intercept);
  const delta = exactNumber(curve.slope) * quantity;
  return curve.role === "demand" ? intercept - delta : intercept + delta;
}

function requiredCurve(semantics: KpPerUnitTaxWelfareAssetV1, role: KpSupplyTaxCurveEntityV1["role"]): KpSupplyTaxCurveEntityV1 {
  const curve = semantics.entities.curves.find((candidate) => candidate.role === role);
  if (!curve) throw new Error(`Missing supply-tax curve ${role}.`);
  return curve;
}

function exactNumber(value: ExactRationalDto): number {
  return Number(BigInt(value.numerator)) / Number(BigInt(value.denominator));
}

function ticks(minimum: number, maximum: number, step: number): readonly number[] {
  const result: number[] = [];
  for (let value = minimum; value <= maximum + step / 10_000; value += step) result.push(Number(value.toFixed(10)));
  return Object.freeze(result);
}

function mathLabel(latex: string, x: number, y: number, width: number, height: number, role: string): string {
  return `<foreignObject class="kp-supply-tax-graph__math" data-kp-supply-tax-math-label="${escapeAttribute(role)}" x="${format(x)}" y="${format(y)}" width="${width}" height="${height}" aria-hidden="true"><div xmlns="http://www.w3.org/1999/xhtml">${renderLatexToHtml(latex, { displayMode: false })}</div></foreignObject>`;
}

function format(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
