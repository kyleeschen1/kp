import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  kpEconomicsGraphPlotInsets,
  renderKpEconomicsEquilibriumRuntimeContent
} from "./economics-equilibrium-svg.ts";
import type { KpEconomicsGraphViewport } from "./economics-equilibrium-svg.ts";

export interface KpEconomicsEquilibriumRuntimeSessionInput {
  readonly content: SVGGElement;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}

export interface KpEconomicsEquilibriumRuntimeSession {
  readonly content: SVGGElement;
  readonly status: "mounted" | "disposed";
  apply(input: {
    readonly frame: KpEconomicsEquilibriumRuntimeFrame;
    readonly viewport: KpEconomicsGraphViewport;
  }): void;
  dispose(): void;
}

export interface KpEconomicsEquilibriumMountedScaffold {
  readonly content: SVGGElement;
  readonly view: SVGGElement;
  readonly status: "mounted" | "disposed";
  dispose(): void;
}

const mountedScaffolds = new WeakMap<
  SVGGElement,
  KpEconomicsEquilibriumMountedScaffold
>();

interface KpEconomicsEquilibriumScaffoldState {
  stableGeometryKey: string;
}

const scaffoldStates = new WeakMap<
  KpEconomicsEquilibriumMountedScaffold,
  KpEconomicsEquilibriumScaffoldState
>();

export function mountKpEconomicsEquilibriumRuntimeScaffold(
  input: KpEconomicsEquilibriumRuntimeSessionInput
): KpEconomicsEquilibriumMountedScaffold {
  const extant = mountedScaffolds.get(input.content);
  if (extant?.status === "mounted") return extant;

  // Complete markup remains the deterministic mount and export authority;
  // later progress patches retain this parsed tree instead of rebuilding it.
  input.content.innerHTML = renderKpEconomicsEquilibriumRuntimeContent({
    frame: input.frame,
    viewport: input.viewport
  });
  const view = input.content.querySelector<SVGGElement>(
    ":scope > [data-kp-economics-equilibrium-view]"
  );
  if (view === null) {
    throw new Error("Economics runtime scaffold did not mount its view root.");
  }

  let disposed = false;
  const scaffold: KpEconomicsEquilibriumMountedScaffold = Object.freeze({
    content: input.content,
    view,
    get status() {
      return disposed ? "disposed" as const : "mounted" as const;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      view.remove();
      mountedScaffolds.delete(input.content);
    }
  });
  mountedScaffolds.set(input.content, scaffold);
  scaffoldStates.set(scaffold, {
    stableGeometryKey: stableGeometryKey(input.frame, input.viewport)
  });
  return scaffold;
}

export function patchKpEconomicsEquilibriumStableStructure(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): void {
  requireMounted(input.scaffold);
  const state = scaffoldStates.get(input.scaffold);
  if (state === undefined) {
    throw new Error("Economics runtime scaffold state is unavailable.");
  }
  const nextKey = stableGeometryKey(input.frame, input.viewport);
  if (state.stableGeometryKey === nextKey) return;

  const point = graphPoint(input.viewport);
  const frame = input.frame.semanticFrame;
  const minimumQuantity = input.viewport.xDomain[0];
  const maximumQuantity = input.viewport.xDomain[1];
  const supplyIntercept = exactNumber(frame.supply.priceIntercept);
  const supplySlope = exactNumber(frame.supply.priceChangePerQuantity);
  const supplyStart = point(
    minimumQuantity,
    supplyIntercept + supplySlope * minimumQuantity
  );
  const supplyEnd = point(
    maximumQuantity,
    supplyIntercept + supplySlope * maximumQuantity
  );
  const supply = requireElement<SVGLineElement>(
    input.scaffold.view,
    "[data-kp-economics-supply-line]"
  );
  supply.dataset["kpEconomicsEquation"] = supplyEquation(frame);
  setLine(supply, supplyStart[0], supplyStart[1], supplyEnd[0], supplyEnd[1]);
  patchGrid(input.scaffold.view, input.viewport, point);
  state.stableGeometryKey = nextKey;
}

function patchGrid(
  view: SVGGElement,
  viewport: KpEconomicsGraphViewport,
  point: (quantity: number, price: number) => readonly [number, number]
): void {
  const quantityTicks = [2, 4, 6, 8, 10];
  const priceTicks = [4, 8, 12, 16];
  const quantityGrid = view.querySelectorAll<SVGLineElement>(
    '[data-kp-economics-grid-axis="quantity"]'
  );
  const priceGrid = view.querySelectorAll<SVGLineElement>(
    '[data-kp-economics-grid-axis="price"]'
  );
  const quantityMarks = view.querySelectorAll<SVGLineElement>(
    '[data-kp-economics-tick-axis="quantity"]'
  );
  const priceMarks = view.querySelectorAll<SVGLineElement>(
    '[data-kp-economics-tick-axis="price"]'
  );
  if (
    quantityGrid.length !== quantityTicks.length ||
    quantityMarks.length !== quantityTicks.length ||
    priceGrid.length !== priceTicks.length ||
    priceMarks.length !== priceTicks.length
  ) {
    throw new Error("Economics runtime grid topology diverged from its scaffold.");
  }

  quantityTicks.forEach((value, index) => {
    const [x] = point(value, 0);
    setLine(
      quantityGrid[index]!,
      x,
      kpEconomicsGraphPlotInsets.top,
      x,
      viewport.height - kpEconomicsGraphPlotInsets.bottom
    );
    setLine(
      quantityMarks[index]!,
      x,
      viewport.height - 32,
      x,
      viewport.height - 24
    );
  });
  priceTicks.forEach((value, index) => {
    const [, y] = point(0, value);
    setLine(
      priceGrid[index]!,
      kpEconomicsGraphPlotInsets.left,
      y,
      viewport.width - kpEconomicsGraphPlotInsets.right,
      y
    );
    setLine(priceMarks[index]!, 32, y, 40, y);
  });
}

function stableGeometryKey(
  frame: KpEconomicsEquilibriumRuntimeFrame,
  viewport: KpEconomicsGraphViewport
): string {
  const supply = frame.semanticFrame.supply;
  return [
    viewport.width,
    viewport.height,
    ...viewport.xDomain,
    ...viewport.yDomain,
    supply.priceIntercept.numerator,
    supply.priceIntercept.denominator,
    supply.priceChangePerQuantity.numerator,
    supply.priceChangePerQuantity.denominator
  ].join(":");
}

function graphPoint(viewport: KpEconomicsGraphViewport) {
  const plot = {
    left: kpEconomicsGraphPlotInsets.left,
    right: viewport.width - kpEconomicsGraphPlotInsets.right,
    top: kpEconomicsGraphPlotInsets.top,
    bottom: viewport.height - kpEconomicsGraphPlotInsets.bottom
  };
  return (quantity: number, price: number) => [
    scale(quantity, viewport.xDomain, [plot.left, plot.right]),
    scale(price, viewport.yDomain, [plot.bottom, plot.top])
  ] as const;
}

function supplyEquation(
  frame: KpEconomicsEquilibriumRuntimeFrame["semanticFrame"]
): string {
  const intercept = formatNumber(exactNumber(frame.supply.priceIntercept));
  const slope = formatNumber(exactNumber(frame.supply.priceChangePerQuantity));
  return `P=${intercept}+${slope === "1" ? "" : slope}Q`;
}

function setLine(
  line: SVGLineElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  line.setAttribute("x1", String(x1));
  line.setAttribute("y1", String(y1));
  line.setAttribute("x2", String(x2));
  line.setAttribute("y2", String(y2));
}

function requireElement<ElementType extends Element>(
  root: Element,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Economics runtime scaffold is missing ${selector}.`);
  }
  return element;
}

function requireMounted(
  scaffold: KpEconomicsEquilibriumMountedScaffold
): void {
  if (scaffold.status !== "mounted") {
    throw new Error("Cannot patch a disposed economics runtime scaffold.");
  }
}

function exactNumber(value: {
  readonly numerator: string;
  readonly denominator: string;
}): number {
  return Number(value.numerator) / Number(value.denominator);
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

export const kpEconomicsEquilibriumRuntimeSessionContract = Object.freeze({
  scope: "economics-equilibrium-exemplar",
  staticRendererAuthority: "pure-deterministic-markup",
  mountPolicy: "one-runtime-tree-per-content-owner",
  ordinaryProgressPolicy: "patch-retained-nodes",
  topologyPolicy: "keyed-discrete-lifecycle",
  labelPolicy: "retain-static-katex-and-screen-label-nodes",
  seekPolicy: "history-independent",
  disposalPolicy: "explicit-idempotent"
} as const);
