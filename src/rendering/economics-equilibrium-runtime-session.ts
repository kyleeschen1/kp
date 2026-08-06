import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  kpEconomicsGraphPlotInsets,
  projectKpEconomicsDataCurvePath,
  renderKpEconomicsEquilibriumRuntimeContent
} from "./economics-equilibrium-svg.ts";
import type {
  KpEconomicsGraphViewport,
  KpEconomicsInlineLatexRenderer
} from "./economics-equilibrium-svg.ts";
import {
  formatKpDimensionalContinuityDynamicDisplay,
  kpDimensionalContinuityDynamicDisplayDecimals,
  kpDimensionalContinuityDynamicDisplayRelation
} from "../animation/dimensional-continuity-dynamic-display.ts";
import {
  createKpEconomicsEquilibriumSynchronizedView
} from "../animation/economics-equilibrium-synchronized-view.ts";

export interface KpEconomicsEquilibriumRuntimeSessionInput {
  readonly content: SVGGElement;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
  readonly renderInlineLatex: KpEconomicsInlineLatexRenderer;
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
  readonly renderInlineLatex: KpEconomicsInlineLatexRenderer;
}

const scaffoldStates = new WeakMap<
  KpEconomicsEquilibriumMountedScaffold,
  KpEconomicsEquilibriumScaffoldState
>();

const runtimeSessions = new WeakMap<
  SVGGElement,
  KpEconomicsEquilibriumRuntimeSession
>();

export function createKpEconomicsEquilibriumRuntimeSession(
  input: KpEconomicsEquilibriumRuntimeSessionInput
): KpEconomicsEquilibriumRuntimeSession {
  const extant = runtimeSessions.get(input.content);
  if (extant?.status === "mounted") {
    extant.apply({ frame: input.frame, viewport: input.viewport });
    return extant;
  }
  const scaffold = mountKpEconomicsEquilibriumRuntimeScaffold(input);
  let disposed = false;
  const session: KpEconomicsEquilibriumRuntimeSession = Object.freeze({
    content: input.content,
    get status() {
      return disposed ? "disposed" as const : "mounted" as const;
    },
    apply(next: {
      readonly frame: KpEconomicsEquilibriumRuntimeFrame;
      readonly viewport: KpEconomicsGraphViewport;
    }) {
      if (disposed) {
        throw new Error("Cannot apply a disposed economics runtime session.");
      }
      patchKpEconomicsEquilibriumMathLabels({ scaffold, ...next });
      patchKpEconomicsEquilibriumSynchronizedContent({ scaffold, ...next });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scaffold.dispose();
      runtimeSessions.delete(input.content);
    }
  });
  runtimeSessions.set(input.content, session);
  session.apply({ frame: input.frame, viewport: input.viewport });
  return session;
}

export function mountKpEconomicsEquilibriumRuntimeScaffold(
  input: KpEconomicsEquilibriumRuntimeSessionInput
): KpEconomicsEquilibriumMountedScaffold {
  const extant = mountedScaffolds.get(input.content);
  if (extant?.status === "mounted") return extant;

  // Complete markup remains the deterministic mount and export authority;
  // later progress patches retain this parsed tree instead of rebuilding it.
  input.content.innerHTML = renderKpEconomicsEquilibriumRuntimeContent({
    frame: input.frame,
    viewport: input.viewport,
    renderInlineLatex: input.renderInlineLatex
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
    stableGeometryKey: stableGeometryKey(input.frame, input.viewport),
    renderInlineLatex: input.renderInlineLatex
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
  const supply = requireElement<SVGPathElement>(
    input.scaffold.view,
    "[data-kp-economics-supply-line]"
  );
  setAttributeIfChanged(
    supply,
    "data-kp-economics-equation",
    supplyEquation(frame)
  );
  setDataCurvePath(supply, supplyStart, supplyEnd);
  patchGrid(input.scaffold.view, input.viewport, point);
  state.stableGeometryKey = nextKey;
}

export function patchKpEconomicsEquilibriumDynamicStructure(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): void {
  requireMounted(input.scaffold);
  patchKpEconomicsEquilibriumStableStructure(input);
  const view = input.scaffold.view;
  const frame = input.frame.semanticFrame;
  const point = graphPoint(input.viewport);
  const minimumQuantity = input.viewport.xDomain[0];
  const maximumQuantity = input.viewport.xDomain[1];
  const demandIntercept = exactNumber(frame.demand.priceInterceptCurrent);
  const initialDemandIntercept = exactNumber(frame.demand.priceInterceptBefore);
  const demandSlope = exactNumber(frame.demand.priceChangePerQuantity);
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
  const equilibrium = point(
    exactNumber(frame.equilibrium.quantity),
    exactNumber(frame.equilibrium.price)
  );
  const quantityAxis = point(exactNumber(frame.equilibrium.quantity), 0);
  const priceAxis = point(0, exactNumber(frame.equilibrium.price));
  const initialEquilibrium = point(
    exactNumber(input.frame.initialEquilibrium.quantity),
    exactNumber(input.frame.initialEquilibrium.price)
  );
  const initialQuantityAxis = point(
    exactNumber(input.frame.initialEquilibrium.quantity),
    0
  );
  const initialPriceAxis = point(
    0,
    exactNumber(input.frame.initialEquilibrium.price)
  );

  setAttributeIfChanged(view, "data-kp-economics-equilibrium-phase", frame.phase);
  setAttributeIfChanged(view, "data-kp-economics-choreography-stage", input.frame.stage);
  setAttributeIfChanged(
    view,
    "data-kp-economics-display-precision",
    String(kpDimensionalContinuityDynamicDisplayDecimals)
  );
  setAttributeIfChanged(
    view,
    "data-kp-economics-demand-intercept",
    exactText(frame.demand.priceInterceptCurrent)
  );

  const demandReference = requireElement<SVGGElement>(
    view,
    ".editor-graph-stage__economics-demand-reference"
  );
  setAttributeIfChanged(
    demandReference,
    "data-kp-economics-reference-progress",
    String(input.frame.initialDemandReferenceOpacity)
  );
  setDataCurvePath(
    requireElement(view, "[data-kp-economics-initial-demand-reference]"),
    initialDemandStart,
    initialDemandEnd
  );
  setDataCurvePath(
    requireElement(view, "[data-kp-economics-initial-demand-reference-core]"),
    initialDemandStart,
    initialDemandEnd
  );

  const demand = requireElement<SVGPathElement>(
    view,
    "[data-kp-economics-demand-line]"
  );
  setAttributeIfChanged(demand, "data-kp-economics-equation", demandEquation(frame));
  setDataCurvePath(demand, demandStart, demandEnd);

  const movement = requireElement<SVGGElement>(
    view,
    "[data-kp-economics-supply-movement]"
  );
  setAttributeIfChanged(
    movement,
    "data-kp-economics-supply-equation",
    supplyEquation(frame)
  );
  setAttributeIfChanged(
    movement,
    "data-kp-economics-movement-from-quantity",
    exactText(input.frame.initialEquilibrium.quantity)
  );
  setAttributeIfChanged(
    movement,
    "data-kp-economics-movement-from-price",
    exactText(input.frame.initialEquilibrium.price)
  );
  setAttributeIfChanged(
    movement,
    "data-kp-economics-movement-to-quantity",
    exactText(frame.equilibrium.quantity)
  );
  setAttributeIfChanged(
    movement,
    "data-kp-economics-movement-to-price",
    exactText(frame.equilibrium.price)
  );
  setDataCurvePath(
    requireElement(movement, "[data-kp-economics-supply-movement-trace]"),
    initialEquilibrium,
    equilibrium
  );

  setLine(
    requireElement(view, "[data-kp-economics-equilibrium-quantity-guide]"),
    equilibrium[0],
    equilibrium[1],
    quantityAxis[0],
    quantityAxis[1]
  );
  setLine(
    requireElement(view, "[data-kp-economics-equilibrium-price-guide]"),
    equilibrium[0],
    equilibrium[1],
    priceAxis[0],
    priceAxis[1]
  );
  patchInitialEquilibriumGuides({
    scaffold: input.scaffold,
    opacity: input.frame.initialEquilibriumReferenceOpacity,
    initialEquilibrium,
    initialPriceAxis,
    initialQuantityAxis
  });

  const initialPoint = requireElement<SVGCircleElement>(
    view,
    "[data-kp-economics-initial-equilibrium-reference]"
  );
  setAttributeIfChanged(
    initialPoint,
    "data-kp-economics-reference-progress",
    String(input.frame.initialEquilibriumReferenceOpacity)
  );
  setCircle(initialPoint, initialEquilibrium[0], initialEquilibrium[1]);
  const pointElement = requireElement<SVGCircleElement>(
    view,
    "[data-kp-economics-equilibrium-point]"
  );
  setAttributeIfChanged(
    pointElement,
    "data-kp-economics-equilibrium-quantity",
    exactText(frame.equilibrium.quantity)
  );
  setAttributeIfChanged(
    pointElement,
    "data-kp-economics-equilibrium-price",
    exactText(frame.equilibrium.price)
  );
  setCircle(pointElement, equilibrium[0], equilibrium[1]);
}

export function patchKpEconomicsEquilibriumMathLabels(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): void {
  requireMounted(input.scaffold);
  patchKpEconomicsEquilibriumDynamicStructure(input);
  const view = input.scaffold.view;
  const frame = input.frame.semanticFrame;
  const point = graphPoint(input.viewport);
  const maximumQuantity = input.viewport.xDomain[1];
  const demandIntercept = exactNumber(frame.demand.priceInterceptCurrent);
  const initialDemandIntercept = exactNumber(frame.demand.priceInterceptBefore);
  const demandSlope = exactNumber(frame.demand.priceChangePerQuantity);
  const demandEnd = point(
    maximumQuantity,
    demandIntercept - demandSlope * maximumQuantity
  );
  const initialDemandEnd = point(
    maximumQuantity,
    initialDemandIntercept - demandSlope * maximumQuantity
  );
  const equilibrium = point(
    exactNumber(frame.equilibrium.quantity),
    exactNumber(frame.equilibrium.price)
  );
  const initialEquilibrium = point(
    exactNumber(input.frame.initialEquilibrium.quantity),
    exactNumber(input.frame.initialEquilibrium.price)
  );
  const demandRole = input.frame.stage === "establish"
    ? "D_0"
    : input.frame.stage === "shift"
      ? "D_t"
      : "D_1";
  const equilibriumRole = input.frame.stage === "establish"
    ? "E_0"
    : input.frame.stage === "shift"
      ? "E_t"
      : "E_1";
  const equilibriumLatex = `${equilibriumRole} ${
    kpDimensionalContinuityDynamicDisplayRelation(input.frame.stage === "shift")
  } (${formatKpDimensionalContinuityDynamicDisplay(frame.equilibrium.quantity)}, ${
    formatKpDimensionalContinuityDynamicDisplay(frame.equilibrium.price)
  })`;

  const demandLabel = requireElement<SVGForeignObjectElement>(
    view,
    '[data-kp-economics-math-label="curve-demand-current"]'
  );
  setAttributeIfChanged(demandLabel, "y", String(demandEnd[1] - 11));
  patchCurveRoleLabel(demandLabel, demandRole);

  patchDiscreteMathLabel({
    scaffold: input.scaffold,
    active: input.frame.initialDemandReferenceOpacity > 0,
    role: "curve-demand-reference",
    beforeSelector: '[data-kp-economics-math-label="equilibrium-current"]',
    create: () => createMathLabel({
      scaffold: input.scaffold,
      role: "curve-demand-reference",
      latex: "D_0",
      x: input.viewport.width - kpEconomicsGraphPlotInsets.right + 12,
      y: initialDemandEnd[1] - 11,
      width: 46,
      height: 26,
      opacity: input.frame.initialDemandReferenceOpacity,
      className: "editor-graph-stage__economics-math-label--reference"
    }),
    patch: (label) => {
      setAttributeIfChanged(label, "x", String(
        input.viewport.width - kpEconomicsGraphPlotInsets.right + 12
      ));
      setAttributeIfChanged(label, "y", String(initialDemandEnd[1] - 11));
      setAttributeIfChanged(
        label,
        "style",
        `opacity:${input.frame.initialDemandReferenceOpacity}`
      );
    }
  });

  const equilibriumLabel = requireElement<SVGForeignObjectElement>(
    view,
    '[data-kp-economics-math-label="equilibrium-current"]'
  );
  setAttributeIfChanged(
    equilibriumLabel,
    "x",
    String(Math.max(0, equilibrium[0] - 210 - 12))
  );
  setAttributeIfChanged(equilibriumLabel, "y", String(equilibrium[1] - 15));
  setAttributeIfChanged(
    equilibriumLabel,
    "data-kp-economics-screen-anchor-x",
    String(equilibrium[0])
  );
  setAttributeIfChanged(
    equilibriumLabel,
    "data-kp-economics-screen-anchor-y",
    String(equilibrium[1])
  );
  patchEquilibriumLabel(equilibriumLabel, equilibriumLatex, equilibriumRole, frame);

  patchDiscreteMathLabel({
    scaffold: input.scaffold,
    active: input.frame.initialEquilibriumReferenceOpacity > 0,
    role: "equilibrium-reference",
    beforeSelector: '[data-kp-economics-math-label="axis-quantity"]',
    create: () => createMathLabel({
      scaffold: input.scaffold,
      role: "equilibrium-reference",
      latex: "E_0",
      x: initialEquilibrium[0] - 54,
      y: initialEquilibrium[1] - 13,
      width: 42,
      height: 26,
      opacity: input.frame.initialEquilibriumReferenceOpacity,
      screenAnchorX: initialEquilibrium[0],
      screenAnchorY: initialEquilibrium[1],
      className:
        "editor-graph-stage__economics-math-label--reference " +
        "editor-graph-stage__economics-math-label--equilibrium"
    }),
    patch: (label) => {
      setAttributeIfChanged(
        label,
        "style",
        `opacity:${input.frame.initialEquilibriumReferenceOpacity}`
      );
    }
  });
}

function patchKpEconomicsEquilibriumSynchronizedContent(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly frame: KpEconomicsEquilibriumRuntimeFrame;
  readonly viewport: KpEconomicsGraphViewport;
}): void {
  const synchronized = createKpEconomicsEquilibriumSynchronizedView(input.frame);
  const description = requireElement<SVGDescElement>(
    input.scaffold.view,
    "[data-kp-economics-nonvisual-summary]"
  );
  setTextContentIfChanged(description, synchronized.nonvisualSummary);
  const explanation = requireElement<HTMLElement>(
    input.scaffold.view,
    "[data-kp-economics-synchronized-view]"
  );
  setAttributeIfChanged(
    explanation,
    "data-kp-economics-narrative-id",
    synchronized.narrative.id
  );
  setAttributeIfChanged(
    explanation,
    "data-kp-economics-claim-ids",
    synchronized.narrative.claimIds.join(" ")
  );
  patchSynchronizedDemandEquation(
    requireElement(explanation, '[data-kp-economics-equation-role="demand"]'),
    synchronized.equations.demandLatex
  );
  patchSynchronizedEquilibriumEquation(
    requireElement(
      explanation,
      '[data-kp-economics-equation-role="equilibrium"]'
    ),
    synchronized.equations.equilibriumLatex
  );
  const narrative = requireElement<HTMLParagraphElement>(
    explanation,
    "[data-kp-economics-narrative]"
  );
  setTextContentIfChanged(narrative, synchronized.narrative.text);
}

function patchSynchronizedDemandEquation(
  owner: HTMLElement,
  latex: string
): void {
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  const relation = requireElement<HTMLElement>(owner, ".katex-html .mrel");
  setTextContentIfChanged(relation, latex.includes("\\approx") ? "≈" : "=");
  const intercept = requireElement<HTMLElement>(
    owner,
    ".katex-html > .base:nth-child(2) > .mord"
  );
  const match = latex.match(/(?:=|\\approx)\s+([^\s]+)/);
  if (match?.[1] === undefined) {
    throw new Error("Economics synchronized demand notation diverged.");
  }
  setTextContentIfChanged(intercept, match[1]);
}

function patchSynchronizedEquilibriumEquation(
  owner: HTMLElement,
  latex: string
): void {
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  const relations = owner.querySelectorAll<HTMLElement>(".katex-html .mrel");
  if (relations.length !== 2) {
    throw new Error("Economics synchronized equilibrium relation topology diverged.");
  }
  setTextContentIfChanged(
    relations[1]!,
    latex.includes("\\approx") ? "≈" : "="
  );
  const values = owner.querySelectorAll<HTMLElement>(
    ".katex-html > .base:nth-child(3) > .mord"
  );
  const match = latex.match(/\(([^,]+),\s*([^\)]+)\)$/);
  if (values.length !== 2 || match?.[1] === undefined || match[2] === undefined) {
    throw new Error("Economics synchronized equilibrium value topology diverged.");
  }
  setTextContentIfChanged(values[0]!, match[1]);
  setTextContentIfChanged(values[1]!, match[2]);
}

function patchCurveRoleLabel(
  foreignObject: SVGForeignObjectElement,
  latex: string
): void {
  const owner = requireElement<HTMLElement>(foreignObject, "[data-kp-latex]");
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  const role = requireElement<HTMLElement>(
    owner,
    ".katex-html .msupsub .mord.mtight"
  );
  setTextContentIfChanged(role, latex.slice(2));
}

function patchEquilibriumLabel(
  foreignObject: SVGForeignObjectElement,
  latex: string,
  role: string,
  frame: KpEconomicsEquilibriumRuntimeFrame["semanticFrame"]
): void {
  const owner = requireElement<HTMLElement>(foreignObject, "[data-kp-latex]");
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  setTextContentIfChanged(
    requireElement<HTMLElement>(
      owner,
      ".katex-html .msupsub .mord.mtight"
    ),
    role.slice(2)
  );
  setTextContentIfChanged(
    requireElement<HTMLElement>(owner, ".katex-html .mrel"),
    role === "E_t" ? "≈" : "="
  );
  const values = owner.querySelectorAll<HTMLElement>(
    ".katex-html > .base:nth-child(2) > .mord"
  );
  if (values.length !== 2) {
    throw new Error("Economics equilibrium KaTeX value topology diverged.");
  }
  setTextContentIfChanged(
    values[0]!,
    formatKpDimensionalContinuityDynamicDisplay(frame.equilibrium.quantity)
  );
  setTextContentIfChanged(
    values[1]!,
    formatKpDimensionalContinuityDynamicDisplay(frame.equilibrium.price)
  );
}

function patchDiscreteMathLabel(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly active: boolean;
  readonly role: string;
  readonly beforeSelector: string;
  readonly create: () => SVGForeignObjectElement;
  readonly patch: (label: SVGForeignObjectElement) => void;
}): void {
  let label = input.scaffold.view.querySelector<SVGForeignObjectElement>(
    `[data-kp-economics-math-label="${input.role}"]`
  );
  if (!input.active) {
    label?.remove();
    return;
  }
  if (label === null) {
    label = input.create();
    input.scaffold.view.insertBefore(
      label,
      requireElement(input.scaffold.view, input.beforeSelector)
    );
  }
  input.patch(label);
}

function createMathLabel(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly role: string;
  readonly latex: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly opacity?: number | undefined;
  readonly screenAnchorX?: number | undefined;
  readonly screenAnchorY?: number | undefined;
  readonly className: string;
}): SVGForeignObjectElement {
  const document = input.scaffold.content.ownerDocument;
  const foreignObject = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "foreignObject"
  );
  foreignObject.setAttribute(
    "class",
    "editor-graph-stage__economics-math-foreign-object"
  );
  foreignObject.setAttribute("data-kp-economics-math-label", input.role);
  foreignObject.setAttribute("x", String(input.x));
  foreignObject.setAttribute("y", String(input.y));
  foreignObject.setAttribute("width", String(input.width));
  foreignObject.setAttribute("height", String(input.height));
  foreignObject.setAttribute("aria-hidden", "true");
  if (input.screenAnchorX !== undefined) {
    foreignObject.setAttribute(
      "data-kp-economics-screen-anchor-x",
      String(input.screenAnchorX)
    );
  }
  if (input.screenAnchorY !== undefined) {
    foreignObject.setAttribute(
      "data-kp-economics-screen-anchor-y",
      String(input.screenAnchorY)
    );
  }
  if (input.opacity !== undefined) {
    foreignObject.setAttribute("style", `opacity:${input.opacity}`);
  }
  const owner = document.createElement("div");
  owner.className =
    `editor-graph-stage__economics-math-label ${input.className}`;
  owner.dataset["kpLatex"] = input.latex;
  owner.innerHTML = requireScaffoldState(input.scaffold).renderInlineLatex(
    input.latex
  );
  foreignObject.append(owner);
  return foreignObject;
}

function requireScaffoldState(
  scaffold: KpEconomicsEquilibriumMountedScaffold
): KpEconomicsEquilibriumScaffoldState {
  const state = scaffoldStates.get(scaffold);
  if (state === undefined) {
    throw new Error("Economics runtime scaffold state is unavailable.");
  }
  return state;
}

function patchInitialEquilibriumGuides(input: {
  readonly scaffold: KpEconomicsEquilibriumMountedScaffold;
  readonly opacity: number;
  readonly initialEquilibrium: readonly [number, number];
  readonly initialQuantityAxis: readonly [number, number];
  readonly initialPriceAxis: readonly [number, number];
}): void {
  let group = input.scaffold.view.querySelector<SVGGElement>(
    "[data-kp-economics-initial-equilibrium-guides]"
  );
  if (input.opacity <= 0) {
    group?.remove();
    return;
  }
  if (group === null) {
    group = createInitialEquilibriumGuideGroup(input.scaffold);
  }
  setAttributeIfChanged(
    group,
    "data-kp-economics-reference-progress",
    String(input.opacity)
  );
  const lineInputs = [
    ["[data-kp-economics-initial-equilibrium-quantity-guide]", input.initialQuantityAxis],
    ["[data-kp-economics-initial-equilibrium-quantity-guide-core]", input.initialQuantityAxis],
    ["[data-kp-economics-initial-equilibrium-price-guide]", input.initialPriceAxis],
    ["[data-kp-economics-initial-equilibrium-price-guide-core]", input.initialPriceAxis]
  ] as const;
  for (const [selector, endpoint] of lineInputs) {
    setLine(
      requireElement(group, selector),
      input.initialEquilibrium[0],
      input.initialEquilibrium[1],
      endpoint[0],
      endpoint[1]
    );
  }
}

function createInitialEquilibriumGuideGroup(
  scaffold: KpEconomicsEquilibriumMountedScaffold
): SVGGElement {
  const document = scaffold.content.ownerDocument;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute(
    "class",
    "editor-graph-stage__economics-equilibrium-guide-reference"
  );
  group.setAttribute("data-kp-economics-initial-equilibrium-guides", "");
  group.setAttribute("aria-hidden", "true");
  const definitions = [
    ["editor-graph-stage__economics-guide editor-graph-stage__economics-guide--reference-casing", "data-kp-economics-initial-equilibrium-quantity-guide"],
    ["editor-graph-stage__economics-guide editor-graph-stage__economics-guide--reference-core", "data-kp-economics-initial-equilibrium-quantity-guide-core"],
    ["editor-graph-stage__economics-guide editor-graph-stage__economics-guide--reference-casing", "data-kp-economics-initial-equilibrium-price-guide"],
    ["editor-graph-stage__economics-guide editor-graph-stage__economics-guide--reference-core", "data-kp-economics-initial-equilibrium-price-guide-core"]
  ] as const;
  for (const [className, attribute] of definitions) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", className);
    line.setAttribute(attribute, "");
    group.append(line);
  }
  const insertionPoint = requireElement(
    scaffold.view,
    "[data-kp-economics-initial-equilibrium-reference]"
  );
  scaffold.view.insertBefore(group, insertionPoint);
  return group;
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

function demandEquation(
  frame: KpEconomicsEquilibriumRuntimeFrame["semanticFrame"]
): string {
  const intercept = formatNumber(
    exactNumber(frame.demand.priceInterceptCurrent)
  );
  const slope = formatNumber(exactNumber(frame.demand.priceChangePerQuantity));
  return `P=${intercept}-${slope === "1" ? "" : slope}Q`;
}

function setLine(
  line: SVGLineElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  setAttributeIfChanged(line, "x1", String(x1));
  setAttributeIfChanged(line, "y1", String(y1));
  setAttributeIfChanged(line, "x2", String(x2));
  setAttributeIfChanged(line, "y2", String(y2));
}

function setDataCurvePath(
  path: SVGPathElement,
  start: readonly [number, number],
  end: readonly [number, number]
): void {
  setAttributeIfChanged(path, "d", projectKpEconomicsDataCurvePath(start, end));
}

function setCircle(circle: SVGCircleElement, x: number, y: number): void {
  setAttributeIfChanged(circle, "cx", String(x));
  setAttributeIfChanged(circle, "cy", String(y));
}

function setAttributeIfChanged(
  element: Element,
  name: string,
  value: string
): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function setTextContentIfChanged(node: Node, value: string): void {
  if (node.textContent === value) return;
  const text = node.childNodes.length === 1 && node.firstChild?.nodeType === 3
    ? node.firstChild
    : null;
  if (text !== null) {
    text.nodeValue = value;
    return;
  }
  node.textContent = value;
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

function exactText(value: {
  readonly numerator: string;
  readonly denominator: string;
}): string {
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
