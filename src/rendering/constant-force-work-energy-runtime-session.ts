import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpConstantForceWorkEnergyRuntimeFrame
} from "../animation/constant-force-work-energy-runtime-frame.ts";
import {
  createKpConstantForceWorkEnergySynchronizedView
} from "../animation/constant-force-work-energy-synchronized-view.ts";
import {
  formatKpDimensionalContinuityDynamicDisplay,
  kpDimensionalContinuityDynamicDisplayDecimals,
  kpDimensionalContinuityDynamicDisplayRelation
} from "../animation/dimensional-continuity-dynamic-display.ts";
import {
  projectKpConstantForceWorkEnergySvgGeometry,
  renderKpConstantForceWorkEnergyRuntimeContent,
  type KpPhysicsGraphViewport
} from "./constant-force-work-energy-svg.ts";

export interface KpConstantForceWorkEnergyRuntimeSession {
  readonly content: SVGGElement;
  readonly status: "mounted" | "disposed";
  apply(input: {
    readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
    readonly viewport: KpPhysicsGraphViewport;
  }): void;
  dispose(): void;
}

export const kpConstantForceWorkEnergyRuntimeSessionContract = Object.freeze({
  scope: "constant-force-work-energy-exemplar",
  staticRendererAuthority: "pure-deterministic-markup",
  mountPolicy: "one-runtime-tree-per-content-owner",
  ordinaryProgressPolicy: "patch-retained-nodes",
  topologyPolicy: "remount-only-for-viewport-structure-change",
  labelPolicy: "retain-static-and-dynamic-katex-nodes",
  seekPolicy: "history-independent",
  disposalPolicy: "explicit-idempotent"
} as const);

interface PhysicsRuntimeReferences {
  readonly view: SVGGElement;
  readonly workArea: SVGRectElement;
  readonly forceLine: SVGLineElement;
  readonly workBoundary: SVGLineElement;
  readonly forceLineLabel: SVGForeignObjectElement;
  readonly forceLineMath: HTMLElement;
  readonly object: SVGRectElement;
  readonly forceArrow: SVGLineElement;
  readonly displacement: SVGLineElement;
  readonly diagramForceLabel: SVGForeignObjectElement;
  readonly diagramDisplacementMath: HTMLElement;
  readonly energy: SVGGElement;
  readonly energyWork: SVGRectElement;
  readonly energyTotalMath: HTMLElement;
  readonly unitLabel: SVGForeignObjectElement;
  readonly description: SVGDescElement;
  readonly synchronizedView: HTMLElement;
  readonly synchronizedForceMath: HTMLElement;
  readonly synchronizedWorkMath: HTMLElement;
  readonly synchronizedEnergyMath: HTMLElement;
  readonly narrative: HTMLParagraphElement;
}

const runtimeSessions = new WeakMap<
  SVGGElement,
  KpConstantForceWorkEnergyRuntimeSession
>();

export function createKpConstantForceWorkEnergyRuntimeSession(input: {
  readonly content: SVGGElement;
  readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
  readonly viewport: KpPhysicsGraphViewport;
}): KpConstantForceWorkEnergyRuntimeSession {
  const extant = runtimeSessions.get(input.content);
  if (extant?.status === "mounted") {
    extant.apply({ frame: input.frame, viewport: input.viewport });
    return extant;
  }
  let disposed = false;
  let viewportKey = stableViewportKey(input.viewport);
  let references = mount(input);
  const session: KpConstantForceWorkEnergyRuntimeSession = Object.freeze({
    content: input.content,
    get status() {
      return disposed ? "disposed" as const : "mounted" as const;
    },
    apply(next: {
      readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
      readonly viewport: KpPhysicsGraphViewport;
    }) {
      if (disposed) {
        throw new Error("Cannot apply a disposed physics runtime session.");
      }
      const nextViewportKey = stableViewportKey(next.viewport);
      if (nextViewportKey !== viewportKey) {
        references = mount({ content: input.content, ...next });
        viewportKey = nextViewportKey;
      }
      patchPhysicsRuntimeFrame({ references, ...next });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      references.view.remove();
      runtimeSessions.delete(input.content);
    }
  });
  runtimeSessions.set(input.content, session);
  session.apply({ frame: input.frame, viewport: input.viewport });
  return session;
}

function mount(input: {
  readonly content: SVGGElement;
  readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
  readonly viewport: KpPhysicsGraphViewport;
}): PhysicsRuntimeReferences {
  // The pure renderer remains mount and export authority; only later frames patch.
  input.content.innerHTML = renderKpConstantForceWorkEnergyRuntimeContent({
    frame: input.frame,
    viewport: input.viewport
  });
  const view = requireElement<SVGGElement>(
    input.content,
    ":scope > [data-kp-physics-work-energy-view]"
  );
  return Object.freeze({
    view,
    workArea: requireElement<SVGRectElement>(view, "[data-kp-physics-work-area]"),
    forceLine: requireElement<SVGLineElement>(
      view,
      "[data-kp-physics-constant-force-line]"
    ),
    workBoundary: requireElement<SVGLineElement>(
      view,
      "[data-kp-physics-work-boundary]"
    ),
    forceLineLabel: requireElement<SVGForeignObjectElement>(
      view,
      '[data-kp-physics-math-label="force-line"]'
    ),
    forceLineMath: requireMathOwner(view, "force-line"),
    object: requireElement<SVGRectElement>(
      view,
      "[data-kp-physics-object-position]"
    ),
    forceArrow: requireElement<SVGLineElement>(
      view,
      "[data-kp-physics-net-force-arrow]"
    ),
    displacement: requireElement<SVGLineElement>(
      view,
      "[data-kp-physics-displacement]"
    ),
    diagramForceLabel: requireElement<SVGForeignObjectElement>(
      view,
      '[data-kp-physics-math-label="diagram-force"]'
    ),
    diagramDisplacementMath: requireMathOwner(view, "diagram-displacement"),
    energy: requireElement<SVGGElement>(view, "[data-kp-physics-energy-total]"),
    energyWork: requireElement<SVGRectElement>(
      view,
      "[data-kp-physics-energy-work]"
    ),
    energyTotalMath: requireMathOwner(view, "energy-total"),
    unitLabel: requireElement<SVGForeignObjectElement>(
      view,
      '[data-kp-physics-math-label="unit-identity"]'
    ),
    description: requireElement<SVGDescElement>(
      view,
      "[data-kp-physics-nonvisual-summary]"
    ),
    synchronizedView: requireElement<HTMLElement>(
      view,
      "[data-kp-physics-synchronized-view]"
    ),
    synchronizedForceMath: requireElement<HTMLElement>(
      view,
      '[data-kp-physics-equation-role="force"]'
    ),
    synchronizedWorkMath: requireElement<HTMLElement>(
      view,
      '[data-kp-physics-equation-role="work"]'
    ),
    synchronizedEnergyMath: requireElement<HTMLElement>(
      view,
      '[data-kp-physics-equation-role="energy"]'
    ),
    narrative: requireElement<HTMLParagraphElement>(
      view,
      "[data-kp-physics-narrative]"
    )
  });
}

function patchPhysicsRuntimeFrame(input: {
  readonly references: PhysicsRuntimeReferences;
  readonly frame: KpConstantForceWorkEnergyRuntimeFrame;
  readonly viewport: KpPhysicsGraphViewport;
}): void {
  const { references, frame, viewport } = input;
  const semantic = frame.semanticFrame;
  const state = semantic.state;
  const geometry = projectKpConstantForceWorkEnergySvgGeometry({
    frame: semantic,
    viewport
  });
  const synchronized = createKpConstantForceWorkEnergySynchronizedView(frame);
  const relation = kpDimensionalContinuityDynamicDisplayRelation(
    frame.stage === "accumulate"
  );
  const displacementDisplay = formatKpDimensionalContinuityDynamicDisplay(
    state.displacement
  );
  const energyDisplay = formatKpDimensionalContinuityDynamicDisplay(
    state.kineticEnergy
  );

  setAttributeIfChanged(references.view, "data-kp-physics-work-energy-phase", semantic.phase);
  setAttributeIfChanged(references.view, "data-kp-physics-choreography-stage", frame.stage);
  setAttributeIfChanged(
    references.view,
    "data-kp-physics-display-precision",
    String(kpDimensionalContinuityDynamicDisplayDecimals)
  );
  setAttributeIfChanged(
    references.view,
    "data-kp-physics-position",
    exactText(state.position)
  );
  setAttributeIfChanged(
    references.view,
    "data-kp-physics-net-force",
    exactText(state.netForceMagnitude)
  );
  references.view.style.setProperty(
    "--kp-physics-unit-opacity",
    String(frame.unitIdentityOpacity)
  );

  setAttributeIfChanged(
    references.workArea,
    "data-kp-physics-work-area",
    exactText(state.accumulatedWork)
  );
  setRect(
    references.workArea,
    geometry.graphOrigin[0],
    geometry.currentTop[1],
    geometry.areaWidth,
    geometry.areaHeight
  );
  references.workArea.style.opacity = String(frame.workAreaOpacity);

  setAttributeIfChanged(
    references.forceLine,
    "data-kp-physics-force-value",
    exactText(state.netForceMagnitude)
  );
  setLine(
    references.forceLine,
    geometry.forceStart[0],
    geometry.forceStart[1],
    geometry.forceEnd[0],
    geometry.forceEnd[1]
  );
  setAttributeIfChanged(
    references.workBoundary,
    "data-kp-physics-position-value",
    exactText(state.position)
  );
  setLine(
    references.workBoundary,
    geometry.currentBase[0],
    geometry.currentBase[1],
    geometry.currentTop[0],
    geometry.currentTop[1]
  );
  setAttributeIfChanged(
    references.forceLineLabel,
    "x",
    String(geometry.forceEnd[0] - 94)
  );
  setAttributeIfChanged(
    references.forceLineLabel,
    "y",
    String(geometry.forceEnd[1] - 30)
  );
  patchRetainedExactQuantityMath(
    references.forceLineMath,
    `F_x = ${exactLatex(state.netForceMagnitude)}\\,\\mathrm{N}`,
    exactText(state.netForceMagnitude)
  );

  setAttributeIfChanged(
    references.object,
    "data-kp-physics-object-position",
    exactText(state.position)
  );
  setRect(
    references.object,
    geometry.blockX,
    geometry.blockY,
    geometry.blockWidth,
    geometry.blockHeight
  );
  setAttributeIfChanged(
    references.forceArrow,
    "data-kp-physics-net-force-arrow",
    exactText(state.netForceMagnitude)
  );
  setLine(
    references.forceArrow,
    geometry.blockX + geometry.blockWidth,
    geometry.blockY + geometry.blockHeight / 2,
    geometry.blockX + geometry.blockWidth + geometry.forceArrowLength,
    geometry.blockY + geometry.blockHeight / 2
  );
  references.forceArrow.style.opacity = String(frame.forceArrowEmphasis);
  setAttributeIfChanged(
    references.displacement,
    "data-kp-physics-displacement",
    exactText(state.displacement)
  );
  setLine(
    references.displacement,
    geometry.displacementStart,
    258,
    geometry.displacementCurrent,
    258
  );
  setAttributeIfChanged(
    references.diagramForceLabel,
    "x",
    String(geometry.blockX + geometry.blockWidth + 10)
  );
  patchRetainedApproxQuantityMath(
    references.diagramDisplacementMath,
    `\\Delta x ${relation} ${displacementDisplay}\\,\\mathrm{m}`,
    displacementDisplay
  );

  setAttributeIfChanged(
    references.energy,
    "data-kp-physics-energy-total",
    exactText(state.kineticEnergy)
  );
  setAttributeIfChanged(
    references.energyWork,
    "data-kp-physics-energy-work",
    exactText(state.accumulatedWork)
  );
  setRect(
    references.energyWork,
    geometry.energyX + geometry.initialEnergyWidth,
    geometry.energyY,
    geometry.workEnergyWidth,
    22
  );
  patchRetainedApproxQuantityMath(
    references.energyTotalMath,
    `K ${relation} ${energyDisplay}\\,\\mathrm{J}`,
    energyDisplay
  );
  references.unitLabel.style.opacity = String(frame.unitIdentityOpacity);

  setTextIfChanged(references.description, synchronized.nonvisualSummary);
  setAttributeIfChanged(
    references.synchronizedView,
    "data-kp-physics-narrative-id",
    synchronized.narrative.id
  );
  setAttributeIfChanged(
    references.synchronizedView,
    "data-kp-physics-claim-ids",
    synchronized.narrative.claimIds.join(" ")
  );
  patchRetainedExactQuantityMath(
    references.synchronizedForceMath,
    synchronized.equations.forceLatex,
    exactText(state.netForceMagnitude)
  );
  patchRetainedApproxQuantityMath(
    references.synchronizedWorkMath,
    synchronized.equations.workLatex,
    formatKpDimensionalContinuityDynamicDisplay(state.accumulatedWork)
  );
  patchRetainedApproxQuantityMath(
    references.synchronizedEnergyMath,
    synchronized.equations.energyLatex,
    energyDisplay
  );
  setTextIfChanged(references.narrative, synchronized.narrative.text);
}

function patchRetainedExactQuantityMath(
  owner: HTMLElement,
  latex: string,
  value: string
): void {
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  setTextIfChanged(requireQuantityValue(owner), value);
}

function patchRetainedApproxQuantityMath(
  owner: HTMLElement,
  latex: string,
  value: string
): void {
  setAttributeIfChanged(owner, "data-kp-latex", latex);
  const relations = owner.querySelectorAll<HTMLElement>(".katex-html .mrel");
  const relation = relations.item(relations.length - 1);
  if (relation === null) {
    throw new Error("Physics retained KaTeX relation topology diverged.");
  }
  setTextIfChanged(relation, latex.includes("\\approx") ? "≈" : "=");
  setTextIfChanged(requireQuantityValue(owner), value);
}

function requireQuantityValue(owner: HTMLElement): HTMLElement {
  const lastBase = owner.querySelector<HTMLElement>(
    ".katex-html > .base:last-child"
  );
  const value = lastBase?.querySelector<HTMLElement>(
    ":scope > .mord:not(.mathrm)"
  );
  if (value === null || value === undefined) {
    throw new Error("Physics retained KaTeX quantity topology diverged.");
  }
  return value;
}

function requireMathOwner(view: SVGGElement, role: string): HTMLElement {
  return requireElement(
    view,
    `[data-kp-physics-math-label="${role}"] [data-kp-latex]`
  );
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

function setRect(
  rect: SVGRectElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  setAttributeIfChanged(rect, "x", String(x));
  setAttributeIfChanged(rect, "y", String(y));
  setAttributeIfChanged(rect, "width", String(width));
  setAttributeIfChanged(rect, "height", String(height));
}

function setAttributeIfChanged(
  element: Element,
  name: string,
  value: string
): void {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function setTextIfChanged(node: Node, value: string): void {
  if (node.textContent === value) return;
  const child = node.firstChild;
  // Retain the text-node identity too; textContent would report remove/add
  // churn even though the surrounding SVG and KaTeX topology is unchanged.
  if (child?.nodeType === 3 && node.childNodes.length === 1) {
    child.nodeValue = value;
    return;
  }
  node.textContent = value;
}

function stableViewportKey(viewport: KpPhysicsGraphViewport): string {
  return [
    viewport.width,
    viewport.height,
    ...viewport.xDomain,
    ...viewport.yDomain
  ].join(":");
}

function exactLatex(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function exactText(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `${value.numerator}/${value.denominator}`;
}

function requireElement<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Physics runtime scaffold is missing ${selector}.`);
  }
  return element;
}
