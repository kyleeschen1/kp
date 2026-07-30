import type {
  KpExactFractionQuantityRuntimeFrame
} from "./exact-fraction-quantity-runtime.ts";
import {
  renderKpExactFractionQuantityBarSvg
} from "./exact-fraction-quantity-bar-projection.ts";
import {
  renderKpExactFractionQuantityCircleSvg
} from "./exact-fraction-quantity-circle-projection.ts";
import {
  renderKpExactFractionQuantityNumberLineSvg
} from "./exact-fraction-quantity-number-line-projection.ts";
import {
  sampleKpExactFractionQuantityConcreteMotion
} from "./exact-fraction-quantity-concrete-motion.ts";
import type {
  KpExactQuantityConcretePhaseBinding
} from "../animation/exact-fraction-quantity-presentation-plan.ts";

const svgNamespace = "http://www.w3.org/2000/svg";

export function syncKpExactFractionQuantityConcreteScenes(
  slot: HTMLElement,
  frame: KpExactFractionQuantityRuntimeFrame
): void {
  const bindings = frame.visibleOperation.viewBindings;
  syncCircle(
    requiredCanvas(slot, "partitioned-circle"),
    frame,
    bindings[1]
  );
  syncBar(requiredCanvas(slot, "fraction-bar"), frame, bindings[2]);
  syncNumberLine(
    requiredCanvas(slot, "number-line"),
    frame,
    bindings[3]
  );
}

function syncCircle(
  canvas: HTMLElement,
  frame: KpExactFractionQuantityRuntimeFrame,
  binding: KpExactQuantityConcretePhaseBinding
): void {
  const projection = frame.projection.circle;
  const svg = ensureSvg(
    canvas,
    () => renderKpExactFractionQuantityCircleSvg(projection)
  );
  svg.setAttribute("aria-label", projection.accessibleSummary);
  const atoms = atomicElements(svg);
  for (const sector of projection.sectors) {
    const element = requireAtom(atoms, sector.atomicPartId);
    element.setAttribute("d", sector.pathData);
    syncSelection(element, sector.selected);
  }
  const divider = ensureSvgElement(svg, "path", "data-kp-refinement-divider");
  syncDivider(
    divider,
    projection.refinement?.dividerPathData,
    refinementProgress(frame)
  );
  syncMotion(canvas, svg, frame, binding);
}

function syncBar(
  canvas: HTMLElement,
  frame: KpExactFractionQuantityRuntimeFrame,
  binding: KpExactQuantityConcretePhaseBinding
): void {
  const projection = frame.projection.bar;
  const svg = ensureSvg(
    canvas,
    () => renderKpExactFractionQuantityBarSvg(projection)
  );
  svg.setAttribute("aria-label", projection.accessibleSummary);
  const atoms = atomicElements(svg);
  for (const part of projection.parts) {
    const element = requireAtom(atoms, part.atomicPartId);
    element.setAttribute("x", String(part.x));
    element.setAttribute("y", String(part.y));
    element.setAttribute("width", String(part.width));
    element.setAttribute("height", String(part.height));
    syncSelection(element, part.selected);
  }
  const divider = ensureSvgElement(svg, "line", "data-kp-refinement-divider");
  divider.setAttribute("x1", String(projection.refinement?.dividerX ?? 80));
  divider.setAttribute("x2", String(projection.refinement?.dividerX ?? 80));
  divider.setAttribute("y1", "35");
  divider.setAttribute("y2", "85");
  syncDivider(
    divider,
    projection.refinement === undefined ? undefined : "",
    refinementProgress(frame)
  );
  syncMotion(canvas, svg, frame, binding);
}

function refinementProgress(
  frame: KpExactFractionQuantityRuntimeFrame
): number {
  return frame.visibleOperation.programPhase?.programKind ===
      "identity-fission"
    ? frame.visibleOperation.programPhase.programProgress
    : frame.visibleOperation.actionProgress;
}

function syncNumberLine(
  canvas: HTMLElement,
  frame: KpExactFractionQuantityRuntimeFrame,
  binding: KpExactQuantityConcretePhaseBinding
): void {
  const projection = frame.projection.numberLine;
  const svg = ensureSvg(
    canvas,
    () => renderKpExactFractionQuantityNumberLineSvg(projection)
  );
  svg.setAttribute("aria-label", projection.accessibleSummary);
  const atoms = atomicElements(svg);
  for (const interval of projection.intervals) {
    const element = requireAtom(atoms, interval.atomicPartId);
    element.setAttribute("x1", String(interval.x1));
    element.setAttribute("x2", String(interval.x2));
    syncSelection(element, interval.selected);
  }
  const endpoint = required<SVGCircleElement>(
    svg,
    "[data-kp-number-line-endpoint]"
  );
  endpoint.setAttribute("cx", String(projection.endpointX));
  syncMotion(canvas, svg, frame, binding);
}

function syncMotion(
  canvas: HTMLElement,
  svg: SVGSVGElement,
  frame: KpExactFractionQuantityRuntimeFrame,
  binding: KpExactQuantityConcretePhaseBinding
): void {
  const motion = sampleKpExactFractionQuantityConcreteMotion(binding);
  const atoms = atomicElements(svg);
  for (const track of motion.tracks) {
    const element = requireAtom(atoms, track.atomicPartId);
    const motifScale = motifScaleForAtomicElement(frame, element);
    const transform =
      `translate(${track.translateX}px, ${track.translateY}px) ` +
      `scale(${track.scale * motifScale})`;
    element.setAttribute(
      "style",
      "transform-box:fill-box;transform-origin:center;" +
      `transform:${transform};`
    );
    element.dataset["kpMotionTrackId"] = track.trackId;
  }
  canvas.dataset["kpExactMotionRenderer"] = motion.renderer;
  canvas.dataset["kpExactMotionInvocationId"] = motion.invocationId;
  canvas.dataset["kpExactMotionTrackCount"] = String(motion.tracks.length);
}

function ensureSvg(
  canvas: HTMLElement,
  render: () => string
): SVGSVGElement {
  const existing = canvas.querySelector<SVGSVGElement>(
    "svg[data-kp-exact-persistent-svg]"
  );
  if (existing !== null) return existing;
  const parser = new canvas.ownerDocument.defaultView!.DOMParser();
  const parsed = parser.parseFromString(render(), "image/svg+xml");
  const source = parsed.documentElement;
  if (source.localName !== "svg" || source.querySelector("parsererror")) {
    throw new Error("Exact-quantity concrete SVG renderer returned invalid SVG.");
  }
  const svg = canvas.ownerDocument.importNode(
    source,
    true
  ) as unknown as SVGSVGElement;
  svg.dataset["kpExactPersistentSvg"] = "true";
  canvas.replaceChildren(svg);
  return svg;
}

function ensureSvgElement<K extends "line" | "path">(
  svg: SVGSVGElement,
  tagName: K,
  dataAttribute: string
): SVGElement {
  const selector = `[${dataAttribute}]`;
  const existing = svg.querySelector<SVGElement>(selector);
  if (existing !== null) return existing;
  const element = svg.ownerDocument.createElementNS(svgNamespace, tagName);
  element.setAttribute(dataAttribute, "true");
  svg.append(element);
  return element;
}

function syncDivider(
  divider: SVGElement,
  pathData: string | undefined,
  progress: number
): void {
  const visible = pathData !== undefined;
  if (pathData !== undefined && pathData !== "") {
    divider.setAttribute("d", pathData);
  } else {
    divider.removeAttribute("d");
  }
  divider.setAttribute(
    "style",
    `display:${visible ? "inline" : "none"};` +
    "stroke-dasharray:100;" +
    `stroke-dashoffset:${100 * (1 - progress)};`
  );
}

function atomicElements(svg: SVGSVGElement): Map<string, SVGElement> {
  return new Map(
    [...svg.querySelectorAll<SVGElement>("[data-kp-atomic-part-id]")]
      .map((element) => [element.dataset["kpAtomicPartId"]!, element])
  );
}

function requireAtom(
  atoms: ReadonlyMap<string, SVGElement>,
  atomicPartId: string
): SVGElement {
  const element = atoms.get(atomicPartId);
  if (element === undefined) {
    throw new Error(`Concrete SVG lacks canonical atom ${atomicPartId}.`);
  }
  return element;
}

function syncSelection(element: SVGElement, selected: boolean): void {
  element.dataset["kpSelected"] = String(selected);
  element.classList.toggle("kp-exact-selected", selected);
}

function motifScaleForAtomicElement(
  frame: KpExactFractionQuantityRuntimeFrame,
  element: SVGElement
): number {
  const atomicPartId = element.dataset["kpAtomicPartId"];
  const motif = frame.motifFrame;
  if (atomicPartId === undefined || motif === undefined) return 1;
  const candidate = [...motif.sources, ...motif.targets].find(
    ({ entityId }) => entityId === atomicPartId
  );
  if (candidate !== undefined) return candidate.scale;
  const selection = frame.projection.selectionCorrespondences.find(
    ({ atomicPartIds }) => atomicPartIds.includes(atomicPartId)
  );
  const group = [...motif.sources, ...motif.targets].find(
    ({ entityId }) => entityId === selection?.selectionId
  );
  return group?.scale ?? 1;
}

function requiredCanvas(
  slot: HTMLElement,
  view: KpExactQuantityConcretePhaseBinding["view"]
): HTMLElement {
  return required(
    slot,
    `[data-kp-exact-view-canvas="${view}"]`
  );
}

function required<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing required exact-quantity element ${selector}.`);
  }
  return element;
}
