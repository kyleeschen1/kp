import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import {
  createKpPerUnitTaxWelfareAsset,
  type KpPerUnitTaxWelfareAssetV1,
  type KpSupplyTaxCurveEntityV1,
  type KpSupplyTaxRegionBoundaryV1,
  type KpSupplyTaxRegionEntityV1
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
  readonly market: Readonly<{
    entityId: string;
    present: boolean;
    opacity: number;
    quantity: number;
    consumerPrice: number;
    producerPrice: number;
    priceWedge: number;
    equilibriumPoint: KpSupplyTaxSvgPointV1;
    producerPoint: KpSupplyTaxSvgPointV1;
    quantityAxisPoint: KpSupplyTaxSvgPointV1;
    consumerPriceAxisPoint: KpSupplyTaxSvgPointV1;
    producerPriceAxisPoint: KpSupplyTaxSvgPointV1;
    wedgeEntityId: string;
  }>;
}

export interface KpSupplyTaxWelfareRegionSvgProjectionV1 {
  readonly regions: readonly Readonly<{
    entityId: string;
    phase: KpSupplyTaxRegionEntityV1["phase"];
    role: KpSupplyTaxRegionEntityV1["role"];
    value: ExactRationalDto;
    points: readonly KpSupplyTaxSvgPointV1[];
  }>[];
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

export function projectKpSupplyTaxWelfareRegionsSvg(
  semantics: KpPerUnitTaxWelfareAssetV1 = createKpPerUnitTaxWelfareAsset()
): KpSupplyTaxWelfareRegionSvgProjectionV1 {
  return Object.freeze({
    regions: Object.freeze(semantics.entities.regions.map((region) => {
      const qStart = exactNumber(region.quantityInterval.start);
      const qEnd = exactNumber(region.quantityInterval.end);
      return Object.freeze({
        entityId: region.id,
        phase: region.phase,
        role: region.role,
        value: region.value,
        points: Object.freeze([
          regionPoint(semantics, region.upperBoundary, qStart),
          regionPoint(semantics, region.upperBoundary, qEnd),
          regionPoint(semantics, region.lowerBoundary, qEnd),
          regionPoint(semantics, region.lowerBoundary, qStart)
        ])
      });
    }))
  });
}

export function renderKpSupplyTaxWelfareLedger(
  semantics: KpPerUnitTaxWelfareAssetV1 = createKpPerUnitTaxWelfareAsset()
): string {
  const consumerBefore = requiredRegion(semantics, "consumer-surplus", "untaxed");
  const consumerAfter = requiredRegion(semantics, "consumer-surplus", "taxed");
  const producerBefore = requiredRegion(semantics, "producer-surplus", "untaxed");
  const producerAfter = requiredRegion(semantics, "producer-surplus", "taxed");
  const revenue = requiredRegion(semantics, "government-revenue", "taxed");
  const loss = requiredRegion(semantics, "deadweight-loss", "taxed");
  const tax = semantics.model.input.tax;
  return `<aside class="kp-supply-tax-ledger" aria-label="Exact welfare accounting" data-kp-supply-tax-ledger>
    <h2>Welfare</h2>
    <div class="kp-supply-tax-ledger__tax" data-kp-supply-tax-entity="${escapeAttribute(tax.id)}" aria-label="Per-unit tax ${exactDtoSpoken(tax.finalAmount)}">
      <span>Per-unit tax</span>
      ${renderLatexToHtml(`t=${exactDtoLatex(tax.finalAmount)}`, { displayMode: false })}
    </div>
    <div class="kp-supply-tax-ledger__columns" aria-hidden="true"><span>Before</span><span>After</span></div>
    ${ledgerRow("Consumer surplus", consumerBefore, consumerAfter)}
    ${ledgerRow("Producer surplus", producerBefore, producerAfter)}
    ${ledgerRow("Government revenue", undefined, revenue)}
    ${ledgerRow("Deadweight loss", undefined, loss)}
  </aside>`;
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
  const quantity = exactNumber(input.frame.market.quantity);
  const consumerPrice = exactNumber(input.frame.market.consumerPrice);
  const producerPrice = exactNumber(input.frame.market.producerPrice);
  const priceWedge = exactNumber(input.frame.market.priceWedge);
  const present = progress > 0;
  const opacity = Math.min(1, progress / 0.14);
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
      present,
      // Reveal follows the playhead, so direct seek and reverse never depend
      // on a CSS clock while the two supply curves separate.
      opacity
    }),
    market: Object.freeze({
      entityId: input.semantics.model.states.taxed.id,
      present,
      opacity,
      quantity,
      consumerPrice,
      producerPrice,
      priceWedge,
      equilibriumPoint: graphPoint(input.semantics, quantity, consumerPrice),
      producerPoint: graphPoint(input.semantics, quantity, producerPrice),
      quantityAxisPoint: graphPoint(input.semantics, quantity, 0),
      consumerPriceAxisPoint: graphPoint(input.semantics, 0, consumerPrice),
      producerPriceAxisPoint: graphPoint(input.semantics, 0, producerPrice),
      wedgeEntityId: input.semantics.entities.wedge.id
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
  projectTaxedMarketDom(input.root, projection.market);
  const title = input.root.querySelector<SVGTitleElement>("title");
  const description = input.root.querySelector<SVGDescElement>("desc");
  if (title === null || description === null) {
    throw new Error("Supply-tax SVG requires an accessible title and description.");
  }
  title.textContent = projection.phase === "untaxed"
    ? "Untaxed supply and demand equilibrium"
    : projection.phase === "taxed"
      ? "Taxed supply and demand equilibrium"
      : "A per-unit tax changes market equilibrium";
  description.textContent = projection.phase === "untaxed"
    ? "Demand P equals 12 minus Q and supply P equals 2 plus Q intersect at quantity 5 and price 7."
    : `A tax of ${exactLatex(projection.market.priceWedge)} shifts buyer-facing supply while original supply remains visible. Quantity is ${exactLatex(projection.market.quantity)}, consumers pay ${exactLatex(projection.market.consumerPrice)}, and producers receive ${exactLatex(projection.market.producerPrice)}.`;
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
  const welfare = projectKpSupplyTaxWelfareRegionsSvg(semantics);
  const taxed = semantics.model.states.taxed;
  const taxedQuantity = exactNumber(taxed.quantity);
  const taxedConsumerPrice = exactNumber(taxed.consumerPrice);
  const taxedProducerPrice = exactNumber(taxed.producerPrice);
  const taxedEquilibrium = graphPoint(semantics, taxedQuantity, taxedConsumerPrice);
  const taxedProducerPoint = graphPoint(semantics, taxedQuantity, taxedProducerPrice);

  return `<svg class="kp-supply-tax-graph" viewBox="0 0 ${kpSupplyTaxGraphViewport.width} ${kpSupplyTaxGraphViewport.height}" role="img" aria-labelledby="kp-supply-tax-graph-title kp-supply-tax-graph-description" data-kp-supply-tax-svg-state="baseline-market">
    <title id="kp-supply-tax-graph-title">Untaxed supply and demand equilibrium</title>
    <desc id="kp-supply-tax-graph-description">Demand P equals 12 minus Q and supply P equals 2 plus Q intersect at quantity 5 and price 7.</desc>
    <g class="kp-supply-tax-graph__grid" aria-hidden="true">
      ${qTicks.filter((value) => value > qMin).map((value) => `<line x1="${format(mapQuantity(semantics, value))}" y1="${format(plotTop)}" x2="${format(mapQuantity(semantics, value))}" y2="${format(plotBottom)}"/>`).join("")}
      ${pTicks.map((value) => `<line x1="${format(plotLeft)}" y1="${format(mapPrice(semantics, value))}" x2="${format(plotRight)}" y2="${format(mapPrice(semantics, value))}"/>`).join("")}
    </g>
    ${includeTransitLayer ? `<g class="kp-supply-tax-graph__welfare-regions" aria-label="Welfare regions">
      ${welfare.regions.map((region) => `<polygon class="kp-supply-tax-graph__region kp-supply-tax-graph__region--${escapeAttribute(region.role)}" data-kp-supply-tax-entity="${escapeAttribute(region.entityId)}" data-kp-supply-tax-region-phase="${region.phase}" data-kp-presence="false" points="${region.points.map(pointPair).join(" ")}"/>`).join("")}
    </g>` : ""}
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
      ${mathLabel("E_0=(5,7)", equilibrium.x + 8, equilibrium.y - 34, 104, 32, "untaxed-equilibrium", requiredPriceId(semantics, "untaxed-market"))}
    </g>
    ${includeTransitLayer ? `<g class="kp-supply-tax-graph__taxed-market" data-kp-supply-tax-entity="${escapeAttribute(taxed.id)}" data-kp-presence="false" style="opacity:0">
      <line class="kp-supply-tax-graph__guide" data-kp-supply-tax-market-mark="consumer-price-guide" x1="${format(plotLeft)}" y1="${format(taxedEquilibrium.y)}" x2="${format(taxedEquilibrium.x)}" y2="${format(taxedEquilibrium.y)}"/>
      <line class="kp-supply-tax-graph__guide" data-kp-supply-tax-market-mark="producer-price-guide" x1="${format(plotLeft)}" y1="${format(taxedProducerPoint.y)}" x2="${format(taxedProducerPoint.x)}" y2="${format(taxedProducerPoint.y)}"/>
      <line class="kp-supply-tax-graph__guide" data-kp-supply-tax-market-mark="quantity-guide" x1="${format(taxedEquilibrium.x)}" y1="${format(taxedEquilibrium.y)}" x2="${format(taxedEquilibrium.x)}" y2="${format(plotBottom)}"/>
      <g class="kp-supply-tax-graph__wedge" data-kp-supply-tax-entity="${escapeAttribute(semantics.entities.wedge.id)}">
        <line data-kp-supply-tax-market-mark="wedge" x1="${format(taxedEquilibrium.x)}" y1="${format(taxedEquilibrium.y)}" x2="${format(taxedProducerPoint.x)}" y2="${format(taxedProducerPoint.y)}"/>
        <line data-kp-supply-tax-market-mark="wedge-cap-consumer" x1="${format(taxedEquilibrium.x - 5)}" y1="${format(taxedEquilibrium.y)}" x2="${format(taxedEquilibrium.x + 5)}" y2="${format(taxedEquilibrium.y)}"/>
        <line data-kp-supply-tax-market-mark="wedge-cap-producer" x1="${format(taxedProducerPoint.x - 5)}" y1="${format(taxedProducerPoint.y)}" x2="${format(taxedProducerPoint.x + 5)}" y2="${format(taxedProducerPoint.y)}"/>
        ${mathLabel("t=P_c-P_p=4", taxedEquilibrium.x + 8, (taxedEquilibrium.y + taxedProducerPoint.y) / 2 - 15, 126, 30, "tax-wedge")}
      </g>
      <circle data-kp-supply-tax-market-mark="taxed-equilibrium-point" cx="${format(taxedEquilibrium.x)}" cy="${format(taxedEquilibrium.y)}" r="4"/>
      <circle class="kp-supply-tax-graph__producer-point" data-kp-supply-tax-market-mark="producer-point" cx="${format(taxedProducerPoint.x)}" cy="${format(taxedProducerPoint.y)}" r="3.25"/>
      ${mathLabel("E_t", taxedEquilibrium.x + 8, taxedEquilibrium.y - 30, 44, 30, "taxed-equilibrium")}
      ${mathLabel("P_c=9", plotLeft - 59, taxedEquilibrium.y - 14, 58, 28, "consumer-price", requiredPriceId(semantics, "consumer"))}
      ${mathLabel("P_p=5", plotLeft - 59, taxedProducerPoint.y - 14, 58, 28, "producer-price", requiredPriceId(semantics, "producer"))}
      ${mathLabel("Q_t=3", taxedEquilibrium.x - 28, plotBottom + 8, 62, 28, "taxed-quantity")}
    </g>` : ""}
  </svg>`;
}

function regionPoint(
  semantics: KpPerUnitTaxWelfareAssetV1,
  boundary: KpSupplyTaxRegionBoundaryV1,
  quantity: number
): KpSupplyTaxSvgPointV1 {
  if (boundary.kind === "curve") {
    const curve = semantics.entities.curves.find(({ id }) => id === boundary.entityId);
    if (curve === undefined) throw new Error(`Missing region curve ${boundary.entityId}.`);
    return graphPoint(semantics, quantity, curvePrice(curve, quantity));
  }
  const price = semantics.entities.prices.find(({ id }) => id === boundary.entityId);
  if (price === undefined) throw new Error(`Missing region price ${boundary.entityId}.`);
  return graphPoint(semantics, quantity, exactNumber(price.value));
}

function requiredRegion(
  semantics: KpPerUnitTaxWelfareAssetV1,
  role: KpSupplyTaxRegionEntityV1["role"],
  phase: KpSupplyTaxRegionEntityV1["phase"]
): KpSupplyTaxRegionEntityV1 {
  const region = semantics.entities.regions.find((candidate) =>
    candidate.role === role && candidate.phase === phase);
  if (region === undefined) throw new Error(`Missing ${phase} ${role} region.`);
  return region;
}

function requiredPriceId(
  semantics: KpPerUnitTaxWelfareAssetV1,
  role: KpPerUnitTaxWelfareAssetV1["entities"]["prices"][number]["role"]
): string {
  const price = semantics.entities.prices.find((candidate) =>
    candidate.role === role);
  if (price === undefined) throw new Error(`Missing ${role} price entity.`);
  return price.id;
}

function ledgerRow(
  label: string,
  before: KpSupplyTaxRegionEntityV1 | undefined,
  after: KpSupplyTaxRegionEntityV1
): string {
  return `<div class="kp-supply-tax-ledger__row" data-kp-supply-tax-ledger-role="${escapeAttribute(after.role)}">
    <span class="kp-supply-tax-ledger__label">${escapeAttribute(label)}</span>
    ${ledgerValue(before)}
    ${ledgerValue(after)}
  </div>`;
}

function ledgerValue(region: KpSupplyTaxRegionEntityV1 | undefined): string {
  const latex = region === undefined ? "0" : exactDtoLatex(region.value);
  const exactValue = region === undefined ? "0/1" :
    `${region.value.numerator}/${region.value.denominator}`;
  const entity = region === undefined
    ? ' data-kp-supply-tax-ledger-zero="true"'
    : ` data-kp-supply-tax-entity="${escapeAttribute(region.id)}"`;
  const spoken = region === undefined ? "zero" : exactDtoSpoken(region.value);
  return `<span class="kp-supply-tax-ledger__value" data-kp-exact-value="${exactValue}" aria-label="${escapeAttribute(spoken)}"${entity}>${renderLatexToHtml(latex,
    { displayMode: false })}</span>`;
}

function exactDtoLatex(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function exactDtoSpoken(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `${value.numerator} divided by ${value.denominator}`;
}

function pointPair(point: KpSupplyTaxSvgPointV1): string {
  return `${format(point.x)},${format(point.y)}`;
}

function projectTaxedMarketDom(
  root: SVGSVGElement,
  market: KpSupplyTaxTransitSvgProjectionV1["market"]
): void {
  const group = requiredSvgGroup(root, market.entityId);
  group.dataset["kpPresence"] = String(market.present);
  group.style.opacity = format(market.opacity);
  setLine(group, "consumer-price-guide", market.consumerPriceAxisPoint,
    market.equilibriumPoint);
  setLine(group, "producer-price-guide", market.producerPriceAxisPoint,
    market.producerPoint);
  setLine(group, "quantity-guide", market.equilibriumPoint,
    market.quantityAxisPoint);
  setLine(group, "wedge", market.equilibriumPoint, market.producerPoint);
  setHorizontalCap(group, "wedge-cap-consumer", market.equilibriumPoint);
  setHorizontalCap(group, "wedge-cap-producer", market.producerPoint);
  setCircle(group, "taxed-equilibrium-point", market.equilibriumPoint);
  setCircle(group, "producer-point", market.producerPoint);
  setMathLabel(group, "taxed-equilibrium", "E_t",
    market.equilibriumPoint.x + 8, market.equilibriumPoint.y - 30);
  setMathLabel(group, "consumer-price", `P_c=${exactLatex(market.consumerPrice)}`,
    kpSupplyTaxGraphViewport.left - 59, market.consumerPriceAxisPoint.y - 14);
  setMathLabel(group, "producer-price", `P_p=${exactLatex(market.producerPrice)}`,
    kpSupplyTaxGraphViewport.left - 59, market.producerPriceAxisPoint.y - 14);
  setMathLabel(group, "taxed-quantity", `Q_t=${exactLatex(market.quantity)}`,
    market.quantityAxisPoint.x - 28, market.quantityAxisPoint.y + 8);
  setMathLabel(group, "tax-wedge", `t=P_c-P_p=${exactLatex(market.priceWedge)}`,
    market.equilibriumPoint.x + 8,
    (market.equilibriumPoint.y + market.producerPoint.y) / 2 - 15);
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

function setLine(
  group: SVGGElement,
  role: string,
  start: KpSupplyTaxSvgPointV1,
  end: KpSupplyTaxSvgPointV1
): void {
  const line = group.querySelector<SVGLineElement>(
    `[data-kp-supply-tax-market-mark="${role}"]`
  );
  if (line === null) throw new Error(`Missing taxed-market line ${role}.`);
  line.setAttribute("x1", format(start.x));
  line.setAttribute("y1", format(start.y));
  line.setAttribute("x2", format(end.x));
  line.setAttribute("y2", format(end.y));
}

function setHorizontalCap(
  group: SVGGElement,
  role: string,
  center: KpSupplyTaxSvgPointV1
): void {
  setLine(group, role, { x: center.x - 5, y: center.y },
    { x: center.x + 5, y: center.y });
}

function setCircle(
  group: SVGGElement,
  role: string,
  point: KpSupplyTaxSvgPointV1
): void {
  const circle = group.querySelector<SVGCircleElement>(
    `[data-kp-supply-tax-market-mark="${role}"]`
  );
  if (circle === null) throw new Error(`Missing taxed-market point ${role}.`);
  circle.setAttribute("cx", format(point.x));
  circle.setAttribute("cy", format(point.y));
}

function setMathLabel(
  group: SVGGElement,
  role: string,
  latex: string,
  x: number,
  y: number
): void {
  const label = group.querySelector<SVGForeignObjectElement>(
    `[data-kp-supply-tax-math-label="${role}"]`
  );
  if (label === null) throw new Error(`Missing taxed-market KaTeX label ${role}.`);
  const content = label.querySelector<HTMLDivElement>("div");
  if (content === null) throw new Error(`Missing KaTeX content for ${role}.`);
  content.innerHTML = renderLatexToHtml(latex, { displayMode: false });
  label.setAttribute("x", format(x));
  label.setAttribute("y", format(y));
}

function exactLatex(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const doubled = value * 2;
  if (Number.isInteger(doubled)) return `\\frac{${doubled}}{2}`;
  return format(value);
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

function mathLabel(latex: string, x: number, y: number, width: number, height: number, role: string, entityId?: string): string {
  const entity = entityId === undefined ? "" :
    ` data-kp-supply-tax-entity="${escapeAttribute(entityId)}"`;
  return `<foreignObject class="kp-supply-tax-graph__math" data-kp-supply-tax-math-label="${escapeAttribute(role)}"${entity} x="${format(x)}" y="${format(y)}" width="${width}" height="${height}" aria-hidden="true"><div xmlns="http://www.w3.org/1999/xhtml">${renderLatexToHtml(latex, { displayMode: false })}</div></foreignObject>`;
}

function format(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function escapeAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
