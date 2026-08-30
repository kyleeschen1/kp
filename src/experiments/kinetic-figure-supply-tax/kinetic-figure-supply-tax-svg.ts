import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import {
  createKpPerUnitTaxWelfareAsset,
  type KpPerUnitTaxWelfareAssetV1,
  type KpSupplyTaxCurveEntityV1
} from "../../../domains/economics/per-unit-tax-welfare-asset.ts";
import type { KpPerUnitTaxWelfareFrameV1 } from
  "../../../domains/economics/per-unit-tax-welfare-frame.ts";
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

export interface KpSupplyTaxTransitSvgProjectionV1 {
  readonly phase: KpPerUnitTaxWelfareFrameV1["phase"];
  readonly progress: number;
  readonly originalSupply: Readonly<{
    entityId: string;
    start: KpSupplyTaxSvgPointV1;
    end: KpSupplyTaxSvgPointV1;
  }>;
  readonly buyerFacingSupply: Readonly<{
    entityId: string;
    start: KpSupplyTaxSvgPointV1;
    end: KpSupplyTaxSvgPointV1;
    present: boolean;
    opacity: number;
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
  return renderKpSupplyTaxSvg(semantics, false);
}

export function renderKpSupplyTaxInteractiveSvg(
  semantics: KpPerUnitTaxWelfareAssetV1 = createKpPerUnitTaxWelfareAsset()
): string {
  return renderKpSupplyTaxSvg(semantics, true);
}

export function projectKpSupplyTaxTransitSvg(input: {
  readonly semantics: KpPerUnitTaxWelfareAssetV1;
  readonly frame: KpPerUnitTaxWelfareFrameV1;
}): KpSupplyTaxTransitSvgProjectionV1 {
  if (input.frame.assetId !== input.semantics.id) {
    throw new Error("Supply-tax SVG frame does not belong to its semantic asset.");
  }
  const original = requiredCurve(input.semantics, "marginal-cost-supply");
  const taxed = requiredCurve(input.semantics, "buyer-facing-taxed-supply");
  const qMin = exactNumber(input.semantics.model.input.axes.quantity.minimum);
  const qMax = exactNumber(input.semantics.model.input.axes.quantity.maximum);
  const slope = exactNumber(original.slope);
  const originalIntercept = exactNumber(input.frame.curves.originalSupplyIntercept);
  const taxedIntercept = exactNumber(input.frame.curves.buyerFacingSupplyIntercept);
  const progress = exactNumber(input.frame.modelProgress);
  return Object.freeze({
    phase: input.frame.phase,
    progress,
    originalSupply: Object.freeze({
      entityId: original.id,
      start: graphPoint(input.semantics, qMin, originalIntercept + slope * qMin),
      end: graphPoint(input.semantics, qMax, originalIntercept + slope * qMax)
    }),
    buyerFacingSupply: Object.freeze({
      entityId: taxed.id,
      start: graphPoint(input.semantics, qMin, taxedIntercept + slope * qMin),
      end: graphPoint(input.semantics, qMax, taxedIntercept + slope * qMax),
      present: progress > 0,
      // Reveal follows the playhead, so direct seek and reverse never depend
      // on a CSS clock while the two supply curves separate.
      opacity: Math.min(1, progress / 0.14)
    })
  });
}

export function projectKpSupplyTaxTransitSvgDom(input: {
  readonly root: SVGSVGElement;
  readonly semantics: KpPerUnitTaxWelfareAssetV1;
  readonly frame: KpPerUnitTaxWelfareFrameV1;
}): void {
  const projection = projectKpSupplyTaxTransitSvg(input);
  const original = requiredSvgGroup(input.root, projection.originalSupply.entityId);
  const taxed = requiredSvgGroup(input.root, projection.buyerFacingSupply.entityId);
  setCurveLine(original, projection.originalSupply.start, projection.originalSupply.end);
  setCurveLine(taxed, projection.buyerFacingSupply.start, projection.buyerFacingSupply.end);
  taxed.dataset["kpPresence"] = String(projection.buyerFacingSupply.present);
  taxed.style.opacity = format(projection.buyerFacingSupply.opacity);
  const label = taxed.querySelector<SVGForeignObjectElement>(
    '[data-kp-supply-tax-math-label="taxed-supply"]'
  );
  if (label === null) throw new Error("Missing buyer-facing supply KaTeX label.");
  label.setAttribute("x", format(projection.buyerFacingSupply.end.x - 68));
  label.setAttribute("y", format(projection.buyerFacingSupply.end.y - 31));
  input.root.dataset["kpSupplyTaxSvgPhase"] = projection.phase;
  input.root.dataset["kpSupplyTaxSvgProgress"] = format(projection.progress);
}

function renderKpSupplyTaxSvg(
  semantics: KpPerUnitTaxWelfareAssetV1,
  includeTransitLayer: boolean
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
    ${includeTransitLayer ? `<g class="kp-supply-tax-graph__curve kp-supply-tax-graph__curve--taxed-supply" data-kp-supply-tax-entity="${escapeAttribute(semantics.model.input.supply.taxedId)}" data-kp-presence="false" style="opacity:0">
      <line x1="${format(projection.supply.start.x)}" y1="${format(projection.supply.start.y)}" x2="${format(projection.supply.end.x)}" y2="${format(projection.supply.end.y)}"/>
      ${mathLabel("S_t=S+t", projection.supply.end.x - 68, projection.supply.end.y - 31, 88, 30, "taxed-supply")}
    </g>` : ""}
    <g class="kp-supply-tax-graph__equilibrium" data-kp-supply-tax-entity="${escapeAttribute(projection.equilibrium.entityId)}">
      <line class="kp-supply-tax-graph__guide" x1="${format(plotLeft)}" y1="${format(equilibrium.y)}" x2="${format(equilibrium.x)}" y2="${format(equilibrium.y)}"/>
      <line class="kp-supply-tax-graph__guide" x1="${format(equilibrium.x)}" y1="${format(equilibrium.y)}" x2="${format(equilibrium.x)}" y2="${format(plotBottom)}"/>
      <circle cx="${format(equilibrium.x)}" cy="${format(equilibrium.y)}" r="4"/>
      ${mathLabel("E_0=(5,7)", equilibrium.x + 8, equilibrium.y - 34, 104, 32, "untaxed-equilibrium")}
    </g>
  </svg>`;
}

function requiredSvgGroup(root: SVGSVGElement, entityId: string): SVGGElement {
  const group = root.querySelector<SVGGElement>(
    `[data-kp-supply-tax-entity="${entityId}"]`
  );
  if (group === null) throw new Error(`Missing SVG entity ${entityId}.`);
  return group;
}

function setCurveLine(
  group: SVGGElement,
  start: KpSupplyTaxSvgPointV1,
  end: KpSupplyTaxSvgPointV1
): void {
  const line = group.querySelector<SVGLineElement>("line");
  if (line === null) throw new Error("Supply-tax curve entity requires a line.");
  line.setAttribute("x1", format(start.x));
  line.setAttribute("y1", format(start.y));
  line.setAttribute("x2", format(end.x));
  line.setAttribute("y2", format(end.y));
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
