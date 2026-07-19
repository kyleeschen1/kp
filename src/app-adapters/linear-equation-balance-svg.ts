import katex from "katex";

import type { KpLinearEquationTrace } from "../../domains/public-api.ts";
import {
  projectLinearEquationBalanceExemplar,
  type KpBalanceOperationApplicationIr,
  type KpBalancePartitionGroupIr,
  type KpBalancePhysicalUnitIr,
  type KpBalanceSceneIr,
  type KpBalanceSideIr
} from "../projections/public-api.ts";

import { applyConceptRoomTheme } from "./concept-room-theme-adapters.ts";
import {
  applyConceptRoomThemeRoles,
  linearEquationExemplarTheme,
  type KpConceptRoomStyleRole,
  type KpConceptRoomThemeShape
} from "./concept-room-theme.ts";

const svgNamespace = "http://www.w3.org/2000/svg";
const htmlNamespace = "http://www.w3.org/1999/xhtml";
const panCenters = { left: 200, right: 520 } as const;

export interface KpBalanceSceneController {
  render(progressPermille: number, focusSemanticIds?: readonly string[]): KpBalanceSceneIr;
  dispose(): void;
}

export function createBalanceSceneController(
  root: HTMLElement,
  trace: KpLinearEquationTrace,
  options: {
    readonly diagramSemanticId: string;
    readonly theme?: KpConceptRoomThemeShape;
  }
): KpBalanceSceneController {
  let disposed = false;
  return {
    render(progressPermille, focusSemanticIds = []) {
      if (disposed) throw new Error("Balance scene controller is disposed.");
      const projection = projectLinearEquationBalanceExemplar(trace, progressPermille, options);
      renderBalanceScene(root, projection, {
        focusSemanticIds,
        theme: options.theme ?? linearEquationExemplarTheme
      });
      return projection;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      root.replaceChildren();
    }
  };
}

export function renderBalanceScene(
  root: HTMLElement,
  projection: KpBalanceSceneIr,
  options: {
    readonly focusSemanticIds?: readonly string[];
    readonly theme?: KpConceptRoomThemeShape;
  } = {}
): void {
  const focusSemanticIds = new Set(options.focusSemanticIds ?? []);
  const theme = options.theme ?? linearEquationExemplarTheme;
  const stageRoot = document.createElement("div");
  stageRoot.dataset["kpBalanceStageRoot"] = "true";
  stageRoot.style.position = "relative";
  stageRoot.style.width = "100%";
  stageRoot.style.isolation = "isolate";
  applyConceptRoomTheme(stageRoot, theme);
  const svg = svgElement("svg");
  svg.dataset["kpBalanceScene"] = "true";
  svg.dataset["kpBalanceStage"] = projection.stage;
  svg.dataset["kpTraceId"] = projection.traceId;
  svg.dataset["kpFrameId"] = projection.frameId;
  svg.dataset["kpEquationSemanticId"] = projection.equationSemanticId;
  svg.dataset["kpDiagramSemanticId"] = projection.diagramSemanticId;
  svg.dataset["kpProgressPermille"] = String(projection.progressPermille);
  svg.setAttribute("viewBox", "0 0 720 390");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", projection.accessibleText);
  svg.style.position = "relative";
  svg.style.zIndex = "1";
  applyConceptRoomTheme(svg, theme);
  applyConceptRoomThemeRoles(
    svg,
    rolesFor(projection.diagramSemanticId, "diagram.balance", focusSemanticIds),
    theme
  );

  const title = svgElement("title");
  title.textContent = projection.accessibleText;
  const description = svgElement("desc");
  description.textContent = accessibleGeometryDescription(projection);
  svg.append(title, description, structuralBalance());
  projection.operationApplications.forEach((application) => {
    svg.append(renderOperation(application, focusSemanticIds, theme));
  });
  if (projection.stage === "solved-partition") {
    svg.append(renderPartitionedSides(projection, focusSemanticIds, theme));
  } else {
    projection.sides.forEach((side) => {
      svg.append(renderPanSide(side, projection.physicalUnits, focusSemanticIds, theme));
    });
  }
  const supportOverlay = svgElement("svg");
  supportOverlay.dataset["kpBalanceSupportOverlay"] = "true";
  supportOverlay.setAttribute("viewBox", "0 0 720 390");
  supportOverlay.setAttribute("preserveAspectRatio", "xMidYMid meet");
  supportOverlay.setAttribute("aria-hidden", "true");
  supportOverlay.style.position = "absolute";
  supportOverlay.style.inset = "0";
  supportOverlay.style.width = "100%";
  supportOverlay.style.height = "100%";
  supportOverlay.style.pointerEvents = "none";
  supportOverlay.style.zIndex = "2";
  supportOverlay.append(centralSupport());
  // Chrome composites SVG foreignObjects independently; a sibling overlay keeps the fulcrum visible without duplicating math.
  stageRoot.append(svg, supportOverlay);
  root.replaceChildren(stageRoot);
}

function structuralBalance(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceStructure"] = "true";
  group.setAttribute("aria-hidden", "true");

  const beam = svgElement("line");
  beam.dataset["kpBalanceBeam"] = "true";
  setAttributes(beam, {
    x1: "92", x2: "628", y1: "214", y2: "214",
    stroke: "var(--kp-concept-line)", "stroke-width": "4", "stroke-linecap": "round"
  });
  group.append(beam, pan("left"), pan("right"));
  return group;
}

function centralSupport(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceCentralSupport"] = "true";
  group.setAttribute("aria-hidden", "true");
  const pivot = svgElement("circle");
  pivot.dataset["kpBalancePivot"] = "true";
  setAttributes(pivot, {
    cx: "360", cy: "214", r: "7", fill: "var(--kp-concept-relation)"
  });
  const fulcrum = svgElement("path");
  fulcrum.dataset["kpBalanceSupport"] = "fulcrum";
  setAttributes(fulcrum, {
    d: "M 360 222 L 322 338 Q 360 348 398 338 Z",
    fill: "var(--kp-concept-surface)", stroke: "var(--kp-concept-line)", "stroke-width": "3",
    "stroke-linejoin": "round"
  });
  const base = svgElement("line");
  base.dataset["kpBalanceSupport"] = "base";
  setAttributes(base, {
    x1: "304", x2: "416", y1: "342", y2: "342",
    stroke: "var(--kp-concept-line)", "stroke-width": "4", "stroke-linecap": "round"
  });
  group.append(fulcrum, base, pivot);
  return group;
}

function pan(side: "left" | "right"): SVGGElement {
  const center = panCenters[side];
  const group = svgElement("g");
  group.dataset["kpBalancePan"] = side;
  const hanger = svgElement("path");
  setAttributes(hanger, {
    d: `M ${center} 218 L ${center - 112} 302 M ${center} 218 L ${center + 112} 302`,
    fill: "none", stroke: "var(--kp-concept-line)", "stroke-width": "1.5", "stroke-linecap": "round"
  });
  const bowl = svgElement("path");
  setAttributes(bowl, {
    d: `M ${center - 112} 302 Q ${center} 329 ${center + 112} 302`,
    fill: "none", stroke: "var(--kp-concept-line)", "stroke-width": "3", "stroke-linecap": "round"
  });
  const pin = svgElement("circle");
  setAttributes(pin, {
    cx: String(center), cy: "214", r: "4", fill: "var(--kp-concept-line)"
  });
  group.append(hanger, bowl, pin);
  return group;
}

function renderPanSide(
  side: KpBalanceSideIr,
  units: readonly KpBalancePhysicalUnitIr[],
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceSide"] = side.side;
  group.dataset["kpBalanceSideId"] = side.id;
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", `${side.side} side: ${side.accessibleText}`);
  const present = units.filter((unit) =>
    unit.placement.kind === "pan" && unit.placement.side === side.side
  );
  const layout = rowLayout(present, panCenters[side.side]);
  const terms = new Map<string, KpBalancePhysicalUnitIr[]>();
  present.forEach((unit) => terms.set(unit.semanticId, [...(terms.get(unit.semanticId) ?? []), unit]));
  for (const [semanticId, termUnits] of terms) {
    const term = side.terms.find((candidate) => candidate.semanticId === semanticId);
    const termGroup = semanticGroup(semanticId, term?.spoken ?? "weight", focusSemanticIds, theme);
    termUnits.forEach((unit) => termGroup.append(renderUnit(unit, layout.get(unit.id)!)));
    group.append(termGroup);
  }
  return group;
}

function renderPartitionedSides(
  projection: KpBalanceSceneIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const root = svgElement("g");
  root.dataset["kpBalancePartition"] = "true";
  projection.sides.forEach((side) => {
    const sideGroup = svgElement("g");
    sideGroup.dataset["kpBalanceSide"] = side.side;
    sideGroup.dataset["kpBalanceSideId"] = side.id;
    sideGroup.setAttribute("role", "group");
    sideGroup.setAttribute("aria-label", `${side.side} side: ${side.accessibleText}`);
    root.append(sideGroup);
  });

  const variableSemanticId = projection.sides[0].terms[0]!.semanticId;
  const constantSemanticId = projection.sides[1].terms[0]!.semanticId;
  const variableGroup = semanticGroup(variableSemanticId, "two x units divided into two groups", focusSemanticIds, theme);
  const constantGroup = semanticGroup(constantSemanticId, "five unit weights divided exactly into two groups", focusSemanticIds, theme);
  root.append(variableGroup, constantGroup);

  for (const group of projection.partitionGroups) {
    const groupNode = renderPartitionGuide(group, focusSemanticIds, theme);
    root.append(groupNode);
    const variable = requireUnit(projection, group.variableUnitId);
    const variableX = group.groupIndex === 0 ? 144 : 208;
    variableGroup.append(renderUnit(variable, { x: variableX, y: 239, width: 48, height: 48 }));
    group.wholeRightUnitIds.forEach((unitId, index) => {
      const unit = requireUnit(projection, unitId);
      const baseX = group.groupIndex === 0 ? 427 : 571;
      constantGroup.append(renderUnit(unit, { x: baseX + index * 29, y: 258, width: 24, height: 24 }));
    });
  }

  const remainder = requireUnit(projection, projection.partitionGroups[0]!.sharedRemainder.unitId);
  constantGroup.append(renderUnit(remainder, { x: 508, y: 258, width: 24, height: 24 }));
  root.append(sharedRemainderLinks(), mathLabel({
    x: 110, y: 142, width: 180, height: 48, latex: "x=\\frac{5}{2}",
    color: "var(--kp-concept-relation)", kind: "result"
  }));
  return root;
}

function renderPartitionGuide(
  group: KpBalancePartitionGroupIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const node = svgElement("g");
  node.dataset["kpBalancePartitionGroup"] = group.id;
  node.dataset["kpBalancePartitionGroupIndex"] = String(group.groupIndex);
  node.dataset["kpBalancePartitionSelected"] = String(group.selectedAsRepresentative);
  applyConceptRoomThemeRoles(
    node,
    rolesFor(group.operationSemanticId, "equation.operation", focusSemanticIds),
    theme
  );
  const leftGuide = svgElement("rect");
  const rightGuide = svgElement("rect");
  const leftX = group.groupIndex === 0 ? 136 : 200;
  const rightX = group.groupIndex === 0 ? 419 : 563;
  [leftGuide, rightGuide].forEach((guide) => {
    guide.dataset["kpBalanceGroupGuide"] = "true";
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", group.selectedAsRepresentative
      ? "var(--kp-concept-relation)"
      : "var(--kp-concept-line)");
    guide.setAttribute("stroke-width", group.selectedAsRepresentative ? "2" : "1.5");
    guide.setAttribute("stroke-dasharray", group.selectedAsRepresentative ? "none" : "5 5");
    guide.setAttribute("rx", "10");
  });
  setAttributes(leftGuide, { x: String(leftX), y: "231", width: "64", height: "64" });
  setAttributes(rightGuide, { x: String(rightX), y: "249", width: "82", height: "42" });
  node.append(leftGuide, rightGuide);
  return node;
}

function sharedRemainderLinks(): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceSharedRemainder"] = "true";
  group.setAttribute("aria-hidden", "true");
  const left = svgElement("path");
  const right = svgElement("path");
  setAttributes(left, {
    d: "M 520 254 Q 503 232 482 247", fill: "none", stroke: "var(--kp-concept-accent)",
    "stroke-width": "1.5", "stroke-dasharray": "3 4"
  });
  setAttributes(right, {
    d: "M 520 254 Q 537 232 558 247", fill: "none", stroke: "var(--kp-concept-accent)",
    "stroke-width": "1.5", "stroke-dasharray": "3 4"
  });
  group.append(left, right,
    mathLabel({ x: 474, y: 218, width: 40, height: 32, latex: "\\frac12", color: "var(--kp-concept-accent)", kind: "share" }),
    mathLabel({ x: 526, y: 218, width: 40, height: 32, latex: "\\frac12", color: "var(--kp-concept-accent)", kind: "share" })
  );
  return group;
}

function renderOperation(
  application: KpBalanceOperationApplicationIr,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGForeignObjectElement {
  const label = mathLabel({
    x: application.side === "left" ? 158 : 478,
    y: 68,
    width: 84,
    height: 42,
    latex: application.kind === "subtract-both-sides" ? "-3" : "\\div 2",
    color: "var(--kp-concept-accent)",
    kind: "operation"
  });
  label.dataset["kpBalanceOperationApplication"] = application.id;
  label.dataset["kpOperationSemanticId"] = application.operationSemanticId;
  label.dataset["kpBalanceSide"] = application.side;
  applyConceptRoomThemeRoles(
    label,
    rolesFor(application.operationSemanticId, "equation.operation", focusSemanticIds),
    theme
  );
  return label;
}

function semanticGroup(
  semanticId: string,
  spoken: string,
  focusSemanticIds: ReadonlySet<string>,
  theme: KpConceptRoomThemeShape
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceTermGroup"] = "true";
  group.dataset["kpSemanticId"] = semanticId;
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", spoken);
  applyConceptRoomThemeRoles(group, rolesFor(semanticId, "equation.expression", focusSemanticIds), theme);
  return group;
}

function renderUnit(
  unit: KpBalancePhysicalUnitIr,
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
): SVGGElement {
  const group = svgElement("g");
  group.dataset["kpBalanceUnit"] = unit.id;
  group.dataset["kpBalanceUnitKind"] = unit.kind;
  group.dataset["kpBalanceUnitOrdinal"] = String(unit.ordinal);
  group.setAttribute("aria-hidden", "true");
  const shape = svgElement("rect");
  shape.dataset["kpBalanceObjectShape"] = "true";
  setAttributes(shape, {
    x: String(box.x), y: String(box.y), width: String(box.width), height: String(box.height),
    rx: unit.kind === "variable-unit" ? "10" : "7",
    fill: unit.kind === "variable-unit" ? "var(--kp-concept-surface)" : "var(--kp-concept-unit)",
    "fill-opacity": unit.kind === "variable-unit" ? "1" : ".14",
    stroke: unit.kind === "variable-unit" ? "var(--kp-concept-variable)" : "var(--kp-concept-unit)",
    "stroke-width": unit.kind === "variable-unit" ? "2.5" : "2"
  });
  const label = mathLabel({
    ...box,
    latex: unit.latex,
    color: unit.kind === "variable-unit" ? "var(--kp-concept-variable)" : "var(--kp-concept-ink)",
    kind: unit.kind === "variable-unit" ? "variable" : "unit"
  });
  group.append(shape, label);
  return group;
}

function rowLayout(
  units: readonly KpBalancePhysicalUnitIr[],
  center: number
): ReadonlyMap<string, { x: number; y: number; width: number; height: number }> {
  const gap = 8;
  const widths = units.map((unit) => unit.kind === "variable-unit" ? 48 : 24);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, units.length - 1) * gap;
  let cursor = center - totalWidth / 2;
  return new Map(units.map((unit, index) => {
    const width = widths[index]!;
    const height = unit.kind === "variable-unit" ? 48 : 24;
    const box = { x: cursor, y: 287 - height, width, height };
    cursor += width + gap;
    return [unit.id, box] as const;
  }));
}

function mathLabel(input: {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly latex: string;
  readonly color: string;
  readonly kind: "variable" | "unit" | "operation" | "share" | "result";
}): SVGForeignObjectElement {
  const foreignObject = svgElement("foreignObject");
  foreignObject.dataset["kpBalanceMathLabel"] = input.kind;
  setAttributes(foreignObject, {
    x: String(input.x), y: String(input.y), width: String(input.width), height: String(input.height)
  });
  const math = document.createElementNS(htmlNamespace, "span");
  math.setAttribute("aria-hidden", "true");
  math.style.display = "grid";
  math.style.placeItems = "center";
  math.style.width = "100%";
  math.style.height = "100%";
  math.style.color = input.color;
  katex.render(input.latex, math, {
    displayMode: false,
    output: "htmlAndMathml",
    throwOnError: true,
    trust: false
  });
  foreignObject.append(math);
  return foreignObject;
}

function requireUnit(projection: KpBalanceSceneIr, unitId: string): KpBalancePhysicalUnitIr {
  const unit = projection.physicalUnits.find((candidate) => candidate.id === unitId);
  if (unit === undefined) throw new Error(`Balance partition references missing physical unit ${unitId}.`);
  return unit;
}

function accessibleGeometryDescription(projection: KpBalanceSceneIr): string {
  switch (projection.stage) {
    case "initial":
      return "Two x blocks and three unit weights balance eight unit weights.";
    case "after-subtraction":
      return "Three matched unit pairs have been removed, leaving two x blocks balanced with five unit weights.";
    case "solved-partition":
      return "The two x blocks and five unit weights form two equal groups. One whole remainder stays unsplit and contributes one symbolic half to each group, so x equals five halves.";
  }
}

function rolesFor(
  semanticId: string,
  baseRole: KpConceptRoomStyleRole,
  focusSemanticIds: ReadonlySet<string>
): KpConceptRoomStyleRole[] {
  return focusSemanticIds.has(semanticId) ? [baseRole, "focus.primary"] : [baseRole];
}

function setAttributes(element: Element, attributes: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

function svgElement<TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName
): SVGElementTagNameMap[TagName] {
  return document.createElementNS(svgNamespace, tagName);
}
